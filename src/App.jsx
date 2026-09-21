import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Menu from './components/Menu'
import About from './components/About'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Footer from './components/Footer'
import AdminDashboard from './components/AdminDashboard'
import AdminOrders from './components/AdminOrders'
import AdminMenu from './components/AdminMenu'
import AdminCustomers from './components/AdminCustomers'
import AdminLogin from './components/AdminLogin'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsConditions from './components/TermsConditions'
import RefundCancellation from './components/RefundCancellation'
import MyOrders from './components/MyOrders'
import CustomerAuth from './components/CustomerAuth'
import CustomerDashboard from './components/CustomerDashboard'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5001'

function OrderSuccess({
  order,
  onContinueShopping,
}) {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <Navbar />

      <main className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-green-100 bg-white p-8 text-center shadow-lg sm:p-10">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <p className="mt-6 font-semibold text-green-700">
            Order Confirmed
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Thank you for your order!
          </h1>

          <p className="mt-4 text-gray-600">
            Your order has been received successfully.
            We will process it shortly.
          </p>

          <div className="mt-8 rounded-2xl bg-green-50 p-5">
            <p className="text-sm text-gray-500">
              Order Number
            </p>

            <p className="mt-1 text-2xl font-bold text-green-800">
              #{order.id}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-600">
              Order Total
            </span>

            <span className="text-xl font-bold text-gray-900">
              ₹{order.total}
            </span>
          </div>

          <button
            onClick={onContinueShopping}
            className="mt-8 w-full rounded-full bg-green-700 py-3.5 font-semibold text-white transition hover:bg-green-800"
          >
            Continue Shopping
          </button>

        </div>
      </main>
    </div>
  )
}

function AdminHome({ onLogout }) {
  const [adminPage, setAdminPage] =
    useState('dashboard')

  return (
    <div className="min-h-screen bg-[#FFFDF5]">

      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">

            <a
              href="/"
              className="rounded-full border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            >
              Customer Website
            </a>

            <button
              onClick={onLogout}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>

          </div>
        </div>

        <div className="border-t border-green-50">

          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">

            <button
              onClick={() =>
                setAdminPage('dashboard')
              }
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                adminPage === 'dashboard'
                  ? 'bg-green-700 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                setAdminPage('orders')
              }
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                adminPage === 'orders'
                  ? 'bg-green-700 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Orders
            </button>

            <button
              onClick={() =>
                setAdminPage('menu')
              }
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                adminPage === 'menu'
                  ? 'bg-green-700 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Menu Management
            </button>

            <button
              onClick={() =>
                setAdminPage('customers')
              }
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                adminPage === 'customers'
                  ? 'bg-green-700 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Customers
            </button>

          </div>
        </div>
      </header>

      {adminPage === 'dashboard' && (
        <AdminDashboard
          onAuthExpired={onLogout}
        />
      )}

      {adminPage === 'orders' && (
        <AdminOrders
          onAuthExpired={onLogout}
        />
      )}

      {adminPage === 'menu' && (
        <AdminMenu
          onAuthExpired={onLogout}
        />
      )}

      {adminPage === 'customers' && (
        <AdminCustomers
          onAuthExpired={onLogout}
        />
      )}

    </div>
  )
}

function AdminAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5] px-4">

      <div className="text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

        <p className="mt-4 font-semibold text-gray-700">
          Checking admin authentication...
        </p>

      </div>

    </div>
  )
}

function App() {
  const [cart, setCart] = useState([])

  const [isCartOpen, setIsCartOpen] =
    useState(false)

  const [isCheckoutOpen, setIsCheckoutOpen] =
    useState(false)

  const [completedOrder, setCompletedOrder] =
    useState(null)

  const [
    showCustomerAuthPopup,
    setShowCustomerAuthPopup,
  ] = useState(false)

  const isAdminPage =
    window.location.pathname === '/admin'

  const isMyOrdersPage =
    window.location.pathname === '/my-orders'

  const isAccountPage =
    window.location.pathname === '/account'

  const isDashboardPage =
    window.location.pathname === '/dashboard'

  const isPrivacyPolicyPage =
    window.location.pathname ===
    '/privacy-policy'

  const isTermsPage =
    window.location.pathname === '/terms'

  const isRefundCancellationPage =
    window.location.pathname ===
    '/refund-cancellation'

  const [
    isAdminLoggedIn,
    setIsAdminLoggedIn,
  ] = useState(false)

  const [
    isCheckingAdminAuth,
    setIsCheckingAdminAuth,
  ] = useState(isAdminPage)

  useEffect(() => {
    if (!isAdminPage) {
      setIsCheckingAdminAuth(false)
      return
    }

    const verifyAdmin = async () => {
      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        setIsAdminLoggedIn(false)
        setIsCheckingAdminAuth(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/admin/verify`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            'jayasKitchenAdminToken'
          )

          setIsAdminLoggedIn(false)
          return
        }

        if (!response.ok) {
          throw new Error(
            'Admin authentication verification failed'
          )
        }

        const data = await response.json()

        if (data.success) {
          setIsAdminLoggedIn(true)
        } else {
          localStorage.removeItem(
            'jayasKitchenAdminToken'
          )

          setIsAdminLoggedIn(false)
        }
      } catch (error) {
        console.error(
          'Admin authentication verification error:',
          error
        )
      } finally {
        setIsCheckingAdminAuth(false)
      }
    }

    verifyAdmin()
  }, [isAdminPage])

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true)
  }

  const handleAdminLogout = () => {
    localStorage.removeItem(
      'jayasKitchenAdminToken'
    )

    setIsAdminLoggedIn(false)
  }

  // ===============================
  // PRIVACY POLICY
  // ===============================

  if (isPrivacyPolicyPage) {
    return <PrivacyPolicy />
  }

  // ===============================
  // TERMS & CONDITIONS
  // ===============================

  if (isTermsPage) {
    return <TermsConditions />
  }

  // ===============================
  // REFUND & CANCELLATION
  // ===============================

  if (isRefundCancellationPage) {
    return <RefundCancellation />
  }

  // ===============================
  // CUSTOMER ACCOUNT
  // ===============================

  if (isAccountPage) {
    return <CustomerAuth />
  }

  // ===============================
  // CUSTOMER DASHBOARD
  // ===============================

  if (isDashboardPage) {
    return <CustomerDashboard />
  }

  // ===============================
  // CUSTOMER MY ORDERS
  // ===============================

  if (isMyOrdersPage) {
    return <MyOrders />
  }

  // ===============================
  // ADMIN AUTH CHECK
  // ===============================

  if (isAdminPage && isCheckingAdminAuth) {
    return <AdminAuthLoading />
  }

  // ===============================
  // ADMIN LOGIN
  // ===============================

  if (isAdminPage && !isAdminLoggedIn) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
      />
    )
  }

  // ===============================
  // ADMIN DASHBOARD
  // ===============================

  if (isAdminPage) {
    return (
      <AdminHome
        onLogout={handleAdminLogout}
      />
    )
  }

  // ===============================
  // ADD TO CART
  // ===============================

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) =>
          cartItem.id === item.id
      )

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity:
                  cartItem.quantity + 1,
              }
            : cartItem
        )
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
        },
      ]
    })
  }

  // ===============================
  // INCREASE QUANTITY
  // ===============================

  const increaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    )
  }

  // ===============================
  // DECREASE QUANTITY
  // ===============================

  const decreaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    )
  }

  // ===============================
  // REMOVE FROM CART
  // ===============================

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id
      )
    )
  }

  // ===============================
  // UPDATE MENU QUANTITY
  // ===============================

  const updateMenuQuantity = (
    id,
    quantity
  ) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
            }
          : item
      )
    )
  }

  // ===============================
  // CHECKOUT AUTHENTICATION
  // ===============================

  const handleCheckoutRequest = () => {
    const customerToken =
      localStorage.getItem(
        'customerToken'
      )

    if (!customerToken) {
      setShowCustomerAuthPopup(true)
      return
    }

    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }

  // ===============================
  // PLACE ORDER
  // ===============================

  const handlePlaceOrder = (order) => {
    setCompletedOrder(order)
    setCart([])
    setIsCartOpen(false)
    setIsCheckoutOpen(false)
  }

  const totalItems = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  )

  // ===============================
  // ORDER SUCCESS
  // ===============================

  if (completedOrder) {
    return (
      <OrderSuccess
        order={completedOrder}
        onContinueShopping={() => {
          setCompletedOrder(null)
        }}
      />
    )
  }

  // ===============================
  // CHECKOUT
  // ===============================

  if (isCheckoutOpen) {
    return (
      <Checkout
        cart={cart}
        onBackToCart={() => {
          setIsCheckoutOpen(false)
          setIsCartOpen(true)
        }}
        onPlaceOrder={handlePlaceOrder}
      />
    )
  }

  // ===============================
  // MAIN CUSTOMER WEBSITE
  // ===============================

  return (
    <div className="min-h-screen bg-[#FFFDF5]">

      {/* Navbar */}
      <Navbar
        onCartClick={() =>
          setIsCartOpen(true)
        }
      />

      <main id="home">

        {/* Hero */}
        <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">

          <div>

            <p className="mb-3 font-semibold text-green-700">
              Fresh • Homemade • Pure Veg
            </p>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Homemade food,
              <span className="text-green-700">
                {' '}
                made with love.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Order fresh homemade meals and
              delicious tiffin from Jaya's Kitchen.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <a
                href="#menu"
                className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Order Now
              </a>

              <a
                href="#menu"
                className="rounded-full border border-green-700 px-6 py-3 font-semibold text-green-700 transition hover:bg-green-50"
              >
                Explore Menu
              </a>

            </div>

          </div>

        </section>

        {/* Menu */}
        <Menu
          cart={cart}
          onAddToCart={addToCart}
          onUpdateQuantity={updateMenuQuantity}
        />

        {/* About */}
        <About />

      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Cart Button */}
      <button
        onClick={() =>
          setIsCartOpen(true)
        }
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-green-700 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-green-800"
      >
        🛒 Cart

        {totalItems > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-green-700">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart */}
      {isCartOpen && (
        <Cart
          cart={cart}
          onClose={() =>
            setIsCartOpen(false)
          }
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onRemove={removeFromCart}
          onCheckout={
            handleCheckoutRequest
          }
        />
      )}

      {/* Customer Login / Signup Popup */}
      {showCustomerAuthPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF5] p-6 shadow-2xl sm:p-8">

            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              🔐
            </div>

            {/* Heading */}
            <div className="mt-5 text-center">

              <h2 className="text-2xl font-bold text-gray-900">
                Login or Signup Required
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Please login or create an
                account before placing your
                order.
              </p>

            </div>

            {/* Login / Signup */}
            <button
              onClick={() => {
                setShowCustomerAuthPopup(false)
                window.location.href =
                  '/account'
              }}
              className="mt-6 w-full rounded-full bg-green-700 py-3.5 font-semibold text-white transition hover:bg-green-800"
            >
              Login / Signup
            </button>

            {/* Continue Shopping */}
            <button
              onClick={() =>
                setShowCustomerAuthPopup(false)
              }
              className="mt-3 w-full rounded-full border border-green-200 bg-white py-3.5 font-semibold text-green-700 transition hover:bg-green-50"
            >
              Continue Shopping
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

export default App