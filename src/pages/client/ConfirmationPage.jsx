import { useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import MonkysLogo from '../../components/MonkysLogo'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function ConfirmationPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const booking = state?.booking

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <MonkysLogo size="lg" />
        <p className="text-gray-500 font-medium text-center">No se encontró información de la reserva.</p>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    )
  }

  const dateFormatted = format(
    new Date(booking.date + 'T12:00:00'),
    "EEEE d 'de' MMMM yyyy",
    { locale: es }
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center px-6 py-12 gap-8">
      {/* Success animation */}
      <div className="flex flex-col items-center gap-4 text-center animate-slide-up">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
          <span className="text-5xl">✓</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-brown">¡Reservado!</h1>
          <p className="text-gray-500 font-medium mt-1">Te esperamos con los brazos abiertos 🐒</p>
        </div>
      </div>

      {/* Details card */}
      <Card className="w-full max-w-sm space-y-4 animate-slide-up">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl">
            💈
          </div>
          <div>
            <p className="font-black text-brown">{booking.service?.name}</p>
            <p className="text-primary font-bold text-sm">${booking.service?.price?.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          <DetailRow icon="✂️" label="Estilista" value={booking.stylist?.name} />
          <DetailRow icon="📅" label="Fecha" value={dateFormatted} />
          <DetailRow icon="🕐" label="Hora" value={booking.timeSlot} />
          <DetailRow icon="🧒" label="Niño/a" value={`${booking.childName}, ${booking.childAge} años`} />
          <DetailRow icon="👤" label="Contacto" value={`${booking.clientName} · ${booking.clientPhone}`} />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mt-2">
          <p className="text-xs text-yellow-700 font-semibold text-center">
            📱 Guarda esta información o toma un screenshot como comprobante
          </p>
        </div>
      </Card>

      <div className="w-full max-w-sm space-y-3">
        <Button size="full" onClick={() => navigate('/book')}>
          ➕ &nbsp;Nueva reserva
        </Button>
        <Button size="full" variant="outline" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-brown capitalize">{value}</p>
      </div>
    </div>
  )
}
