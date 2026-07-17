import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type State = { hasError: boolean };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="container main-content">
          <section className="card failure-state" role="alert">
            <h1>Something went wrong</h1>
            <p>This page could not be displayed correctly. No calculation data was intentionally sent anywhere.</p>
            <div className="button-row">
              <button type="button" onClick={() => window.location.assign(window.location.pathname)}>
                Try again
              </button>
              <Link className="button-secondary" to="/calculators">
                View calculators
              </Link>
            </div>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
