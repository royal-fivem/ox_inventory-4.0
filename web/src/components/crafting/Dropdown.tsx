import React, { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface Props {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  title?: string;
}

/** Lightweight custom dropdown so the codex controls match the UI theme
 *  instead of using the browser's native <select> chrome. */
const Dropdown: React.FC<Props> = ({ options, value, onChange, className, title }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDocMouseDown);
    return () => window.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  return (
    <div ref={ref} className={`craft-dd ${className ?? ''} ${open ? 'open' : ''}`} title={title}>
      <button type="button" className="craft-dd-btn" onClick={() => setOpen((o) => !o)}>
        <span className="craft-dd-value">{selected?.label ?? ''}</span>
        <span className="craft-dd-caret" />
      </button>

      {open && (
        <div className="craft-dd-menu">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`craft-dd-item ${o.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
