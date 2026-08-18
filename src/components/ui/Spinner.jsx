export default function Spinner({ size = 'md', color = 'primary', label = 'Cargando...' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const colors = { primary: 'border-primary', white: 'border-white', brown: 'border-brown' }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${sizes[size]} border-4 border-t-transparent rounded-full animate-spin ${colors[color]}`}
        role="status"
        aria-label={label}
      />
      {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
    </div>
  )
}
