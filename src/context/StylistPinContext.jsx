import { createContext, useContext, useState } from 'react'
import { supabase, SALON_ID } from '../lib/supabase'

const STORAGE_KEY = 'monkys_stylist_session'
const StylistPinContext = createContext(null)

export function StylistPinProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  async function loginWithPin(pin) {
    let query = supabase
      .from('stylists')
      .select('id, name')
      .eq('pin', pin.trim())
      .eq('is_active', true)

    if (SALON_ID) query = query.eq('salon_id', SALON_ID)

    const { data, error } = await query.maybeSingle()

    if (error || !data) return { success: false }

    const sess = { stylistId: data.id, stylistName: data.name }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
    setSession(sess)
    return { success: true }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }

  return (
    <StylistPinContext.Provider value={{ session, loginWithPin, logout }}>
      {children}
    </StylistPinContext.Provider>
  )
}

export function useStylistPin() {
  return useContext(StylistPinContext)
}
