import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function AdminDashboard({
  setActiveTab,
  onAuthExpired,
}) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newOrder, setNewOrder] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(false)

  const lastOrderIdRef = useRef(null)
  const audioContextRef = useRef(null)

  const enableOrderSound = async () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext

      if (!AudioContext) {
        console.error(
          'Web Audio API is not supported'
        )
        return
      }

      if (!audioContextRef.current) {
        audioContextRef.current =
          new AudioContext()
      }

      if (
        audioContextRef.current.state ===
        'suspended'
      ) {
        await audioContextRef.current.resume()
      }

      // Play a short test sound
      const audioContext =
        audioContextRef.current

      const oscillator =
        audioContext.createOscillator()

      const gainNode =
        audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(
        audioContext.destination
      )

      oscillator.type = 'sine'

      oscillator.frequency.setValueAtTime(
        900,
        audioContext.currentTime
      )

      gainNode.gain.setValueAtTime(
        0.25,
        audioContext.currentTime
      )

      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.4
      )

      oscillator.start()

      oscillator.stop(
        audioContext.currentTime + 0.4
      )

      setSoundEnabled(true)

      console.log(
        'Order notification sound enabled'
      )
    } catch (error) {
      console.error(
        'Failed to enable notification sound:',
        error
      )
    }
  }

  const playNotificationSound = async () => {
    try {
      const audioContext =
        audioContextRef.current

      if (!audioContext) {
        console.log(
          'Audio is not enabled'
        )
        return
      }

      if (
        audioContext.state ===
        'suspended'
      ) {
        await audioContext.resume()
      }

      // First beep
      const oscillator1 =
        audioContext.createOscillator()

      const gainNode1 =
        audioContext.createGain()

      oscillator1.connect(gainNode1)
      gainNode1.connect(
        audioContext.destination
      )

      oscillator1.type = 'sine'

      oscillator1.frequency.setValueAtTime(
        800,
        audioContext.currentTime
      )

      gainNode1.gain.setValueAtTime(
        0.3,
        audioContext.currentTime
      )

      gainNode1.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.25
      )

      oscillator1.start()

      oscillator1.stop(
        audioContext.currentTime + 0.25
      )

      // Second beep
      const oscillator2 =
        audioContext.createOscillator()

      const gainNode2 =
        audioContext.createGain()

      oscillator2.connect(gainNode2)
      gainNode2.connect(
        audioContext.destination
      )

      oscillator2.type = 'sine'

      oscillator2.frequency.setValueAtTime(
        1000,
        audioContext.currentTime + 0.3
      )

      gainNode2.gain.setValueAtTime(
        0.3,
        audioContext.currentTime + 0.3
      )

      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.6
      )

      oscillator2.start(
        audioContext.currentTime + 0.3
      )

      oscillator2.stop(
        audioContext.currentTime + 0.6
      )
    } catch (error) {
      console.error(
        'Notification sound failed:',
        error
      )
    }
  }

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        if (onAuthExpired) {
          onAuthExpired()
        }

        return
      }

      const response = await fetch(
        `${API_URL}/api/orders/admin/dashboard`,
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

        if (onAuthExpired) {
          onAuthExpired()
        }

        return
      }

      if (!response.ok) {
        throw new Error(
          'Failed to fetch dashboard data'
        )
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(
          data.message ||
            'Failed to load dashboard'
        )
      }

      const dashboardData =
        data.dashboard

      if (
        dashboardData.recentOrders?.length >
        0
      ) {
        const latestOrder =
          dashboardData.recentOrders[0]

        if (
          lastOrderIdRef.current !== null &&
          latestOrder.id >
            lastOrderIdRef.current
        ) {
          setNewOrder(latestOrder)

          console.log(
            `New order detected: #${latestOrder.id}`
          )

          if (soundEnabled) {
            playNotificationSound()
          }
        }

        if (
          lastOrderIdRef.current === null ||
          latestOrder.id >
            lastOrderIdRef.current
        ) {
          lastOrderIdRef.current =
            latestOrder.id
        }
      }

      setDashboard(dashboardData)
      setError('')
    } catch (error) {
      console.error(
        'Dashboard error:',
        error
      )

      setError(
        error.message ||
          'Failed to load dashboard'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()

    const interval = setInterval(() => {
      fetchDashboard()
    }, 10000)

    return () => clearInterval(interval)
  }, [soundEnabled])

  const goToOrders = () => {
    if (setActiveTab) {
      setActiveTab('orders')
    } else {
      window.location.href =
        '/admin?tab=orders'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-600">
          Loading dashboard...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          Dashboard Error
        </h2>

        <p className="mt-2 text-red-600">
          {error}
        </p>

        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const orderStatuses =
    dashboard.orderStatuses || {}

  const recentOrders =
    dashboard.recentOrders || []

  return (
    <div className="space-y-6">

      {/* Sound Control */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

        <div>
          <p className="font-semibold text-gray-900">
            Order Notifications
          </p>

          <p className="text-sm text-gray-500">
            {soundEnabled
              ? 'Sound is enabled. You will hear an alert for new orders.'
              : 'Enable sound to hear an alert when a new order arrives.'}
          </p>
        </div>

        {!soundEnabled && (
          <button
            onClick={enableOrderSound}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            🔔 Enable Sound
          </button>
        )}

        {soundEnabled && (
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            ✓ Sound Enabled
          </span>
        )}

      </div>

      {/* New Order Alert */}
      {newOrder && (
        <div className="rounded-2xl border-2 border-green-500 bg-green-50 p-5 shadow-lg">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-bold text-green-800">
                🔔 New Order Received!
              </h2>

              <p className="mt-1 text-green-700">
                Order #{newOrder.id} from{' '}
                <strong>
                  {newOrder.customerName}
                </strong>
              </p>

              <p className="mt-1 text-green-700">
                Order Total:{' '}
                <strong>
                  ₹
                  {Number(
                    newOrder.total ?? 0
                  ).toFixed(2)}
                </strong>
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={goToOrders}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
              >
                View Orders
              </button>

              <button
                onClick={() =>
                  setNewOrder(null)
                }
                className="rounded-lg border border-green-600 px-4 py-2 font-medium text-green-700 hover:bg-green-100"
              >
                Dismiss
              </button>

            </div>

          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-600">
          Overview of Jaya's Kitchen orders and business.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Today's Orders
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dashboard.todayOrders}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Today's Revenue
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₹
            {Number(
              dashboard.todayRevenue ?? 0
            ).toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dashboard.totalOrders}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Revenue
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₹
            {Number(
              dashboard.totalRevenue ?? 0
            ).toFixed(2)}
          </p>
        </div>

      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Customers
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {dashboard.totalCustomers}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Menu Items
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {dashboard.totalMenuItems}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Available Items
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {dashboard.availableMenuItems}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Pending Orders
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {orderStatuses.pending || 0}
          </p>
        </div>

      </div>

      {/* Order Status */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-gray-900">
          Order Status
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl bg-yellow-50 p-4">
            <p className="text-sm text-yellow-700">
              Pending
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-800">
              {orderStatuses.pending || 0}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              Confirmed
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-800">
              {orderStatuses.confirmed || 0}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 p-4">
            <p className="text-sm font-bold text-purple-800">
              Preparing
            </p>

            <p className="mt-1 text-2xl font-bold text-purple-800">
              {orderStatuses.preparing || 0}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-sm text-orange-700">
              Out for Delivery
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-800">
              {orderStatuses.out_for_delivery || 0}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-sm text-green-700">
              Completed
            </p>

            <p className="mt-1 text-2xl font-bold text-green-800">
              {orderStatuses.completed || 0}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Cancelled
            </p>

            <p className="mt-1 text-2xl font-bold text-red-800">
              {orderStatuses.cancelled || 0}
            </p>
          </div>

        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-bold text-gray-900">
            Recent Orders
          </h2>

          <button
            onClick={goToOrders}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            View All Orders →
          </button>

        </div>

        <div className="mt-4 overflow-x-auto">

          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-gray-500">
              No orders yet.
            </p>
          ) : (
            <table className="w-full min-w-[700px] text-left">

              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">

                  <th className="px-4 py-3">
                    Order
                  </th>

                  <th className="px-4 py-3">
                    Customer
                  </th>

                  <th className="px-4 py-3">
                    Total
                  </th>

                  <th className="px-4 py-3">
                    Payment
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 last:border-0"
                  >

                    <td className="px-4 py-4 font-medium text-gray-900">
                      #{order.id}
                    </td>

                    <td className="px-4 py-4">

                      <div className="font-medium text-gray-900">
                        {order.customerName}
                      </div>

                      <div className="text-sm text-gray-500">
                        {order.customerPhone}
                      </div>

                    </td>

                    <td className="px-4 py-4 font-medium">
                      ₹
                      {Number(
                        order.total ?? 0
                      ).toFixed(2)}
                    </td>

                    <td className="px-4 py-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          order.paymentStatus ===
                          'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>

                    </td>

                    <td className="px-4 py-4">

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                        {String(
                          order.orderStatus || ''
                        ).replaceAll(
                          '_',
                          ' '
                        )}
                      </span>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          )}

        </div>
      </div>

    </div>
  )
}