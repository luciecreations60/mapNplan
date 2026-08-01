import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n.js';
import { useTrips } from '../../hooks/useTrips.js';
import { searchTripContent } from '../../utils/tripSearch.js';
import { Icon } from '../common/Icon.jsx';

const RESULT_ICONS = {
  trip: 'trips',
  activity: 'calendarDays',
  reservation: 'ticket',
  document: 'file',
  notes: 'notebook',
  savedPlace: 'pin',
};

export function GlobalSearch() {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const { trips } = useTrips();
  const { t } = useI18n();
  const results = useMemo(() => searchTripContent(trips, query), [query, trips]);
  const shortcutLabel = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener('keydown', handleShortcut);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleShortcut);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  function openResult(result) {
    setOpen(false);
    setQuery('');
    navigate(`/trips/${result.tripId}?tab=${result.tab}`);
  }

  return (
    <div className="global-search" ref={rootRef}>
      <button
        className="topbar__search"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={t('nav.search')}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="search" size={18} />
        <span>{t('nav.search')}</span>
        <kbd>{shortcutLabel}</kbd>
      </button>

      {isOpen && (
        <section className="global-search__panel" role="dialog" aria-label={t('search.title')}>
          <div className="global-search__field">
            <Icon name="search" size={19} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label={t('search.clear')} onClick={() => setQuery('')}>
                <Icon name="close" size={17} />
              </button>
            )}
          </div>

          <div className="global-search__results" role="listbox">
            {query.trim().length < 2 && (
              <div className="global-search__empty">
                <Icon name="sparkles" size={22} />
                <p>{t('search.hint')}</p>
              </div>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
              <div className="global-search__empty">
                <Icon name="search" size={22} />
                <strong>{t('search.noResults')}</strong>
                <p>{t('search.noResultsText')}</p>
              </div>
            )}

            {results.map((result) => (
              <button
                key={result.id}
                className="global-search__result"
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => openResult(result)}
              >
                <span className="global-search__result-icon">
                  <Icon name={RESULT_ICONS[result.type]} size={18} />
                </span>
                <span className="global-search__result-copy">
                  <strong>{result.title}</strong>
                  <small>{result.subtitle}</small>
                </span>
                <span className="global-search__result-type">{t(`search.types.${result.type}`)}</span>
                <Icon name="arrowRight" size={16} />
              </button>
            ))}
          </div>

          <footer className="global-search__footer">
            <span>{t('search.footer')}</span>
            <kbd>Esc</kbd>
          </footer>
        </section>
      )}
    </div>
  );
}
