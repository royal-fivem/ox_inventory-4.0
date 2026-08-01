import React, { useEffect, useState } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import { useAppDispatch, useAppSelector } from '../../store';
import { refreshSlots, selectRightInventory, setAdditionalMetadata, setupInventory } from '../../store/inventory';
import { setInventorySettings } from '../../store/settings';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import ShopPage from '../shop/ShopPage';
import { useExitListener } from '../../hooks/useExitListener';
import type { Inventory as InventoryProps } from '../../typings';
import RightInventory from './RightInventory';
import LeftInventory from './LeftInventory';
import Tooltip from '../utils/Tooltip';
import { closeTooltip } from '../../store/tooltip';
import InventoryContext from './InventoryContext';
import { closeContextMenu } from '../../store/contextMenu';
import Fade from '../utils/transitions/Fade';
import InventoryHotbar from './InventoryHotbar';
import InventoryPanelSwitcher from './InventoryPanelSwitcher';
import InventoryUtils from './InventoryUtils';
import InventoryContainer from './InventoryContainer';
import ExperiencePage from '../experience/ExperiencePage';
import CraftingPage from '../crafting/CraftingPage';
import HealthPage from '../health/HealthPage';
import HealthFigure from '../health/HealthFigure';
import { useHealthData } from '../health/useHealthData';

const HEALTH_INDEX = 1;
const CRAFTING_INDEX = 2;
const EXPERIENCE_INDEX = 3;

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useAppDispatch();
  const rightInventory = useAppSelector(selectRightInventory);
  const isShop = rightInventory?.type === 'shop';
  const healthData = useHealthData(inventoryVisible);
  const [hasExperience, setHasExperience] = useState(false);

  useEffect(() => {
    if (!inventoryVisible) return;

    if (isEnvBrowser()) {
      setHasExperience(true);
      return;
    }

    fetchNui<unknown[]>('getExperience')
      .then((data) => setHasExperience(Array.isArray(data) && data.length > 0))
      .catch(() => setHasExperience(false));
  }, [inventoryVisible]);

  useNuiEvent<unknown[]>('setExperience', (data) => {
    setHasExperience(Array.isArray(data) && data.length > 0);
  });

  useEffect(() => {
    if (!hasExperience && activeIndex === EXPERIENCE_INDEX) setActiveIndex(0);
  }, [hasExperience, activeIndex]);

  useEffect(() => {
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
  }, [activeIndex, dispatch]);

  // load persisted inventory display settings (KVP) once
  useEffect(() => {
    fetchNui<{ hideItemDetails?: boolean; hideRarityBorder?: boolean }>('getSettings')
      .then((data) => {
        if (data) dispatch(setInventorySettings(data));
      })
      .catch(() => {});
  }, [dispatch]);

  useNuiEvent<boolean>('setInventoryVisible', setInventoryVisible);
  useNuiEvent<false>('closeInventory', () => {
    setInventoryVisible(false);
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
  });
  useExitListener(setInventoryVisible);

  useNuiEvent<{ leftInventory?: InventoryProps; rightInventory?: InventoryProps }>(
    'setupInventory',
    (data) => {
      dispatch(
        setupInventory({
          ...data,
          shouldReset: !!data.leftInventory && data.rightInventory?.type !== 'container',
        })
      );
      !inventoryVisible && setInventoryVisible(true);
      setActiveIndex(0)
    }
  );

  useNuiEvent('refreshSlots', (data) => {
    dispatch(refreshSlots(data));
  });
  useNuiEvent('displayMetadata', (data: Array<{ metadata: string; value: string }>) =>
    dispatch(setAdditionalMetadata(data))
  );

  return (
    <>
      <Fade in={inventoryVisible}>
        <div className="inventory-wrapper">
          {!isShop && (
            <InventoryPanelSwitcher
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              hasExperience={hasExperience}
            />
          )}

          {isShop ? (
            <>
              <LeftInventory />
              <ShopPage />
              <Tooltip />
              <InventoryContext />
            </>
          ) : activeIndex === EXPERIENCE_INDEX ? (
            <ExperiencePage visible={inventoryVisible && activeIndex === EXPERIENCE_INDEX} />
          ) : activeIndex === HEALTH_INDEX ? (
            <>
              <LeftInventory />

              <HealthFigure injuries={healthData.injuries} />

              <div
                className="right-inventory-column"
                style={{ display: 'flex', flexDirection: 'column', gap: '1vh', height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}
              />

              <HealthPage data={healthData} />

              <Tooltip />
              <InventoryContext />
            </>
          ) : activeIndex === CRAFTING_INDEX ? (
            <>
              <LeftInventory />

              {/* Crafting page replaces the right inventory with the workbench + codex */}
              <CraftingPage visible={inventoryVisible && activeIndex === CRAFTING_INDEX} />

              <Tooltip />
              <InventoryContext />
            </>
          ) : (
            <>
              <LeftInventory />

              <InventoryUtils injuries={healthData.injuries}/>

              <div className="right-inventory-column" style={{ display: 'flex', flexDirection: 'column', gap: '1vh', height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <RightInventory />
                <InventoryContainer />
              </div>

              <Tooltip />
              <InventoryContext />
            </>
          )}
        </div>
      </Fade>
      <InventoryHotbar />
    </>
  );
};

export default Inventory;
