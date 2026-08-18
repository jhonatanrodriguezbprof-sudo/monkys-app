import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
            💥
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800">Algo salió mal</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              La aplicación encontró un error inesperado.
            </p>
          </div>
          <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
            <p className="text-xs font-bold text-red-600 mb-1">Error:</p>
            <p className="text-xs text-red-700 font-mono break-all">
              {this.state.error?.message || String(this.state.error)}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md shadow-primary/30"
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
