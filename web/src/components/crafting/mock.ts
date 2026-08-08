import { CraftingConfig } from './types';
import { getDefaultCategories } from './config';

// Mock config used when running the UI in a regular browser (yarn start),
// so the crafting page renders without a live FiveM backend.
export const MOCK_CRAFTING: CraftingConfig = {
  categories: getDefaultCategories(),
  recipes: [
    {
      id: 'brake_discs',
      result: 'brake_discs',
      label: 'Brake Discs',
      category: 'materials',
      count: 1,
      duration: 5000,
      description: 'Fabricated brake discs used for vehicle repairs.',
      ingredients: [
        { name: 'steel_ingot', count: 1 },
        { name: 'brake_disc_pads', count: 4 },
      ],
      layout: ['steel_ingot', null, 'brake_disc_pads'],
    },
    {
      id: 'lockpick',
      result: 'lockpick',
      label: 'Lockpick',
      category: 'tools',
      count: 1,
      duration: 5000,
      ingredients: [
        { name: 'metalscrap', count: 3 },
        { name: 'steel_ingot', count: 1 },
      ],
    },
    {
      id: 'repairkit',
      result: 'repairkit',
      label: 'Repair Kit',
      category: 'mechanic',
      count: 1,
      duration: 10000,
      ingredients: [
        { name: 'metalscrap', count: 5 },
        { name: 'iron_ingot', count: 2 },
        { name: 'ducttape', count: 1 },
      ],
      layout: ['metalscrap', 'ducttape', 'iron_ingot'],
    },
    {
      id: 'bandage',
      result: 'bandage',
      label: 'Bandage',
      category: 'medical',
      count: 1,
      duration: 2500,
      ingredients: [
        { name: 'cloth', count: 1 },
        { name: 'alcohol', count: 1 },
      ],
    },
    {
      id: 'cloth',
      result: 'cloth',
      label: 'Cloth',
      category: 'materials',
      count: 2,
      duration: 5000,
      ingredients: [
        { name: 'dirty_cloth', count: 1 },
        { name: 'alcohol', count: 1 },
      ],
    },
    {
      id: 'gauze',
      result: 'gauze',
      label: 'Gauze',
      category: 'medical',
      count: 3,
      duration: 4000,
      ingredients: [{ name: 'cloth', count: 2 }],
    },
  ],
};
