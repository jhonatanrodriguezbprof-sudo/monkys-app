import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const stylistLinks = [
  { to: '/stylist', label: 'Hoy', icon: '📅' },
  { to: '/stylist/week', label: 'Semana', icon: '🗓️' },
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/appointments', label: 'Citas', icon: '📋' },
  { to: '/admin/stylists', label: 'Estilistas', icon: '✂️' },
  { to: '/admin/services', label: 'Servicios', icon: '💈' },
]

export default function BottomNav() {
  const { profile } = useAuth()
  const links = profile?.role === 'admin' ? adminLinks : stylistLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
      <div className="flex">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/stylist'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-[10px] font-bold">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
