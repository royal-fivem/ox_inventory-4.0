import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { Items } from '../../store/items';
import { selectLeftInventory, selectBackpackInventory, selectRightInventory, selectCraftingInventory } from '../../store/inventory';
import React, { useMemo, useState } from 'react';
import { isSlotWithItem } from '../../helpers';
import { AnimatePresence, motion } from 'framer-motion';
import CharacterInfo from './CharacterInfo';
import useNuiEvent from '../../hooks/useNuiEvent';

const LeftInventory: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const backpackInventory = useAppSelector(selectBackpackInventory);
  const rightInventory = useAppSelector(selectRightInventory);
  const craftingInventory = useAppSelector(selectCraftingInventory);
  const [money, setMoney] = useState<number | undefined>(undefined);

  useNuiEvent<{ money?: number }>('setCharacterInfo', (data) => {
    if (data?.money !== undefined) setMoney(data.money);
  });

  // Slots 1-12 are reserved utility slots (hotkeys + equipment), so the Pockets grid starts at 13.
  const displayItems = useMemo(() => leftInventory.items.filter(item => item.slot > 12), [leftInventory.items]);
  
  const backpackSlotItem = useMemo(
    () => leftInventory.items.find((item) => item.slot === 6),
    [leftInventory.items]
  );
  
  const backpackEquipped = Boolean(backpackSlotItem && (isSlotWithItem(backpackSlotItem) || backpackSlotItem.name));

  const shouldShowBackpack = backpackEquipped && (backpackInventory?.slots ?? 0) > 0;
  const shouldShowCraftingInventory = rightInventory?.type === 'crafting' && craftingInventory && (craftingInventory?.slots ?? 0) > 0;

  const backpackPanel = useMemo(() => {
    const label = backpackSlotItem?.metadata?.label ?? (backpackSlotItem?.name ? Items[backpackSlotItem.name]?.label : undefined);
    return label ? { ...backpackInventory, label } : backpackInventory;
  }, [backpackInventory, backpackSlotItem])

  return (
    <div className="left-inventory">
      <CharacterInfo />
      <AnimatePresence>
        <motion.div key="left-inventory-motion">
          <InventoryGrid
            inventory={leftInventory}
            itemsOverride={displayItems}
            collapsible
            money={money}
          />
          {shouldShowBackpack && (
            <div style={{ marginTop: '1vh' }}>
              <InventoryGrid
                inventory={backpackPanel}
                hideHeader={false}
                collapsible
                defaultCollapsed
              />
            </div>
          )}
          {shouldShowCraftingInventory && (
            <div style={{ marginTop: '1vh' }}>
              <InventoryGrid
                inventory={craftingInventory}
                hideHeader={false}
                collapsible
                defaultCollapsed
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LeftInventory;
