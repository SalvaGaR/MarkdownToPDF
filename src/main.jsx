import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
          <h1 style={{ color: '#dc2626' }}>Algo salió mal</h1>
          <p>Ocurrió un error al cargar la aplicación.</p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.875rem' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#007aff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reiniciar aplicación
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
