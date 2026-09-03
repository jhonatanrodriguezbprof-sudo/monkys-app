import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, SALON_ID } from '../../lib/supabase'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import MonkysLogo from '../../components/MonkysLogo'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import useServices from '../../hooks/useServices'
import useStylists from '../../hooks/useStylists'

const STEPS = ['Servicio', 'Estilista', 'Fecha y hora', 'Tus datos', 'Confirmar']
const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

export default function BookingPage() {
  const navigate = useNavigate()
  const { services, loading: loadingServices } = useServices()
  const { stylists, loading: loadingStylists } = useStylists()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [takenSlots, setTakenSlots] = useState([])

  const [booking, setBooking] = useState({
    service: null,
    stylist: null,
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    timeSlot: null,
    clientName: '',
    clientPhone: '',
    childName: '',
    childAge: '',
  })

  const set = (key, val) => setBooking((b) => ({ ...b, [key]: val }))

  // Filter stylists by the selected service's categoria.
  // Stylists without a categoria are always included (requirement 4).
  const svcCat = booking.service?.categoria
  const visibleStylists = (!svcCat || svcCat === 'ambos')
    ? stylists
    : stylists.filter((st) => !st.categoria || st.categoria === svcCat)

  async function fetchTakenSlots(stylistId, date) {
    const { data } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('stylist_id', stylistId)
      .eq('date', date)
      .not('status', 'in', '("cancelled","no-show")')
    setTakenSlots((data || []).map((d) => d.time_slot))
  }

  function next() {
    if (step === 1 && booking.stylist && booking.date) {
      fetchTakenSlots(booking.stylist.id, booking.date)
    }
    setStep((s) => s + 1)
  }
  function back() { setStep((s) => s - 1) }

  const canNext = [
    !!booking.service,
    !!booking.stylist,
    !!booking.timeSlot,
    booking.clientName && booking.clientPhone && booking.childName && booking.childAge,
  ]

  async function submit() {
    if (!SALON_ID) {
      toast.error('Error de configuración: sin salón asignado.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('appointments').insert({
        salon_id: SALON_ID,
        client_name: booking.clientName.trim(),
        client_phone: booking.clientPhone.trim(),
        child_name: booking.childName.trim(),
        child_age: parseInt(booking.childAge, 10),
        stylist_id: booking.stylist.id,
        service_id: booking.service.id,
        date: booking.date,
        time_slot: booking.timeSlot,
        status: 'pending',
      })
      if (error) throw error
      navigate('/confirmation', { state: { booking } })
    } catch (err) {
      const msg = err?.message || err?.details || 'Error al reservar'
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('Ese horario ya fue reservado. Elige otra hora.')
      } else {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => step === 0 ? navigate('/') : back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-lg">
          ←
        </button>
        <MonkysLogo size="sm" />
        <h1 className="font-bold text-brown text-base">Reservar cita</h1>
      </header>

      {/* Progress */}
      <div className="bg-white px-4 pb-3">
        <div className="flex items-center gap-1 mt-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5 font-medium">
          Paso {step + 1} de {STEPS.length}: <span className="text-brown font-bold">{STEPS[step]}</span>
        </p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 animate-fade-in">
        {/* STEP 0: Service */}
        {step === 0 && (
          <>
            <h2 className="text-xl font-black text-brown">¿Qué servicio necesitas?</h2>
            {loadingServices ? <Spinner /> : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <Card
                    key={svc.id}
                    hover
                    onClick={() => setBooking((b) => ({ ...b, service: svc, stylist: null }))}
                    className={`flex items-center justify-between ${booking.service?.id === svc.id ? 'border-primary border-2 bg-primary-50' : ''}`}
                  >
                    <div>
                      <p className="font-bold text-brown">{svc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">⏱ {svc.duration_minutes} min</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary text-lg">${svc.price.toLocaleString()}</p>
                      {booking.service?.id === svc.id && <span className="text-primary text-lg">✓</span>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 1: Stylist */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-black text-brown">¿Con quién?</h2>
            {loadingStylists ? <Spinner /> : visibleStylists.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">✂️</p>
                <p className="font-medium text-sm">No hay estilistas disponibles para este servicio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleStylists.map((st) => (
                  <Card
                    key={st.id}
                    hover
                    onClick={() => set('stylist', st)}
                    className={`flex items-center gap-4 ${booking.stylist?.id === st.id ? 'border-primary border-2 bg-primary-50' : ''}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {st.avatar_url ? <img src={st.avatar_url} alt={st.name} className="w-full h-full rounded-full object-cover" /> : '✂️'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-brown">{st.name}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">Disponible</p>
                    </div>
                    {booking.stylist?.id === st.id && <span className="text-primary text-xl">✓</span>}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 2: Date & time */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-black text-brown">¿Cuándo?</h2>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-brown-800">Selecciona el día</p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = addDays(new Date(), i + 1)
                  const val = format(d, 'yyyy-MM-dd')
                  const isSelected = booking.date === val
                  return (
                    <button
                      key={val}
                      onClick={() => { set('date', val); set('timeSlot', null); fetchTakenSlots(booking.stylist.id, val) }}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-2xl border-2 transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      <span className="text-[10px] font-bold uppercase">{format(d, 'EEE', { locale: es })}</span>
                      <span className="text-lg font-black">{format(d, 'd')}</span>
                      <span className="text-[10px] font-medium">{format(d, 'MMM', { locale: es })}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-sm font-semibold text-brown-800">Selecciona la hora</p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((t) => {
                  const taken = takenSlots.includes(t)
                  const selected = booking.timeSlot === t
                  return (
                    <button
                      key={t}
                      disabled={taken}
                      onClick={() => set('timeSlot', t)}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all
                        ${taken ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : ''}
                        ${selected ? 'bg-primary border-primary text-white' : ''}
                        ${!taken && !selected ? 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary' : ''}
                      `}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Client info */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-black text-brown">Tus datos</h2>
            <div className="space-y-4">
              <Input label="Tu nombre" placeholder="Ej. María García" value={booking.clientName} onChange={(e) => set('clientName', e.target.value)} icon="👤" />
              <Input label="Teléfono de contacto" placeholder="Ej. 3001234567" type="tel" value={booking.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} icon="📱" />
              <Input label="Nombre del niño/a" placeholder="Ej. Sofía" value={booking.childName} onChange={(e) => set('childName', e.target.value)} icon="🧒" />
              <Input label="Edad del niño/a" placeholder="Ej. 5" type="number" min="0" max="18" value={booking.childAge} onChange={(e) => set('childAge', e.target.value)} icon="🎂" />
            </div>
          </>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <>
            <h2 className="text-xl font-black text-brown">Confirmar reserva</h2>
            <Card className="space-y-3">
              <Row label="Servicio" value={booking.service?.name} />
              <Row label="Precio" value={`$${booking.service?.price?.toLocaleString()}`} />
              <Row label="Estilista" value={booking.stylist?.name} />
              <Row label="Fecha" value={format(new Date(booking.date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })} />
              <Row label="Hora" value={booking.timeSlot} />
              <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
                <Row label="Cliente" value={booking.clientName} />
                <Row label="Teléfono" value={booking.clientPhone} />
                <Row label="Niño/a" value={`${booking.childName}, ${booking.childAge} años`} />
              </div>
            </Card>
            <p className="text-xs text-gray-400 text-center">
              Al confirmar aceptas nuestros términos de servicio.
            </p>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-white border-t border-gray-100">
        {step < 4 ? (
          <Button
            size="full"
            disabled={!canNext[step]}
            onClick={next}
          >
            Continuar →
          </Button>
        ) : (
          <Button size="full" loading={submitting} onClick={submit}>
            🗓️ &nbsp;Confirmar reserva
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-brown capitalize">{value}</span>
    </div>
  )
}
