import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectHideItemDetails,
  selectHideRarityBorder,
  toggleHideItemDetails,
  toggleHideRarityBorder,
} from '../../store/settings';
import { fetchNui } from '../../utils/fetchNui';
import clickSound from '../../assets/sounds/drag.ogg';
import { Locale } from '../../store/locale';

const playClick = () => {
  try {
    const audio = new Audio(clickSound);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
};

const InventorySettingsButtons: React.FC = () => {
  const dispatch = useAppDispatch();
  const hideDetails = useAppSelector(selectHideItemDetails);
  const hideRarity = useAppSelector(selectHideRarityBorder);

  const onToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    dispatch(toggleHideItemDetails());
    fetchNui('saveInventorySetting', { key: 'hideItemDetails', value: !hideDetails }).catch(() => {});
  };

  const onToggleRarity = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    dispatch(toggleHideRarityBorder());
    fetchNui('saveInventorySetting', { key: 'hideRarityBorder', value: !hideRarity }).catch(() => {});
  };

  const onColor = '#a2ca31';
  const offColor = 'rgba(255,255,255,0.4)';

  return (
    <div className="inv-settings-buttons">
      <button
        type="button"
        className={`inv-toggle inv-toggle-coupon ${hideDetails ? 'active' : ''}`}
        title={Locale('ui_toggle_item_details', 'Toggle item name / amount / weight')}
        onClick={onToggleDetails}
      >
        <i className="fa-solid fa-ticket" style={{ color: hideDetails ? onColor : offColor }} />
      </button>
      <button
        type="button"
        className={`inv-toggle inv-toggle-diamond ${hideRarity ? 'active' : ''}`}
        title={Locale('ui_toggle_rarity_border', 'Toggle rarity border')}
        onClick={onToggleRarity}
      >
        <span className="inv-diamond" style={{ borderColor: hideRarity ? onColor : offColor }} />
      </button>
    </div>
  );
};

export default InventorySettingsButtons;
