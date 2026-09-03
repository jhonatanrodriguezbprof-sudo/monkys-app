import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase, SALON_ID } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show']
const STATUS_LABELS = { all: 'Todas', pending: 'Pendiente', confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado', 'no-show': 'No asistió' }

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

export default function AdminAppointments() {
  const { profile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [stylists, setStylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const [filters, setFilters] = useState({
    date: '',
    stylist: '',
    status: 'all',
  })

  const salonId = SALON_ID || profile?.salon_id

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select('*, services(name, price, duration_minutes), stylists(name)')
      .eq('salon_id', salonId)
      .order('date', { ascending: false })
      .order('time_slot', { ascending: true })

    if (filters.date) query = query.eq('date', filters.date)
    if (filters.stylist) query = query.eq('stylist_id', filters.stylist)
    if (filters.status !== 'all') query = query.eq('status', filters.status)

    const { data } = await query
    setAppointments(data || [])
    setLoading(false)
  }, [filters, salonId])

  useEffect(() => {
    fetchAppointments()
    supabase.from('stylists').select('id, name').eq('salon_id', salonId).then(({ data }) => setStylists(data || []))
  }, [fetchAppointments, salonId])

  async function updateStatus(id, status) {
    setUpdating(true)
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    setUpdating(false)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success('Estado actualizado')
    setSelected(null)
    fetchAppointments()
  }

  async function reschedule() {
    if (!newDate || !newTime) { toast.error('Selecciona fecha y hora'); return }
    setUpdating(true)
    const { error } = await supabase
      .from('appointments')
      .update({ date: newDate, time_slot: newTime, status: 'confirmed' })
      .eq('id', selected.id)
    setUpdating(false)
    if (error) { toast.error('Error al reprogramar'); return }
    toast.success('Cita reprogramada')
    setSelected(null)
    setRescheduling(false)
    fetchAppointments()
  }

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  return (
    <AppShell title="Todas las citas">
      {/* Filters */}
      <div className="bg-white px-4 py-3 space-y-2 border-b border-gray-100 sticky top-0 z-30">
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilter('date', e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-primary"
          />
          <select
            value={filters.stylist}
            onChange={(e) => setFilter('stylist', e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-primary bg-white"
          >
            <option value="">Todos</option>
            {stylists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filters.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? <Spinner /> : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="font-medium">Sin resultados</p>
          </div>
        ) : (
          appointments.map((a) => (
            <Card key={a.id} hover onClick={() => setSelected(a)} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brown">{a.child_name}
                    <span className="text-gray-400 font-normal text-sm"> · {a.child_age} años</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.services?.name} · {a.stylists?.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <span>📅 {format(new Date(a.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}</span>
                <span>🕐 {a.time_slot}</span>
                <span className="ml-auto font-bold text-primary">${a.services?.price?.toLocaleString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setRescheduling(false) }} title="Detalle de cita">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
              <InfoRow label="Niño/a" value={`${selected.child_name}, ${selected.child_age} años`} />
              <InfoRow label="Servicio" value={selected.services?.name} />
              <InfoRow label="Precio" value={`$${selected.services?.price?.toLocaleString()}`} />
              <InfoRow label="Estilista" value={selected.stylists?.name} />
              <InfoRow label="Fecha" value={format(new Date(selected.date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })} />
              <InfoRow label="Hora" value={selected.time_slot} />
              <InfoRow label="Cliente" value={`${selected.client_name} · ${selected.client_phone}`} />
            </div>

            {rescheduling ? (
              <div className="space-y-3">
                <Input label="Nueva fecha" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                <div>
                  <p className="text-sm font-semibold text-brown-800 mb-1.5">Nueva hora</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewTime(t)}
                        className={`py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${newTime === t ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-700'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRescheduling(false)}>Cancelar</Button>
                  <Button className="flex-1" loading={updating} onClick={reschedule}>Guardar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selected.status === 'pending' && (
                  <>
                    <Button size="full" onClick={() => updateStatus(selected.id, 'confirmed')} loading={updating}>
                      ✅ Confirmar cita
                    </Button>
                    <Button size="full" variant="secondary" onClick={() => setRescheduling(true)}>
                      📅 Reprogramar
                    </Button>
                    <Button size="full" variant="danger" onClick={() => updateStatus(selected.id, 'cancelled')} loading={updating}>
                      🚫 Cancelar cita
                    </Button>
                  </>
                )}
                {selected.status === 'confirmed' && (
                  <>
                    <Button size="full" onClick={() => updateStatus(selected.id, 'completed')} loading={updating}>
                      🏁 Marcar completada
                    </Button>
                    <Button size="full" variant="secondary" onClick={() => setRescheduling(true)}>
                      📅 Reprogramar
                    </Button>
                    <Button size="full" onClick={() => updateStatus(selected.id, 'no-show')} loading={updating} variant="secondary">
                      👻 No asistió
                    </Button>
                    <Button size="full" variant="danger" onClick={() => updateStatus(selected.id, 'cancelled')} loading={updating}>
                      🚫 Cancelar cita
                    </Button>
                  </>
                )}
                {(selected.status === 'completed' || selected.status === 'cancelled' || selected.status === 'no-show') && (
                  <p className="text-center text-sm text-gray-400 py-2 font-medium">
                    Esta cita ya está cerrada.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
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
