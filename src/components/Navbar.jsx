import { useEffect, useState } from 'react'

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // ==========================================
  // SYNC LOGIN STATE
  // ==========================================

  const syncAuthState = () => {
    const token =
      localStorage.getItem('customerToken')

    setIsLoggedIn(!!token)
  }

  useEffect(() => {
    syncAuthState()

    // Same-tab login/logout
    window.addEventListener(
      'customerAuthChanged',
      syncAuthState
    )

    // Other-tab login/logout
    window.addEventListener(
      'storage',
      syncAuthState
    )

    return () => {
      window.removeEventListener(
        'customerAuthChanged',
        syncAuthState
      )

      window.removeEventListener(
        'storage',
        syncAuthState
      )
    }
  }, [])

  // ==========================================
  // MENU
  // ==========================================

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // ==========================================
  // SETTINGS
  // ==========================================

  const handleSettingsClick = () => {
    closeMenu()

    window.location.href =
      '/dashboard?settings=true'
  }

  // ==========================================
  // MY ORDERS
  // ==========================================

  const handleMyOrdersClick = () => {
    closeMenu()

    window.location.href =
      '/dashboard?orders=true'
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-green-100 bg-[#FFFDF5]/95 backdrop-blur">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        {/* ================================= */}
        {/* LOGO */}
        {/* ================================= */}

        <div>
          <h1 className="text-xl font-bold text-green-800 sm:text-2xl">
            Jaya's Kitchen
          </h1>

          <p className="text-xs text-gray-500">
            Home Tiffin & Catering
          </p>
        </div>

        {/* ================================= */}
        {/* DESKTOP NAVIGATION */}
        {/* ================================= */}

        <div className="hidden items-center gap-8 md:flex">

          {/* Home */}
          <a
            href="#home"
            onClick={closeMenu}
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            Home
          </a>

          {/* Menu */}
          <a
            href="#menu"
            onClick={closeMenu}
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            Menu
          </a>

          {/* About */}
          <a
            href="#about"
            onClick={closeMenu}
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            About
          </a>

          {/* Dashboard / Login */}
          {isLoggedIn ? (
            <a
              href="/dashboard"
              onClick={closeMenu}
              className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/account"
              onClick={closeMenu}
              className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Login / Signup
            </a>
          )}

          {/* ================================= */}
          {/* DESKTOP HAMBURGER */}
          {/* ================================= */}

          <button
            type="button"
            onClick={() =>
              setIsMenuOpen(
                (previous) => !previous
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 transition hover:bg-green-100"
            aria-label={
              isMenuOpen
                ? 'Close menu'
                : 'Open menu'
            }
            aria-expanded={isMenuOpen}
          >
            <div className="flex w-5 flex-col gap-1.5">

              <span
                className={`h-0.5 w-5 rounded-full bg-green-700 transition-all duration-200 ${
                  isMenuOpen
                    ? 'translate-y-2 rotate-45'
                    : ''
                }`}
              />

              <span
                className={`h-0.5 w-5 rounded-full bg-green-700 transition-all duration-200 ${
                  isMenuOpen
                    ? 'opacity-0'
                    : ''
                }`}
              />

              <span
                className={`h-0.5 w-5 rounded-full bg-green-700 transition-all duration-200 ${
                  isMenuOpen
                    ? '-translate-y-1 -rotate-45'
                    : ''
                }`}
              />

            </div>
          </button>

        </div>

        {/* ================================= */}
        {/* MOBILE HAMBURGER */}
        {/* ================================= */}

        <button
          type="button"
          onClick={() =>
            setIsMenuOpen(
              (previous) => !previous
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 transition hover:bg-green-100 md:hidden"
          aria-label={
            isMenuOpen
              ? 'Close menu'
              : 'Open menu'
          }
          aria-expanded={isMenuOpen}
        >
          <div className="flex w-5 flex-col gap-1.5">

            <span
              className={`h-0.5 w-5 rounded-full bg-green-700 transition-all duration-200 ${
                isMenuOpen
                  ? 'translate-y-2 rotate-45'
                  : ''
              }`}
            />

            <span
              className={`h-0.5 w-5 rounded-full bg-green-700 transition-all duration-200 ${
                isMenuOpen
                  ? 'opacity-0'
                  : ''
              }`}
            />

            <span
              className={`h-0.5 w-5 rounded-full bg-green-700 transition-all duration-200 ${
                isMenuOpen
                  ? '-translate-y-1 -rotate-45'
                  : ''
              }`}
            />

          </div>
        </button>

      </div>

      {/* ==========================================
          HAMBURGER MENU
      ========================================== */}

      {isMenuOpen && (
        <div className="absolute right-4 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-green-100 bg-[#FFFDF5] shadow-xl md:right-6 lg:right-8">

          <div className="p-3">

            {/* Home */}
            <a
              href="/#home"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <span className="text-lg">
                🏠
              </span>

              <span>
                Home
              </span>
            </a>

            {/* Menu */}
            <a
              href="/#menu"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <span className="text-lg">
                🍽️
              </span>

              <span>
                Menu
              </span>
            </a>

            {/* About */}
            <a
              href="/#about"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <span className="text-lg">
                ℹ️
              </span>

              <span>
                About
              </span>
            </a>

            {/* Dashboard / Login */}
            {isLoggedIn ? (
              <a
                href="/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                <span className="text-lg">
                  📊
                </span>

                <span>
                  Dashboard
                </span>
              </a>
            ) : (
              <a
                href="/account"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                <span className="text-lg">
                  🔐
                </span>

                <span>
                  Login / Signup
                </span>
              </a>
            )}

            {/* Divider */}
            <div className="my-2 border-t border-green-100" />

            {/* My Orders */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleMyOrdersClick}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-green-50 hover:text-green-700"
              >
                <span className="text-lg">
                  📦
                </span>

                <span>
                  My Orders
                </span>
              </button>
            )}

            {/* Settings */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleSettingsClick}
                className="flex w-full items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-left text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                <span className="text-lg">
                  ⚙️
                </span>

                <span>
                  Settings
                </span>
              </button>
            )}

          </div>

        </div>
      )}

    </nav>
  )
}

export default Navbar