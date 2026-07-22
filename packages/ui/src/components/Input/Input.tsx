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
        <label htmlFor={inputId} className="text-netflix-light-gray text-sm">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-netflix-medium-gray placeholder-netflix-light-gray ring-netflix-medium-gray focus:ring-netflix-red w-full rounded px-4 py-3 text-white outline-none ring-1 transition ${error ? 'ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
