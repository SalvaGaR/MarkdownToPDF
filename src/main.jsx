import { StrictMode, Component, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const App = lazy(() => import('./App.jsx'))

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
          <h1 style={{ color: '#dc2626', fontSize: '1.5rem', marginBottom: '1rem' }}>Algo salió mal</h1>
          <p style={{ marginBottom: '1rem' }}>Ocurrió un error al cargar la aplicación.</p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {this.state.error?.message || 'Error desconocido'}
          </pre>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            style={{ padding: '0.5rem 1rem', background: '#007aff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Reiniciar aplicación
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const loadingFallback = (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'system-ui, sans-serif',
    color: '#666',
    fontSize: '1rem',
  }}>
    Cargando editor...
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={loadingFallback}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
