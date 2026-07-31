import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application error.', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <div className="fatal-error__panel">
            <span className="fatal-error__symbol" aria-hidden="true">!</span>
            <h1>Something went wrong</h1>
            <p>Refresh the page. Your locally saved trips have not been deleted.</p>
            <button className="button button--primary button--medium" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
