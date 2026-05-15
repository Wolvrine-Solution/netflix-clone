import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm text-netflix-light-gray">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded bg-netflix-medium-gray px-4 py-3 text-white placeholder-netflix-light-gray outline-none ring-1 ring-netflix-medium-gray transition focus:ring-netflix-red ${error ? 'ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
