import { Experience } from './types';

// Mirrors the screenshots so `npm run dev` in a browser shows real content.
export const MOCK_EXPERIENCE: Experience[] = [
  {
    id: 'agriculture', label: 'Agriculture', icon: 'agriculture',
    level: 1, xp: 251, nextXp: 400, daily: 0, dailyCap: 1000, maxLevel: 30,
    unlocks: [
      { level: 1, title: 'Field Hand' }, { level: 3, title: 'Harvester', reward: 400 },
      { level: 6, title: 'Herdsman', reward: 600 }, { level: 9, title: 'Cultivator', reward: 800 },
    ],
    subExperiences: [],
  },
  {
    id: 'outdoorsman', label: 'Outdoorsman', icon: 'outdoorsman',
    level: 1, xp: 8, nextXp: 400, daily: 0, dailyCap: 1000, maxLevel: 30,
    unlocks: [
      { level: 1, title: 'Wanderer' }, { level: 3, title: 'Tracker', reward: 400 },
    ],
    subExperiences: [
      { id: 'hunting', label: 'Hunting', icon: 'outdoorsman', level: 2, xp: 40, nextXp: 200, daily: 0, dailyCap: 1000, maxLevel: 30, unlocks: [{ level: 1, title: 'Small Game' }, { level: 3, title: 'Deer Hunter', reward: 300 }] },
      { id: 'fishing', label: 'Fishing', icon: 'outdoorsman', level: 1, xp: 10, nextXp: 200, daily: 0, dailyCap: 1000, maxLevel: 30, unlocks: [{ level: 1, title: 'Bait Thrower' }, { level: 3, title: 'Angler', reward: 300 }] },
    ],
  },
  {
    id: 'outlaw', label: 'Outlaw', icon: 'outlaw',
    level: 0, xp: 181, nextXp: 250, daily: 0, dailyCap: 1000, maxLevel: 30,
    unlocks: [
      { level: 1, title: 'Petty Crook' }, { level: 3, title: 'Burglar', reward: 400 },
      { level: 6, title: 'Robber', reward: 600 }, { level: 9, title: 'Kingpin', reward: 800 },
    ],
    subExperiences: [],
  },
  {
    id: 'trades', label: 'Trades', icon: 'trades',
    level: 1, xp: 0, nextXp: 500, daily: 0, dailyCap: 1000, maxLevel: 30,
    unlocks: [
      { level: 1, title: 'Apprentice' }, { level: 3, title: 'Fabricator', reward: 400 },
    ],
    subExperiences: [],
  },
  {
    id: 'underground', label: 'Underground', icon: 'underground',
    level: 1, xp: 0, nextXp: 50, daily: 0, dailyCap: 1000, maxLevel: 50,
    unlocks: [
      { level: 1, title: 'Street Kid' }, { level: 2, title: 'Lookout', bonus: '+1% chop payout' }, { level: 3, title: 'Wheelman', reward: 400, bonus: '+2% chop payout' },
      { level: 4, title: 'Hotwire', bonus: 'Faster hotwiring' }, { level: 5, title: 'Joyrider', bonus: '+3% chop payout' }, { level: 6, title: 'Boost Runner', reward: 600, bonus: '+4% chop payout' },
      { level: 7, title: 'Car Thief', bonus: '+5% chop payout' }, { level: 8, title: 'Chop Hand', bonus: 'Extra part yield' }, { level: 9, title: 'Grease Monkey', reward: 800, bonus: '+6% chop payout' },
      { level: 10, title: 'Part Stripper', bonus: '+7% chop payout' }, { level: 11, title: 'Chop Artist', bonus: '+8% chop payout' }, { level: 12, title: 'Gearhead', reward: 1000, bonus: '+9% chop payout' },
      { level: 13, title: 'Boost Specialist', bonus: 'Rare part chance' }, { level: 14, title: 'Vehicle Fence', bonus: '+10% chop payout' }, { level: 15, title: 'Chop Boss', reward: 1200, bonus: '+12% chop payout' },
      { level: 16, title: 'Boost Veteran', bonus: '+15% chop payout' },
    ],
    subExperiences: [
      { id: 'chopping', label: 'Chopping', icon: 'chopping', level: 3, xp: 40, nextXp: 100, daily: 0, dailyCap: 1000, maxLevel: 50, unlocks: [
        { level: 1, title: 'Scrapper' }, { level: 3, title: 'Dismantler', reward: 300 }, { level: 6, title: 'Chop Hand', reward: 500 }, { level: 9, title: 'Chop Master', reward: 700 },
      ] },
      { id: 'racing', label: 'Racing', icon: 'racing', level: 1, xp: 20, nextXp: 100, daily: 0, dailyCap: 1000, maxLevel: 50, unlocks: [
        { level: 1, title: 'Rookie' }, { level: 3, title: 'Drifter', reward: 300 }, { level: 6, title: 'Speedster', reward: 500 }, { level: 9, title: 'Track Star', reward: 700 },
      ] },
    ],
  },
];
