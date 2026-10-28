import { SdamRegion, ClassificationType, ModelPrediction } from '../types/sdam';

/**
 * Executes regional SDAM models and returns streamflow duration classification,
 * calculated probabilities (P, I, E), and diagnostic summaries.
 */
export function runSdamModel(region: SdamRegion, inputs: Record<string, any>): ModelPrediction {
  const timestamp = new Date().toISOString();

  if (region === 'Pacific Northwest') {
    return runPacificNorthwest(inputs, timestamp);
  } else if (region === 'Great Plains') {
    return runGreatPlains(inputs, timestamp);
  } else if (region === 'Arid West') {
    return runAridWest(inputs, timestamp);
  } else if (region === 'Western Mountains') {
    return runWesternMountains(inputs, timestamp);
  } else if (region === 'Northeast') {
    return runNortheast(inputs, timestamp);
  } else if (region === 'Southeast') {
    return runSoutheast(inputs, timestamp);
  }

  return {
    classification: 'OTHER',
    probabilities: { P: 0, I: 0, E: 0 },
    summary: 'Unknown regional model.',
    region,
    timestamp,
    inputs,
  };
}

/**
 * 1. Pacific Northwest (PNW) SDAM
 * Direct deterministic decision tree from EPA SDAM method
 */
function runPacificNorthwest(inputs: Record<string, any>, timestamp: string): ModelPrediction {
  const aquaPresence = inputs.user_aquatic_presence;
  const ephemeroptera = inputs.user_ephemeroptera;
  const perenTaxa = inputs.user_per_taxa;
  const plants = inputs.user_plants;
  const slope = parseFloat(inputs.user_slope ?? '0');
  const fish = inputs.user_fish;
  const amphibians = inputs.user_amphibians;

  let streamClass: ClassificationType = 'OTHER';
  const steps: string[] = [];

  if (aquaPresence === 'Yes') {
    steps.push('Aquatic macroinvertebrates present');
    if (ephemeroptera === 'Yes') {
      steps.push('≥6 Ephemeroptera individuals detected');
      if (perenTaxa === 'Yes') {
        steps.push('Perennial indicator taxa present');
        streamClass = 'PERENNIAL';
      } else {
        steps.push('No perennial indicator taxa');
        if (slope < 16) {
          steps.push(`Reach slope (${slope}%) < 16%`);
          streamClass = 'INTERMITTENT';
        } else {
          steps.push(`Reach slope (${slope}%) ≥ 16%`);
          streamClass = 'PERENNIAL';
        }
      }
    } else {
      steps.push('<6 Ephemeroptera individuals detected');
      streamClass = 'INTERMITTENT';
    }
  } else if (aquaPresence === 'No') {
    steps.push('Aquatic macroinvertebrates absent');
    if (plants === 'Yes') {
      steps.push('FACW/OBL/SAV plants present within ½ channel width');
      if (slope < 10.5) {
        steps.push(`Reach slope (${slope}%) < 10.5%`);
        streamClass = 'INTERMITTENT';
      } else {
        steps.push(`Reach slope (${slope}%) ≥ 10.5%`);
        streamClass = 'EPHEMERAL';
      }
    } else {
      steps.push('No FACW/OBL/SAV plants present');
      streamClass = 'EPHEMERAL';
    }
  }

  // Override check: fish or amphibians detected
  if (streamClass === 'EPHEMERAL') {
    if (fish === 'Yes' || amphibians === 'Yes') {
      steps.push('Fish or amphibian presence detected: upgraded from Ephemeral');
      streamClass = 'AT LEAST INTERMITTENT';
    }
  }

  const probs =
    streamClass === 'PERENNIAL'
      ? { P: 0.9, I: 0.08, E: 0.02 }
      : streamClass === 'INTERMITTENT'
      ? { P: 0.12, I: 0.8, E: 0.08 }
      : streamClass === 'AT LEAST INTERMITTENT'
      ? { P: 0.45, I: 0.45, E: 0.1 }
      : { P: 0.03, I: 0.07, E: 0.9 };

  return {
    classification: streamClass,
    probabilities: probs,
    summary: steps.join(' → '),
    region: 'Pacific Northwest',
    timestamp,
    inputs,
  };
}

/**
 * 2. Great Plains (GP) SDAM
 * Random Forest indicator scoring & class probabilities
 */
function runGreatPlains(inputs: Record<string, any>, timestamp: string): ModelPrediction {
  const totalAbundance = Number(inputs.user_total_abundance ?? 0); // 0, 1, 2
  const hydrophyte = Number(inputs.user_hydrophyte ?? 0); // 0 (<2), 1 (>=2)
  const uplandRooted = Number(inputs.user_upland_rooted ?? 0); // 0 (present), 1 (absent)
  const diffVeg = Number(inputs.user_diff_veg ?? 0); // 0 to 3
  const riffPool = Number(inputs.user_riff_pool ?? 0); // 0 to 3
  const substrate = Number(inputs.user_substrate ?? 0); // 0 to 3
  const sedimentPlants = Number(inputs.user_sediment_plants ?? 0); // 0 to 1.5
  const bankMean = parseFloat(inputs.bank_mean ?? '2');

  // Multi-variable scoring weights derived from EPA Random Forest feature importance
  // Higher scores strongly correlate with hydrologic permanence (P & I)
  let scoreP = 0;
  let scoreI = 0;
  let scoreE = 0;

  // Macroinvertebrate abundance
  if (totalAbundance === 2) {
    scoreP += 2.8;
    scoreI += 1.4;
  } else if (totalAbundance === 1) {
    scoreI += 2.0;
    scoreP += 0.8;
  } else {
    scoreE += 2.4;
  }

  // Hydrophytic plant species
  if (hydrophyte === 1) {
    scoreP += 1.8;
    scoreI += 1.4;
  } else {
    scoreE += 1.8;
  }

  // Upland rooted plants (0 = present in streambed [ephemeral signal], 1 = absent [perennial signal])
  if (uplandRooted === 1) {
    scoreP += 2.0;
    scoreI += 1.2;
  } else {
    scoreE += 2.2;
  }

  // Differences in vegetation (0 to 3)
  scoreP += diffVeg * 0.9;
  scoreI += (3 - Math.abs(diffVeg - 1.5)) * 0.5;
  scoreE += (3 - diffVeg) * 0.8;

  // Riffle-pool sequence (0 to 3)
  scoreP += riffPool * 0.8;
  scoreI += (3 - Math.abs(riffPool - 1.5)) * 0.5;
  scoreE += (3 - riffPool) * 0.7;

  // Substrate sorting (0 to 3)
  scoreP += substrate * 0.7;
  scoreI += substrate * 0.3;
  scoreE += (3 - substrate) * 0.6;

  // Sediment on plants (0 to 1.5)
  scoreP += sedimentPlants * 0.8;
  scoreI += sedimentPlants * 0.5;
  scoreE += (1.5 - sedimentPlants) * 0.6;

  // Bankfull width influence
  if (bankMean > 3.0) {
    scoreP += 0.6;
  } else if (bankMean < 1.0) {
    scoreE += 0.4;
  }

  const probs = normalizeProbabilities(scoreP, scoreI, scoreE);
  const streamClass = determineClassFromProbs(probs.P, probs.I, probs.E);

  return {
    classification: streamClass,
    probabilities: probs,
    summary: `Great Plains RF Model: P=${Math.round(probs.P * 100)}%, I=${Math.round(probs.I * 100)}%, E=${Math.round(probs.E * 100)}%`,
    region: 'Great Plains',
    timestamp,
    inputs,
  };
}

/**
 * 3. Arid West (AW) SDAM
 */
function runAridWest(inputs: Record<string, any>, timestamp: string): ModelPrediction {
  const ephIsa = Number(inputs.user_eph_isa ?? 0); // 0 to 4
  const slope = parseFloat(inputs.user_slope ?? '2');
  const hydrophyte = Number(inputs.user_hydrophyte ?? 0); // 0 to 5
  const uplandRooted = Number(inputs.user_upland_rooted ?? 0); // 0 to 3
  const algalCover = Number(inputs.user_algal_cover ?? 0); // 0 to 4
  const algalCb = Boolean(inputs.user_algal_cb); // Upstream deposition only
  const diffVeg = Number(inputs.user_diff_veg ?? 0); // 0 to 3
  const riffPool = Number(inputs.user_riff_pool ?? 0); // 0 to 3
  const bankMean = parseFloat(inputs.bank_mean ?? '2');

  let scoreP = 0;
  let scoreI = 0;
  let scoreE = 0;

  // Perennial indicator taxa (dominant indicator in AW)
  if (ephIsa >= 3) {
    scoreP += 4.2;
    scoreI += 1.0;
  } else if (ephIsa >= 1) {
    scoreP += 1.5;
    scoreI += 2.6;
  } else {
    scoreE += 3.0;
  }

  // Hydrophytic plant species (0 to 5)
  if (hydrophyte >= 4) {
    scoreP += 2.6;
    scoreI += 1.4;
  } else if (hydrophyte >= 2) {
    scoreI += 2.0;
    scoreP += 0.9;
  } else {
    scoreE += 2.0;
  }

  // Upland rooted plants (0=prevalent to 3=absent)
  scoreP += uplandRooted * 1.0;
  scoreI += uplandRooted * 0.4;
  scoreE += (3 - uplandRooted) * 1.1;

  // Algal cover (discounted if washed down from upstream)
  const effAlgal = algalCb ? 0 : algalCover;
  if (effAlgal >= 3) {
    scoreP += 2.0;
    scoreI += 1.2;
  } else if (effAlgal >= 1) {
    scoreI += 1.2;
    scoreP += 0.4;
  } else {
    scoreE += 1.0;
  }

  // Differences in vegetation
  scoreP += diffVeg * 0.8;
  scoreI += (3 - Math.abs(diffVeg - 1.5)) * 0.5;
  scoreE += (3 - diffVeg) * 0.8;

  // Riffle-pool sequence
  scoreP += riffPool * 0.7;
  scoreI += riffPool * 0.4;
  scoreE += (3 - riffPool) * 0.6;

  // Slope and bank width
  if (slope > 8) scoreE += 0.5;
  if (bankMean > 3.5) scoreP += 0.5;

  const probs = normalizeProbabilities(scoreP, scoreI, scoreE);
  const streamClass = determineClassFromProbs(probs.P, probs.I, probs.E);

  return {
    classification: streamClass,
    probabilities: probs,
    summary: `Arid West RF Model: P=${Math.round(probs.P * 100)}%, I=${Math.round(probs.I * 100)}%, E=${Math.round(probs.E * 100)}%`,
    region: 'Arid West',
    timestamp,
    inputs,
  };
}

/**
 * 4. Western Mountains (WM) SDAM
 */
function runWesternMountains(inputs: Record<string, any>, timestamp: string): ModelPrediction {
  const totalAbundance = Number(inputs.user_total_abundance ?? 0); // EPT: 0 to 4
  const ephIsa = Number(inputs.user_eph_isa ?? 0); // Perennial taxa: 0 to 4
  const slope = parseFloat(inputs.user_slope ?? '3');
  const shade = parseFloat(inputs.user_shade ?? '30');
  const hydrophyte = Number(inputs.user_hydrophyte ?? 0); // 0 to 5
  const uplandRooted = Number(inputs.user_upland_rooted ?? 0); // 0 to 3
  const diffVeg = Number(inputs.user_diff_veg ?? 0); // 0 to 3
  const riffPool = Number(inputs.user_riff_pool ?? 0); // 0 to 3
  const substrate = Number(inputs.user_substrate ?? 0); // 0 to 3
  const bankMean = parseFloat(inputs.bank_mean ?? '2');

  let scoreP = 0;
  let scoreI = 0;
  let scoreE = 0;

  // EPT abundance
  if (totalAbundance >= 3) {
    scoreP += 3.5;
    scoreI += 1.0;
  } else if (totalAbundance >= 1) {
    scoreI += 2.5;
    scoreP += 1.0;
  } else {
    scoreE += 2.5;
  }

  // Perennial indicator taxa
  if (ephIsa >= 3) {
    scoreP += 3.5;
  } else if (ephIsa >= 1) {
    scoreI += 2.0;
    scoreP += 1.0;
  } else {
    scoreE += 2.2;
  }

  // Hydrophytes
  scoreP += hydrophyte * 0.5;
  scoreE += (5 - hydrophyte) * 0.4;

  // Upland rooted plants absent
  scoreP += uplandRooted * 0.8;
  scoreE += (3 - uplandRooted) * 0.8;

  // Differences in veg, riffle-pool, substrate
  scoreP += diffVeg * 0.6 + riffPool * 0.6 + substrate * 0.6;
  scoreE += (3 - diffVeg) * 0.5 + (3 - riffPool) * 0.5 + (3 - substrate) * 0.5;

  // Shade bonus
  if (shade > 40) scoreP += 0.5;

  const probs = normalizeProbabilities(scoreP, scoreI, scoreE);
  const streamClass = determineClassFromProbs(probs.P, probs.I, probs.E);

  return {
    classification: streamClass,
    probabilities: probs,
    summary: `Western Mountains RF Model: P=${Math.round(probs.P * 100)}%, I=${Math.round(probs.I * 100)}%, E=${Math.round(probs.E * 100)}%`,
    region: 'Western Mountains',
    timestamp,
    inputs,
  };
}

/**
 * 5. Northeast (NE) SDAM
 */
function runNortheast(inputs: Record<string, any>, timestamp: string): ModelPrediction {
  const bankMean = parseFloat(inputs.bank_mean ?? '2.5');
  const er = parseFloat(inputs.user_er ?? '1.6');
  const bmi = Number(inputs.user_bmi ?? 0); // 0 to 3
  const slope = parseFloat(inputs.user_slope ?? '2');
  const shade = parseFloat(inputs.user_shade ?? '40');
  const drainage = parseFloat(inputs.user_drainage ?? '0.5');
  const elev = parseFloat(inputs.user_elev ?? '250');

  let scoreP = 0;
  let scoreI = 0;
  let scoreE = 0;

  // BMI score
  if (bmi === 3) {
    scoreP += 3.8;
    scoreI += 1.0;
  } else if (bmi === 2) {
    scoreP += 1.8;
    scoreI += 2.2;
  } else if (bmi === 1) {
    scoreI += 2.2;
    scoreE += 0.8;
  } else {
    scoreE += 3.2;
  }

  // Entrenchment ratio (1 to 2.5)
  if (er > 2.0) scoreP += 1.0;
  else if (er < 1.4) scoreE += 1.0;
  else scoreI += 1.0;

  // Drainage area
  if (drainage > 1.0) scoreP += 1.5;
  else if (drainage < 0.1) scoreE += 1.2;

  // Bankfull width
  if (bankMean >= 4.0) scoreP += 1.2;
  else if (bankMean < 1.5) scoreE += 0.8;

  // Shading
  if (shade >= 50) scoreP += 0.6;

  const probs = normalizeProbabilities(scoreP, scoreI, scoreE);
  const streamClass = determineClassFromProbs(probs.P, probs.I, probs.E);

  return {
    classification: streamClass,
    probabilities: probs,
    summary: `Northeast RF Model: P=${Math.round(probs.P * 100)}%, I=${Math.round(probs.I * 100)}%, E=${Math.round(probs.E * 100)}%`,
    region: 'Northeast',
    timestamp,
    inputs,
  };
}

/**
 * 6. Southeast (SE) SDAM
 */
function runSoutheast(inputs: Record<string, any>, timestamp: string): ModelPrediction {
  const bankMean = parseFloat(inputs.bank_mean ?? '2.5');
  const bmi = Number(inputs.user_bmi ?? 0); // 0 to 3
  const totalAbundance = Number(inputs.user_total_abundance ?? 0); // 0 to 3
  const shade = parseFloat(inputs.user_shade ?? '40');
  const uplandRooted = Number(inputs.user_upland_rooted ?? 0); // 0 to 3
  const substrate = Number(inputs.user_substrate ?? 0); // 0 to 3
  const roots = Number(inputs.user_roots ?? 0); // 0 to 3
  const drainage = parseFloat(inputs.user_drainage ?? '0.5');
  const elev = parseFloat(inputs.user_elev ?? '150');
  const precip = parseFloat(inputs.user_precip ?? '105');

  let scoreP = 0;
  let scoreI = 0;
  let scoreE = 0;

  // BMI score
  if (bmi >= 2) {
    scoreP += 2.8;
    scoreI += 1.2;
  } else if (bmi === 1) {
    scoreI += 2.0;
  } else {
    scoreE += 2.5;
  }

  // Macroinvertebrate abundance
  if (totalAbundance === 3) scoreP += 2.5;
  else if (totalAbundance === 2) scoreI += 2.0;
  else if (totalAbundance === 1) scoreI += 1.0;
  else scoreE += 2.2;

  // Upland rooted plants (0=prevalent to 3=absent)
  scoreP += uplandRooted * 0.8;
  scoreE += (3 - uplandRooted) * 0.9;

  // Substrate sorting
  scoreP += substrate * 0.7;
  scoreE += (3 - substrate) * 0.7;

  // Fibrous roots (0=persistent to 3=absent)
  scoreP += roots * 0.7;
  scoreE += (3 - roots) * 0.7;

  // Drainage area and precip
  if (drainage > 1.0) scoreP += 1.0;
  if (precip > 115) scoreP += 0.5;

  const probs = normalizeProbabilities(scoreP, scoreI, scoreE);
  const streamClass = determineClassFromProbs(probs.P, probs.I, probs.E);

  return {
    classification: streamClass,
    probabilities: probs,
    summary: `Southeast RF Model: P=${Math.round(probs.P * 100)}%, I=${Math.round(probs.I * 100)}%, E=${Math.round(probs.E * 100)}%`,
    region: 'Southeast',
    timestamp,
    inputs,
  };
}

/**
 * Normalizes scores into probabilities that sum to 1.0 with softmax temperature
 */
function normalizeProbabilities(pScore: number, iScore: number, eScore: number): { P: number; I: number; E: number; ALI: number } {
  const temperature = 2.0;
  const expP = Math.exp(pScore / temperature);
  const expI = Math.exp(iScore / temperature);
  const expE = Math.exp(eScore / temperature);
  const sum = expP + expI + expE;

  const P = Math.round((expP / sum) * 1000) / 1000;
  const I = Math.round((expI / sum) * 1000) / 1000;
  const E = Math.round((expE / sum) * 1000) / 1000;
  const ALI = Math.round((P + I) * 1000) / 1000;

  return { P, I, E, ALI };
}

/**
 * Applies the EPA SDAM decision rules to class probabilities
 */
function determineClassFromProbs(P: number, I: number, E: number): ClassificationType {
  if (P >= 0.5) return 'PERENNIAL';
  if (I >= 0.5) return 'INTERMITTENT';
  if (E >= 0.5) return 'EPHEMERAL';
  if (P > E) return 'AT LEAST INTERMITTENT';
  if (E > P) return 'LESS THAN PERENNIAL';
  if (P === E) return 'NEED MORE INFORMATION';
  return 'OTHER';
}
