import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase, SALON_ID } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const EMPTY_STATS = { todayCount: 0, todayCompleted: 0, weekCount: 0, weekRevenue: 0 }

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(EMPTY_STATS)
  const [todayAppts, setTodayAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    setFetchError(null)
    const salonId = SALON_ID || profile?.salon_id

    if (!salonId) {
      setLoading(false)
      return
    }

    try {
      const [todayRes, weekRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, services(name, price), stylists(name)')
          .eq('salon_id', salonId)
          .eq('date', today)
          .order('time_slot'),
        supabase
          .from('appointments')
          .select('*, services(price)')
          .eq('salon_id', salonId)
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .not('status', 'in', '("cancelled","no-show")'),
      ])

      if (todayRes.error) throw todayRes.error
      if (weekRes.error) throw weekRes.error

      const todayData = todayRes.data || []
      const weekData = weekRes.data || []
      const weekRevenue = weekData.reduce((sum, a) => sum + (a.services?.price || 0), 0)

      setTodayAppts(todayData)
      setStats({
        todayCount: todayData.length,
        todayCompleted: todayData.filter((a) => a.status === 'completed').length,
        weekCount: weekData.length,
        weekRevenue,
      })
    } catch (err) {
      setFetchError(err?.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Dashboard">
      <div className="px-4 py-5 space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-gray-400 text-sm font-medium">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <h2 className="text-2xl font-black text-brown">
            ¡Hola, {profile?.full_name?.split(' ')[0] || 'Nataly'}! 👋
          </h2>
        </div>

        {loading ? (
          <Spinner />
        ) : fetchError ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-4xl">⚠️</p>
            <p className="font-semibold text-gray-600">No se pudieron cargar los datos</p>
            <p className="text-xs text-gray-400">{fetchError}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm font-bold text-primary underline"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="📅" label="Citas hoy" value={stats.todayCount} color="primary" />
              <StatCard icon="✅" label="Completadas hoy" value={stats.todayCompleted} color="green" />
              <StatCard icon="🗓️" label="Citas esta semana" value={stats.weekCount} color="blue" />
              <StatCard icon="💰" label="Ingresos semana" value={`$${stats.weekRevenue.toLocaleString()}`} color="brown" />
            </div>

            {/* Today's appointments */}
            <div>
              <h3 className="text-base font-black text-brown mb-3">Citas de hoy</h3>
              {todayAppts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">😴</p>
                  <p className="font-medium text-sm">Sin citas hoy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAppts.map((a) => (
                    <Card key={a.id} className="flex items-center gap-3">
                      <span className="text-sm font-black text-primary w-12 text-center flex-shrink-0">{a.time_slot}</span>
                      <div className="w-px h-8 bg-gray-100" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brown text-sm truncate">{a.child_name}</p>
                        <p className="text-xs text-gray-400">{a.services?.name} · {a.stylists?.name}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    brown: 'bg-brown-50 text-brown',
  }
  return (
    <div className={`rounded-3xl p-4 ${colors[color]}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold opacity-70 mt-0.5">{label}</p>
    </div>
  )
}
