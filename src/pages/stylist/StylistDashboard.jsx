import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'

const tabs = ['Hoy', 'Esta semana']

export default function StylistDashboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState(0)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  useEffect(() => { fetchAppointments() }, [tab, profile])

  async function fetchAppointments() {
    if (!profile) return
    setLoading(true)

    // Get stylist record for this user
    const { data: stylistData } = await supabase
      .from('stylists')
      .select('id')
      .eq('user_id', profile.id)
      .single()

    if (!stylistData) { setLoading(false); return }

    let query = supabase
      .from('appointments')
      .select('*, services(name, price, duration_minutes)')
      .eq('stylist_id', stylistData.id)
      .order('time_slot', { ascending: true })

    if (tab === 0) query = query.eq('date', today)
    else query = query.gte('date', weekStart).lte('date', weekEnd)

    const { data } = await query
    setAppointments(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    setUpdating(true)
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    setUpdating(false)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(status === 'completed' ? '✅ Marcado como completado' : '📭 Marcado como no asistió')
    setSelected(null)
    fetchAppointments()
  }

  const pending = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed')
  const done = appointments.filter((a) => a.status === 'completed' || a.status === 'no-show' || a.status === 'cancelled')

  return (
    <AppShell title="Mi agenda">
      {/* Tabs */}
      <div className="bg-white px-4 pt-3 pb-1 flex gap-2 sticky top-16 z-30 border-b border-gray-100">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === i ? 'bg-primary text-white' : 'text-gray-400 hover:text-brown'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {tab === 0 ? 'Hoy' : 'Esta semana'}
            </p>
            <h2 className="text-lg font-black text-brown">
              {tab === 0
                ? format(new Date(), "EEEE d 'de' MMMM", { locale: es })
                : `${format(new Date(weekStart + 'T12:00:00'), "d MMM", { locale: es })} - ${format(new Date(weekEnd + 'T12:00:00'), "d MMM", { locale: es })}`
              }
            </h2>
          </div>
          <div className="bg-primary-100 rounded-2xl px-4 py-2 text-center">
            <p className="text-2xl font-black text-primary">{appointments.length}</p>
            <p className="text-[10px] text-primary-600 font-bold">citas</p>
          </div>
        </div>

        {loading ? <Spinner /> : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">😴</p>
            <p className="font-semibold">Sin citas {tab === 0 ? 'hoy' : 'esta semana'}</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <Section title="Pendientes" count={pending.length}>
                {pending.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onPress={() => setSelected(a)} showDate={tab === 1} />
                ))}
              </Section>
            )}
            {done.length > 0 && (
              <Section title="Finalizadas" count={done.length}>
                {done.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} showDate={tab === 1} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de cita">
        {selected && (
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-2xl p-4 space-y-2">
              <InfoRow label="Niño/a" value={`${selected.child_name}, ${selected.child_age} años`} />
              <InfoRow label="Servicio" value={selected.services?.name} />
              <InfoRow label="Hora" value={selected.time_slot} />
              <InfoRow label="Contacto" value={`${selected.client_name} · ${selected.client_phone}`} />
            </div>
            {(selected.status === 'pending' || selected.status === 'confirmed') && (
              <div className="flex gap-3">
                <Button
                  size="md"
                  className="flex-1"
                  loading={updating}
                  onClick={() => updateStatus(selected.id, 'completed')}
                >
                  ✅ Completado
                </Button>
                <Button
                  size="md"
                  variant="danger"
                  className="flex-1"
                  loading={updating}
                  onClick={() => updateStatus(selected.id, 'no-show')}
                >
                  📭 No asistió
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}

function Section({ title, count, children }) {
  return (
    <div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
        {title} ({count})
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function AppointmentCard({ appointment: a, onPress, showDate }) {
  return (
    <Card hover={!!onPress} onClick={onPress} className="flex items-center gap-4">
      <div className="w-12 text-center flex-shrink-0">
        <p className="text-sm font-black text-primary">{a.time_slot}</p>
        {showDate && (
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
            {format(new Date(a.date + 'T12:00:00'), 'd MMM', { locale: es })}
          </p>
        )}
      </div>
      <div className="w-px h-10 bg-gray-100 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-brown truncate">{a.child_name}</p>
        <p className="text-xs text-gray-400 font-medium">{a.services?.name} · {a.client_name}</p>
      </div>
      <StatusBadge status={a.status} />
    </Card>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-brown">{value}</span>
    </div>
  )
}
