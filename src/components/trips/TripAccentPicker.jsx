import { useEffect, useRef, useState } from 'react';
import { TRIP_ACCENTS } from '../../config/trip-accents.config.js';
import { Icon } from '../common/Icon.jsx';

export function TripAccentPicker({ value, label, getLabel, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = TRIP_ACCENTS.find((accent) => accent.id === value) || TRIP_ACCENTS[0];

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="field trip-accent-picker">
      <span className="field__label">{label}</span>
      <button type="button" className="trip-accent-picker__trigger" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="trip-accent-picker__swatch" style={{ background: selected.swatch }} />
        <span>{getLabel(selected.id)}</span>
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div className="trip-accent-picker__menu" role="listbox">
          {TRIP_ACCENTS.map((accent) => (
            <button
              key={accent.id}
              type="button"
              role="option"
              aria-selected={accent.id === selected.id}
              className={accent.id === selected.id ? 'trip-accent-picker__option trip-accent-picker__option--active' : 'trip-accent-picker__option'}
              onClick={() => {
                onChange(accent.id);
                setOpen(false);
              }}
            >
              <span className="trip-accent-picker__swatch" style={{ background: accent.swatch }} />
              <span>{getLabel(accent.id)}</span>
              {accent.id === selected.id && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
