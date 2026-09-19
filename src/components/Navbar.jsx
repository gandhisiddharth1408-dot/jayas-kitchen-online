function Navbar() {
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
          <a
            href="#home"
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            Home
          </a>

          <a
            href="#menu"
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            Menu
          </a>

          <a
            href="#about"
            className="text-sm font-medium text-gray-700 transition hover:text-green-700"
          >
            About
          </a>

          <button className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800">
            View Cart
          </button>
        </div>

        {/* Mobile Cart */}
        <button className="rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white md:hidden">
          Cart
        </button>
      </div>
    </nav>
  )
}

export default Navbar