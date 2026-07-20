export interface Injury {
  id: string;
  label: string;
  severity: number;
  bodyPart?: string;
  bleeding?: boolean;
  healItem?: string;
}

export interface HealthData {
  // all 0-100 percentages
  health: number;
  armor: number;
  stamina: number;
  injuries: Injury[];
}
