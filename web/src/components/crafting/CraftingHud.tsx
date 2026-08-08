import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useNuiEvent from '../../hooks/useNuiEvent';
import { getItemUrl } from '../../helpers';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import { getItemLabel } from './craftingHelpers';
import { useCraftingQueue } from './CraftingQueueContext';
import { Locale } from '../../store/locale';

/**
 * Compact crafting indicator shown on the right side of the screen while a
 * craft is in progress and the main inventory is closed.
 */
const CraftingHud: React.FC = () => {
  const { activeJob, jobs, cancelActive } = useCraftingQueue();
  const [invOpen, setInvOpen] = useState(false);
  const [, tick] = useState(0);

  useNuiEvent<boolean>('setInventoryVisible', setInvOpen);
  useNuiEvent('setupInventory', () => setInvOpen(true));
  useNuiEvent('closeInventory', () => setInvOpen(false));

  const show = !!activeJob && activeJob.startedAt != null && !invOpen;

  // animate the progress while visible
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => tick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [show]);

  // the HUD shows while the inventory is closed, so the NUI has no keyboard
  // focus — tell the client to enable/disable the "X to cancel" keybind, and
  // let it tell us when X was pressed.
  useEffect(() => {
    if (isEnvBrowser()) return;
    fetchNui('craftingHudActive', { active: show }).catch(() => {});
  }, [show]);

  useNuiEvent('cancelActiveCraft', () => cancelActive());

  // in dev / when the NUI is focused, allow the X key directly too
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'x' || e.key === 'X') cancelActive();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, cancelActive]);

  if (!show || !activeJob || activeJob.startedAt == null) return null;

  const elapsed = Date.now() - activeJob.startedAt;
  const progress = Math.min(1, elapsed / activeJob.recipe.duration);
  const queued = jobs.length - 1;

  return createPortal(
    <div className="craft-hud">
      <div className="craft-hud-title">
        {Locale('ui_crafting', 'Crafting')}
        {queued > 0 ? ` +${queued}` : '...'}
      </div>

      <div
        className="craft-hud-slot"
        style={{ backgroundImage: `url(${getItemUrl(activeJob.recipe.result)})` }}
      >
        <div className="craft-hud-label">
          {activeJob.recipe.label ?? getItemLabel(activeJob.recipe.result)}
        </div>

        {/* durability-bar slot (separated beneath the slot, like inventory
            slots) but driven by the crafting progress instead of durability */}
        <div className="durability-bar craft-hud-progress">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <button className="craft-hud-cancel" onClick={cancelActive}>
        <span className="craft-hud-key">X</span> {Locale('ui_cancel', 'Cancel')}
      </button>
    </div>,
    document.body
  );
};

export default CraftingHud;
