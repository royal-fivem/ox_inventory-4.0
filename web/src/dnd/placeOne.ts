import { canStack, getTargetInventory, isSlotWithItem } from '../helpers';
import { store } from '../store';
import { DragSource, InventoryType } from '../typings';
import { onDrop } from './onDrop';

// Places a single unit of the currently dragged stack into a target slot.
// Backs the "hold right-click while dragging to distribute one per slot"
// feature. Returns true when a placement was actually dispatched so the caller
// can mark the slot as served (and retry later if it wasn't).
export const placeOne = (source: DragSource, targetInventoryType: string, targetSlot: number): boolean => {
  if (!source || !source.item) return false;

  // Shops and crafting move items through their own flows (buy/craft) and
  // can't be handed out one unit at a time like a normal stack.
  if (
    source.inventory === InventoryType.SHOP ||
    source.inventory === InventoryType.CRAFTING ||
    targetInventoryType === InventoryType.SHOP ||
    targetInventoryType === InventoryType.CRAFTING
  )
    return false;

  const { inventory: state } = store.getState();

  // don't pile up moves while a previous one is still resolving
  if (state.isBusy) return false;

  const { sourceInventory, targetInventory } = getTargetInventory(state, source.inventory, targetInventoryType);

  const sourceItem = sourceInventory.items[source.item.slot - 1];
  if (!isSlotWithItem(sourceItem, true)) return false;

  // nothing left to hand out
  if (sourceItem.count <= 0) return false;

  // don't drop back onto the slot we're dragging from
  if (sourceInventory.id === targetInventory.id && sourceItem.slot === targetSlot) return false;

  const target = targetInventory.items[targetSlot - 1];
  if (target === undefined) return false;

  // only distribute into empty slots or matching stacks — never swap a whole stack
  if (isSlotWithItem(target) && !canStack(sourceItem, target)) return false;

  onDrop(
    { inventory: source.inventory, item: { slot: sourceItem.slot, name: sourceItem.name } },
    { inventory: targetInventoryType, item: { slot: targetSlot } },
    undefined,
    1
  );

  return true;
};
