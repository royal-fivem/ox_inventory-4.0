import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Inventory, InventoryType, Slot } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import InventorySettingsButtons from './InventorySettingsButtons';
import { getTotalWeight } from '../../helpers';
import { useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { toAsciiLower } from '../../utils/string';
import CharacterInfo from './CharacterInfo';
import Fade from '../utils/transitions/Fade';

const PAGE_SIZE = 30;

interface InventoryGridProps {
  inventory: Inventory;
  itemsOverride?: Slot[];
  hideHeader?: boolean;
  hideExtras?: boolean;
  noWrapper?: boolean;
  onCtrlClick?: (item: ShopItem) => void; // Add onCtrlClick prop
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  money?: number;
}

interface ShopItem {
  slot: number;
  name: string;
  price?: number;
  metadata?: { label?: string };
  image?: string;
  currency?: string;
  weight?: number;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({
  inventory,
  itemsOverride,
  hideHeader,
  hideExtras,
  noWrapper,
  onCtrlClick, // Destructure new prop
  collapsible,
  defaultCollapsed,
  money,
}) => {
  const weight = useMemo(
    () =>
      inventory.maxWeight !== undefined
        ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000
        : 0,
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);
  const moneyValue = useMotionValue(money ?? 0);
  const springMoney = useSpring(moneyValue, { stiffness: 140, damping: 22, mass: 0.6 });
  const displayMoney = useTransform(springMoney, (v) => Math.round(v).toLocaleString('en-us'));

  useEffect(() => {
    moneyValue.set(money ?? 0);
  }, [money, moneyValue]);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => prev + 1);
    }
  }, [entry]);

  const renderedItems = itemsOverride ?? inventory.items;

    const slotsToShow = useMemo(() => {
    return renderedItems;
  }, [renderedItems]);

  const paginatedItems = useMemo(() => {
    if (inventory.type === InventoryType.SHOP) {
      return slotsToShow;
    }
  
    const items =
      inventory.type === InventoryType.OTHERPLAYER
        ? slotsToShow.slice(12)
        : slotsToShow;
  
    return items.slice(
      0,
      Math.min((page + 1) * PAGE_SIZE, items.length)
    );
  }, [slotsToShow, inventory.type, page]);  

  const normalizedQuery = toAsciiLower(searchQuery);

  const usedSlots = useMemo(
    () => inventory.items.filter((i) => i && i.name).length,
    [inventory.items]
  );

  // Very fucking basic way to assign titles to inventories based on type. --- There has to be an easier fucking way... --- 
  const headerTitle = useMemo(() => {
    if (inventory.type === InventoryType.PLAYER) return 'Pockets';
    if (inventory.type === InventoryType.SHOP) return 'Shop';
    if (inventory.type === InventoryType.CRAFTING) return 'Crafting';
    if (inventory.type === InventoryType.CRAFTING_STORAGE) return 'Crafting Storage';
    if (inventory.type === InventoryType.BACKPACK) return inventory.label || 'Backpack';
    if (inventory.type === InventoryType.CONTAINER) return 'Storage';
    if (inventory.type === InventoryType.OTHERPLAYER) return 'Robed Pockets';
    if (inventory.type === InventoryType.OTHERPLAYER_HOTBAR) return 'Robed Pockets Hotbar';
    if (inventory.type == 'stash') return inventory.label || 'Stash';
    if (inventory.type === 'dumpster') return 'Dumpster';
    if (inventory.type === 'drop') return 'Ground';
    if (inventory.type === 'trunk') return 'Trunk';
    if (inventory.type === 'glovebox') return 'Glovebox';
    return 'Ground';
  }, [inventory.label, inventory.type]);

  const gridContent = (
    <div
      className="inventory-grid-container"
      ref={containerRef}
      style={{ paddingRight: '8px' }}
    >
      {paginatedItems.map((item, index) => {
        const matches = toAsciiLower(item?.name ?? '').includes(normalizedQuery);
        return (
          <InventorySlot
            key={`${inventory.type}-${inventory.id}-${item.slot}`}
            item={item}
            ref={index === paginatedItems.length - 1 ? ref : null}
            inventoryType={inventory.type}
            inventoryGroups={inventory.groups}
            inventoryId={inventory.id}
            onCtrlClick={onCtrlClick} // Pass onCtrlClick to InventorySlot
            style={{
              opacity: searchQuery && !matches ? 0.25 : 1,
              transition: 'opacity 0.2s ease',
            }}
          />
        );
      })}
    </div>
  );

  const handleHeaderClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!collapsible) return;

      const target = event.target as HTMLElement;
      if (target.closest('input') || target.closest('[data-stop-collapse]')) {
        return;
      }

      setIsCollapsed((prev) => !prev);
    },
    [collapsible]
  );

  useEffect(() => {
    if (!collapsible) return;
    const updateHeight = () => {
      const current = containerRef.current;
      if (!current) return;
      setContentHeight(current.scrollHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [collapsible, paginatedItems.length, normalizedQuery]);

  const content = (
    <>
      {!hideHeader && (
        <div className="inventory-grid-header">
          <div
            className="inventory-grid-header-wrapper"
            onClick={collapsible ? handleHeaderClick : undefined}
            role={collapsible ? 'button' : undefined}
            aria-expanded={collapsible ? !isCollapsed : undefined}
            style={collapsible ? { cursor: 'pointer' } : undefined}
          >
            <div className="inventory-grid-header-title">
              <h1>{headerTitle}</h1>
              
              {inventory.type === InventoryType.PLAYER && (
                <>
                  <CharacterInfo />

                  <span className="inventory-grid-money">
                    <i className="fa-solid fa-money-bill"></i> $<motion.span>{displayMoney}</motion.span>
                  </span>
                </>
              )}
            </div>

            {collapsible && (
              <span
                className={`inventory-collapse-arrow ${isCollapsed ? 'down' : 'up'}`}
              ></span>
            )}
          </div>

          {!hideExtras && (
            <>
              <div className="inventory-grid-header-stats">
                {inventory.maxWeight !== undefined && (
                  <p className="inventory-grid-weight-text">
                    <i className="fa-light fa-weight-hanging"></i>{' '}
                    {weight / 1000} / {inventory.maxWeight / 1000} KG
                  </p>
                )}
                <div className="inventory-grid-header-right">
                  <InventorySettingsButtons />
                  {inventory.slots !== undefined && (
                    <p className="inventory-grid-slotcount">
                      <i className="fa-solid fa-grip"></i> {usedSlots}/{inventory.slots}
                    </p>
                  )}
                </div>
              </div>

              <WeightBar
                percent={inventory.maxWeight ? (weight / inventory.maxWeight) * 100 : 0}
              />
            </>
          )}
        </div>
      )}

      {collapsible ? (
        <div
          className={`inventory-collapse${isCollapsed ? '' : ' open'}`}
          style={{
            maxHeight: isCollapsed
              ? 0
              : contentHeight !== null
                ? `${contentHeight}px`
                : undefined,
            opacity: isCollapsed ? 0 : 1,
            pointerEvents: isCollapsed ? 'none' : 'auto',
          }}
        >
          {gridContent}
        </div>
      ) : (
        gridContent
      )}
    </>
  );

  if (noWrapper) {
    return content;
  }

  return (
    <div
      className="inventory-grid-wrapper"
      style={{ pointerEvents: isBusy ? 'none' : 'auto' }}
    >
      {content}
    </div>
  );
};

export default InventoryGrid;
