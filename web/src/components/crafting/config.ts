import { CraftCategory } from './types';

// ======================================================================
//  Default / fallback category configuration.
//
//  Categories are normally supplied by the Lua backend (data file) so they
//  stay fully configurable server-side. This list is only used when the
//  backend sends recipes referencing a category it did not define, and to
//  give browser dev mode something to render.
// ======================================================================

export const DEFAULT_CATEGORIES: CraftCategory[] = [
  { id: 'materials', label: 'Materials', order: 0 },
  { id: 'mechanic', label: 'Mechanic', order: 1 },
  { id: 'medical', label: 'Medical', order: 2 },
  { id: 'tools', label: 'Tools', order: 3 },
  { id: 'misc', label: 'Miscellaneous', order: 99 },
];

/** Fallback category used when a recipe references an unknown category id. */
export const FALLBACK_CATEGORY_ID = 'misc';

/** Sort modes offered by the codex filter. */
export const SORT_MODES = [
  { id: 'category', label: 'Category' },
  { id: 'name', label: 'Name (A-Z)' },
  { id: 'craftable', label: 'Craftable first' },
] as const;

export type SortMode = (typeof SORT_MODES)[number]['id'];
