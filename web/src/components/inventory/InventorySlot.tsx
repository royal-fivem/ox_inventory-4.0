import React, { useCallback, useRef } from 'react';
import { DragSource, InventoryType, SlotWithItem } from '../../typings';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectHideItemDetails, selectHideRarityBorder } from '../../store/settings';
import WeightBar from '../utils/WeightBar';
import { onDrop } from '../../dnd/onDrop';
import { placeOne } from '../../dnd/placeOne';
import { rightDrag } from '../../dnd/rightDrag';
import { onBuy } from '../../dnd/onBuy';
import { Items } from '../../store/items';
import { canCraftItem, canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { Locale } from '../../store/locale';
import { onCraft } from '../../dnd/onCraft';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { useMergeRefs } from '@floating-ui/react';
import { Rarity, getRarityKey } from '../../store/rarity';

interface SlotProps {
  inventoryId: string;
  inventoryType: string;
  displayInventoryType?: string;
  inventoryGroups: any;
  item: any;
  onUse?: (item: any) => void;
  canDrop?: (item: any) => boolean;
  style?: React.CSSProperties;
  onCtrlClick?: (item: any) => void; // Add onCtrlClick prop
}

const InventorySlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  {
    item,
    inventoryId,
    inventoryType,
    displayInventoryType,
    inventoryGroups,
    onUse,
    canDrop,
    style,
    onCtrlClick,
  },
  ref
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);
  const visualInventoryType = displayInventoryType ?? inventoryType;

  const hideItemDetails = useAppSelector(selectHideItemDetails);
  const hideRarityBorder = useAppSelector(selectHideRarityBorder);

  const hasItem = isSlotWithItem(item);
  const rarityKey = hasItem ? getRarityKey(item?.rarity) : null;
  const rarityColor = rarityKey ? Rarity[rarityKey] : null;
  // rarity glow/border can be toggled off; the coloured bar beneath stays
  const showRarity = !!rarityColor && !hideRarityBorder;

  const withAlpha = (color: string, alpha: number) => {
    return color.replace(/rgba?\(([^)]+)\)/, (match, contents) => {
      if (!contents) return match;
      const parts = contents.split(',').map((p: string) => p.trim());
      if (parts.length === 3) {
        return `rgba(${parts.join(', ')}, ${alpha})`;
      } else if (parts.length === 4) {
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
      }
      return match;
    });
  };

  const canDrag = useCallback(() => {
    if (!isSlotWithItem(item, true)) return false;
    if (inventoryType === InventoryType.SHOP) return true;
    return (
      canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) &&
      canCraftItem(item, inventoryType)
    );
  }, [item, inventoryType, inventoryGroups]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () => {
        if (!canDrag()) return null;
        return {
          inventory: inventoryType,
          item: {
            ...item,
            label:
              item.metadata?.label ??
              item.label ??
              Items[item.name]?.label ??
              item.name,
          },
          image: item?.name && `url(${getItemUrl(item) || 'none'})`,
        };
      },
      canDrag,
    }),
    [inventoryType, item, canDrag]
  );

  const [{ isOver, canDrop: isDroppable }, drop] = useDrop<
    DragSource,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      drop: (source) => {
        dispatch(closeTooltip());
        switch (source.inventory) {
          case InventoryType.SHOP:
            onBuy(source, { inventory: inventoryType, item: { ...item } });
            break;
          case InventoryType.CRAFTING:
            onCraft(source, { inventory: inventoryType, item: { ...item } });
            break;
          default:
            onDrop(source, { inventory: inventoryType, item: { ...item } });
            break;
        }
      },
      canDrop: (source) => {
        if (source.inventory === InventoryType.SHOP) return false;
        const baseAllowed =
          (source.item.slot !== item.slot || source.inventory !== inventoryType) &&
          inventoryType !== InventoryType.SHOP &&
          inventoryType !== InventoryType.CRAFTING;
        if (!baseAllowed) return false;
        return canDrop ? canDrop(source.item) : true;
      },
    }),
    [inventoryType, item, canDrop]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging && !data.items) return;
    if (!Array.isArray(data.items)) return;

    const itemSlot = data.items.find(
      (dataItem) => dataItem.item.slot === item.slot && dataItem.inventory === inventoryId
    );

    if (!itemSlot) return;

    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  const connectRef = (element: HTMLDivElement) => drag(drop(element));

  // Drops a single unit of the currently dragged stack into this slot, once per
  // slot for as long as the right button stays held (see rightDrag / placeOne).
  const distributeOne = useCallback(() => {
    const monitor = manager.getMonitor();
    if (!monitor.isDragging()) return;

    const source = monitor.getItem() as DragSource | null;
    if (!source?.item) return;

    const key = `${inventoryId}:${item.slot}`;
    if (rightDrag.visited.has(key)) return;

    if (placeOne(source, inventoryType, item.slot)) rightDrag.visited.add(key);
  }, [manager, inventoryId, inventoryType, item]);

  const handleMouseEnter = () => {
    if (!rightDrag.active) return;
    distributeOne();
  };

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    // right-click during a drag distributes one unit into this slot instead of
    // opening the context menu
    if (manager.getMonitor().isDragging()) {
      distributeOne();
      return;
    }
    if ((inventoryType !== 'player' && inventoryType !== 'backpack') || !isSlotWithItem(item)) return;
    dispatch(closeTooltip());
    dispatch(openContextMenu({ item, coords: { x: event.clientX, y: event.clientY }, inventoryType }));
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (event.ctrlKey && isSlotWithItem(item)) {
      if (inventoryType === InventoryType.SHOP && onCtrlClick) {
        onCtrlClick(item); // Call onCtrlClick for shop items
      } else if (inventoryType !== InventoryType.CRAFTING) {
        const targetOverride = visualInventoryType === 'utility' ? InventoryType.PLAYER : undefined;
        onDrop({ item: item, inventory: inventoryType }, undefined, targetOverride);
      }
    } else if (event.altKey && isSlotWithItem(item) && inventoryType === 'player') {
      if (onUse) onUse(item);
    }
  };

  const refs = useMergeRefs([connectRef, ref]);

  return (
    <div
      ref={refs}
      onContextMenu={handleContext}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className="inventory-slot"
      style={{
        borderRadius: '0px',
        padding: '8px',
        border: isOver
          ? '1px dashed rgba(255,255,255,0.4)'
          : '1px solid rgba(255,255,255,0.15)',
        background: `
              ${item?.name ? `url(${getItemUrl(item as SlotWithItem)}) center / 5vh no-repeat,` : ''}
              linear-gradient(180deg, rgba(28,28,28,0.5), rgba(20,20,20,0.5))
            `,
        filter:
          !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) ||
            !canCraftItem(item, inventoryType)
            ? 'brightness(80%) grayscale(100%)'
            : undefined,
        opacity: isDragging ? 0.4 : 1.0,
        boxShadow: isOver
          ? 'inset 0px 0px 20px -12px rgba(255,255,255, 0.1)'
          : showRarity
            ? `inset 0px 0px 18px -14px ${withAlpha(rarityColor as string, 0.8)}`
            : 'none',
        ...style,
      }}
    >
      {showRarity && !isOver && (
        <div
          className="inventory-slot-corners"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `
              linear-gradient(to right, ${withAlpha(rarityColor, 0.9)}, transparent) top left / 20% 2px no-repeat,
              linear-gradient(to bottom, ${withAlpha(rarityColor, 0.9)}, transparent) top left / 2px 20% no-repeat,
              linear-gradient(to left, ${withAlpha(rarityColor, 0.9)}, transparent) top right / 20% 2px no-repeat,
              linear-gradient(to bottom, ${withAlpha(rarityColor, 0.9)}, transparent) top right / 2px 20% no-repeat,
              linear-gradient(to right, ${withAlpha(rarityColor, 0.9)}, transparent) bottom left / 20% 2px no-repeat,
              linear-gradient(to top, ${withAlpha(rarityColor, 0.9)}, transparent) bottom left / 2px 20% no-repeat,
              linear-gradient(to left, ${withAlpha(rarityColor, 0.9)}, transparent) bottom right / 20% 2px no-repeat,
              linear-gradient(to top, ${withAlpha(rarityColor, 0.9)}, transparent) bottom right / 2px 20% no-repeat,
              radial-gradient(circle at top left, ${withAlpha(rarityColor, 0.22)}, transparent 10%) no-repeat,
              radial-gradient(circle at top right, ${withAlpha(rarityColor, 0.22)}, transparent 10%) no-repeat,
              radial-gradient(circle at bottom left, ${withAlpha(rarityColor, 0.22)}, transparent 10%) no-repeat,
              radial-gradient(circle at bottom right, ${withAlpha(rarityColor, 0.22)}, transparent 10%) no-repeat
            `,
          }}
        />
      )}
      {isSlotWithItem(item) && !hideItemDetails && (
        <div className="item-slot-wrapper">
          <div className='item-slot-header-wrapper' style={{ color: `${rarityColor}` }}>
            <div className="hotbar-slot-header-wrapper">
              {item.count && item.count > 1 && (
                <div className={visualInventoryType === 'utility' ? 'item-slot-info-wrapper2' : 'item-slot-info-wrapper'}>
                  <p>{item.count.toLocaleString('en-us')}x</p>
                </div>
              )}
            </div>

            <div className="inventory-slot-weight">
              {item.weight > 0
                ? item.weight >= 1000
                  ? `${(item.weight / 1000).toLocaleString('en-us', { minimumFractionDigits: 2 })} kg`
                  : `${item.weight.toLocaleString('en-us', { minimumFractionDigits: 0 })} g`
                : ''}
            </div>
          </div>
          <div>
            {inventoryType === 'shop' && item?.price !== undefined ? (
              <div className="inventory-slot-label-box">
                <div className="inventory-slot-label-text">
                  {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.label || item.name}
                </div>

                {item?.currency !== 'money' && item.currency ? (
                  <div className="item-slot-currency-wrapper">
                    <img
                      src={
                        item.currency === 'black_money'
                          ? 'assets/icons/black_money.png'
                          : 'assets/icons/money.png'
                      }
                      alt={item.currency}
                    />
                    <p style={{ color: 'rgba(171, 171, 171, 1)' }}>
                      {item.price.toLocaleString('en-us')}
                    </p>
                  </div>
                ) : (
                  <p style={{ color: 'rgba(171, 171, 171, 1)' }}>
                    {Locale.$ || '$'}
                    {item.price.toLocaleString('en-us')}
                  </p>
                )}
              </div>
            ) : (
              <div className="inventory-slot-label-box">
                <div className="inventory-slot-label-text">
                  {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.label || item.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {inventoryType !== 'shop' && item?.durability !== item.name && (
        <WeightBar percent={item.durability || 100} durability rarityColor={rarityColor || undefined} />
      )}
    </div>
  );
};

export default React.memo(React.forwardRef(InventorySlot));
