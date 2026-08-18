export default function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-brown-800">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full border-2 rounded-2xl px-4 py-3 text-sm font-medium
            outline-none transition-all duration-200
            border-gray-200 focus:border-primary placeholder-gray-400 text-gray-800
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-400 focus:border-red-400' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
