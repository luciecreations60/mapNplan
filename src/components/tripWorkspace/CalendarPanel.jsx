import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { calendarInteropService } from '../../services/calendar/CalendarInteropService.js';
import {
  analyseCalendarEvents,
  CALENDAR_REMINDER_OPTIONS,
  importedEventsToItinerary,
} from '../../utils/calendarInterop.js';
import {
  buildCalendarGrid,
  getInitialCalendarMonth,
  getTripCalendarEvents,
  shiftCalendarMonth,
  toDateKey,
} from '../../utils/tripCalendar.js';
import { Button } from '../common/Button.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

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
  calendar: 'calendar',
};

export function CalendarPanel({ trip, onOpenTab, onUpdate }) {
  const { locale, t } = useI18n();
  const fileInputRef = useRef(null);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialCalendarMonth(trip));
  const [selectedDate, setSelectedDate] = useState(() => trip.startDate || toDateKey(new Date()));
  const [importedEvents, setImportedEvents] = useState([]);
  const [selectedImportIds, setSelectedImportIds] = useState([]);
  const [notice, setNotice] = useState(null);
  const events = useMemo(() => getTripCalendarEvents(trip), [trip]);
  const calendarDays = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth]);
  const analysis = useMemo(() => analyseCalendarEvents(events, trip), [events, trip]);
  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
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

  function exportAllEvents() {
    calendarInteropService.exportTrip(trip, events);
    setNotice({ tone: 'success', title: t('calendar.exportedTitle'), message: t('calendar.exportedAll') });
  }

  function exportSelectedDay() {
    calendarInteropService.exportDay(trip, selectedEvents, selectedDate);
    setNotice({ tone: 'success', title: t('calendar.exportedTitle'), message: t('calendar.exportedDay') });
  }

  async function handleImportFile(event) {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) return;

    try {
      const parsedEvents = await calendarInteropService.importFile(file);
      setImportedEvents(parsedEvents);
      setSelectedImportIds(parsedEvents.map((item) => item.id));
      setNotice(parsedEvents.length > 0
        ? { tone: 'success', title: t('calendar.importReadyTitle'), message: t('calendar.importReadyText', { count: parsedEvents.length }) }
        : { tone: 'warning', title: t('calendar.importEmptyTitle'), message: t('calendar.importEmptyText') });
    } catch {
      setImportedEvents([]);
      setSelectedImportIds([]);
      setNotice({ tone: 'danger', title: t('calendar.importFailedTitle'), message: t('calendar.importFailedText') });
    }
  }

  function importSelectedEvents() {
    const selectedEventsToImport = importedEvents.filter((event) => selectedImportIds.includes(event.id));
    if (selectedEventsToImport.length === 0) return;

    onUpdate({ itinerary: importedEventsToItinerary(trip, selectedEventsToImport) });
    setImportedEvents([]);
    setSelectedImportIds([]);
    setNotice({
      tone: 'success',
      title: t('calendar.importedTitle'),
      message: t(selectedEventsToImport.length === 1 ? 'calendar.importedOne' : 'calendar.importedMany', { count: selectedEventsToImport.length }),
    });
  }

  function toggleImportedEvent(id) {
    setSelectedImportIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }

  function updateReminder(calendarEvent, value) {
    const reminderMinutes = value === '' ? null : Number(value);

    if (calendarEvent.source === 'activity') {
      const itinerary = trip.itinerary.map((day) => ({
        ...day,
        items: day.items.map((item) => (
          item.id === calendarEvent.sourceId ? { ...item, reminderMinutes } : item
        )),
      }));
      onUpdate({ itinerary });
    } else {
      const reservations = trip.reservations.map((reservation) => (
        reservation.id === calendarEvent.sourceId ? { ...reservation, reminderMinutes } : reservation
      ));
      onUpdate({ reservations });
    }

    setNotice({ tone: 'success', title: t('calendar.reminderUpdatedTitle'), message: t('calendar.reminderUpdatedText') });
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

      {notice && (
        <InlineNotice tone={notice.tone} title={notice.title} className="calendar-sync__notice">
          {notice.message}
        </InlineNotice>
      )}

      <section className="calendar-sync" aria-labelledby="calendar-sync-title">
        <div className="calendar-sync__intro">
          <span className="calendar-sync__icon"><Icon name="calendarRange" size={22} /></span>
          <div>
            <p className="eyebrow">{t('calendar.syncEyebrow')}</p>
            <h3 id="calendar-sync-title">{t('calendar.syncTitle')}</h3>
            <p>{t('calendar.syncText')}</p>
          </div>
        </div>
        <div className="calendar-sync__actions">
          <Button size="small" icon="download" onClick={exportAllEvents} disabled={events.length === 0}>
            {t('calendar.exportAll')}
          </Button>
          <Button size="small" variant="secondary" icon="calendar" onClick={exportSelectedDay} disabled={selectedEvents.length === 0}>
            {t('calendar.exportDay')}
          </Button>
          <Button size="small" variant="secondary" icon="upload" onClick={() => fileInputRef.current?.click()}>
            {t('calendar.importIcs')}
          </Button>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".ics,text/calendar" onChange={handleImportFile} />
        </div>
      </section>

      {(analysis.conflicts.length > 0 || analysis.issues.length > 0) && (
        <section className="calendar-health" aria-labelledby="calendar-health-title">
          <div className="calendar-health__heading">
            <Icon name="alertTriangle" size={20} />
            <div>
              <h3 id="calendar-health-title">{t('calendar.healthTitle')}</h3>
              <p>{t('calendar.healthText')}</p>
            </div>
          </div>
          <div className="calendar-health__list">
            {analysis.conflicts.map((conflict) => {
              const [first, second] = conflict.eventIds.map((id) => eventMap.get(id));
              return (
                <button key={conflict.id} type="button" onClick={() => { setSelectedDate(conflict.date); setVisibleMonth(monthFromDateKey(conflict.date)); }}>
                  <strong>{t('calendar.conflictLabel')}</strong>
                  <span>{first?.title} · {second?.title}</span>
                  <small>{formatSelectedDate(conflict.date, locale)}</small>
                </button>
              );
            })}
            {analysis.issues.map((issue) => {
              const event = eventMap.get(issue.eventIds[0]);
              const canSelectDate = Boolean(issue.date);
              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => {
                    if (canSelectDate) {
                      setSelectedDate(issue.date);
                      setVisibleMonth(monthFromDateKey(issue.date));
                    } else {
                      onOpenTab(issue.id.includes('reservation') ? 'reservations' : 'itinerary');
                    }
                  }}
                >
                  <strong>{t(`calendar.issue.${issue.type}`)}</strong>
                  <span>{event?.title || issue.title}</span>
                  <small>{canSelectDate ? formatSelectedDate(issue.date, locale) : t('calendar.dateMissing')}</small>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {importedEvents.length > 0 && (
        <section className="calendar-import" aria-labelledby="calendar-import-title">
          <div className="calendar-import__heading">
            <div>
              <p className="eyebrow">{t('calendar.importPreviewEyebrow')}</p>
              <h3 id="calendar-import-title">{t('calendar.importPreviewTitle')}</h3>
              <p>{t('calendar.importPreviewText')}</p>
            </div>
            <Button size="small" icon="plus" onClick={importSelectedEvents} disabled={selectedImportIds.length === 0}>
              {t('calendar.importSelected', { count: selectedImportIds.length })}
            </Button>
          </div>
          <div className="calendar-import__list">
            {importedEvents.map((event) => (
              <label key={event.id} className="calendar-import__item">
                <input type="checkbox" checked={selectedImportIds.includes(event.id)} onChange={() => toggleImportedEvent(event.id)} />
                <span>
                  <strong>{event.title}</strong>
                  <small>{formatSelectedDate(event.date, locale)} · {event.time || t('calendar.allDay')} {event.location ? `· ${event.location}` : ''}</small>
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

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
                  <article key={event.id} className="calendar-agenda__event">
                    <button className="calendar-agenda__item" type="button" onClick={() => onOpenTab(event.tab)}>
                      <span className={`calendar-agenda__icon calendar-agenda__icon--${event.source}`}>
                        <Icon name={EVENT_ICONS[event.type] || 'calendar'} size={18} />
                      </span>
                      <span>
                        <strong>{event.title}</strong>
                        <small>{[event.time || t('calendar.allDay'), event.subtitle].filter(Boolean).join(' · ')}</small>
                      </span>
                      <Icon name="arrowRight" size={16} />
                    </button>
                    <div className="calendar-agenda__tools">
                      <label>
                        <span>{t('calendar.reminder')}</span>
                        <select value={event.reminderMinutes ?? ''} onChange={(changeEvent) => updateReminder(event, changeEvent.target.value)}>
                          {CALENDAR_REMINDER_OPTIONS.map((minutes) => (
                            <option key={minutes ?? 'none'} value={minutes ?? ''}>{reminderLabel(minutes, t)}</option>
                          ))}
                        </select>
                      </label>
                      <div className="calendar-agenda__external-actions" aria-label={t('calendar.addToCalendar')}>
                        <button type="button" title={t('calendar.googleCalendar')} aria-label={t('calendar.googleCalendar')} onClick={() => calendarInteropService.openGoogleCalendar(trip, event)}>
                          <Icon name="externalLink" size={15} /><span>Google</span>
                        </button>
                        <button type="button" title={t('calendar.outlookCalendar')} aria-label={t('calendar.outlookCalendar')} onClick={() => calendarInteropService.openOutlookCalendar(trip, event)}>
                          <Icon name="externalLink" size={15} /><span>Outlook</span>
                        </button>
                        <button type="button" title={t('calendar.appleCalendar')} aria-label={t('calendar.appleCalendar')} onClick={() => calendarInteropService.exportEvent(trip, event)}>
                          <Icon name="download" size={15} /><span>Apple / ICS</span>
                        </button>
                      </div>
                    </div>
                  </article>
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

function reminderLabel(minutes, t) {
  if (minutes === null) return t('calendar.reminderNone');
  if (minutes === 0) return t('calendar.reminderAtTime');
  if (minutes === 1440) return t('calendar.reminderOneDay');
  if (minutes >= 60) return t('calendar.reminderHours', { count: minutes / 60 });
  return t('calendar.reminderMinutes', { count: minutes });
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

function monthFromDateKey(value) {
  const [year, month] = String(value || '').split('-').map(Number);
  return new Date(year, Math.max(0, month - 1), 1);
}
