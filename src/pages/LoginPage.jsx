import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import MonkysLogo from '../components/MonkysLogo'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      // Show the real Supabase error so we can diagnose
      console.error('[Login error]', error)
      setError(error.message)
      toast.error(error.message)
      return
    }
    // Redirect is handled by RedirectIfAuth in AuthGuard once profile loads
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center px-6 py-12 gap-10">
      <MonkysLogo size="lg" />

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-black text-brown">Bienvenida</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Ingresa con tu cuenta del salón</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="✉️"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon="🔒"
            required
          />
          {error && (
            <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <Button size="full" loading={loading} type="submit">
            Ingresar
          </Button>
        </form>
      </div>

      <button
        onClick={() => navigate('/')}
        className="text-sm text-gray-400 hover:text-primary font-medium transition-colors"
      >
        ← Volver al inicio
      </button>
    </div>
  )
}
