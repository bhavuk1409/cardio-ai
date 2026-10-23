import React, { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: number | string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: 'red' | 'green' | 'cyan' | 'amber';
}

interface Props {
  options: SelectOption[];
  value: number | string;
  onChange: (val: number | string) => void;
  className?: string;
}

export function CustomSelect({ options, value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className={`custom-select ${open ? 'custom-select--open' : ''} ${className}`} ref={ref}>
      <button
        type="button"
        className="custom-select__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="custom-select__name">{current ? current.label : ''}</span>
        {current?.badge && (
          <span className={`badge badge--${current.badgeColor || 'approx'} text-[8.5px] ml-1.5`}>
            {current.badge}
          </span>
        )}
        <span className="custom-select__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className="custom-select__menu" role="listbox">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={String(opt.value)} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`custom-select__opt ${active ? 'custom-select__opt--active' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="custom-select__opt-name">{opt.label}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {opt.badge && (
                      <span className={`badge badge--${opt.badgeColor || 'approx'} text-[8px]`}>
                        {opt.badge}
                      </span>
                    )}
                    {active && <span className="custom-select__check">✓</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
