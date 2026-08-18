import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './ui/Spinner'

export function RequireAuth({ allowedRoles, children }) {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Cargando..." />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // User is authenticated but profile row is missing in public.users
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white gap-5 text-center">
        <div className="text-5xl">🔐</div>
        <div>
          <h2 className="text-xl font-black text-gray-800">Perfil no encontrado</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            Tu cuenta existe pero no tiene un perfil configurado. Pídele al administrador que lo active.
          </p>
          <p className="text-xs text-gray-400 mt-2 font-mono">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm font-bold text-red-500 underline"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const redirects = { admin: '/admin', stylist: '/stylist', client: '/' }
    return <Navigate to={redirects[profile.role] || '/'} replace />
  }

  return children
}

export function RedirectIfAuth({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Cargando..." />
      </div>
    )
  }

  if (user && profile) {
    const redirects = { admin: '/admin', stylist: '/stylist' }
    if (redirects[profile.role]) return <Navigate to={redirects[profile.role]} replace />
  }

  return children
}
