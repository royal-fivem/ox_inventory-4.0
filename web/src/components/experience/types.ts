export interface ExperienceRewardItem {
  name: string; // ox_inventory item name (used for the icon)
  count?: number; // amount given; shown in a corner when > 1
  label?: string; // optional display label (tooltip); falls back to the item label
}

export interface ExperienceUnlock {
  level: number;
  title: string;
  reward?: number; // cash paid on reaching this level
  items?: ExperienceRewardItem[]; // item rewards given at this level
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
