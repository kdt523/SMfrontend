import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info);
  }

  handleReload = () => {
    // Try a soft reload first
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'An unexpected error occurred.';
      return (
        <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
          <div style={{ maxWidth: 800, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Something went wrong</h2>
            <p style={{ marginTop: 8, color: '#374151' }}>{message}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={this.handleReload} style={{ padding: '8px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6 }}>Reload</button>
              <button onClick={() => { window.history.back(); }} style={{ padding: '8px 12px', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 6 }}>Go Back</button>
            </div>

            <details style={{ marginTop: 12, color: '#6b7280' }}>
              <summary style={{ cursor: 'pointer' }}>Error details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{this.state.error && this.state.error.stack}</pre>
              {this.state.info && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(this.state.info, null, 2)}</pre>}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
