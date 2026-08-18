const statusConfig = {
  pending:   { label: 'Pendiente',   classes: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado',  classes: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completado',  classes: 'bg-primary-100 text-primary-700' },
  cancelled: { label: 'Cancelado',   classes: 'bg-red-100 text-red-600' },
  'no-show': { label: 'No asistió',  classes: 'bg-gray-200 text-gray-600' },
}

export function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

export default function Badge({ children, color = 'green', className = '' }) {
  const colors = {
    green: 'bg-primary-100 text-primary-700',
    brown: 'bg-brown-100 text-brown-700',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
