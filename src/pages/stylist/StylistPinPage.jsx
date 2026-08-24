import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStylistPin } from '../../context/StylistPinContext'
import MonkysLogo from '../../components/MonkysLogo'

const KEYS = ['1','2','3','4','5','6','7','8','9','←','0','✓']

export default function StylistPinPage() {
  const navigate = useNavigate()
  const { session, loginWithPin } = useStylistPin()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) navigate('/estilista/dashboard', { replace: true })
  }, [session, navigate])

  async function handleKey(key) {
    if (loading) return
    setError('')

    if (key === '←') {
      setPin((p) => p.slice(0, -1))
      return
    }

    if (key === '✓') {
      if (pin.length < 4) { setError('Ingresa 4 dígitos'); return }
      await submit(pin)
      return
    }

    const next = pin + key
    setPin(next)
    if (next.length === 4) await submit(next)
  }

  async function submit(code) {
    setLoading(true)
    const { success } = await loginWithPin(code)
    setLoading(false)
    if (!success) {
      setError('PIN incorrecto. Intenta de nuevo.')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center px-6 py-10 gap-8">
      <div className="flex flex-col items-center gap-2">
        <MonkysLogo size="lg" />
        <h1 className="text-2xl font-black text-brown mt-2">Acceso Estilistas</h1>
        <p className="text-sm text-gray-400 font-medium">Ingresa tu PIN de 4 dígitos</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {[0,1,2,3].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all duration-150 ${
              i < pin.length ? 'bg-primary scale-110' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      <div className="h-5">
        {error && (
          <p className="text-sm text-red-500 font-semibold text-center animate-fade-in">
            {error}
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {KEYS.map((key) => {
          const isBackspace = key === '←'
          const isConfirm = key === '✓'
          return (
            <button
              key={key}
              onClick={() => handleKey(key)}
              disabled={loading}
              className={`
                h-16 rounded-2xl text-xl font-black transition-all duration-150
                active:scale-95 disabled:opacity-50
                ${isConfirm
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : isBackspace
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-white text-brown shadow-sm border border-gray-100 hover:bg-primary-50'
                }
              `}
            >
              {loading && isConfirm ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
