import { useState, useEffect } from 'react'
import { supabase, SALON_ID } from '../lib/supabase'

const FALLBACK_SERVICES = [
  { id: 'b1000000-0000-0000-0000-000000000001', name: 'Corte infantil',  duration_minutes: 30, price: 25000 },
  { id: 'b1000000-0000-0000-0000-000000000002', name: 'Lavado + Corte',  duration_minutes: 45, price: 35000 },
  { id: 'b1000000-0000-0000-0000-000000000003', name: 'Peinado especial', duration_minutes: 30, price: 30000 },
]

export default function useServices(salonId) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const id = salonId || SALON_ID

  useEffect(() => {
    if (!id) {
      setServices(FALLBACK_SERVICES)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('services')
      .select('*')
      .eq('salon_id', id)
      .eq('is_active', true)
      .order('price')
      .then(({ data, error }) => {
        setServices(data?.length ? data : FALLBACK_SERVICES)
        setError(error)
        setLoading(false)
      })
  }, [id])

  return { services, loading, error }
}
