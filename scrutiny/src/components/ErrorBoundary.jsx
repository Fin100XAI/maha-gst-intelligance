import React from 'react';

// Keeps one failing screen from blanking the whole app; shows the error and a way back.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Screen error:', error, info?.componentStack); window.__lastScreenError = `${error?.message}\n${info?.componentStack || ''}`; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="callout" style={{ background: 'var(--live-bg)', color: 'var(--critical)' }}>
          <div>
            <b>This screen could not be displayed.</b> {String(this.state.error?.message || this.state.error)}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn small" onClick={() => this.setState({ error: null })}>Try again</button>
              <button className="btn small" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
