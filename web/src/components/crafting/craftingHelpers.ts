import { store } from '../../store';
import { Items } from '../../store/items';
import { isSlotWithItem } from '../../helpers';
import { CraftRecipe, GridCell } from './types';

/**
 * Total amount of an item the player currently owns across their pockets
 * (leftInventory) and, if present, their backpack.
 */
export const getOwnedCount = (itemName: string): number => {
  const state = store.getState().inventory;
  let total = 0;

  const tally = (items?: { name?: string; count?: number }[]) => {
    if (!items) return;
    for (const slot of items) {
      if (isSlotWithItem(slot as any) && slot.name === itemName) total += slot.count ?? 1;
    }
  };

  tally(state.leftInventory?.items as any);
  tally(state.backpackInventory?.items as any);

  return total;
};

/** Human label for an item name, falling back to the raw name. */
export const getItemLabel = (itemName?: string | null): string => {
  if (!itemName) return '';
  return Items[itemName]?.label ?? itemName;
};

/**
 * Build the 3x3 workbench grid for a recipe.
 *
 * If the recipe defines a shaped `layout`, ingredients are placed in the
 * exact slots requested. Otherwise ingredients are auto-placed into the first
 * available cells. Missing/empty cells are returned so the grid always has 9.
 */
export const buildGrid = (recipe: CraftRecipe | null): GridCell[] => {
  const grid: GridCell[] = Array.from({ length: 9 }, (_, slot) => ({
    slot,
    name: null,
    count: 0,
    owned: 0,
  }));

  if (!recipe) return grid;

  const countFor = (name: string) =>
    recipe.ingredients.find((i) => i.name === name)?.count ?? 0;

  if (recipe.layout && recipe.layout.length) {
    recipe.layout.forEach((name, slot) => {
      if (slot > 8 || !name) return;
      grid[slot] = {
        slot,
        name,
        count: countFor(name),
        owned: getOwnedCount(name),
      };
    });
    return grid;
  }

  // Auto-layout: fill from the first slot in ingredient order.
  recipe.ingredients.slice(0, 9).forEach((ingredient, index) => {
    grid[index] = {
      slot: index,
      name: ingredient.name,
      count: ingredient.count,
      owned: getOwnedCount(ingredient.name),
    };
  });

  return grid;
};

/** Whether the player owns every ingredient required for the recipe. */
export const canCraftRecipe = (recipe: CraftRecipe): boolean =>
  recipe.ingredients.every((ing) => getOwnedCount(ing.name) >= ing.count);
