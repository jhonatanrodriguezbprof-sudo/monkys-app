export default function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl shadow-sm border border-gray-100 p-4
        ${hover ? 'cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
