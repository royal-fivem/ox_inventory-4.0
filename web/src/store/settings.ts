import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';

interface SettingsState {
  /** hide item name, amount and weight for a cleaner look */
  hideItemDetails: boolean;
  /** hide the rarity border/glow (the coloured bar beneath is kept) */
  hideRarityBorder: boolean;
}

const initialState: SettingsState = {
  hideItemDetails: false,
  hideRarityBorder: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setInventorySettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      if (action.payload.hideItemDetails !== undefined) state.hideItemDetails = action.payload.hideItemDetails;
      if (action.payload.hideRarityBorder !== undefined) state.hideRarityBorder = action.payload.hideRarityBorder;
    },
    toggleHideItemDetails: (state) => {
      state.hideItemDetails = !state.hideItemDetails;
    },
    toggleHideRarityBorder: (state) => {
      state.hideRarityBorder = !state.hideRarityBorder;
    },
  },
});

export const { setInventorySettings, toggleHideItemDetails, toggleHideRarityBorder } = settingsSlice.actions;

export const selectHideItemDetails = (state: RootState) => state.settings.hideItemDetails;
export const selectHideRarityBorder = (state: RootState) => state.settings.hideRarityBorder;

export default settingsSlice.reducer;
