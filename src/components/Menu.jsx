import { useEffect, useState } from 'react'

import fullGujaratiThali from '../assets/menu/full-gujarati-thali.jpg'
import halfGujaratiThali from '../assets/menu/half-gujarati-thali.jpg'
import gujaratiDal from '../assets/menu/gujarati-dal.jpg'
import rotli from '../assets/menu/rotli.jpg'
import onlyRice from '../assets/menu/only-rice.jpg'
import paneerThali from '../assets/menu/paneer-thali.jpg'

const menuImages = {
  'full-gujarati-thali.jpg': fullGujaratiThali,
  'half-gujarati-thali.jpg': halfGujaratiThali,
  'gujarati-dal.jpg': gujaratiDal,
  'rotli.jpg': rotli,
  'only-rice.jpg': onlyRice,
  'paneer-thali.jpg': paneerThali,
}

const API_URL = import.meta.env.VITE_API_URL

const MENU_CACHE_KEY = 'jayasKitchenMenu'
const MENU_CACHE_TIME_KEY = 'jayasKitchenMenuTime'

// Cache menu for 30 minutes
const MENU_CACHE_DURATION = 30 * 60 * 1000

function Menu({
  cart = [],
  onAddToCart,
  onUpdateQuantity,
}) {
  const [menuItems, setMenuItems] = useState(() => {
    try {
      const cachedMenu =
        localStorage.getItem(
          MENU_CACHE_KEY
        )

      if (cachedMenu) {
        return JSON.parse(cachedMenu)
      }
    } catch (error) {
      console.error(
        'Menu cache read error:',
        error
      )
    }

    return []
  })

  const [loading, setLoading] = useState(
    () => {
      try {
        return !localStorage.getItem(
          MENU_CACHE_KEY
        )
      } catch {
        return true
      }
    }
  )

  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const getCachedMenu = () => {
      try {
        const cachedMenu =
          localStorage.getItem(
            MENU_CACHE_KEY
          )

        const cachedTime =
          localStorage.getItem(
            MENU_CACHE_TIME_KEY
          )

        if (!cachedMenu) {
          return null
        }

        const parsedMenu =
          JSON.parse(cachedMenu)

        const cacheAge =
          Date.now() -
          Number(cachedTime || 0)

        return {
          menu: parsedMenu,
          isFresh:
            cacheAge <
            MENU_CACHE_DURATION,
        }
      } catch (error) {
        console.error(
          'Menu cache error:',
          error
        )

        return null
      }
    }

    const saveMenuToCache = (items) => {
      try {
        localStorage.setItem(
          MENU_CACHE_KEY,
          JSON.stringify(items)
        )

        localStorage.setItem(
          MENU_CACHE_TIME_KEY,
          Date.now().toString()
        )
      } catch (error) {
        console.error(
          'Menu cache save error:',
          error
        )
      }
    }

    const fetchMenu = async (
      attempt = 1
    ) => {
      try {
        if (!API_URL) {
          throw new Error(
            'API URL is not configured'
          )
        }

        const response = await fetch(
          `${API_URL}/api/orders/menu`,
          {
            method: 'GET',
            headers: {
              Accept:
                'application/json',
            },

            // Don't let a stale browser
            // connection block the request.
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          throw new Error(
            `Menu API returned ${response.status}`
          )
        }

        const data =
          await response.json()

        if (!data.success) {
          throw new Error(
            data.message ||
              'Failed to fetch menu'
          )
        }

        const items =
          data.menuItems || []

        if (!isMounted) {
          return
        }

        setMenuItems(items)

        setError('')

        setLoading(false)

        saveMenuToCache(items)
      } catch (err) {
        console.error(
          `Menu fetch attempt ${attempt} failed:`,
          err
        )

        if (!isMounted) {
          return
        }

        // Retry automatically.
        // This helps when Render is waking
        // up on the first request.
        if (attempt < 3) {
          const retryDelay =
            attempt === 1
              ? 1500
              : 3000

          setTimeout(() => {
            fetchMenu(attempt + 1)
          }, retryDelay)

          return
        }

        // If cached data exists, keep showing it.
        const cached =
          getCachedMenu()

        if (
          cached?.menu &&
          cached.menu.length > 0
        ) {
          setMenuItems(
            cached.menu
          )

          setError('')

          setLoading(false)

          return
        }

        setError(
          'Unable to load menu right now. Please try again.'
        )

        setLoading(false)
      }
    }

    const cached =
      getCachedMenu()

    // If we have cached menu,
    // show it immediately.
    if (
      cached?.menu &&
      cached.menu.length > 0
    ) {
      setMenuItems(cached.menu)

      setLoading(false)

      // Fresh cache:
      // still refresh silently in background.
      if (cached.isFresh) {
        fetchMenu()
      } else {
        // Old cache:
        // refresh immediately.
        fetchMenu()
      }
    } else {
      // No cache:
      // fetch from backend.
      fetchMenu()
    }

    return () => {
      isMounted = false
    }
  }, [])

  const getItemQuantity = (itemId) => {
    const cartItem = cart.find(
      (item) => item.id === itemId
    )

    return cartItem?.quantity || 0
  }

  const handleIncrease = (item) => {
    const quantity =
      getItemQuantity(item.id)

    if (quantity === 0) {
      onAddToCart(item)
    } else {
      onUpdateQuantity(
        item.id,
        quantity + 1
      )
    }
  }

  const handleDecrease = (item) => {
    const quantity =
      getItemQuantity(item.id)

    if (quantity > 0) {
      onUpdateQuantity(
        item.id,
        quantity - 1
      )
    }
  }

  const formatPrice = (price) => {
    return Number(price).toFixed(0)
  }

  const getImage = (image) => {
    if (!image) {
      return null
    }

    return (
      menuImages[image] || null
    )
  }

  const groupedItems =
    menuItems.reduce(
      (groups, item) => {
        const category =
          item.category || 'Other'

        if (!groups[category]) {
          groups[category] = []
        }

        groups[category].push(item)

        return groups
      },
      {}
    )

  const categoryOrder = [
    'Thali',
    'Dal',
    'Breads',
    'Rice',
    'Other',
  ]

  const categories =
    Object.keys(groupedItems).sort(
      (a, b) => {
        const aIndex =
          categoryOrder.indexOf(a)

        const bIndex =
          categoryOrder.indexOf(b)

        if (
          aIndex === -1 &&
          bIndex === -1
        ) {
          return a.localeCompare(b)
        }

        if (aIndex === -1) {
          return 1
        }

        if (bIndex === -1) {
          return -1
        }

        return aIndex - bIndex
      }
    )

  // ==========================================
  // INITIAL LOADING
  // ==========================================

  if (
    loading &&
    menuItems.length === 0
  ) {
    return (
      <section
        id="menu"
        className="bg-[#FFFDF5] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="font-semibold text-green-700">
              Our Menu
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Fresh & Homemade
            </h2>
          </div>

          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

            <p className="text-gray-500">
              Loading our fresh menu...
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ==========================================
  // ERROR WITHOUT MENU
  // ==========================================

  if (
    error &&
    menuItems.length === 0
  ) {
    return (
      <section
        id="menu"
        className="bg-[#FFFDF5] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="menu"
      className="bg-[#FFFDF5] px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section Header */}
        <div className="mb-12 text-center">
          <p className="font-semibold text-green-700">
            Our Menu
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Fresh & Homemade
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Delicious homemade food prepared fresh
            with care.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-16">

          {categories.map(
            (category) => (
              <div key={category}>

                {/* Category Heading */}
                <div className="mb-6 flex items-center gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {category}
                  </h3>

                  <div className="h-px flex-1 bg-green-100" />
                </div>

                {/* Menu Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                  {groupedItems[
                    category
                  ].map((item) => {
                    const quantity =
                      getItemQuantity(
                        item.id
                      )

                    const image =
                      getImage(
                        item.image
                      )

                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >

                        {/* Image */}
                        <div className="relative h-56 w-full overflow-hidden bg-green-50">
                          {image ? (
                            <img
                              src={image}
                              alt={
                                item.name
                              }
                              className="h-full w-full object-cover transition duration-500 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-6xl">
                              🍱
                            </div>
                          )}

                          {/* Popular Badge */}
                          {item.is_popular && (
                            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700 shadow">
                              Popular
                            </span>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-5">

                          <div className="flex items-start justify-between gap-4">
                            <h4 className="text-lg font-bold text-gray-900">
                              {item.name}
                            </h4>

                            <span className="shrink-0 text-lg font-bold text-green-700">
                              ₹
                              {formatPrice(
                                item.price
                              )}
                            </span>
                          </div>

                          {item.description && (
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {
                                item.description
                              }
                            </p>
                          )}

                          {/* Quantity / Add Button */}
                          <div className="mt-5">

                            {quantity ===
                            0 ? (
                              <button
                                onClick={() =>
                                  onAddToCart(
                                    item
                                  )
                                }
                                disabled={
                                  !item.is_available
                                }
                                className={`w-full rounded-full py-3 font-semibold transition ${
                                  item.is_available
                                    ? 'bg-green-700 text-white hover:bg-green-800'
                                    : 'cursor-not-allowed bg-gray-200 text-gray-500'
                                }`}
                              >
                                {item.is_available
                                  ? 'Add to Cart'
                                  : 'Unavailable'}
                              </button>
                            ) : (
                              <div className="flex w-full items-center justify-between rounded-full bg-green-50 p-1.5">

                                <button
                                  onClick={() =>
                                    handleDecrease(
                                      item
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-green-700 shadow-sm transition hover:bg-green-100"
                                  aria-label={`Decrease ${item.name} quantity`}
                                >
                                  −
                                </button>

                                <span className="text-base font-bold text-green-800">
                                  {
                                    quantity
                                  }
                                </span>

                                <button
                                  onClick={() =>
                                    handleIncrease(
                                      item
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-xl font-bold text-white shadow-sm transition hover:bg-green-800"
                                  aria-label={`Increase ${item.name} quantity`}
                                >
                                  +
                                </button>

                              </div>
                            )}

                          </div>

                        </div>

                      </div>
                    )
                  })}

                </div>
              </div>
            )
          )}

        </div>

      </div>
    </section>
  )
}

export default Menu