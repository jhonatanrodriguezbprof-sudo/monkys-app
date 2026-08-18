export default function MonkysLogo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg' },
    md: { container: 'w-14 h-14', text: 'text-2xl' },
    lg: { container: 'w-20 h-20', text: 'text-3xl' },
    xl: { container: 'w-28 h-28', text: 'text-4xl' },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${s.container} rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce-slow`}
      >
        <span className={size === 'sm' ? 'text-base' : size === 'md' ? 'text-2xl' : 'text-3xl'}>
          🐒
        </span>
      </div>
      {showText && (
        <div className="text-center leading-tight">
          <p className={`font-black text-brown ${s.text}`}>Monkys</p>
          {size !== 'sm' && (
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Kids Hair Salon
            </p>
          )}
        </div>
      )}
    </div>
  )
}
