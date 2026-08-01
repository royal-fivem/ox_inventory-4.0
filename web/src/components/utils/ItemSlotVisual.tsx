import React from 'react';
import { getItemUrl, itemDurability, withAlpha, cornerBackground } from '../../helpers';
import { Items } from '../../store/items';
import { getRarityKey, Rarity } from '../../store/rarity';
import WeightBar from './WeightBar';

interface Props {
  name?: string | null;
  /** count shown as "{count}x" in the header */
  count?: number;
  /** show the count even when it is 1 */
  alwaysShowCount?: boolean;
  weight?: number;
  metadata?: Record<string, any>;
  rarity?: string | number;
  /** durability 0-100; when omitted, derived from metadata (full bar if none) */
  durability?: number;
  /** dim + dashed (missing ingredient preview) */
  ghost?: boolean;
  /** slot size, default 8.5vh */
  size?: string;
  /** item image size, default 4.5vh */
  imageSize?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
  innerRef?: (el: HTMLDivElement | null) => void;
}

/**
 * Renders an item exactly like an inventory grid slot (count, weight, label,
 * rarity corners/glow and the bottom durability/fill bar). Shared by the item
 * notifications and the crafting bench so everything looks consistent.
 */
const ItemSlotVisual: React.FC<Props> = ({
  name,
  count,
  alwaysShowCount,
  weight,
  metadata,
  rarity,
  durability,
  ghost,
  size = '8.5vh',
  imageSize = '4.5vh',
  className = '',
  style,
  onClick,
  title,
  innerRef,
}) => {
  const rarityKey = getRarityKey(rarity) || 'common';
  const rarityColor = Rarity[rarityKey] ?? Rarity.common;
  const label = name ? Items[name]?.label || name : '';
  const dur =
    durability ?? (metadata ? itemDurability(metadata, Math.floor(Date.now() / 1000)) : undefined);
  const showCount = count !== undefined && (alwaysShowCount ? count >= 1 : count > 1);

  return (
    <div
      ref={innerRef}
      onClick={onClick}
      title={title}
      className={`inventory-slot ${ghost ? 'ghost' : ''} ${className}`}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        width: size,
        height: size,
        borderRadius: '0px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: `
          ${name ? `url(${getItemUrl(name)}) center / ${imageSize} no-repeat,` : ''}
          linear-gradient(180deg, rgba(28,28,28,0.5), rgba(20,20,20,0.5))
        `,
        boxShadow: rarityColor ? `inset 0px 0px 18px -14px ${withAlpha(rarityColor, 0.8)}` : 'none',
        ...(ghost ? { opacity: 0.3, filter: 'grayscale(60%)', borderStyle: 'dashed' } : {}),
        ...style,
      }}
    >
      {name && rarityColor && (
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

      {name && (
        <div className="item-slot-wrapper">
          <div className="item-slot-header-wrapper" style={{ color: rarityColor }}>
            <div className="hotbar-slot-header-wrapper">
              {showCount && (
                <div className="item-slot-info-wrapper">
                  <p>{(count as number).toLocaleString('en-us')}x</p>
                </div>
              )}
            </div>
            <div className="inventory-slot-weight">
              {weight !== undefined && weight > 0
                ? weight >= 1000
                  ? `${(weight / 1000).toLocaleString('en-us', { minimumFractionDigits: 2 })} kg`
                  : `${weight.toLocaleString('en-us', { minimumFractionDigits: 0 })} g`
                : ''}
            </div>
          </div>
          <div className="inventory-slot-label-box">
            <div className="inventory-slot-label-text">{label}</div>
          </div>
        </div>
      )}

      {name && <WeightBar percent={dur ?? 100} durability rarityColor={rarityColor || undefined} />}
    </div>
  );
};

export default ItemSlotVisual;
