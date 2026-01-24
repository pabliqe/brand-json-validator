export function Button({ children, onClick, className = '', variant = 'primary', disabled = false, ...props }) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
    ghost: 'text-slate-300 hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800 rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Alert({ type = 'info', title, message, children }) {
  const styles = {
    error: 'bg-red-950 border-red-700 text-red-100',
    warning: 'bg-yellow-950 border-yellow-700 text-yellow-100',
    info: 'bg-blue-950 border-blue-700 text-blue-100',
    success: 'bg-green-950 border-green-700 text-green-100',
  };

  return (
    <div className={`border rounded-lg p-4 ${styles[type]}`}>
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      {message && <p className="text-sm mb-2">{message}</p>}
      {children}
    </div>
  );
}

export function Badge({ children, type = 'default' }) {
  const styles = {
    error: 'bg-red-900 text-red-200',
    warning: 'bg-yellow-900 text-yellow-200',
    info: 'bg-blue-900 text-blue-200',
    success: 'bg-green-900 text-green-200',
    default: 'bg-slate-700 text-slate-200',
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${styles[type]}`}>
      {children}
    </span>
  );
}
