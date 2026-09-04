import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Inter, system-ui, sans-serif',
            backgroundColor: '#f7f9f8',
            color: '#1f2937',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '1rem' }}>🐾</div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.25rem', fontWeight: '700' }}>
              ¡Ups! Algo no cargó correctamente
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {this.state.error?.message || 'Ocurrió un error inesperado al renderizar la vista.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#2c4a3e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Recargar página
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Restablecer datos locales
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
