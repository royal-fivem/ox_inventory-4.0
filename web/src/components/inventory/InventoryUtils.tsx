import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectContainerInventory, selectLeftInventory, setupInventory } from '../../store/inventory';
import InventorySlot from './InventorySlot';
import { getItemUrl, isSlotWithItem } from '../../helpers';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import BodyFigure from '../health/BodyFigure';
import { Injury } from '../health/types';

const PHONE_SLOT = 8;

// dev-only mock SIM card so the phone box/container is testable in a browser
const MOCK_SIMS = [
    { slot: 1, name: 'simcard', label: 'Sim Card', weight: 5, count: 1, rarity: 'uncommon' },
];

type SlotConfig = {
    slot: number;
    label?: string;
    showPhoneKey?: boolean;
};

const leftSlotConfigs: SlotConfig[] = [
    { slot: 10, label: 'Gadget 1' },
    { slot: 8, label: 'Phone', showPhoneKey: true },
    { slot: 6, label: 'Backpack' },
];

const rightSlotConfigs: SlotConfig[] = [
    { slot: 11, label: 'Gadget 2' },
    { slot: 7, label: 'Armor' },
    { slot: 12, label: 'Radio' },
];

const hotkeySlotConfigs: SlotConfig[] = [
    { slot: 1, label: 'Hotkey 1' },
    { slot: 2, label: 'Hotkey 2' },
    { slot: 3, label: 'Hotkey 3' },
    { slot: 4, label: 'Hotkey 4' },
    { slot: 5, label: 'Hotkey 5' },
];

interface InventoryUtilsProps {
    figureOnly?: boolean;
    injuries?: Injury[];
}

const InventoryUtils: React.FC<InventoryUtilsProps> = ({ figureOnly = false, injuries }) => {
    const { items, id, type, groups } = useAppSelector(selectLeftInventory);
    const containerInventory = useAppSelector(selectContainerInventory);
    const [phoneKey, setPhoneKey] = useState<string>('M');
    const [phoneItems, setPhoneItems] = useState<any[]>(isEnvBrowser() ? MOCK_SIMS : []);
    const dispatch = useAppDispatch();

    const phoneOpen = containerInventory?.label === 'Phone';
    const simItems: any[] = phoneOpen ? containerInventory!.items : phoneItems;

    const loadPhoneContents = () => {
        if (isEnvBrowser()) return;
        fetchNui<any[]>('getPhoneContents')
            .then((data) => {
                if (Array.isArray(data)) setPhoneItems(data);
            })
            .catch(() => {});
    };

    useEffect(() => {
        loadPhoneContents();
    }, []);

    useEffect(() => {
        if (!containerInventory) loadPhoneContents();
    }, [containerInventory]);

    const phoneSlotItem = items.find((i) => i.slot === PHONE_SLOT);
    const phoneContainerId =
        phoneSlotItem && isSlotWithItem(phoneSlotItem) ? phoneSlotItem.metadata?.container : undefined;

    useEffect(() => {
        if (isEnvBrowser()) return;
        if (!phoneContainerId) {
            setPhoneItems([]);
            return;
        }
        loadPhoneContents();
    }, [phoneContainerId]);

    useEffect(() => {
        if (isEnvBrowser()) return;
        if (phoneOpen && !phoneContainerId) {
            fetchNui('closePhone').catch(() => {});
        }
    }, [phoneOpen, phoneContainerId]);

    const togglePhoneContainer = () => {
        if (isEnvBrowser()) {
            if (phoneOpen) {
                dispatch(setupInventory({ shouldReset: true } as any));
            } else {
                dispatch(
                    setupInventory({
                        rightInventory: {
                            id: 'phone-mock',
                            type: 'container',
                            slots: 1,
                            label: 'Phone',
                            maxWeight: 2000,
                            items: MOCK_SIMS as any,
                        } as any,
                    })
                );
            }
            return;
        }

        if (phoneOpen) fetchNui('closePhone').catch(() => {});
        else fetchNui('openPhone', { slot: PHONE_SLOT }).catch(() => {});
    };

    useEffect(() => {
        const fetchPhoneKey = async () => {
            if (isEnvBrowser()) {
                setPhoneKey('M');
                return;
            }

            try {
                const key = await fetchNui<string>('getPhoneKey');
                setPhoneKey(key);
            } catch (error) {
                console.error('Failed to fetch phone key:', error);
                setPhoneKey('M');
            }
        };

        fetchPhoneKey();
    }, []);


    const renderSlot = ({ slot, label, showPhoneKey }: SlotConfig) => {
        const slotItem = items.find((item) => item.slot === slot) || { slot };
        const hasItem = isSlotWithItem(slotItem);
        const isPhoneSlot = showPhoneKey && hasItem && slot === 8;

        const isPhone = slot === PHONE_SLOT;

        return (
            <div className={`utility-slot-group ${isPhone ? 'phone-group' : ''}`} key={`utility-slot-${slot}`}>
                {label && <div className="utility-slot-label">{label}</div>}
                <div className="phone-slot-row">
                    <div className="utility-slot-wrapper">
                        {isPhoneSlot && (
                            <div className="inventory-slot-number" style={{ top: 0.2, left: 0.6 }}>
                                {phoneKey}
                            </div>
                        )}
                        <InventorySlot
                            item={slotItem}
                            inventoryType={type}
                            displayInventoryType="utility"
                            inventoryGroups={groups}
                            inventoryId={id}
                        />
                    </div>

                    {isPhone && (
                        <div className="phone-sim-slots">
                            {[0].map((i) => {
                                const sim = simItems?.[i];
                                const hasSim = sim && isSlotWithItem(sim);
                                return (
                                    <button
                                        key={i}
                                        className={`phone-sim-slot ${hasSim ? 'filled' : ''}`}
                                        title="Phone — click to open / close SIM cards"
                                        onClick={togglePhoneContainer}
                                        style={
                                            hasSim
                                                ? { backgroundImage: `url(${getItemUrl(sim.name!)})` }
                                                : undefined
                                        }
                                    >
                                        {!hasSim && <i className="fa-solid fa-sim-card" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    return (
        <div className="utils-inventory" style={{position: 'relative', display: 'flex', justifyContent: 'space-between', width: '64vh', height: '60vh'}}>
            {!figureOnly && (
                <div className="utils-left-grid">
                    {leftSlotConfigs.map(renderSlot)}
                </div>
            )}

            <div className="utils-center">
                <div style={{width: '26vh', height: '48vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                    <BodyFigure injuries={injuries} />
                </div>
            </div>

            {!figureOnly && (
                <div className="utils-right-grid">
                    {rightSlotConfigs.map(renderSlot)}
                </div>
            )}

            {!figureOnly && (
                <div className="utils-hotkey-grid">
                    {hotkeySlotConfigs.map(renderSlot)}
                </div>
            )}
        </div>
    );
};

export default InventoryUtils;
