export type SdamRegion =
  | 'Arid West'
  | 'Western Mountains'
  | 'Great Plains'
  | 'Pacific Northwest'
  | 'Northeast'
  | 'Southeast';

export type ClassificationType =
  | 'PERENNIAL'
  | 'INTERMITTENT'
  | 'EPHEMERAL'
  | 'AT LEAST INTERMITTENT'
  | 'LESS THAN PERENNIAL'
  | 'NEED MORE INFORMATION'
  | 'OTHER';

export interface ModelPrediction {
  classification: ClassificationType;
  probabilities: {
    P: number;
    I: number;
    E: number;
    ALI?: number;
  };
  summary: string;
  region: SdamRegion;
  timestamp: string;
  inputs: Record<string, any>;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface BankMeasurement {
  id: number;
  value: number | '';
}

export interface AssessmentMetadata {
  project: string;
  code: string;
  assessor: string;
  waterway: string;
  date: string;
  weatherCondition: string;
  weatherNotes: string;
  reachLength: string;
  flowState: string;
  surroundingLandUse: string;
  disturbances: string;
  notes: string;
}

export interface AssessmentPhoto {
  id: string;
  url: string;
  caption: string;
  category: 'upstream' | 'downstream' | 'substrate' | 'indicator' | 'other';
}
