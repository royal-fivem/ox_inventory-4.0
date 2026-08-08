import { CraftCategory } from './types';
import { Locale } from '../../store/locale';

// ======================================================================
//  Default / fallback category configuration.
//
//  Categories are normally supplied by the Lua backend (data file) so they
//  stay fully configurable server-side. This list is only used when the
//  backend sends recipes referencing a category it did not define, and to
//  give browser dev mode something to render.
// ======================================================================

export const getDefaultCategories = (): CraftCategory[] => [
  { id: 'materials', label: Locale('ui_category_materials', 'Materials'), order: 0 },
  { id: 'mechanic', label: Locale('ui_category_mechanic', 'Mechanic'), order: 1 },
  { id: 'medical', label: Locale('ui_category_medical', 'Medical'), order: 2 },
  { id: 'tools', label: Locale('ui_category_tools', 'Tools'), order: 3 },
  { id: 'misc', label: Locale('ui_category_misc', 'Miscellaneous'), order: 99 },
];

/** Fallback category used when a recipe references an unknown category id. */
export const FALLBACK_CATEGORY_ID = 'misc';

/** Sort modes offered by the codex filter. */
export const SORT_MODES = [
  { id: 'category', fallback: 'Category' },
  { id: 'name', fallback: 'Name (A-Z)' },
  { id: 'craftable', fallback: 'Craftable first' },
] as const;

export type SortMode = (typeof SORT_MODES)[number]['id'];

export const getSortModes = () => SORT_MODES.map((mode) => ({ id: mode.id, label: Locale(`ui_sort_${mode.id}`, mode.fallback) }));
