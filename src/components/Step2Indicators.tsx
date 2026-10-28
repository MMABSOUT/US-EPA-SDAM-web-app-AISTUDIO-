import React, { useState, useEffect } from 'react';
import { SdamRegion, ModelPrediction, Coordinates, BankMeasurement } from '../types/sdam';
import { runSdamModel } from '../utils/sdamClassifier';
import { getElevationMeters, getPrismPrecipNormal } from '../utils/geoUtils';
import { Play, Calculator, AlertCircle, Award, CheckCircle } from 'lucide-react';

interface Step2Props {
  region: SdamRegion;
  coordinates: Coordinates;
  prediction: ModelPrediction | null;
  onPredictionChange: (pred: ModelPrediction | null) => void;
  indicatorInputs: Record<string, any>;
  onIndicatorInputsChange: (inputs: Record<string, any>) => void;
}

export const Step2Indicators: React.FC<Step2Props> = ({
  region,
  coordinates,
  prediction,
  onPredictionChange,
  indicatorInputs,
  onIndicatorInputsChange,
}) => {
  // Bankfull width measurements (1 to 3)
  const [bankNum, setBankNum] = useState<number>(3);
  const [bankVals, setBankVals] = useState<BankMeasurement[]>([
    { id: 1, value: 2.4 },
    { id: 2, value: 2.6 },
    { id: 3, value: 2.5 },
  ]);

  // Densiometer tool for shading
  const [showDensiometer, setShowDensiometer] = useState(false);
  const [densiCount, setDensiCount] = useState<number>(4);
  const [densiReadings, setDensiReadings] = useState<number[]>([12, 11, 13, 10]);

  // Elevation and precipitation auto-fill
  const [elevation, setElevation] = useState<number>(250);
  const [precip, setPrecip] = useState<number>(105);
  const [isRunning, setIsRunning] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync bankfull width mean
  const validBankVals = bankVals.slice(0, bankNum).map((b) => (typeof b.value === 'number' ? b.value : 0));
  const bankMean = validBankVals.length > 0 ? validBankVals.reduce((a, b) => a + b, 0) / bankNum : 2.5;

  // Sync densiometer shade %
  const densiShadePercent =
    densiCount > 0
      ? Math.round((densiReadings.slice(0, densiCount).reduce((a, b) => a + b, 0) / (densiCount * 17)) * 100)
      : 50;

  // Load elevation and PRISM precipitation on location change
  useEffect(() => {
    let isMounted = true;
    if (coordinates.lat && coordinates.lon) {
      getElevationMeters(coordinates.lat, coordinates.lon).then((elev) => {
        if (isMounted) {
          setElevation(elev);
          updateInput('user_elev', elev);
        }
      });
      const pr = getPrismPrecipNormal(coordinates.lat, coordinates.lon);
      setPrecip(pr);
      updateInput('user_precip', pr);
    }
    return () => {
      isMounted = false;
    };
  }, [coordinates.lat, coordinates.lon]);

  const updateInput = (key: string, val: any) => {
    onIndicatorInputsChange({
      ...indicatorInputs,
      [key]: val,
    });
  };

  const handleBankValChange = (idx: number, val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    const updated = [...bankVals];
    updated[idx] = { id: idx + 1, value: num };
    setBankVals(updated);
  };

  const handleRunModel = () => {
    setValidationError(null);
    setIsRunning(true);

    const mergedInputs: Record<string, any> = {
      ...indicatorInputs,
      bank_mean: Math.round(bankMean * 10) / 10,
      user_elev: elevation,
      user_precip: precip,
    };

    // Quick validation check for missing values
    if (region === 'Pacific Northwest') {
      if (!mergedInputs.user_aquatic_presence || !mergedInputs.user_ephemeroptera || !mergedInputs.user_per_taxa) {
        setValidationError('Indicator data missing! Please select responses for all indicators before running the model prediction.');
        setIsRunning(false);
        return;
      }
    }

    setTimeout(() => {
      const result = runSdamModel(region, mergedInputs);
      onPredictionChange(result);
      setIsRunning(false);
    }, 300);
  };

  return (
    <div id="step2-container" className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <span className="step-badge">Step 2</span>
        <h2 className="text-xl font-bold text-gray-900">Enter field measurements for all indicators</h2>
      </div>

      <div className="bg-white border-2 border-gray-800 rounded p-5 mb-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 underline decoration-[#005ea2] decoration-3">
            {region} SDAM
          </h3>
          <p className="text-sm text-gray-600 mt-1">Regional field indicator assessment protocol</p>
        </div>

        {/* BANKFULL WIDTH CALCULATOR (Used in GP, AW, WM, NE, SE) */}
        {region !== 'Pacific Northwest' && (
          <div className="question-box">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Enter the number of bankfull width measurements (m) (min. 1, max. 3) and associated measurement values to the nearest 0.1 m:
            </h4>
            <div className="flex items-center space-x-3 mb-3">
              <label className="text-xs font-semibold text-gray-700">Number of measurements:</label>
              <select
                value={bankNum}
                onChange={(e) => setBankNum(parseInt(e.target.value, 10))}
                className="border border-gray-400 p-1.5 rounded text-sm bg-white"
              >
                <option value={1}>1 measurement</option>
                <option value={2}>2 measurements</option>
                <option value={3}>3 measurements</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                {Array.from({ length: bankNum }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-600 w-36">Measurement {i + 1} (m):</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={bankVals[i]?.value ?? ''}
                      onChange={(e) => handleBankValChange(i, e.target.value)}
                      className="w-28 border border-gray-400 p-1.5 rounded text-sm bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="border-my-text rounded">
                <span className="text-xs uppercase tracking-wider text-blue-200">Calculated Value</span>
                <div className="text-lg font-bold">Mean Bankfull Width: {Math.round(bankMean * 10) / 10} m</div>
              </div>
            </div>
          </div>
        )}

        {/* REGION SPECIFIC INDICATOR QUESTIONS */}

        {/* 1. PACIFIC NORTHWEST */}
        {region === 'Pacific Northwest' && (
          <div className="space-y-4">
            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                1. Are aquatic macroinvertebrates present?
              </label>
              <div className="flex space-x-6">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="user_aquatic_presence"
                      checked={indicatorInputs.user_aquatic_presence === opt}
                      onChange={() => updateInput('user_aquatic_presence', opt)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                2. Are 6 or more individuals of the Order Ephemeroptera (mayflies) present?
              </label>
              <div className="flex space-x-6">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="user_ephemeroptera"
                      checked={indicatorInputs.user_ephemeroptera === opt}
                      onChange={() => updateInput('user_ephemeroptera', opt)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                3. Are perennial indicator taxa present?
              </label>
              <div className="flex space-x-6">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="user_per_taxa"
                      checked={indicatorInputs.user_per_taxa === opt}
                      onChange={() => updateInput('user_per_taxa', opt)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                4. Are FACW, OBL, or SAV plants present? (Within ½ channel width)
              </label>
              <div className="flex space-x-6">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="user_plants"
                      checked={indicatorInputs.user_plants === opt}
                      onChange={() => updateInput('user_plants', opt)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                5. Reach slope (to the nearest half-percent):
              </label>
              <input
                type="number"
                step="0.5"
                value={indicatorInputs.user_slope ?? '4.5'}
                onChange={(e) => updateInput('user_slope', e.target.value)}
                className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
              />
              <span className="ml-2 text-sm text-gray-600">%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-2">Are fish present?</label>
                <div className="flex space-x-6">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm font-semibold">
                      <input
                        type="radio"
                        name="user_fish"
                        checked={indicatorInputs.user_fish === opt}
                        onChange={() => updateInput('user_fish', opt)}
                        className="w-4 h-4 text-[#005ea2]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-2">Are amphibians present?</label>
                <div className="flex space-x-6">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm font-semibold">
                      <input
                        type="radio"
                        name="user_amphibians"
                        checked={indicatorInputs.user_amphibians === opt}
                        onChange={() => updateInput('user_amphibians', opt)}
                        className="w-4 h-4 text-[#005ea2]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. GREAT PLAINS */}
        {region === 'Great Plains' && (
          <div className="space-y-4">
            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Total abundance of aquatic macroinvertebrates:
              </label>
              <div className="space-y-1.5">
                {[
                  { label: 'Total abundance of aquatic macroinvertebrates is zero.', val: 0 },
                  { label: 'Total abundance is 1 to 9 individuals.', val: 1 },
                  { label: 'Total abundance is 10 or more individuals.', val: 2 },
                ].map((opt) => (
                  <label key={opt.val} className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="gp_total_abundance"
                      checked={indicatorInputs.user_total_abundance === opt.val}
                      onChange={() => updateInput('user_total_abundance', opt.val)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Number of hydrophytic plant species:
              </label>
              <div className="space-y-1.5">
                {[
                  { label: 'Less than 2 species', val: 0 },
                  { label: 'Greater than or equal to 2 species', val: 1 },
                ].map((opt) => (
                  <label key={opt.val} className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="gp_hydrophyte"
                      checked={indicatorInputs.user_hydrophyte === opt.val}
                      onChange={() => updateInput('user_hydrophyte', opt.val)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-1">
                Presence/absence of rooted upland plants in streambed:
              </label>
              <p className="text-xs text-gray-600 mb-2">Upland rooted plants include FAC, FACU, UPL, NI.</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Present - rooted upland plant individuals are present in the streambed.', val: 0 },
                  { label: 'Absent - rooted upland plant individuals are absent in the streambed.', val: 1 },
                ].map((opt) => (
                  <label key={opt.val} className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="gp_upland_rooted"
                      checked={indicatorInputs.user_upland_rooted === opt.val}
                      onChange={() => updateInput('user_upland_rooted', opt.val)}
                      className="w-4 h-4 text-[#005ea2]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Differences in vegetation:</label>
              <select
                value={indicatorInputs.user_diff_veg ?? 1}
                onChange={(e) => updateInput('user_diff_veg', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor) No compositional or density differences in vegetation between streambanks and adjacent uplands</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak) Vegetation growing along reach occurs in greater densities, but no dramatic composition difference</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate) Distinct riparian corridor exists along part of the reach</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong) Dramatic differences in vegetation; distinct riparian corridor along entire reach</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Riffle-pool sequence:</label>
              <select
                value={indicatorInputs.user_riff_pool ?? 1}
                onChange={(e) => updateInput('user_riff_pool', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor) No riffle-pool sequences observed</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak) Mostly has areas of pools or riffles</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate) Less frequent number of riffles and pools; transition difficult to observe</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong) Frequent structural transitions with obvious transition between riffles and pools</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Particle size or stream substrate sorting:</label>
              <select
                value={indicatorInputs.user_substrate ?? 1.5}
                onChange={(e) => updateInput('user_substrate', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor) Particle sizes in channel comparable to adjacent areas; no sorting observed</option>
                <option value={0.75}>0.75</option>
                <option value={1.5}>1.5 (Moderate) Moderately similar sizes; higher ratio of larger gravel/cobble</option>
                <option value={2.25}>2.25</option>
                <option value={3}>3 (Strong) Noticeably different; clear distribution of finer particles in pools, larger in riffles</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Sediment on plants or debris:</label>
              <select
                value={indicatorInputs.user_sediment_plants ?? 0.5}
                onChange={(e) => updateInput('user_sediment_plants', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor) No fine sediment is present on plants or debris</option>
                <option value={0.25}>0.25</option>
                <option value={0.5}>0.5 (Weak) Fine sediment is isolated in small amounts along stream</option>
                <option value={0.75}>0.75</option>
                <option value={1}>1 (Moderate) Fine sediment found on plants/debris within channel, mostly accumulating in pools</option>
                <option value={1.25}>1.25</option>
                <option value={1.5}>1.5 (Strong) Readily found on plants/debris in channel and floodplain throughout stream</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. ARID WEST */}
        {region === 'Arid West' && (
          <div className="space-y-4">
            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Perennial indicator taxa abundance:
              </label>
              <select
                value={indicatorInputs.user_eph_isa ?? 1}
                onChange={(e) => updateInput('user_eph_isa', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0: No perennial indicator taxa detected</option>
                <option value={1}>1: 1 to 4 perennial indicator individuals</option>
                <option value={2}>2: 5 to 9 perennial indicator individuals</option>
                <option value={3}>3: 10 to 19 perennial indicator individuals</option>
                <option value={4}>4: 20 or more perennial indicator individuals</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Reach slope (to the nearest half-percent):</label>
              <input
                type="number"
                step="0.5"
                value={indicatorInputs.user_slope ?? '3.0'}
                onChange={(e) => updateInput('user_slope', e.target.value)}
                className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
              />
              <span className="ml-2 text-sm text-gray-600">%</span>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Number of hydrophytic plant species:</label>
              <select
                value={indicatorInputs.user_hydrophyte ?? 2}
                onChange={(e) => updateInput('user_hydrophyte', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 species</option>
                <option value={1}>1 species</option>
                <option value={2}>2 species</option>
                <option value={3}>3 species</option>
                <option value={4}>4 species</option>
                <option value={5}>5 or more species</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Prevalence of upland rooted plants in streambed:</label>
              <select
                value={indicatorInputs.user_upland_rooted ?? 1.5}
                onChange={(e) => updateInput('user_upland_rooted', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor) Rooted upland plants are prevalent within streambed/thalweg</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak) Rooted upland plants consistently dispersed</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate) Few rooted upland plants present</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong) Rooted upland plants absent from streambed/thalweg</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Algal cover:</label>
              <select
                value={indicatorInputs.user_algal_cover ?? 1}
                onChange={(e) => updateInput('user_algal_cover', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white mb-2"
              >
                <option value={0}>0: Not detected</option>
                <option value={1}>1: &lt;2% cover</option>
                <option value={2}>2: 2–10% cover</option>
                <option value={3}>3: 10–40% cover</option>
                <option value={4}>4: &gt;40% cover</option>
              </select>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicatorInputs.user_algal_cb ?? false}
                  onChange={(e) => updateInput('user_algal_cb', e.target.checked)}
                  className="rounded text-[#005ea2]"
                />
                <span>Check here if algae exclusively appears to have been deposited from an upstream source, and no local growth is evident.</span>
              </label>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Differences in vegetation:</label>
              <select
                value={indicatorInputs.user_diff_veg ?? 1.5}
                onChange={(e) => updateInput('user_diff_veg', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor)</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak)</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate)</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Riffle-pool sequence score:</label>
              <select
                value={indicatorInputs.user_riff_pool ?? 1}
                onChange={(e) => updateInput('user_riff_pool', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor)</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak)</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate)</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. WESTERN MOUNTAINS */}
        {region === 'Western Mountains' && (
          <div className="space-y-4">
            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Abundance of Ephemeroptera, Plecoptera, and Trichoptera (EPT):
              </label>
              <select
                value={indicatorInputs.user_total_abundance ?? 2}
                onChange={(e) => updateInput('user_total_abundance', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0: No EPT detected</option>
                <option value={1}>1: 1 to 4 EPT individuals</option>
                <option value={2}>2: 5 to 9 EPT individuals</option>
                <option value={3}>3: 10 to 19 EPT individuals</option>
                <option value={4}>4: 20 or more EPT individuals</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Perennial indicator taxa:
              </label>
              <select
                value={indicatorInputs.user_eph_isa ?? 1}
                onChange={(e) => updateInput('user_eph_isa', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0: No perennial indicator taxa detected</option>
                <option value={1}>1: 1 to 4 perennial indicator individuals</option>
                <option value={2}>2: 5 to 9 perennial indicator individuals</option>
                <option value={3}>3: 10 to 19 perennial indicator individuals</option>
                <option value={4}>4: 20 or more perennial indicator individuals</option>
              </select>
            </div>

            <div className="question-box">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-900">Reach shading (%):</label>
                <button
                  type="button"
                  onClick={() => setShowDensiometer(!showDensiometer)}
                  className="text-xs text-[#005ea2] underline hover:text-[#1a4480] flex items-center space-x-1 cursor-pointer font-semibold"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{showDensiometer ? 'Hide densiometer tool' : 'Use densiometer calculator'}</span>
                </button>
              </div>

              {!showDensiometer ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={indicatorInputs.user_shade ?? '45'}
                    onChange={(e) => updateInput('user_shade', e.target.value)}
                    className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-900 mb-2">
                    Spherical densiometer reading calculator (17 points per grid):
                  </p>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xs font-semibold">Number of readings:</span>
                    <select
                      value={densiCount}
                      onChange={(e) => setDensiCount(parseInt(e.target.value, 10))}
                      className="border border-gray-300 p-1 text-xs rounded bg-white"
                    >
                      {[1, 2, 3, 4, 6, 8, 12].map((n) => (
                        <option key={n} value={n}>{n} readings</option>
                      ))}
                    </select>
                    <span className="text-xs font-bold text-[#005ea2]">
                      Calculated Shade: {densiShadePercent}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: densiCount }).map((_, i) => (
                      <div key={i} className="text-xs">
                        <span>Station {i + 1}: {densiReadings[i] ?? 10}/17</span>
                        <input
                          type="range"
                          min="0"
                          max="17"
                          value={densiReadings[i] ?? 10}
                          onChange={(e) => {
                            const updated = [...densiReadings];
                            updated[i] = parseInt(e.target.value, 10);
                            setDensiReadings(updated);
                            updateInput('user_shade', densiShadePercent);
                          }}
                          className="w-full h-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Reach slope (%):</label>
              <input
                type="number"
                step="0.5"
                value={indicatorInputs.user_slope ?? '4.0'}
                onChange={(e) => updateInput('user_slope', e.target.value)}
                className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
              />
              <span className="ml-2 text-sm text-gray-600">%</span>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Number of hydrophytic plant species:</label>
              <select
                value={indicatorInputs.user_hydrophyte ?? 2}
                onChange={(e) => updateInput('user_hydrophyte', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 species</option>
                <option value={1}>1 species</option>
                <option value={2}>2 species</option>
                <option value={3}>3 species</option>
                <option value={4}>4 species</option>
                <option value={5}>5 or more species</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Prevalence of upland rooted plants in streambed:</label>
              <select
                value={indicatorInputs.user_upland_rooted ?? 1.5}
                onChange={(e) => updateInput('user_upland_rooted', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor)</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak)</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate)</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Differences in vegetation:</label>
              <select
                value={indicatorInputs.user_diff_veg ?? 1.5}
                onChange={(e) => updateInput('user_diff_veg', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor)</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak)</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate)</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Riffle-pool sequence:</label>
              <select
                value={indicatorInputs.user_riff_pool ?? 1.5}
                onChange={(e) => updateInput('user_riff_pool', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor)</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak)</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate)</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Particle size or stream substrate sorting:</label>
              <select
                value={indicatorInputs.user_substrate ?? 1.5}
                onChange={(e) => updateInput('user_substrate', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor)</option>
                <option value={0.75}>0.75</option>
                <option value={1.5}>1.5 (Moderate)</option>
                <option value={2.25}>2.25</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>
          </div>
        )}

        {/* 5. NORTHEAST */}
        {region === 'Northeast' && (
          <div className="space-y-4">
            <div className="question-box">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Average Entrenchment Ratio:</label>
                  <p className="text-xs text-gray-600 mb-2">Flood-prone width divided by bankfull width (typically 1.0 to 2.5).</p>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={indicatorInputs.user_er ?? '1.65'}
                    onChange={(e) => updateInput('user_er', e.target.value)}
                    className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                  />
                </div>
                <div className="p-3 bg-white border border-gray-300 rounded text-center">
                  <span className="text-xs font-bold text-gray-700 block mb-1">Entrenchment Ratio Diagram</span>
                  <img
                    src="/er.jpg"
                    alt="Entrenchment Ratio diagram"
                    className="max-h-28 mx-auto object-contain rounded border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-[11px] text-gray-500 italic mt-1">
                    Flood-prone Width (at 2× max bankfull depth) ÷ Bankfull Width
                  </div>
                </div>
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Aquatic macroinvertebrates: BMI Score:
              </label>
              <select
                value={indicatorInputs.user_bmi ?? 2}
                onChange={(e) => updateInput('user_bmi', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Absent) No aquatic macroinvertebrates observed</option>
                <option value={1}>1 (Weak) Total abundance is 1 to 3</option>
                <option value={2}>2 (Moderate) Total abundance ≥ 4</option>
                <option value={3}>3 (Strong) Total abundance ≥ 10 and richness ≥ 3 OR Total abundance &lt; 10 and richness ≥ 5</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Reach slope (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={indicatorInputs.user_slope ?? '2.5'}
                  onChange={(e) => updateInput('user_slope', e.target.value)}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>

              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Percent shading (%):</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={indicatorInputs.user_shade ?? '55'}
                  onChange={(e) => updateInput('user_shade', e.target.value)}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Drainage area (sq miles):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.001"
                  value={indicatorInputs.user_drainage ?? '0.45'}
                  onChange={(e) => updateInput('user_drainage', e.target.value)}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>

              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Elevation (m):</label>
                <input
                  type="number"
                  step="1"
                  value={elevation}
                  onChange={(e) => setElevation(parseFloat(e.target.value))}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
                <span className="text-xs text-gray-500 block mt-1">Auto-retrieved from USGS / site location</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. SOUTHEAST */}
        {region === 'Southeast' && (
          <div className="space-y-4">
            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Aquatic macroinvertebrates: BMI Score:
              </label>
              <select
                value={indicatorInputs.user_bmi ?? 2}
                onChange={(e) => updateInput('user_bmi', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Absent) No aquatic macroinvertebrates observed</option>
                <option value={1}>1 (Weak) Total abundance is 1 to 3</option>
                <option value={2}>2 (Moderate) Total abundance ≥ 4</option>
                <option value={3}>3 (Strong) Total abundance ≥ 10 and richness ≥ 3 OR Total abundance &lt; 10 and richness ≥ 5</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Total aquatic macroinvertebrate abundance:
              </label>
              <select
                value={indicatorInputs.user_total_abundance ?? 2}
                onChange={(e) => updateInput('user_total_abundance', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0: No aquatic macroinvertebrates observed</option>
                <option value={1}>1: Total abundance is 1 or 2</option>
                <option value={2}>2: Total abundance is 3 to 40</option>
                <option value={3}>3: Total abundance is 41 or more</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Percent shading (%):</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={indicatorInputs.user_shade ?? '60'}
                  onChange={(e) => updateInput('user_shade', e.target.value)}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>

              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Drainage area (sq miles):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.001"
                  value={indicatorInputs.user_drainage ?? '0.65'}
                  onChange={(e) => updateInput('user_drainage', e.target.value)}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Prevalence of upland rooted plants in streambed:</label>
              <select
                value={indicatorInputs.user_upland_rooted ?? 2}
                onChange={(e) => updateInput('user_upland_rooted', parseInt(e.target.value, 10))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Poor) Rooted upland plants are prevalent (&gt;75%)</option>
                <option value={1}>1 (Weak) Rooted upland plants consistently dispersed (20-75%)</option>
                <option value={2}>2 (Moderate) Few rooted upland plants (&lt;20%)</option>
                <option value={3}>3 (Strong) Rooted upland plants are absent from streambed</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Particle size of stream substrate:</label>
              <select
                value={indicatorInputs.user_substrate ?? 1.5}
                onChange={(e) => updateInput('user_substrate', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Absent)</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak)</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate)</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong)</option>
              </select>
            </div>

            <div className="question-box">
              <label className="block text-sm font-bold text-gray-900 mb-2">Prevalence of fibrous roots in the streambed:</label>
              <select
                value={indicatorInputs.user_roots ?? 2}
                onChange={(e) => updateInput('user_roots', parseFloat(e.target.value))}
                className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
              >
                <option value={0}>0 (Persistent) Strong network of fibrous roots persistent in thalweg</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1 (Weak) Discontinuous network of fibrous roots present</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2 (Moderate) Very few fibrous roots present</option>
                <option value={2.5}>2.5</option>
                <option value={3}>3 (Strong) No fibrous roots present</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">Elevation (m):</label>
                <input
                  type="number"
                  step="1"
                  value={elevation}
                  onChange={(e) => setElevation(parseFloat(e.target.value))}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>

              <div className="question-box">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  PRISM 30-year normal May-July precipitation (mm):
                </label>
                <input
                  type="number"
                  step="1"
                  value={precip}
                  onChange={(e) => setPrecip(parseFloat(e.target.value))}
                  className="w-32 border border-gray-400 p-2 rounded text-sm bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation error display */}
        {validationError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-900 rounded text-sm flex items-center space-x-2 my-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* RUN MODEL ACTION */}
        <div className="text-center mt-6 pt-4 border-t border-gray-300">
          <button
            type="button"
            onClick={handleRunModel}
            disabled={isRunning}
            className="epa-btn-primary text-lg py-3 px-10 cursor-pointer shadow-lg flex items-center justify-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isRunning ? 'Calculating prediction...' : 'Run model'}</span>
          </button>
        </div>

        {/* PREDICTION CLASSIFICATION RESULTS BOX */}
        {prediction && (
          <div className="mt-8 animate-fade-in">
            <div className="border-my-class shadow-md">
              <h3 className="text-xs uppercase tracking-widest text-blue-200 mb-1 font-bold">
                Streamflow Duration Assessment Result
              </h3>
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase my-2 tracking-wide text-white">
                This reach is classified as:<br />
                <span className="text-yellow-300 inline-block mt-1 underline decoration-yellow-400">
                  {prediction.classification}
                </span>
              </h2>

              <p className="text-xs text-blue-100 mt-2 italic max-w-xl mx-auto">
                {prediction.summary}
              </p>

              {/* Probabilities breakdown */}
              <div className="mt-4 pt-4 border-t border-blue-400 max-w-lg mx-auto">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-blue-900/60 p-2 rounded border border-blue-400/40">
                    <span className="block font-bold text-blue-200">Perennial (P)</span>
                    <span className="text-base font-extrabold text-white">
                      {Math.round(prediction.probabilities.P * 100)}%
                    </span>
                  </div>
                  <div className="bg-blue-900/60 p-2 rounded border border-blue-400/40">
                    <span className="block font-bold text-blue-200">Intermittent (I)</span>
                    <span className="text-base font-extrabold text-white">
                      {Math.round(prediction.probabilities.I * 100)}%
                    </span>
                  </div>
                  <div className="bg-blue-900/60 p-2 rounded border border-blue-400/40">
                    <span className="block font-bold text-blue-200">Ephemeral (E)</span>
                    <span className="text-base font-extrabold text-white">
                      {Math.round(prediction.probabilities.E * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
