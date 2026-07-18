import { InventoryType, ItemData, SlotWithItem } from '../typings';
import { onDrop } from './onDrop';
import { store } from '../store';
import { setItemAmount } from '../store/inventory';
import { Items } from '../store/items';
import { isUtilitySlot } from '../utils/utilitySlotValidation';
import { isEqual } from 'lodash';

/**
 * Split `amount` off a stack into a free/stackable slot. Extracted from the old
 * split popup so it can be triggered inline from the context menu.
 */
export const performSplit = (item: SlotWithItem, amount: number, inventoryType?: string | null) => {
  const total = item.count ?? 1;
  if (!item || amount <= 0 || amount >= total) return;

  const sourceInventoryType =
    inventoryType === 'backpack'
      ? InventoryType.BACKPACK
      : inventoryType === 'container'
      ? InventoryType.CONTAINER
      : InventoryType.PLAYER;

  const source = { inventory: sourceInventoryType, item };

  store.dispatch(setItemAmount(amount));

  const buildSourceData = (): ItemData => {
    const itemName = item.name;
    const normalized = Items[itemName] || Items[itemName.toLowerCase()] || Items[itemName.toUpperCase()];
    // Stackability comes from the item type, not the current count — otherwise a
    // count-1 slot is wrongly treated as non-stackable and won't merge.
    const stackValue = typeof item.metadata?.stack === 'boolean' ? item.metadata.stack : (normalized?.stack ?? true);
    return normalized
      ? { ...normalized, stack: stackValue }
      : {
          name: itemName,
          label: item.metadata?.label || itemName,
          stack: stackValue,
          usable: false,
          close: false,
          count: item.count ?? 1,
          description: item.metadata?.description,
          image: item.metadata?.image,
        };
  };

  if (sourceInventoryType === InventoryType.PLAYER) {
    const state = store.getState();
    const sourceData = buildSourceData();

    const availableItems = state.inventory.leftInventory.items.filter((slot) => slot.slot !== item.slot);
    const nonUtilityItems = availableItems.filter((target) => !isUtilitySlot(target.slot));

    let targetSlot = nonUtilityItems.find((target) => target.name === undefined);

    if (!targetSlot && sourceData.stack) {
      targetSlot = nonUtilityItems.find(
        (target) => target.name === item.name && isEqual(target.metadata, item.metadata)
      );
    }

    if (targetSlot && targetSlot.slot !== item.slot) {
      onDrop(source, { inventory: InventoryType.PLAYER, item: { slot: targetSlot.slot } });
    } else {
      store.dispatch(setItemAmount(0));
      return;
    }
  } else if (sourceInventoryType === InventoryType.BACKPACK) {
    const state = store.getState();

    if (!state.inventory.backpackInventory || !state.inventory.backpackInventory.items) {
      store.dispatch(setItemAmount(0));
      return;
    }

    const sourceData = buildSourceData();
    const availableItems = state.inventory.backpackInventory.items.filter((slot) => slot.slot !== item.slot);

    let targetSlot = availableItems.find((target) => target.name === undefined);

    if (!targetSlot && sourceData.stack) {
      targetSlot = availableItems.find(
        (target) => target.name === item.name && isEqual(target.metadata, item.metadata)
      );
    }

    if (targetSlot && targetSlot.slot !== item.slot) {
      onDrop(source, { inventory: InventoryType.BACKPACK, item: { slot: targetSlot.slot } });
    } else {
      store.dispatch(setItemAmount(0));
      return;
    }
  } else {
    onDrop(source, undefined);
  }

  store.dispatch(setItemAmount(0));
};
