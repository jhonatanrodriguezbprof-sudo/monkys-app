import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  // Tracks the userId whose profile is already loaded — avoids re-fetching on TOKEN_REFRESHED
  const loadedUserId = useRef(null)

  useEffect(() => {
    mounted.current = true

    // onAuthStateChange covers INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT
    // No need for a separate getSession() call.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted.current) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        loadedUserId.current = null
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      // Always keep the user object current (token may have rotated)
      setUser(session.user)

      // Profile already loaded for this user — TOKEN_REFRESHED, skip re-fetch
      if (loadedUserId.current === session.user.id) {
        setLoading(false)
        return
      }

      fetchProfile(session.user.id)
    })

    return () => {
      mounted.current = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!mounted.current) return

      if (error) {
        setProfile(null)
        loadedUserId.current = null
      } else {
        setProfile(data)
        loadedUserId.current = userId
      }
    } catch {
      if (mounted.current) {
        setProfile(null)
        loadedUserId.current = null
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    loadedUserId.current = null
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = { user, profile, loading, signIn, signOut, fetchProfile }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
