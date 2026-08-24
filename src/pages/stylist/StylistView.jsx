import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useStylistPin } from '../../context/StylistPinContext'
import { StatusBadge } from '../../components/ui/Badge'
import MonkysLogo from '../../components/MonkysLogo'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
]

export default function StylistView() {
  const navigate = useNavigate()
  const { session, logout } = useStylistPin()
  const [tab, setTab] = useState('today')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!session) navigate('/estilista', { replace: true })
  }, [session, navigate])

  const fetchAppointments = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const end   = tab === 'today' ? today : format(addDays(new Date(), 6), 'yyyy-MM-dd')

    const { data, error } = await supabase.rpc('stylist_appointments', {
      p_stylist_id: session.stylistId,
      p_date_start: today,
      p_date_end:   end,
    })

    if (error) {
      toast.error('No se pudieron cargar las citas')
      setAppointments([])
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }, [session, tab])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function updateStatus(apptId, status) {
    setUpdating(apptId + status)
    const { data, error } = await supabase.rpc('stylist_update_status', {
      p_appointment_id: apptId,
      p_stylist_id:     session.stylistId,
      p_status:         status,
    })
    setUpdating(null)

    if (error || data === false) {
      toast.error('No se pudo actualizar la cita')
      return
    }
    toast.success(status === 'completed' ? '✅ Marcada como completada' : '👻 Registrado como no asistió')
    fetchAppointments()
  }

  function handleLogout() {
    logout()
    navigate('/estilista', { replace: true })
  }

  // Group by date for "Esta semana" tab
  const grouped = groupByDate(appointments)
  const today = format(new Date(), 'yyyy-MM-dd')

  if (!session) return null

  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <MonkysLogo size="sm" />
            <div>
              <p className="text-xs text-gray-400 font-medium leading-none">Estilista</p>
              <p className="font-black text-brown text-base leading-tight">{session.stylistName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-black transition-colors ${
                tab === t.key
                  ? 'text-primary border-b-2 border-primary bg-primary-50'
                  : 'text-gray-400 hover:text-brown'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">😴</p>
            <p className="font-bold text-gray-500">Sin citas para {tab === 'today' ? 'hoy' : 'esta semana'}</p>
            <p className="text-sm mt-1">¡Disfruta el descanso!</p>
          </div>
        ) : tab === 'today' ? (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                updating={updating}
                onUpdate={updateStatus}
                showDate={false}
              />
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([date, appts]) => (
            <div key={date} className="mb-5">
              <p className="text-xs font-black text-brown uppercase tracking-wider mb-2 px-1">
                {date === today
                  ? 'Hoy'
                  : format(new Date(date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <div className="space-y-3">
                {appts.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    updating={updating}
                    onUpdate={updateStatus}
                    showDate={false}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}

function AppointmentCard({ appt, updating, onUpdate }) {
  const canAct = appt.status === 'pending' || appt.status === 'confirmed'
  const isBusy = (id) => updating === appt.id + id

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Time strip */}
      <div className="bg-primary px-4 py-2 flex items-center justify-between">
        <span className="text-white font-black text-lg">{appt.time_slot}</span>
        <StatusBadge status={appt.status} />
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-black text-brown text-base">{appt.child_name}
              <span className="font-normal text-gray-400 text-sm"> · {appt.child_age} años</span>
            </p>
            <p className="text-sm text-gray-500 font-semibold mt-0.5">{appt.service_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
          <span>👤 {appt.client_name}</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-primary">
          <a href={`tel:${appt.client_phone}`} className="flex items-center gap-1.5 hover:underline">
            📱 {appt.client_phone}
          </a>
        </div>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate(appt.id, 'completed')}
            disabled={!!updating}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isBusy('completed')
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '✅'}
            Completada
          </button>
          <button
            onClick={() => onUpdate(appt.id, 'no-show')}
            disabled={!!updating}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isBusy('no-show')
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : '👻'}
            No vino
          </button>
        </div>
      )}
    </div>
  )
}

function groupByDate(appointments) {
  return appointments.reduce((acc, appt) => {
    const d = appt.date
    if (!acc[d]) acc[d] = []
    acc[d].push(appt)
    return acc
  }, {})
}
