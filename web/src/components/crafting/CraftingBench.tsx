import React from 'react';
import { useDrop } from 'react-dnd';
import { DragSource } from '../../typings';
import { GridCell, PlacedCell } from './types';
import { getItemLabel } from './craftingHelpers';
import ItemSlotVisual from '../utils/ItemSlotVisual';

const DROP_BORDER: React.CSSProperties = { border: '1px dashed #a2ca31' };
const EMPTY_BORDER: React.CSSProperties = { border: '1px dashed rgba(255,255,255,0.1)' };

interface CellProps {
  index: number;
  manual: PlacedCell | null;
  preview?: GridCell;
  manualMode: boolean;
  onDropItem: (index: number, source: DragSource) => void;
  onRemoveCell: (index: number) => void;
}

const BenchCell: React.FC<CellProps> = ({ index, manual, preview, manualMode, onDropItem, onRemoveCell }) => {
  const [{ isOver, canDrop }, drop] = useDrop<DragSource, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: 'SLOT',
      canDrop: (source) => source.inventory === 'player' || source.inventory === 'backpack',
      drop: (source) => onDropItem(index, source),
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [index, onDropItem]
  );

  const dropOver = isOver && canDrop;

  // a manually-placed (reserved) item — full inventory-slot look, click to remove
  if (manualMode && manual) {
    return (
      <ItemSlotVisual
        innerRef={drop as any}
        className="craft-bench-slot"
        name={manual.name}
        count={manual.count}
        alwaysShowCount
        weight={manual.unitWeight * manual.count}
        metadata={manual.metadata}
        rarity={manual.rarity}
        style={{ cursor: 'pointer', ...(dropOver ? DROP_BORDER : {}) }}
        title={`${getItemLabel(manual.name)} — click to remove`}
        onClick={() => onRemoveCell(index)}
      />
    );
  }

  // recipe preview cell (count = how many you need; ghost when you lack them)
  const p = !manualMode ? preview : undefined;
  if (p?.name) {
    const missing = p.owned < p.count;
    return (
      <ItemSlotVisual
        innerRef={drop as any}
        className="craft-bench-slot"
        name={p.name}
        count={p.count}
        alwaysShowCount
        ghost={missing}
        style={dropOver ? DROP_BORDER : undefined}
        title={getItemLabel(p.name)}
      />
    );
  }

  // empty cell (still a drop target) — subtle placeholder border
  return (
    <ItemSlotVisual
      innerRef={drop as any}
      className="craft-bench-slot"
      name={null}
      style={dropOver ? DROP_BORDER : EMPTY_BORDER}
    />
  );
};

interface Props {
  grid: GridCell[];
  manualCells: (PlacedCell | null)[];
  manualMode: boolean;
  combineLabel: string;
  combineDisabled: boolean;
  combineError: boolean;
  onDropItem: (index: number, source: DragSource) => void;
  onRemoveCell: (index: number) => void;
  onCombine: () => void;
}

const CraftingBench: React.FC<Props> = ({
  grid,
  manualCells,
  manualMode,
  combineLabel,
  combineDisabled,
  combineError,
  onDropItem,
  onRemoveCell,
  onCombine,
}) => {
  return (
    <div className="craft-bench">
      <div className="craft-bench-top">
        <div className="craft-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <BenchCell
              key={i}
              index={i}
              manual={manualCells[i] ?? null}
              preview={grid[i]}
              manualMode={manualMode}
              onDropItem={onDropItem}
              onRemoveCell={onRemoveCell}
            />
          ))}
        </div>
      </div>

      <button
        className={`craft-combine-btn ${combineError ? 'error' : ''}`}
        disabled={combineDisabled}
        onClick={onCombine}
      >
        {combineLabel}
      </button>
    </div>
  );
};

export default CraftingBench;
