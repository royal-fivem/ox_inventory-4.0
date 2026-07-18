import { ShopProduct } from './types';

// Mock shop data for browser dev (yarn start). In-game the products come from
// the shop inventory (Redux rightInventory) instead.
export const MOCK_SHOP_LABEL = 'General Store';

export const MOCK_SHOP_CATEGORIES = [
  { id: 'drinks', label: 'Drinks', icon: 'fa-bottle-water' },
  { id: 'food', label: 'Food', icon: 'fa-burger' },
  { id: 'furniture', label: 'Furniture', icon: 'fa-chair' },
  { id: 'misc', label: 'Misc', icon: 'fa-box' },
];

export const MOCK_SHOP_PRODUCTS: ShopProduct[] = [
  { slot: 1, name: 'chair_grey', label: 'Grey Foldable Chair', price: 50, category: 'furniture', count: 12 },
  { slot: 2, name: 'chair_orange', label: 'Orange Foldable Chair', price: 50, category: 'furniture', count: 8 },
  { slot: 3, name: 'chair_pink', label: 'Pink Foldable Chair', price: 50, category: 'furniture', count: 3 },
  { slot: 4, name: 'chair_purple', label: 'Purple Foldable Chair', price: 50, category: 'furniture', count: 5 },
  { slot: 5, name: 'chair_red', label: 'Red Foldable Chair', price: 50, category: 'furniture', count: 9 },
  { slot: 6, name: 'rolling_paper', label: 'Rolling Paper', price: 29, category: 'misc', count: 40 },
  { slot: 7, name: 'sandwich', label: 'Sandwich', price: 10, category: 'food', count: 25 },
  { slot: 8, name: 'wallet', label: 'Wallet', price: 289, category: 'misc', count: 2 },
  { slot: 9, name: 'water', label: 'Water Bottle', price: 5, category: 'drinks', count: 99 },
  { slot: 10, name: 'coffee', label: 'Coffee', price: 295, category: 'drinks', count: 15 },
  { slot: 11, name: 'soda', label: 'Soda', price: 25, category: 'drinks', count: 30 },
  { slot: 12, name: 'chocolate_bar', label: 'Chocolate Bar', price: 25, category: 'food', count: 20 },
];
