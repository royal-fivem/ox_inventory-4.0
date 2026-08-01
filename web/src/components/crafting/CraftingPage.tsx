import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import useNuiEvent from '../../hooks/useNuiEvent';
import { store, useAppDispatch, useAppSelector } from '../../store';
import { refreshSlots, selectLeftInventory, selectBackpackInventory } from '../../store/inventory';
import { InventoryType, DragSource } from '../../typings';
import { CraftCategory, CraftingConfig, CraftRecipe, PlacedCell } from './types';
import { DEFAULT_CATEGORIES } from './config';
import { MOCK_CRAFTING } from './mock';
import { buildGrid, canCarryResult, canCraftRecipe } from './craftingHelpers';
import CraftingCodex from './CraftingCodex';
import CraftingBench from './CraftingBench';
import CraftingQueue from './CraftingQueue';
import { QUEUE_SLOTS, useCraftingQueue } from './CraftingQueueContext';

interface Props {
  visible: boolean;
}

const FAV_KEY = 'ox_craft_favorites';
const EMPTY_CELLS = (): (PlacedCell | null)[] => Array(9).fill(null);

const matchRecipe = (recipes: CraftRecipe[], placed: Record<string, number>): CraftRecipe | null => {
  const placedKeys = Object.keys(placed);
  for (const r of recipes) {
    const map: Record<string, number> = {};
    for (const ing of r.ingredients) map[ing.name] = (map[ing.name] || 0) + ing.count;
    const keys = Object.keys(map);
    if (keys.length !== placedKeys.length) continue;
    if (keys.every((k) => placed[k] === map[k])) return r;
  }
  return null;
};

const loadFavorites = (): Set<string> => {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const CraftingPage: React.FC<Props> = ({ visible }) => {
  const [config, setConfig] = useState<CraftingConfig>({ categories: [], recipes: [] });
  const [selected, setSelected] = useState<CraftRecipe | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [manualCells, setManualCells] = useState<(PlacedCell | null)[]>(EMPTY_CELLS);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<number>();
  const { jobs, enqueue, cancel } = useCraftingQueue();
  const dispatch = useAppDispatch();

  const showError = useCallback((msg: string) => {
    if (errorTimer.current) window.clearTimeout(errorTimer.current);
    setError(msg);
    errorTimer.current = window.setTimeout(() => setError(null), 2200);
  }, []);

  useEffect(() => () => {
    if (errorTimer.current) window.clearTimeout(errorTimer.current);
  }, []);

  const manualCellsRef = useRef(manualCells);
  useEffect(() => {
    manualCellsRef.current = manualCells;
  }, [manualCells]);

  const manualMode = manualCells.some(Boolean);

  const leftInventory = useAppSelector(selectLeftInventory);
  const backpackInventory = useAppSelector(selectBackpackInventory);

  const grid = useMemo(
    () => buildGrid(selected),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, leftInventory, backpackInventory]
  );

  const isCraftable = useCallback(
    (recipe: CraftRecipe) => canCraftRecipe(recipe),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leftInventory, backpackInventory]
  );

  const categories: CraftCategory[] = config.categories.length ? config.categories : DEFAULT_CATEGORIES;

  // -------- item reservation (client-side) --------
  // reserve one unit of an inventory slot into the bench
  const reserveUnit = useCallback(
    (invType: 'player' | 'backpack', slot: number): PlacedCell | null => {
      const state = store.getState().inventory;
      const inv = invType === 'backpack' ? state.backpackInventory : state.leftInventory;
      const s: any = inv.items[slot - 1];
      if (!s || !s.name || (s.count ?? 0) < 1) return null;

      const count = s.count ?? 1;
      const unitWeight = count > 0 ? (s.weight ?? 0) / count : s.weight ?? 0;
      const newCount = count - 1;
      const invEnum = invType === 'backpack' ? InventoryType.BACKPACK : InventoryType.PLAYER;
      const newItem = newCount > 0 ? { ...s, count: newCount, weight: unitWeight * newCount } : { slot };

      dispatch(refreshSlots({ items: { item: newItem as any, inventory: invEnum } }));
      return {
        name: s.name,
        count: 1,
        metadata: s.metadata,
        rarity: s.rarity,
        sourceInv: invType,
        sourceSlot: slot,
        unitWeight,
      };
    },
    [dispatch]
  );

  // return a reserved cell back to the inventory slot it came from
  const restoreCell = useCallback(
    (cell: PlacedCell) => {
      const state = store.getState().inventory;
      const inv = cell.sourceInv === 'backpack' ? state.backpackInventory : state.leftInventory;
      const s: any = inv.items[cell.sourceSlot - 1];
      const base = s && s.name === cell.name ? s.count ?? 0 : 0;
      const newCount = base + cell.count;
      const invEnum = cell.sourceInv === 'backpack' ? InventoryType.BACKPACK : InventoryType.PLAYER;

      dispatch(
        refreshSlots({
          items: {
            item: {
              slot: cell.sourceSlot,
              name: cell.name,
              count: newCount,
              metadata: cell.metadata,
              weight: cell.unitWeight * newCount,
            } as any,
            inventory: invEnum,
          },
        })
      );
    },
    [dispatch]
  );

  const onDropItem = useCallback(
    (index: number, source: DragSource) => {
      const invType = source.inventory === 'backpack' ? 'backpack' : 'player';
      const existing = manualCellsRef.current[index];

      // dropping the same item (from the same slot) onto a cell stacks it
      if (existing) {
        if (existing.name !== source.item.name || existing.sourceSlot !== source.item.slot) return;
        const more = reserveUnit(invType, source.item.slot);
        if (!more) return;
        setManualCells((prev) => {
          const next = [...prev];
          next[index] = { ...existing, count: existing.count + 1 };
          return next;
        });
        setSelected(null);
        setError(null);
        return;
      }

      const placed = reserveUnit(invType, source.item.slot);
      if (!placed) return;
      setManualCells((prev) => {
        const next = [...prev];
        next[index] = placed;
        return next;
      });
      setSelected(null); // switch to manual mode
      setError(null);
    },
    [reserveUnit]
  );

  const onRemoveCell = useCallback(
    (index: number) => {
      const cell = manualCellsRef.current[index];
      if (!cell) return;
      restoreCell(cell);
      setManualCells((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    },
    [restoreCell]
  );

  // return all placed items (e.g. when closing the page or picking a codex recipe)
  const restoreAll = useCallback(() => {
    manualCellsRef.current.forEach((c) => c && restoreCell(c));
    setManualCells(EMPTY_CELLS());
  }, [restoreCell]);

  // --- load config ---
  const load = useCallback(() => {
    if (isEnvBrowser()) {
      setConfig(MOCK_CRAFTING);
      return;
    }
    fetchNui<CraftingConfig>('getPersonalCrafting')
      .then((data) => {
        if (data && Array.isArray(data.recipes)) setConfig(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  useNuiEvent<CraftingConfig>('setPersonalCrafting', (data) => {
    if (data && Array.isArray(data.recipes)) setConfig(data);
  });

  useEffect(() => {
    if (!selected) return;
    const fresh = config.recipes.find((r) => r.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [config, selected]);

  // return any reserved items when the page unmounts (inventory closed / tab switched)
  useEffect(() => {
    return () => {
      manualCellsRef.current.forEach((c) => c && restoreCell(c));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- favorites ---
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const onSelectRecipe = useCallback(
    (recipe: CraftRecipe) => {
      restoreAll(); // give back anything on the bench before previewing a recipe
      setSelected(recipe);
      setError(null);
    },
    [restoreAll]
  );

  const onCombine = useCallback(() => {
    if (manualMode) {
      const cells = manualCellsRef.current.filter(Boolean) as PlacedCell[];
      if (!cells.length) return;

      const items: Record<string, number> = {};
      for (const c of cells) items[c.name] = (items[c.name] || 0) + c.count;

      const matched = matchRecipe(config.recipes, items);
      if (matched) {
        if (!canCarryResult(matched)) {
          showError('Cannot carry');
          return;
        }
        
        restoreAll();
        enqueue(matched);
        setError(null);
        return;
      }

      const clearBench = () => setManualCells(EMPTY_CELLS());

      if (isEnvBrowser()) {
        clearBench();
        return;
      }

      fetchNui<{ success: boolean; error?: string }>('craftHiddenRecipe', { items })
        .then((res) => {
          if (res && res.success) {
            clearBench(); // items consumed server-side
          } else {
            cells.forEach((c) => restoreCell(c)); // no match — hand items back
            clearBench();
            showError('No Recipe');
          }
        })
        .catch(() => {
          cells.forEach((c) => restoreCell(c));
          clearBench();
        });
      return;
    }

    // known recipe mode (clicked a codex recipe)
    if (!selected || !isCraftable(selected)) return;

    if (!canCarryResult(selected)) {
      showError('Cannot carry');
      return;
    }

    enqueue(selected);
  }, [manualMode, selected, isCraftable, enqueue, restoreCell, restoreAll, showError, config.recipes]);

  const combineLabel = error
    ? error
    : manualMode
    ? 'Combine'
    : selected && !isCraftable(selected)
    ? 'Missing Materials'
    : 'Combine';
  const combineDisabled = error ? true : manualMode ? false : !(selected && isCraftable(selected));

  return (
    <div className="craft-page">
      <div className="craft-center">
        <CraftingBench
          grid={grid}
          manualCells={manualCells}
          manualMode={manualMode}
          combineLabel={combineLabel}
          combineDisabled={combineDisabled}
          combineError={!!error}
          onDropItem={onDropItem}
          onRemoveCell={onRemoveCell}
          onCombine={onCombine}
        />
        <CraftingQueue slots={QUEUE_SLOTS} jobs={jobs} onCancel={cancel} />
      </div>

      <CraftingCodex
        recipes={config.recipes}
        categories={categories}
        selectedId={selected?.id ?? null}
        onSelect={onSelectRecipe}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        isCraftable={isCraftable}
      />
    </div>
  );
};

export default CraftingPage;
