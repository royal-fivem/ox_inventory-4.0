import { canStack, findAvailableSlot, getItemData, getTargetInventory, isSlotWithItem } from '../helpers';
import { validateMove } from '../thunks/validateItems';
import { store } from '../store';
import { DragSource, DropTarget, InventoryType, ItemData, SlotWithItem } from '../typings';
import { moveSlots, setItemAmount, stackSlots, swapSlots } from '../store/inventory';
import { Items } from '../store/items';
import { canItemBePlacedInUtilitySlot, isUtilitySlot } from '../utils/utilitySlotValidation';
import { fetchNui } from '../utils/fetchNui';
import dragSound from '../assets/sounds/drag.ogg';

const missingItemCache = new Set<string>();

const utilityEquipEvents: Record<number, string> = {
  7: 'equipArmor',
};

const resolveItemData = (slot: SlotWithItem): ItemData => {
  const itemName = slot.name;

  const exact = Items[itemName];
  if (exact) return exact;

  const normalized = Items[itemName.toLowerCase()] ?? Items[itemName.toUpperCase()];
  if (normalized) return normalized;

  if (!missingItemCache.has(itemName)) {
    console.warn(`${itemName} item data missing, falling back to slot data.`);
    missingItemCache.add(itemName);
  }

  void getItemData(itemName);

  return {
    name: itemName,
    label: slot.metadata?.label || itemName,
    // Stackability is a property of the item type, not how many you currently
    // hold. A single unit (e.g. one just split/distributed off a stack) must
    // still merge back onto its twin, so default to stackable when unknown and
    // only treat it as non-stackable when the metadata explicitly says so.
    stack: typeof slot.metadata?.stack === 'boolean' ? slot.metadata.stack : true,
    usable: false,
    close: false,
    count: slot.count ?? 1,
    description: slot.metadata?.description,
    image: slot.metadata?.image,
  };
};

export const onDrop = async (
  source: DragSource,
  target?: DropTarget,
  targetInventoryTypeOverride?: string,
  countOverride?: number
) => {
  const { inventory: state } = store.getState();

  const { sourceInventory, targetInventory } = getTargetInventory(state, source.inventory, target?.inventory ?? targetInventoryTypeOverride);

  const sourceItem = sourceInventory.items[source.item.slot - 1];
  if (!isSlotWithItem(sourceItem, true)) {
    return console.error(`Source slot ${source.item.slot} item data undefined!`);
  }
  const sourceSlot = sourceItem;
  const sourceData = resolveItemData(sourceSlot);

  // If dragging from container slot
  if (sourceSlot.metadata?.container !== undefined) {
    // Prevent storing container in container
    if (targetInventory.type === InventoryType.CONTAINER)
      return console.log(`Cannot store container ${sourceSlot.name} inside another container`);

    // Prevent dragging of container slot when opened
    if (state.rightInventory.id === sourceSlot.metadata.container)
      return console.log(`Cannot move container ${sourceSlot.name} when opened`);
  }

  const targetSlot = target
    ? targetInventory.items[target.item.slot - 1]
    : findAvailableSlot(sourceSlot, sourceData, targetInventory.items, targetInventory.type === InventoryType.PLAYER);

  if (targetSlot === undefined) return console.error('Target slot undefined!');
  
  const isSourceUtilitySlot = sourceInventory.type === InventoryType.PLAYER && isUtilitySlot(sourceSlot.slot);
  const targetInventoryIsPlayer = targetInventory.type === InventoryType.PLAYER;

  if (target && targetInventoryIsPlayer && isUtilitySlot(target.item.slot)) {
    if (!canItemBePlacedInUtilitySlot(sourceSlot.name, target.item.slot)) return;

    if (isSlotWithItem(targetSlot, true) && isSourceUtilitySlot) {
      if (!canItemBePlacedInUtilitySlot(targetSlot.name, sourceSlot.slot)) return;
    }
  }

  if (isSourceUtilitySlot) {
    // Note: removing an item OUT of a utility slot is always allowed (so legacy/invalid
    // items that predate this slot's restrictions can be freed). Only swaps are validated:
    // an item moving INTO this utility slot must be allowed here.
    if (target && isSlotWithItem(targetSlot, true) && !isUtilitySlot(target?.item.slot ?? -1)) {
      if (!canItemBePlacedInUtilitySlot(targetSlot.name, sourceSlot.slot)) return;
    }
  }

  if (target && targetInventoryIsPlayer && isUtilitySlot(target.item.slot) && isSlotWithItem(targetSlot, true)) {
    if (!canItemBePlacedInUtilitySlot(targetSlot.name, target.item.slot)) return;
  }

  if (targetSlot.metadata?.container !== undefined && state.rightInventory.id === targetSlot.metadata.container)
    return console.log(`Cannot swap item ${sourceSlot.name} with container ${targetSlot.name} when opened`);

  const count =
    countOverride && countOverride > 0
      ? Math.min(countOverride, sourceSlot.count)
      : state.shiftPressed && sourceSlot.count > 1 && sourceInventory.type !== InventoryType.SHOP
        ? Math.floor(sourceSlot.count / 2)
        : state.itemAmount === 0 || state.itemAmount > sourceSlot.count
          ? sourceSlot.count
          : state.itemAmount;

  const data = {
    fromSlot: { ...sourceSlot, rarity: sourceSlot.rarity },
    toSlot: { ...targetSlot, rarity: targetSlot.rarity },
    fromType: sourceInventory.type,
    toType: targetInventory.type,
    fromInventory: sourceInventory.id,
    toInventory: targetInventory.id,
    count,
  };

  store.dispatch(
    validateMove({
      fromSlot: sourceSlot.slot,
      toSlot: targetSlot.slot,
      fromType: sourceInventory.type,
      toType: targetInventory.type,
      count,
    })
  );

  isSlotWithItem(targetSlot, true)
    ? sourceData.stack && canStack(sourceSlot, targetSlot)
      ? store.dispatch(
        stackSlots({
          ...data,
          toSlot: { ...targetSlot, rarity: targetSlot.rarity },
        })
      )
      : store.dispatch(
        swapSlots({
          ...data,
          toSlot: { ...targetSlot, rarity: targetSlot.rarity },
        })
      )
    : store.dispatch(moveSlots(data));

  // reset the split amount so the next drag moves the full stack again
  if (state.itemAmount !== 0) store.dispatch(setItemAmount(0));

  // right-click distribute drops one unit per slot; skip the drag sound so a
  // sweep across several slots doesn't stack up a flurry of overlapping clicks
  if (countOverride) return;

  let shouldPlayAudio = true;
  try {
    const settings = await fetchNui<{ audio?: boolean }>('getSettings');
    if (typeof settings?.audio === 'boolean') {
      shouldPlayAudio = settings.audio;
    }
  } catch (error) {
    console.debug('getSettings failed:', error);
  }

  if (!shouldPlayAudio) return;

  try {
    const audio = new Audio(dragSound);
    audio.volume = 0.25;
    audio.play();
  } catch (error) {
    console.log('Audio creation failed:', error);
  }
};
