import { useState, useEffect, useCallback } from 'react'
import { supabase, SALON_ID } from '../lib/supabase'

export default function useAppointments({ salonId, date, stylistId, status } = {}) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const id = salonId || SALON_ID

  const fetch = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select('*, services(name, price, duration_minutes), stylists(name)')
      .eq('salon_id', id)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true })

    if (date) query = query.eq('date', date)
    if (stylistId) query = query.eq('stylist_id', stylistId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    setAppointments(data || [])
    setError(error)
    setLoading(false)
  }, [id, date, stylistId, status])

  useEffect(() => { fetch() }, [fetch])

  return { appointments, loading, error, refetch: fetch }
}
