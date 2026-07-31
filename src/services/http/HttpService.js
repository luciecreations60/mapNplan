/**
 * Small JSON HTTP client shared by all public API adapters.
 *
 * It centralises timeout handling and error messages so provider services can
 * focus only on translating remote payloads into stable application models.
 */
export class HttpError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload;
  }
}

class HttpService {
  async getJson(url, { timeoutMs = 10000, headers = {} } = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      const payload = await this.#readPayload(response);

      if (!response.ok) {
        const remoteMessage = payload?.reason || payload?.message;
        throw new HttpError(
          remoteMessage || `The remote service returned HTTP ${response.status}.`,
          response.status,
          payload,
        );
      }

      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new HttpError('The remote service took too long to respond.');
      }

      if (error instanceof HttpError) throw error;
      throw new HttpError('The remote service is currently unavailable.', 0, error);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async #readPayload(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;

    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}

export const httpService = new HttpService();
