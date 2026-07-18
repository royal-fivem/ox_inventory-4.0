export interface ExperienceUnlock {
  level: number;
  title: string;
  reward?: number; // cash paid on reaching this level
  bonus?: string; // perk / description shown under the title, e.g. "+5% pawn payout"
}

export interface ExperienceTrack {
  id: string;
  label: string;
  icon: string;
  level: number;
  xp: number;
  nextXp: number;
  daily: number;
  dailyCap: number;
  maxLevel: number;
  unlocks: ExperienceUnlock[];
}

export interface Experience extends ExperienceTrack {
  subExperiences: ExperienceTrack[];
}
