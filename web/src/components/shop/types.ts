// ======================================================================
//  Shop page types
// ======================================================================

export interface ShopProduct {
  slot: number;
  name: string;
  label: string;
  price: number;
  currency?: string;
  /** available stock — undefined means unlimited */
  count?: number;
  /** category id used by the category tabs */
  category?: string;
  image?: string;
  weight?: number;
  grade?: number | number[];
}

export interface ShopCategory {
  id: string;
  label: string;
  /** Font Awesome icon class (e.g. "fa-bottle-water") */
  icon?: string;
}

// default icons for common category ids, used when the shop config doesn't
// supply its own icon for a category
export const CATEGORY_ICONS: Record<string, string> = {
  all: 'fa-filter',
  drinks: 'fa-bottle-water',
  food: 'fa-burger',
  furniture: 'fa-chair',
  misc: 'fa-box',
  weapons: 'fa-gun',
  ammo: 'fa-boxes-stacked',
  tools: 'fa-screwdriver-wrench',
  medical: 'fa-kit-medical',
  clothing: 'fa-shirt',
  electronics: 'fa-microchip',
  materials: 'fa-cubes',
};

export const iconForCategory = (cat: ShopCategory): string =>
  cat.icon || CATEGORY_ICONS[cat.id] || 'fa-tag';

export interface CartLine {
  key: string;
  product: ShopProduct;
  quantity: number;
}

export const SHOP_SORTS = [
  { id: 'name', label: 'Name', icon: 'fa-arrow-down-a-z' },
  { id: 'price', label: 'Price', icon: 'fa-money-bill' },
  { id: 'available', label: 'Available', icon: 'fa-list-ol' },
] as const;

export type ShopSortId = (typeof SHOP_SORTS)[number]['id'];
export type SortDir = 'asc' | 'desc';

export const ALL_CATEGORY: ShopCategory = { id: 'all', label: 'All' };
export const MAX_CATEGORIES = 5;
