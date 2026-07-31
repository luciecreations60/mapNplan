import { EXTERNAL_SERVICES_CONFIG } from '../../config/external-services.config.js';
import { httpService } from '../http/HttpService.js';
import { responseCacheService } from '../storage/ResponseCacheService.js';

/**
 * Frankfurter exchange-rate adapter.
 *
 * The service returns reference rates only. It deliberately avoids presenting
 * them as guaranteed card or cash rates because banks may add fees and spreads.
 */
class CurrencyService {
  async getRate(baseCurrency, quoteCurrency, { forceRefresh = false } = {}) {
    const base = String(baseCurrency || '').trim().toUpperCase();
    const quote = String(quoteCurrency || '').trim().toUpperCase();

    if (!base || !quote) throw new Error('Two currencies are required.');
    if (base === quote) {
      return {
        base,
        quote,
        rate: 1,
        date: new Date().toISOString().slice(0, 10),
        fromCache: false,
      };
    }

    const config = EXTERNAL_SERVICES_CONFIG.currency;
    const cacheKey = `currency:${base}:${quote}`;

    if (!forceRefresh) {
      const cached = responseCacheService.get(cacheKey, config.cacheTtlMs);
      if (cached) return { ...cached, fromCache: true };
    }

    const payload = await httpService.getJson(
      `${config.baseUrl}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
      { timeoutMs: config.timeoutMs },
    );
    const rate = Number(payload?.rate ?? payload?.rates?.[quote]);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error('The exchange-rate provider returned an invalid rate.');
    }

    const result = {
      base: payload?.base || base,
      quote: payload?.quote || quote,
      rate,
      date: payload?.date || new Date().toISOString().slice(0, 10),
    };

    responseCacheService.set(cacheKey, result);
    return { ...result, fromCache: false };
  }
}

export const currencyService = new CurrencyService();
