import { Component } from 'react';
import { translateForCurrentBrowser } from '../../contexts/LocalizationContext.jsx';
import { diagnosticsService } from '../../services/diagnostics/DiagnosticsService.js';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    diagnosticsService.capture(error, { source: 'react-error-boundary', componentStack: info?.componentStack || '' });
    console.error('Unhandled application error.', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <div className="fatal-error__panel">
            <span className="fatal-error__symbol" aria-hidden="true">!</span>
            <h1>{translateForCurrentBrowser('error.title')}</h1>
            <p>{translateForCurrentBrowser('error.message')}</p>
            <button className="button button--primary button--medium" onClick={() => window.location.reload()}>
              {translateForCurrentBrowser('error.reload')}
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
