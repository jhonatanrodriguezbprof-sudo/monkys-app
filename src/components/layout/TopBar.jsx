import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MonkysLogo from '../MonkysLogo'

export default function TopBar({ title, showBack = false, actions }) {
  const navigate = useNavigate()
  const { signOut, profile } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
          ) : (
            <MonkysLogo size="sm" />
          )}
          {title && <h1 className="text-lg font-bold text-brown">{title}</h1>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {profile && (
            <button
              onClick={signOut}
              className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
            >
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
