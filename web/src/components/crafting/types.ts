// ======================================================================
//  Personal crafting page types
//  (Minecraft-style workbench + codex + queue, always available via the
//   CRAFTING inventory tab — independent from physical crafting benches)
// ======================================================================

export interface CraftIngredient {
  /** item name (must match an ox_inventory item) */
  name: string;
  /** amount of this ingredient required for a single craft */
  count: number;
}

export interface CraftRecipe {
  /** unique recipe id, sent back to the server when crafting */
  id: string;
  /** item name that gets produced */
  result: string;
  /** display label override (falls back to the item label) */
  label?: string;
  /** short flavour / description shown on hover */
  description?: string;
  /** category id — must match a CraftCategory.id */
  category: string;
  /** amount produced per craft */
  count: number;
  /** craft time in ms (drives the queue progress bar) */
  duration: number;
  /** ingredients required for one craft */
  ingredients: CraftIngredient[];
  /**
   * Optional shaped layout. A flat array of up to 9 entries mapping a grid
   * slot (0-8, read left-to-right / top-to-bottom) to an ingredient name.
   * `null`/`false` leaves the slot empty. When omitted the grid is filled
   * automatically from the ingredient list.
   *
   *   0 1 2
   *   3 4 5
   *   6 7 8
   */
  layout?: (string | null | false)[];
}

export interface CraftCategory {
  /** unique category id referenced by recipes */
  id: string;
  /** display label (e.g. "Materials") */
  label: string;
  /** Font Awesome class or emoji shown next to the label */
  icon?: string;
  /** sort order — lower comes first */
  order?: number;
}

export interface CraftingConfig {
  categories: CraftCategory[];
  recipes: CraftRecipe[];
}

/** A single cell of the 3x3 workbench grid. */
export interface GridCell {
  /** grid index 0-8, or null for an empty cell */
  slot: number;
  /** ingredient item name, or null when the cell is empty */
  name: string | null;
  /** required amount for this ingredient */
  count: number;
  /** how many the player currently owns (across pockets + backpack) */
  owned: number;
}

/** An item the player has dragged (reserved) into a workbench cell. */
export interface PlacedCell {
  name: string;
  count: number;
  metadata?: Record<string, any>;
  rarity?: string | number;
  /** where it came from so it can be returned on close / no-match */
  sourceInv: 'player' | 'backpack';
  sourceSlot: number;
  /** per-unit weight, used when restoring to the inventory */
  unitWeight: number;
}

/** An entry in the crafting queue. */
export interface QueueJob {
  /** unique id for this queued job (not the recipe id) */
  uid: string;
  recipe: CraftRecipe;
  /** epoch ms when the job started processing, or null while waiting */
  startedAt: number | null;
}
