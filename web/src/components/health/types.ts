export interface Injury {
  id: string;
  label: string;
  // 0-100, drives the severity colour of the pill
  severity: number;
  bodyPart?: string;
}

export interface HealthData {
  // all 0-100 percentages
  health: number;
  armor: number;
  stamina: number;
  injuries: Injury[];
}
