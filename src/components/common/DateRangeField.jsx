import { useEffect, useMemo, useRef, useState } from 'react';
import { formatLocalizedDate } from '../../utils/date.js';
import { Icon } from './Icon.jsx';

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthStart(value) {
  const date = parseDateKey(value) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function shiftMonth(month, amount) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1, 12);
}

function buildMonthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const leading = (first.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - leading, 12);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      currentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

export function DateRangeField({
  label,
  startDate,
  endDate,
  onChange,
  locale,
  error = '',
  startLabel = 'Start',
  endLabel = 'End',
  previousMonthLabel = 'Previous month',
  nextMonthLabel = 'Next month',
  instruction = 'Choose the first date, then the last date.',
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(startDate));
  const [pendingStart, setPendingStart] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setPendingStart('');
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (startDate) setVisibleMonth(monthStart(startDate));
  }, [startDate]);

  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 1 + index)).replace('.', ''));
  }, [locale]);

  function chooseDate(key) {
    if (!pendingStart) {
      setPendingStart(key);
      onChange?.({ startDate: key, endDate: '' });
      return;
    }

    if (key < pendingStart) {
      setPendingStart(key);
      onChange?.({ startDate: key, endDate: '' });
      return;
    }

    onChange?.({ startDate: pendingStart, endDate: key });
    setPendingStart('');
    setOpen(false);
  }

  const effectiveStart = pendingStart || startDate;
  const rangeLabel = startDate
    ? `${formatLocalizedDate(startDate, locale, 'numeric')}${endDate ? ` → ${formatLocalizedDate(endDate, locale, 'numeric')}` : ''}`
    : instruction;

  return (
    <div ref={rootRef} className={`date-range-field${error ? ' date-range-field--error' : ''}`}>
      <span className="field__label">{label}</span>
      <button
        type="button"
        className="date-range-field__trigger"
        aria-expanded={open}
        onClick={() => {
          setVisibleMonth(monthStart(startDate || endDate));
          setPendingStart('');
          setOpen((value) => !value);
        }}
      >
        <Icon name="calendarRange" size={18} />
        <span>{rangeLabel}</span>
        <Icon name="chevronDown" size={16} />
      </button>
      {error && <small className="field__error">{error}</small>}

      {open && (
        <div className="date-range-field__popover">
          <header className="date-range-field__header">
            <button type="button" className="icon-button icon-button--small" aria-label={previousMonthLabel} onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}>
              <Icon name="arrowLeft" size={17} />
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" className="icon-button icon-button--small" aria-label={nextMonthLabel} onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}>
              <Icon name="arrowRight" size={17} />
            </button>
          </header>
          <p className="date-range-field__instruction">{pendingStart ? endLabel : startLabel} · {instruction}</p>
          <div className="date-range-field__weekdays" aria-hidden="true">
            {weekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="date-range-field__calendar" role="grid">
            {days.map((day) => {
              const isStart = day.key === effectiveStart;
              const isEnd = Boolean(endDate && day.key === endDate && !pendingStart);
              const inRange = Boolean(effectiveStart && endDate && !pendingStart && day.key > effectiveStart && day.key < endDate);
              return (
                <button
                  key={day.key}
                  type="button"
                  role="gridcell"
                  className={[
                    'date-range-field__day',
                    !day.currentMonth ? 'date-range-field__day--outside' : '',
                    inRange ? 'date-range-field__day--range' : '',
                    isStart || isEnd ? 'date-range-field__day--selected' : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={isStart || isEnd}
                  onClick={() => chooseDate(day.key)}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
