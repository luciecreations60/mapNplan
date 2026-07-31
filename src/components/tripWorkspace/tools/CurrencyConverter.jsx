import { useEffect, useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../../config/external-services.config.js';
import { useI18n } from '../../../hooks/useI18n.js';
import { currencyService } from '../../../services/currency/CurrencyService.js';
import { formatCurrency } from '../../../utils/currency.js';
import { Card } from '../../common/Card.jsx';
import { Icon } from '../../common/Icon.jsx';

export function CurrencyConverter({ baseCurrency = 'EUR', destinationCurrency = 'USD' }) {
  const { locale, t } = useI18n();
  const [amount, setAmount] = useState('100');
  const [base, setBase] = useState(baseCurrency);
  const [quote, setQuote] = useState(destinationCurrency || baseCurrency);
  const [rateData, setRateData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadRate() {
      setStatus('loading');
      setError('');
      try {
        const result = await currencyService.getRate(base, quote);
        if (active) {
          setRateData(result);
          setStatus('success');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || t('tools.exchangeUnavailable'));
          setStatus('error');
        }
      }
    }

    loadRate();
    return () => { active = false; };
  }, [base, quote, t]);

  const convertedAmount = useMemo(() => {
    const numericAmount = Number(amount);
    if (!rateData || !Number.isFinite(numericAmount)) return null;
    return numericAmount * rateData.rate;
  }, [amount, rateData]);

  function swapCurrencies() {
    setBase(quote);
    setQuote(base);
  }

  return (
    <Card className="travel-tool-card currency-card">
      <header className="travel-tool-card__header">
        <div>
          <p className="eyebrow">{t('tools.rateEyebrow')}</p>
          <h2>{t('tools.converter')}</h2>
          <small>{t('tools.fees')}</small>
        </div>
        <span className="travel-tool-card__header-icon"><Icon name="exchange" /></span>
      </header>

      <div className="currency-converter">
        <label><span>{t('tools.amount')}</span><input type="number" min="0" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label>
          <span>{t('tools.from')}</span>
          <select value={base} onChange={(event) => setBase(event.target.value)}>
            {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code}</option>)}
          </select>
        </label>
        <button className="currency-converter__swap" type="button" onClick={swapCurrencies} aria-label={t('tools.swap')}><Icon name="exchange" size={18} /></button>
        <label>
          <span>{t('tools.to')}</span>
          <select value={quote} onChange={(event) => setQuote(event.target.value)}>
            {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code}</option>)}
          </select>
        </label>
      </div>

      <div className="currency-result" aria-live="polite">
        {status === 'loading' && <span>{t('tools.updatingRate')}</span>}
        {status === 'error' && <span className="currency-result__error">{error}</span>}
        {status === 'success' && convertedAmount !== null && (
          <>
            <small>{t('tools.equals', { amount: formatCurrency(Number(amount) || 0, base, locale) })}</small>
            <strong>{formatCurrency(convertedAmount, quote, locale)}</strong>
            <span>{t('tools.rate', { base, rate: rateData.rate.toLocaleString(locale, { maximumFractionDigits: 6 }), quote })}</span>
          </>
        )}
      </div>

      {rateData && (
        <footer className="travel-tool-card__footer">
          <span>{t('tools.rateDate', { date: rateData.date })}</span>
          <span>{rateData.fromCache ? t('tools.cachedProvider') : t('tools.provider')}</span>
        </footer>
      )}
    </Card>
  );
}
