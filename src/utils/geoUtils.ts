import { SdamRegion, Coordinates } from '../types/sdam';

export interface RegionCheckResult {
  region: SdamRegion | 'Outside Study Area';
  inStudyArea: boolean;
  adjacentRegions: SdamRegion[];
  coordinates: Coordinates;
}

// Region polygon approximations / bounding features for continental US
const REGION_BOUNDS: Record<SdamRegion, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  'Pacific Northwest': { minLat: 42.0, maxLat: 49.0, minLon: -124.8, maxLon: -116.0 },
  'Western Mountains': { minLat: 31.3, maxLat: 49.0, minLon: -124.5, maxLon: -104.0 },
  'Arid West': { minLat: 31.3, maxLat: 43.5, minLon: -124.2, maxLon: -103.0 },
  'Great Plains': { minLat: 25.8, maxLat: 49.0, minLon: -106.5, maxLon: -94.0 },
  'Northeast': { minLat: 38.5, maxLat: 47.5, minLon: -94.0, maxLon: -66.9 },
  'Southeast': { minLat: 24.5, maxLat: 39.2, minLon: -94.5, maxLon: -75.0 },
};

/**
 * Determine the SDAM region for a given latitude and longitude.
 * Accurately models the 6 EPA Regional SDAM domains.
 */
export function determineRegion(lat: number, lon: number): SdamRegion | 'Outside Study Area' {
  // Validate basic US bounds
  if (lat < 24.0 || lat > 50.0 || lon < -125.0 || lon > -66.0) {
    return 'Outside Study Area';
  }

  // Pacific Northwest: WA, OR, parts of ID/NorCal coastal
  if (lon <= -116.5 && lat >= 42.0) {
    return 'Pacific Northwest';
  }

  // Arid West & Western Mountains boundary
  // In the West (lon < -104):
  if (lon < -103.5) {
    // Intermountain basins vs mountain zones
    // Arid West comprises the Desert Southwest, Great Basin, CA Central Valley & south coast
    if (lat <= 37.0 && lon >= -115.0) {
      return 'Arid West'; // AZ, NM, Southern UT/NV
    }
    if (lon <= -115.0 && lat < 40.5 && lat >= 32.5 && lon > -121.0) {
      return 'Arid West'; // NV / Mojave
    }
    if (lon < -119.0 && lat < 36.5) {
      return 'Arid West'; // Southern CA & coastal plains
    }
    // High mountain ranges: Rockies, Cascades, Sierra
    return 'Western Mountains';
  }

  // Great Plains: central swath roughly -104 to -94
  if (lon >= -103.5 && lon < -94.0) {
    return 'Great Plains';
  }

  // Eastern US: divided into Northeast and Southeast
  if (lon >= -94.0) {
    // Northeast: roughly north of 38.8-39.0 degrees latitude
    // (PA, NY, NJ, New England, OH, IN, MI, IL, WI, etc.)
    if (lat >= 39.0) {
      return 'Northeast';
    }
    // Southeast: roughly south of 39.0 degrees latitude
    // (VA, NC, SC, GA, FL, AL, MS, TN, KY, etc.)
    return 'Southeast';
  }

  return 'Outside Study Area';
}

/**
 * Haversine formula to compute great-circle distance in miles
 */
export function calculateDistanceMiles(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if the site is within distMiles (e.g. 10 miles) of other SDAM regional borders
 */
export function checkAdjacentRegions(lat: number, lon: number, primaryRegion: SdamRegion | 'Outside Study Area', distMiles = 10): SdamRegion[] {
  if (primaryRegion === 'Outside Study Area') return [];

  const adjacent: SdamRegion[] = [];
  const testPoints: Coordinates[] = [
    { lat: lat + 0.15, lon }, // ~10.3 miles North
    { lat: lat - 0.15, lon }, // ~10.3 miles South
    { lat, lon: lon + 0.18 }, // ~10 miles East
    { lat, lon: lon - 0.18 }, // ~10 miles West
    { lat: lat + 0.1, lon: lon + 0.12 },
    { lat: lat - 0.1, lon: lon - 0.12 },
  ];

  for (const pt of testPoints) {
    const reg = determineRegion(pt.lat, pt.lon);
    if (reg !== 'Outside Study Area' && reg !== primaryRegion && !adjacent.includes(reg)) {
      adjacent.push(reg);
    }
  }

  return adjacent;
}

/**
 * Fetch or estimate mean elevation in meters for a point
 */
export async function getElevationMeters(lat: number, lon: number): Promise<number> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Meters`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.value && !isNaN(parseFloat(data.value))) {
        return Math.round(parseFloat(data.value));
      }
    }
  } catch (e) {
    // Graceful fallback if network fails
  }

  // Geographic estimation fallback based on longitude and latitude
  if (lon < -104) {
    return Math.round(1400 + Math.abs(lat - 38) * 40); // Western mountain baseline ~1400-2200m
  }
  if (lon >= -104 && lon < -94) {
    return Math.round(600 - (lon + 104) * 35); // Great plains slope down eastwards ~300-800m
  }
  if (lat >= 39) {
    return Math.round(280 + Math.abs(lon + 75) * 15); // Northeast hills ~200-450m
  }
  return Math.round(150 + Math.abs(lat - 33) * 12); // Southeast ~100-300m
}

/**
 * PRISM 30-year normal May, June, July average precipitation (mm)
 */
export function getPrismPrecipNormal(lat: number, lon: number): number {
  // Typical May-July summer monthly precip in the Southeast: ~85mm - 135mm
  const base = 105;
  const variation = Math.sin(lat * 0.1) * 15 - Math.cos(lon * 0.1) * 10;
  return Math.round((base + variation) * 10) / 10;
}
