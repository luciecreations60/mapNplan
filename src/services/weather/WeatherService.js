import { EXTERNAL_SERVICES_CONFIG } from '../../config/external-services.config.js';
import { httpService } from '../http/HttpService.js';
import { responseCacheService } from '../storage/ResponseCacheService.js';

/**
 * Open-Meteo adapter.
 *
 * Consumers receive a stable forecast model and never depend on the provider's
 * raw field names. A future commercial weather provider can implement the same
 * public method without changing the workspace components.
 */
class WeatherService {
  async getForecast({ latitude, longitude, forceRefresh = false }) {
    const config = EXTERNAL_SERVICES_CONFIG.weather;
    const roundedLatitude = Number(latitude).toFixed(3);
    const roundedLongitude = Number(longitude).toFixed(3);
    const cacheKey = `weather:${roundedLatitude}:${roundedLongitude}:${config.forecastDays}`;

    if (!forceRefresh) {
      const cached = responseCacheService.get(cacheKey, config.cacheTtlMs);
      if (cached) return { ...cached, fromCache: true };
    }

    const parameters = new URLSearchParams({
      latitude: roundedLatitude,
      longitude: roundedLongitude,
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'weather_code',
        'wind_speed_10m',
        'is_day',
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'sunrise',
        'sunset',
      ].join(','),
      timezone: 'auto',
      forecast_days: String(config.forecastDays),
    });

    const payload = await httpService.getJson(
      `${config.baseUrl}?${parameters.toString()}`,
      { timeoutMs: config.timeoutMs },
    );

    const forecast = this.#normalize(payload);
    responseCacheService.set(cacheKey, forecast);
    return { ...forecast, fromCache: false };
  }

  #normalize(payload) {
    const daily = payload?.daily || {};
    const dates = Array.isArray(daily.time) ? daily.time : [];

    return {
      fetchedAt: new Date().toISOString(),
      timezone: payload?.timezone || 'UTC',
      timezoneAbbreviation: payload?.timezone_abbreviation || 'UTC',
      utcOffsetSeconds: Number(payload?.utc_offset_seconds) || 0,
      current: {
        time: payload?.current?.time || '',
        temperature: Number(payload?.current?.temperature_2m),
        apparentTemperature: Number(payload?.current?.apparent_temperature),
        humidity: Number(payload?.current?.relative_humidity_2m),
        weatherCode: Number(payload?.current?.weather_code),
        windSpeed: Number(payload?.current?.wind_speed_10m),
        isDay: Number(payload?.current?.is_day) === 1,
      },
      days: dates.map((date, index) => ({
        date,
        weatherCode: Number(daily.weather_code?.[index]),
        temperatureMax: Number(daily.temperature_2m_max?.[index]),
        temperatureMin: Number(daily.temperature_2m_min?.[index]),
        precipitationProbability: Number(daily.precipitation_probability_max?.[index]),
        windSpeedMax: Number(daily.wind_speed_10m_max?.[index]),
        sunrise: daily.sunrise?.[index] || '',
        sunset: daily.sunset?.[index] || '',
      })),
    };
  }
}

export const weatherService = new WeatherService();
