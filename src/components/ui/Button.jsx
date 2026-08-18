const variants = {
  primary: 'bg-primary text-white hover:bg-primary-500 active:bg-primary-600 shadow-md shadow-primary/30',
  secondary: 'bg-brown text-white hover:bg-brown-800 active:bg-brown-900 shadow-md shadow-brown/30',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-primary hover:bg-primary-50',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-base rounded-2xl',
  lg: 'px-7 py-3.5 text-lg rounded-2xl',
  full: 'w-full px-5 py-3.5 text-base rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-bold
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="text-lg">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
