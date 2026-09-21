import { useEffect, useState } from 'react'

function Navbar({ onCartClick, totalItems = 0 }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    setIsLoggedIn(!!token)
  }, [])

  return (
    <nav className="sticky top-0 z-50 border-b border-green-100 bg-[#FFFDF5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div>
          <h1 className="text-xl font-bold text-green-800 sm:text-2xl">
            Jaya's Kitchen
          </h1>

          <p className="text-xs text-gray-500">
            Home Tiffin & Catering
          </p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">

          {/* Home */}
          <a
            href="#home"
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            Home
          </a>

          {/* Menu */}
          <a
            href="#menu"
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            Menu
          </a>

          {/* About */}
          <a
            href="#about"
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            About
          </a>

          {/* Customer Login / Dashboard */}
          {isLoggedIn ? (
            <a
              href="/dashboard"
              className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/account"
              className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Login / Signup
            </a>
          )}

          {/* View Cart */}
          <button
            type="button"
            onClick={onCartClick}
            className="flex items-center gap-2 rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <span>🛒</span>

            <span>View Cart</span>

            {totalItems > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-green-700">
                {totalItems}
              </span>
            )}
          </button>

        </div>

        {/* Mobile Cart Button */}
        <button
          type="button"
          onClick={onCartClick}
          className="flex items-center gap-2 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 md:hidden"
        >
          <span>🛒</span>

          <span>Cart</span>

          {totalItems > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-green-700">
              {totalItems}
            </span>
          )}
        </button>

      </div>
    </nav>
  )
}

export default Navbar