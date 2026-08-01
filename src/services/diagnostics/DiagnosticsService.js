const DIAGNOSTICS_KEY = 'tripflow:diagnostics';
const MAX_ENTRIES = 20;

function serializeError(error) {
  return {
    name: String(error?.name || 'Error'),
    message: String(error?.message || error || 'Unknown error').slice(0, 1000),
    stack: String(error?.stack || '').slice(0, 5000),
  };
}

class DiagnosticsService {
  capture(error, context = {}) {
    const entry = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      capturedAt: new Date().toISOString(),
      error: serializeError(error),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      version: typeof document !== 'undefined' ? document.documentElement?.dataset?.appVersion || '' : '',
    };

    try {
      const current = JSON.parse(sessionStorage.getItem(DIAGNOSTICS_KEY) || '[]');
      sessionStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify([entry, ...current].slice(0, MAX_ENTRIES)));
    } catch {
      // Diagnostics must never cause another application failure.
    }
    return entry;
  }

  list() {
    try {
      return JSON.parse(sessionStorage.getItem(DIAGNOSTICS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  clear() {
    try { sessionStorage.removeItem(DIAGNOSTICS_KEY); } catch { /* noop */ }
  }

  installGlobalHandlers() {
    if (typeof window === 'undefined' || window.__tripflowDiagnosticsInstalled) return;
    window.__tripflowDiagnosticsInstalled = true;
    window.addEventListener('error', (event) => {
      this.capture(event.error || event.message, { source: 'window.error' });
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.capture(event.reason, { source: 'unhandledrejection' });
    });
  }
}

export const diagnosticsService = new DiagnosticsService();
