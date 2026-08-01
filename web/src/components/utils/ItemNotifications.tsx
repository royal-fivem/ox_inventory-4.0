import React, { useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TransitionGroup } from 'react-transition-group';
import useNuiEvent from '../../hooks/useNuiEvent';
import { Locale } from '../../store/locale';
import { getItemUrl, itemDurability, withAlpha, cornerBackground } from '../../helpers';
import { SlotWithItem } from '../../typings';
import { Items } from '../../store/items';
import Fade from './transitions/Fade';
import { getRarityKey, Rarity } from '../../store/rarity';
import WeightBar from './WeightBar';

type NotifyTone = 'added' | 'removed' | 'neutral';

interface NotifyItem {
  item: SlotWithItem;
  count?: number;
}

interface AddArgs extends NotifyItem {
  tone: NotifyTone;
  action: string;
}

interface Batch {
  id: number;
  tone: NotifyTone;
  action: string;
  items: NotifyItem[];
  lastAt: number;
  startedAt: number | null;
}

// items arriving within this window (same action) are grouped into one batch;
// a different action starts a new batch that is shown after the first fades.
const GROUP_WINDOW = 300;
const DISPLAY_MS = 2500;


export const ItemNotificationsContext = React.createContext<{
  add: (args: AddArgs) => void;
} | null>(null);

export const useItemNotifications = () => {
  const ctx = useContext(ItemNotificationsContext);
  if (!ctx) throw new Error(`ItemNotificationsContext undefined`);
  return ctx;
};

/** A single item rendered exactly like an inventory grid slot. */
// const NotifySlot: React.FC<{ item: SlotWithItem; count?: number }> = ({ item, count }) => {
const NotifySlot = React.memo<{ item: SlotWithItem; count?: number }>(({ item, count }) => {
  const rarityKey = getRarityKey(item?.rarity) || 'common';
  const rarityColor = Rarity[rarityKey] ?? Rarity.common;
  const label = item.label || Items[item.name]?.label || item.name;
  const amount = count ?? item.count;

  // durability drives the bottom bar; when the item has none, the bar fills the
  // gap at 100% — either way it uses the rarity colour, like the inventory slots
  const durability = item?.durability ?? itemDurability(item?.metadata, Math.floor(Date.now() / 1000));

  return (
    <div className="item-notify-slot-wrap">
      <div
        className="inventory-slot"
        style={{
          position: 'relative',
          width: '8vh',
          height: '8vh',
          borderRadius: '0px',
          padding: '8px',
          border: '1px solid rgba(255,255,255,0.15)',
          background: `
            ${item?.name ? `url(${getItemUrl(item as SlotWithItem)}) center / 4.4vh no-repeat,` : ''}
            linear-gradient(180deg, rgba(28,28,28,0.5), rgba(20,20,20,0.5))
          `,

          boxShadow: rarityColor ? `inset 0px 0px 18px -14px ${withAlpha(rarityColor, 0.8)}` : 'none',
        }}
      >
        {rarityColor && (
          <div
            className="inventory-slot-corners"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: cornerBackground(rarityColor),
            }}
          />
        )}
        <div className="item-slot-wrapper">
          <div className="item-slot-header-wrapper" style={{ color: rarityColor }}>
            <div className="hotbar-slot-header-wrapper">
              {amount !== undefined && amount > 1 && (
                <div className="item-slot-info-wrapper">
                  <p>{amount.toLocaleString('en-us')}x</p>
                </div>
              )}
            </div>
            <div className="inventory-slot-weight">
              {item.weight !== undefined && item.weight > 0
                ? item.weight >= 1000
                  ? `${(item.weight / 1000).toLocaleString('en-us', { minimumFractionDigits: 2 })} kg`
                  : `${item.weight.toLocaleString('en-us', { minimumFractionDigits: 0 })} g`
                : ''}
            </div>
          </div>
          <div className="inventory-slot-label-box">
            <div className="inventory-slot-label-text">{label}</div>
          </div>
        </div>

        {/* durability bar (rarity coloured) — full width when the item has no
            durability; positioned beneath the slot like the inventory slots */}
        <WeightBar percent={durability ?? 100} durability rarityColor={rarityColor || undefined} />
      </div>
    </div>
  );
});

const NotificationBatch = React.forwardRef<HTMLDivElement, { batch: Batch }>(({ batch }, ref) => {
  const plural = batch.items.length > 1;
  const title = `${plural ? 'Items' : 'Item'} ${batch.action}`;

  return (
    <div className="item-notify" ref={ref}>
      <div className="item-notify-title">{title}</div>
      <div className="item-notify-line" />
      <div className="item-notify-row">
        {batch.items.map((ni, i) => (
          <NotifySlot key={i} item={ni.item} count={ni.count} />
        ))}
      </div>
    </div>
  );
});

export const ItemNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const currentId = batches[0]?.id;
  const currentStartedAt = batches[0]?.startedAt;

  const add = useCallback((args: AddArgs) => {
    setBatches((prev) => {
      const now = Date.now();
      const last = prev[prev.length - 1];

      // merge into the last batch if it's the same action and arrived recently
      if (last && last.tone === args.tone && now - last.lastAt < GROUP_WINDOW) {
        const merged: Batch = {
          ...last,
          items: [...last.items, { item: args.item, count: args.count }],
          lastAt: now,
        };
        return [...prev.slice(0, -1), merged];
      }

      return [
        ...prev,
        {
          id: now + Math.random(),
          tone: args.tone,
          action: args.action,
          items: [{ item: args.item, count: args.count }],
          lastAt: now,
          startedAt: null,
        },
      ];
    });
  }, []);


  // start displaying the front batch
  useEffect(() => {
    const current = batches[0];
    if (!current || current.startedAt != null) return;
    setBatches((prev) => prev.map((b, i) => (i === 0 ? { ...b, startedAt: Date.now() } : b)));
  }, [currentId, currentStartedAt]);

  // remove the front batch after its display time, revealing the next one
  useEffect(() => {
    const current = batches[0];
    if (!current || current.startedAt == null) return;
    const remaining = DISPLAY_MS - (Date.now() - current.startedAt);
    const timer = setTimeout(() => setBatches((prev) => prev.slice(1)), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [currentId, currentStartedAt]);

  useNuiEvent<[item: SlotWithItem, text: string, count?: number]>('itemNotify', ([item, text, count]) => {
    const tone: NotifyTone = text === 'ui_added' ? 'added' : text === 'ui_removed' ? 'removed' : 'neutral';
    add({ item, count, tone, action: (Locale[text] as string) ?? text });
  });

  const current = batches[0];

  return (
    <ItemNotificationsContext.Provider value={{ add }}>
      {children}
      {createPortal(
        <TransitionGroup className="item-notification-container">
          {current && (
            <Fade key={current.id}>
              <NotificationBatch batch={current} />
            </Fade>
          )}
        </TransitionGroup>,
        document.body
      )}
    </ItemNotificationsContext.Provider>
  );
};
