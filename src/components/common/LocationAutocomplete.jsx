import { useEffect, useId, useRef, useState } from 'react';
import { EXTERNAL_SERVICES_CONFIG } from '../../config/external-services.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { geocodingService } from '../../services/geocoding/GeocodingService.js';
import { Icon } from './Icon.jsx';

const CONFIG = EXTERNAL_SERVICES_CONFIG.geocoding;

/**
 * Accessible place-search field shared by trip, itinerary and reservation forms.
 *
 * The field remains fully editable: selecting a suggestion fills coordinates,
 * while ignoring suggestions keeps the manually entered text unchanged.
 */
export function LocationAutocomplete({
  id,
  label,
  value,
  onValueChange,
  onPlaceSelect,
  placeholder = '',
  hint = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  variant = 'standard',
  countryCode = '',
  bias = null,
  autoComplete = 'off',
}) {
  const generatedId = useId();
  const inputId = id || `location-${generatedId}`;
  const listboxId = `${inputId}-results`;
  const messageId = `${inputId}-message`;
  const rootRef = useRef(null);
  const selectedValueRef = useRef('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [isFocused, setFocused] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { language, t } = useI18n();

  const normalizedValue = String(value || '').trim();
  const showMinimumHint = isFocused
    && normalizedValue.length > 0
    && normalizedValue.length < CONFIG.minimumQueryLength;
  const visibleMessage = error || hint;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (disabled || normalizedValue.length < CONFIG.minimumQueryLength) {
      setResults([]);
      setStatus('idle');
      setOpen(false);
      setActiveIndex(-1);
      return undefined;
    }

    if (selectedValueRef.current === normalizedValue) {
      selectedValueRef.current = '';
      return undefined;
    }

    const controller = new AbortController();
    const debounceId = window.setTimeout(async () => {
      setStatus('loading');

      try {
        const places = await geocodingService.search(normalizedValue, {
          language,
          countryCode,
          bias,
          signal: controller.signal,
        });

        setResults(places);
        setStatus('success');
        setOpen(isFocused);
        setActiveIndex(-1);
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus('error');
        setOpen(isFocused);
        setActiveIndex(-1);
      }
    }, CONFIG.debounceMs);

    return () => {
      window.clearTimeout(debounceId);
      controller.abort();
    };
  }, [bias?.latitude, bias?.longitude, countryCode, disabled, isFocused, language, normalizedValue]);

  function handleChange(event) {
    selectedValueRef.current = '';
    onValueChange(event.target.value);
    setOpen(true);
  }

  function handleFocus() {
    setFocused(true);
    if (normalizedValue.length >= CONFIG.minimumQueryLength) setOpen(true);
  }

  function handleBlur() {
    setFocused(false);
  }

  function selectPlace(place) {
    selectedValueRef.current = place.label;
    onValueChange(place.label);
    onPlaceSelect?.(place);
    setResults([]);
    setStatus('idle');
    setOpen(false);
    setActiveIndex(-1);
  }

  function clearValue() {
    selectedValueRef.current = '';
    onValueChange('');
    onPlaceSelect?.(null);
    setResults([]);
    setStatus('idle');
    setOpen(false);
    setActiveIndex(-1);
    window.requestAnimationFrame(() => document.getElementById(inputId)?.focus());
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectPlace(results[activeIndex]);
    }
  }

  const wrapperClass = variant === 'workspace'
    ? `workspace-field location-autocomplete ${className}`
    : `field location-autocomplete ${className}`;
  const labelClass = variant === 'workspace' ? '' : 'field__label';
  const inputClass = variant === 'workspace'
    ? ''
    : `field__input ${error ? 'field__input--error' : ''}`.trim();

  return (
    <div ref={rootRef} className={wrapperClass.trim()}>
      <label className={labelClass} htmlFor={inputId}>{label}</label>
      <div className="location-autocomplete__control">
        <Icon name="pin" size={17} className="location-autocomplete__leading-icon" />
        <input
          id={inputId}
          className={inputClass}
          type="text"
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-describedby={(visibleMessage || showMinimumHint) ? messageId : undefined}
          aria-invalid={Boolean(error)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {status === 'loading' && (
          <span className="location-autocomplete__status" aria-label={t('placeSearch.loading')}>
            <Icon name="refresh" size={16} />
          </span>
        )}
        {value && status !== 'loading' && !disabled && (
          <button
            className="location-autocomplete__clear"
            type="button"
            aria-label={t('placeSearch.clear')}
            onClick={clearValue}
          >
            <Icon name="close" size={15} />
          </button>
        )}

        {isOpen && normalizedValue.length >= CONFIG.minimumQueryLength && (
          <div className="location-autocomplete__popover">
            {status === 'loading' && (
              <p className="location-autocomplete__empty">{t('placeSearch.loading')}</p>
            )}

            {status === 'error' && (
              <p className="location-autocomplete__empty location-autocomplete__empty--error">
                {t('placeSearch.error')}
              </p>
            )}

            {status === 'success' && results.length === 0 && (
              <p className="location-autocomplete__empty">{t('placeSearch.noResults')}</p>
            )}

            {results.length > 0 && (
              <ul id={listboxId} className="location-autocomplete__results" role="listbox">
                {results.map((place, index) => (
                  <li
                    id={`${listboxId}-${index}`}
                    key={place.id}
                    role="option"
                    aria-selected={activeIndex === index}
                  >
                    <button
                      className={`location-autocomplete__option ${activeIndex === index ? 'location-autocomplete__option--active' : ''}`}
                      type="button"
                      onPointerDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectPlace(place)}
                    >
                      <span className="location-autocomplete__option-icon"><Icon name="pin" size={16} /></span>
                      <span>
                        <strong>{place.primaryLabel}</strong>
                        {place.secondaryLabel && <small>{place.secondaryLabel}</small>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <footer className="location-autocomplete__attribution">
              <span>{t('placeSearch.poweredBy')}</span>
              <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a>
              <span>·</span>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
            </footer>
          </div>
        )}
      </div>

      {(visibleMessage || showMinimumHint) && (
        <small id={messageId} className={error ? 'field__error' : 'field__hint'}>
          {error || (showMinimumHint
            ? t('placeSearch.minimumCharacters', { count: CONFIG.minimumQueryLength })
            : hint)}
        </small>
      )}
    </div>
  );
}
