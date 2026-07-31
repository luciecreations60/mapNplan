import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import {
  buildCalendarGrid,
  getInitialCalendarMonth,
  getTripCalendarEvents,
  shiftCalendarMonth,
  toDateKey,
} from '../../utils/tripCalendar.js';
import { Icon } from '../common/Icon.jsx';

const EVENT_ICONS = {
  flight: 'plane',
  accommodation: 'hotel',
  transport: 'car',
  activity: 'ticket',
  map: 'pin',
  food: 'food',
  hotel: 'hotel',
  plane: 'plane',
  car: 'car',
  ticket: 'ticket',
};

export function CalendarPanel({ trip, onOpenTab }) {
  const { locale, t } = useI18n();
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialCalendarMonth(trip));
  const [selectedDate, setSelectedDate] = useState(() => trip.startDate || toDateKey(new Date()));
  const events = useMemo(() => getTripCalendarEvents(trip), [trip]);
  const calendarDays = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth]);
  const eventsByDate = useMemo(() => events.reduce((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event];
    return groups;
  }, {}), [events]);
  const selectedEvents = eventsByDate[selectedDate] || [];
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const monday = new Date(2024, 0, 1 + index);
    return weekdayFormatter.format(monday).replace('.', '');
  });

  function selectDay(day) {
    setSelectedDate(day.key);
    if (!day.isCurrentMonth) setVisibleMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
  }

  return (
    <div className="workspace-section calendar-panel">
      <section className="workspace-section__heading calendar-panel__heading">
        <div>
          <p className="eyebrow">{t('calendar.eyebrow')}</p>
          <h2>{t('calendar.title')}</h2>
          <p>{t('calendar.intro')}</p>
        </div>
        <div className="calendar-panel__navigation" aria-label={t('calendar.monthNavigation')}>
          <button className="icon-button icon-button--small" type="button" aria-label={t('calendar.previousMonth')} onClick={() => setVisibleMonth((month) => shiftCalendarMonth(month, -1))}>
            <Icon name="arrowLeft" size={17} />
          </button>
          <strong>{monthLabel}</strong>
          <button className="icon-button icon-button--small" type="button" aria-label={t('calendar.nextMonth')} onClick={() => setVisibleMonth((month) => shiftCalendarMonth(month, 1))}>
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      </section>

      {events.length === 0 ? (
        <div className="workspace-large-empty workspace-large-empty--compact">
          <span><Icon name="calendarRange" size={28} /></span>
          <h3>{t('calendar.emptyTitle')}</h3>
          <p>{t('calendar.emptyText')}</p>
          <button className="button button--primary button--small" type="button" onClick={() => onOpenTab('itinerary')}>
            <Icon name="plus" size={16} /> {t('calendar.addActivity')}
          </button>
        </div>
      ) : (
        <div className="calendar-layout">
          <div className="calendar-grid-wrap">
            <div className="calendar-weekdays" aria-hidden="true">
              {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="calendar-grid" role="grid" aria-label={monthLabel}>
              {calendarDays.map((day) => {
                const dayEvents = eventsByDate[day.key] || [];
                const isSelected = day.key === selectedDate;
                const isToday = day.key === toDateKey(new Date());
                return (
                  <button
                    key={day.key}
                    className={[
                      'calendar-day',
                      !day.isCurrentMonth ? 'calendar-day--outside' : '',
                      isSelected ? 'calendar-day--selected' : '',
                      isToday ? 'calendar-day--today' : '',
                    ].filter(Boolean).join(' ')}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    onClick={() => selectDay(day)}
                  >
                    <span className="calendar-day__number">{day.date.getDate()}</span>
                    <span className="calendar-day__events">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className={`calendar-event-dot calendar-event-dot--${event.source}`} title={event.title}>
                          {event.time && <small>{event.time}</small>}
                          <span>{event.title}</span>
                        </span>
                      ))}
                      {dayEvents.length > 3 && <small className="calendar-day__more">+{dayEvents.length - 3}</small>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="calendar-agenda">
            <div className="calendar-agenda__heading">
              <p className="eyebrow">{t('calendar.agenda')}</p>
              <h3>{formatSelectedDate(selectedDate, locale)}</h3>
              <span>{t(selectedEvents.length === 1 ? 'calendar.eventCountOne' : 'calendar.eventCountMany', { count: selectedEvents.length })}</span>
            </div>

            {selectedEvents.length > 0 ? (
              <div className="calendar-agenda__list">
                {selectedEvents.map((event) => (
                  <button key={event.id} className="calendar-agenda__item" type="button" onClick={() => onOpenTab(event.tab)}>
                    <span className={`calendar-agenda__icon calendar-agenda__icon--${event.source}`}>
                      <Icon name={EVENT_ICONS[event.type] || 'calendar'} size={18} />
                    </span>
                    <span>
                      <strong>{event.title}</strong>
                      <small>{[event.time || t('calendar.allDay'), event.subtitle].filter(Boolean).join(' · ')}</small>
                    </span>
                    <Icon name="arrowRight" size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="calendar-agenda__empty">
                <Icon name="calendar" size={24} />
                <p>{t('calendar.noEvents')}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function formatSelectedDate(value, locale) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
