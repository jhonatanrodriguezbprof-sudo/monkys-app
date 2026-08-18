import { useState, useEffect } from 'react'
import { supabase, SALON_ID } from '../lib/supabase'

const FALLBACK_STYLISTS = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'Laura', is_active: true, avatar_url: null },
  { id: 'c1000000-0000-0000-0000-000000000002', name: 'Sofia', is_active: true, avatar_url: null },
]

export default function useStylists(salonId) {
  const [stylists, setStylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const id = salonId || SALON_ID

  useEffect(() => {
    if (!id) {
      setStylists(FALLBACK_STYLISTS)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('stylists')
      .select('*')
      .eq('salon_id', id)
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        setStylists(data?.length ? data : FALLBACK_STYLISTS)
        setError(error)
        setLoading(false)
      })
  }, [id])

  return { stylists, loading, error }
}
