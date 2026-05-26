import React from 'react'

export const Header = ({ className = "" }) => {
  return (
    <header className={`container flex flex-col items-center justify-center ${className}`}>
        <div className="text-3xl font-bold mb-2">Logo here</div>
        <span>Tagline here</span>
    </header>
  )
}
