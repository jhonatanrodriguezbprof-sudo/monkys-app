import { useNavigate } from 'react-router-dom'
import MonkysLogo from '../../components/MonkysLogo'
import Button from '../../components/ui/Button'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-8">
        <MonkysLogo size="xl" />

        <div className="space-y-3">
          <h1 className="text-4xl font-black text-brown leading-tight">
            ¡El mejor corte<br />
            <span className="text-primary">para tu peque!</span>
          </h1>
          <p className="text-gray-500 text-base font-medium max-w-xs mx-auto">
            Reserva fácil, rápido y sin filas. Tu hijo merece la mejor experiencia.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['✂️ Cortes divertidos', '💧 Lavado incluido', '🌈 Estilistas expertos'].map((f) => (
            <span key={f} className="bg-white border border-primary/30 text-primary-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              {f}
            </span>
          ))}
        </div>

        <Button size="full" className="max-w-xs text-lg" onClick={() => navigate('/book')}>
          🗓️ &nbsp;Reservar cita
        </Button>

        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-primary">500+</p>
            <p className="text-xs text-gray-400 font-medium">Clientes felices</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-2xl font-black text-brown">5★</p>
            <p className="text-xs text-gray-400 font-medium">Calificación</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-2xl font-black text-primary">3+</p>
            <p className="text-xs text-gray-400 font-medium">Estilistas</p>
          </div>
        </div>
      </div>

      {/* Footer login links */}
      <div className="px-6 py-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <button
            onClick={() => navigate('/login')}
            className="font-semibold text-brown hover:text-primary transition-colors"
          >
            Acceso estilistas / admin
          </button>
        </div>
      </div>
    </div>
  )
}
