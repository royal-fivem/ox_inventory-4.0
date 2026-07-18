import React, { useEffect, useMemo, useState } from 'react';
import { Menu, MenuItem } from '../utils/menu/Menu';
import { useAppDispatch, useAppSelector } from '../../store';
import { onUse } from '../../dnd/onUse';
import { onGive } from '../../dnd/onGive';
import { Items } from '../../store/items';
import { setItemAmount } from '../../store/inventory';
import { fetchNui } from '../../utils/fetchNui';
import { Locale } from '../../store/locale';
import { setClipboard } from '../../utils/setClipboard';
import { getRarityKey, getRarityDisplayName, Rarity } from '../../store/rarity';

const withAlpha = (color: string | undefined, alpha: number) => {
  if (!color) return `rgba(255, 255, 255, ${alpha})`;
  return color.replace(/rgba?\(([^)]+)\)/, (match, contents) => {
    if (!contents) return match;
    const parts = contents.split(',').map((p: string) => p.trim());
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    return match;
  });
};

type EvidenceKey = 'blood' | 'casing';
const EVIDENCE_LABELS: Record<EvidenceKey, string> = {
  blood: 'Blod',
  casing: 'Patronhylster',
};

interface DataProps {
  action: string;
  component?: string;
  slot?: number;
  serial?: string;
  id?: number;
}

interface InventoryContextProps {}

interface Button {
  label: string;
  index: number;
  group?: string;
}

interface Group {
  groupName: string | null;
  buttons: ButtonWithIndex[];
}

interface ButtonWithIndex extends Button {
  index: number;
}

interface GroupedButtons extends Array<Group> { }

const InventoryContext: React.FC<InventoryContextProps> = () => {
  const contextMenu = useAppSelector((state) => state.contextMenu);
  const additionalMetadata = useAppSelector((state) => state.inventory.additionalMetadata);
  const dispatch = useAppDispatch();
  const item = contextMenu.item;
  const isPhone = item?.name?.toLowerCase() === 'phone';

  // inline split — type the amount to split, then drag the item out
  const total = item?.count ?? 1;
  const [splitValue, setSplitValue] = useState(total);

  // reset to the full amount (no split) whenever the menu targets a new item
  useEffect(() => {
    setSplitValue(total);
    dispatch(setItemAmount(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.slot, item?.name, item?.count, contextMenu.inventoryType]);

  const onSplitChange = (raw: string) => {
    const num = Number(raw);
    if (isNaN(num)) return;
    const v = Math.max(1, Math.min(total, num));
    setSplitValue(v);
    // itemAmount drives how much a drag moves; full amount = 0 (whole stack)
    dispatch(setItemAmount(v >= total ? 0 : v));
  };

  const itemData = item ? Items[item.name] : undefined;
  const itemLabel = item ? item.metadata?.label || itemData?.label || item.name : '';
  const itemDescription = item ? item.metadata?.description || itemData?.description : undefined;
  const rarityColor = item ? Rarity[getRarityKey(item.rarity)] ?? Rarity.common : undefined;
  const durability = item?.durability;
  const meta = item?.metadata ?? {};
  const ammoName = itemData?.ammoName ? Items[itemData.ammoName]?.label : undefined;

  // Generic metadata rows so the card adapts to whatever an item carries
  // (id-cards, evidence, weapon serials/attachments, custom fields, ...)
  const metaRows: { label: string; value: React.ReactNode }[] = [];
  if (item) {
    if (meta.firstname !== undefined) metaRows.push({ label: 'First Name', value: meta.firstname });
    if (meta.lastname !== undefined) metaRows.push({ label: 'Last Name', value: meta.lastname });
    if (meta.citizenid !== undefined) metaRows.push({ label: 'State ID', value: meta.citizenid });
    if (meta.birthday !== undefined) metaRows.push({ label: 'Birthday', value: meta.birthday });
    if (meta.ammo !== undefined) metaRows.push({ label: 'Ammunition', value: `${meta.ammo}${ammoName ? ` — ${ammoName}` : ''}` });
    if (meta.serial) metaRows.push({ label: 'Serial Number', value: meta.serial });
    if (meta.evidencetype) metaRows.push({ label: 'Evidence Type', value: EVIDENCE_LABELS[meta.evidencetype as EvidenceKey] ?? meta.evidencetype });
    if (meta.evidenceId) metaRows.push({ label: 'Evidence Number', value: meta.evidenceId });
    if (meta.weapontint) metaRows.push({ label: 'Skin', value: meta.weapontint });
    if (meta.components && meta.components[0]) {
      metaRows.push({
        label: 'Attachments',
        value: meta.components.map((c: string) => Items[c]?.label || c).join(', '),
      });
    }
    additionalMetadata.forEach((data: { metadata: string; value: string }) => {
      if (meta[data.metadata]) metaRows.push({ label: data.value, value: meta[data.metadata] });
    });
  }

  const isWeaponInValidSlot = useMemo((): boolean => {
    if (!item) return false;

    const name = item.name?.toUpperCase() || '';
    const isWeapon = name.startsWith('WEAPON_');

    const isInPlayerUtilitySlot = contextMenu.inventoryType === 'player' && [1, 2, 3, 4, 5].includes(item.slot);

    return !isWeapon || isInPlayerUtilitySlot;
  }, [item, contextMenu.inventoryType]);

  const handleClick = (data: DataProps) => {
    if (!item) return;

    switch (data.action) {
      case 'use':
        onUse({ name: item.name, slot: item.slot });
        break;
      case 'give':
        onGive({ name: item.name, slot: item.slot });
        break;
      case 'remove':
        fetchNui('removeComponent', { component: data.component, slot: data.slot });
        break;
      case 'removeAmmo':
        fetchNui('removeAmmo', item.slot);
        break;
      case 'copy':
        setClipboard(data.serial || '');
        break;
      case 'custom':
        fetchNui('useButton', { id: (data.id || 0) + 1, slot: item.slot });
        break;
    }
  };

  const groupButtons = (buttons: any): GroupedButtons => {
    return buttons.reduce((groups: Group[], button: Button, index: number) => {
      if (button.group) {
        const groupIndex = groups.findIndex((group) => group.groupName === button.group);
        if (groupIndex !== -1) {
          groups[groupIndex].buttons.push({ ...button, index });
        } else {
          groups.push({
            groupName: button.group,
            buttons: [{ ...button, index }],
          });
        }
      } else {
        groups.push({
          groupName: null,
          buttons: [{ ...button, index }],
        });
      }
      return groups;
    }, []);
  };

  return (
    <Menu>
      {item && (
        <div className="context-item-card">
          <div className="context-item-body">
            <div className="context-item-name">{itemLabel}</div>
            {itemDescription && <div className="context-item-desc">{itemDescription}</div>}

            <div className="context-item-divider" />

            <div className="context-item-meta-row">
              <span>{Locale.ui_rarity || 'Rarity'}</span>
              <span className="context-item-meta-value" style={{ color: rarityColor }}>
                {getRarityDisplayName(item.rarity).toUpperCase()}
              </span>
            </div>

            {durability !== undefined && (
              <div className="context-item-meta-row">
                <span>{Locale.ui_durability || 'Durability'}</span>
                <span className="context-item-durability">{Math.floor(durability)}%</span>
              </div>
            )}

            {metaRows.map((row, index) => (
              <div className="context-item-meta-row" key={`meta-${index}`}>
                <span>{row.label}</span>
                <span className="context-item-meta-value">{row.value}</span>
              </div>
            ))}

            <div className="context-item-divider" />
          </div>
        </div>
      )}

      {/* split field: type the amount, then drag the item out to split it off */}
      {item && item.count > 1 && (
        <div className="context-split-row" onMouseDown={(e) => e.stopPropagation()}>
          <span className="context-split-label">{Locale.ui_split || 'Split'}</span>
          <div className="context-split-field">
            <input
              type="number"
              className="context-split-input"
              value={splitValue}
              min={1}
              max={total}
              title="Type an amount, then drag the item to split it off"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => onSplitChange(e.target.value)}
            />
            <span className="context-split-total">/ {total}</span>
          </div>
        </div>
      )}

      {isWeaponInValidSlot && !isPhone && (
        <MenuItem onClick={() => handleClick({ action: 'use' })} label={Locale.ui_use || 'Use'} />
      )}
      <MenuItem onClick={() => handleClick({ action: 'give' })} label={Locale.ui_give || 'Give'} />

      {item && item.metadata?.ammo > 0 && (
        <MenuItem onClick={() => handleClick({ action: 'removeAmmo' })} label={Locale.ui_remove_ammo} />
      )}

      {item && item.metadata?.serial && (
        <MenuItem onClick={() => handleClick({ action: 'copy', serial: item?.metadata?.serial })} label={Locale.ui_copy} />
      )}

      {item && item.metadata?.components?.length > 0 && (
        <Menu label={Locale.ui_removeattachments}>
          {item?.metadata?.components.map((component: string, index: number) => (
            <MenuItem
              key={index}
              onClick={() => handleClick({ action: 'remove', component, slot: item.slot })}
              label={Items[component]?.label || ''}
            />
          ))}
        </Menu>
      )}

      {((item && item.name && Items[item.name]?.buttons?.length) || 0) > 0 && (
        <>
          {item && item.name && groupButtons(Items[item.name]?.buttons).map((group: Group, index: number) => (
            <React.Fragment key={index}>
              {group.groupName ? (
                <Menu label={group.groupName}>
                  {group.buttons.map((button: Button) => (
                    <MenuItem
                      key={button.index}
                      onClick={() => handleClick({ action: 'custom', id: button.index })}
                      label={button.label}
                    />
                  ))}
                </Menu>
              ) : (
                group.buttons.map((button: Button) => (
                  <MenuItem
                    key={button.index}
                    onClick={() => handleClick({ action: 'custom', id: button.index })}
                    label={button.label}
                  />
                ))
              )}
            </React.Fragment>
          ))}
        </>
      )}
    </Menu>
  );
};

export default InventoryContext;