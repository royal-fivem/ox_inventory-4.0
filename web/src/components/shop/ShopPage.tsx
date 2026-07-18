import React, { useCallback, useMemo, useState } from 'react';
import { useAppSelector } from '../../store';
import { selectRightInventory } from '../../store/inventory';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import { isSlotWithItem } from '../../helpers';
import { Items } from '../../store/items';
import {
  ALL_CATEGORY,
  CartLine,
  iconForCategory,
  MAX_CATEGORIES,
  ShopCategory,
  ShopProduct,
  ShopSortId,
  SHOP_SORTS,
  SortDir,
} from './types';
import { MOCK_SHOP_CATEGORIES, MOCK_SHOP_LABEL, MOCK_SHOP_PRODUCTS } from './mock';
import ShopProductCard from './ShopProductCard';
import ShopCart from './ShopCart';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ShopPage: React.FC = () => {
  const rightInv = useAppSelector(selectRightInventory);

  const [activeCat, setActiveCat] = useState('all');
  const [sortId, setSortId] = useState<ShopSortId>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  const usingMock = isEnvBrowser() && !rightInv?.items?.some((i) => i.name);

  // --- products from the shop inventory (or mock in browser dev) ---
  const products: ShopProduct[] = useMemo(() => {
    if (usingMock) return MOCK_SHOP_PRODUCTS;
    return (rightInv?.items || [])
      .filter((i) => isSlotWithItem(i))
      .map((i: any) => ({
        slot: i.slot,
        name: i.name,
        label: i.metadata?.label || Items[i.name]?.label || i.name,
        price: i.price ?? 0,
        currency: i.currency,
        count: i.count,
        category: i.category,
        weight: i.weight,
        grade: i.grade,
      }));
  }, [rightInv, usingMock]);

  const shopLabel = usingMock ? MOCK_SHOP_LABEL : (rightInv as any)?.label || 'Shop';

  // --- categories: explicit config, else derived from products (ALL + max 5) ---
  const categories: ShopCategory[] = useMemo(() => {
    let cats: ShopCategory[] = [];
    const cfg = (rightInv as any)?.categories as ShopCategory[] | undefined;

    if (cfg && cfg.length) {
      cats = cfg;
    } else if (usingMock) {
      cats = MOCK_SHOP_CATEGORIES;
    } else {
      const seen = new Set<string>();
      for (const p of products) {
        if (p.category && !seen.has(p.category)) {
          seen.add(p.category);
          cats.push({ id: p.category, label: cap(p.category) });
        }
      }
    }

    return [ALL_CATEGORY, ...cats.slice(0, MAX_CATEGORIES)];
  }, [rightInv, products, usingMock]);

  // --- filter + sort ---
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (activeCat !== 'all' && (p.category ?? 'misc') !== activeCat) return false;
      if (term && !p.label.toLowerCase().includes(term) && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sortId === 'price') return (a.price - b.price) * dir;
      if (sortId === 'available') return ((a.count ?? Infinity) - (b.count ?? Infinity)) * dir;
      return a.label.localeCompare(b.label) * dir;
    });
  }, [products, activeCat, search, sortId, sortDir]);

  // --- cart ---
  const addToCart = useCallback((product: ShopProduct, quantity: number) => {
    const key = `${product.name}:${product.slot}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { key, product, quantity }];
    });
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const pay = useCallback(
    (method: 'cash' | 'bank') => {
      if (!cart.length) return;
      const items = cart.map((l) => ({
        name: l.product.name,
        quantity: l.quantity,
        price: l.product.price,
      }));
      if (!isEnvBrowser()) fetchNui('buyItems', { items, method }).catch(() => {});
      setCart([]);
    },
    [cart]
  );

  const onSortClick = (id: ShopSortId) => {
    if (id === sortId) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortId(id);
      setSortDir('asc');
    }
  };

  return (
    <div className="shop-page">
      {/* products column */}
      <div className="shop-main">
        <div className="shop-header">
          <div className="shop-controls">
            <div className="shop-controls-left">
              {/* shop "title" — big icon placeholder (replaces the old "?") */}
              <div className="shop-title-icon" title={shopLabel}>
                <i className="fa-solid fa-store" />
              </div>

              {SHOP_SORTS.map((s) => (
                <button
                  key={s.id}
                  className={`shop-sort ${sortId === s.id ? 'active' : ''}`}
                  onClick={() => onSortClick(s.id)}
                >
                  <i className={`fa-solid ${s.icon}`} />
                  {s.label}
                  {sortId === s.id && (
                    <span className="shop-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>

            <input
              className="shop-search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="shop-categories">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`shop-category ${activeCat === c.id ? 'active' : ''}`}
                onClick={() => setActiveCat(c.id)}
              >
                <i className={`fa-solid ${iconForCategory(c)}`} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="shop-grid">
          {visibleProducts.length === 0 && <div className="shop-empty">No items found</div>}
          {visibleProducts.map((p) => (
            <ShopProductCard key={`${p.name}:${p.slot}`} product={p} onAdd={addToCart} />
          ))}
        </div>
      </div>

      {/* receipt / cart column */}
      <ShopCart lines={cart} onChangeQty={changeQty} onRemove={removeFromCart} onPay={pay} />
    </div>
  );
};

export default ShopPage;
