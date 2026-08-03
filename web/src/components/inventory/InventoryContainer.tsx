import React from 'react';
import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectContainerInventory } from '../../store/inventory';

const InventoryContainer: React.FC = () => {
    const InventoryContainer = useAppSelector(selectContainerInventory);

    if (!InventoryContainer) return null;

    return (
        <div className="right-inventory container-inventory">
            <div className="inventory-item">
                <InventoryGrid
                    inventory={InventoryContainer}
                    hideExtras={false}
                    noWrapper={false}
                    collapsible
                />
            </div>
        </div>
    );
};

export default InventoryContainer;
