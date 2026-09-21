import { useEffect, useState } from 'react'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5001'

const statusSteps = [
  {
    key: 'pending',
    label: 'Order Placed',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
  },
  {
    key: 'preparing',
    label: 'Preparing',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
  },
  {
    key: 'completed',
    label: 'Completed',
  },
]

const getStatusLabel = (status) => {
  const step = statusSteps.find(
    (item) => item.key === status
  )

  return step?.label || status
}

const getStatusClass = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'

    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-700'

    case 'preparing':
      return 'bg-yellow-100 text-yellow-700'

    case 'confirmed':
      return 'bg-indigo-100 text-indigo-700'

    case 'cancelled':
      return 'bg-red-100 text-red-700'

    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getStepState = (
  currentStatus,
  stepKey
) => {
  if (currentStatus === 'cancelled') {
    return 'inactive'
  }

  const currentIndex =
    statusSteps.findIndex(
      (step) => step.key === currentStatus
    )

  const stepIndex =
    statusSteps.findIndex(
      (step) => step.key === stepKey
    )

  if (stepIndex < currentIndex) {
    return 'completed'
  }

  if (stepIndex === currentIndex) {
    return 'current'
  }

  return 'inactive'
}

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token =
          localStorage.getItem(
            'customerToken'
          )

        if (!token) {
          window.location.href = '/account'
          return
        }

        const response = await fetch(
          `${API_URL}/api/orders/my-orders`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to load your orders.'
          )
        }

        setOrders(data.orders || [])
      } catch (error) {
        console.error(
          'Fetch orders error:',
          error
        )

        setError(
          error.message ||
            'Unable to load your orders.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-green-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

            <p className="mt-4 text-sm text-gray-500">
              Loading your orders...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">
            My Orders
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View your orders and track their status.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* No Orders */}
        {!error && orders.length === 0 && (
          <div className="rounded-3xl border border-green-100 bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              🛍️
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              No Orders Yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your orders will appear here after
              you place your first order.
            </p>

            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Browse Menu
            </a>
          </div>
        )}

        {/* Orders */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm"
            >

              {/* Order Header */}
              <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Order
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-800">
                      #{order.id}
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(
                        order.createdAt
                      ).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div
                    className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${getStatusClass(
                      order.orderStatus
                    )}`}
                  >
                    {getStatusLabel(
                      order.orderStatus
                    )}
                  </div>

                </div>
              </div>

              {/* Status Tracker */}
              <div className="border-b border-gray-100 px-5 py-6 sm:px-6">

                {order.orderStatus ===
                'cancelled' ? (
                  <div className="rounded-2xl bg-red-50 px-5 py-4 text-center">
                    <p className="font-semibold text-red-700">
                      Order Cancelled
                    </p>

                    <p className="mt-1 text-xs text-red-500">
                      This order has been cancelled.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-[650px] items-start">

                      {statusSteps.map(
                        (step, index) => {
                          const state =
                            getStepState(
                              order.orderStatus,
                              step.key
                            )

                          return (
                            <div
                              key={step.key}
                              className="flex flex-1 items-start"
                            >

                              <div className="flex min-w-0 flex-1 flex-col items-center">

                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                                    state ===
                                    'completed'
                                      ? 'bg-green-700 text-white'
                                      : state ===
                                        'current'
                                      ? 'bg-green-600 text-white ring-4 ring-green-100'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {state ===
                                  'completed'
                                    ? '✓'
                                    : index + 1}
                                </div>

                                <p
                                  className={`mt-2 text-center text-xs font-medium ${
                                    state ===
                                      'current' ||
                                    state ===
                                      'completed'
                                      ? 'text-green-700'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {step.label}
                                </p>

                              </div>

                              {index <
                                statusSteps.length -
                                  1 && (
                                <div
                                  className={`mt-4 h-0.5 flex-1 ${
                                    state ===
                                      'completed'
                                      ? 'bg-green-600'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              )}

                            </div>
                          )
                        }
                      )}

                    </div>
                  </div>
                )}

              </div>

              {/* Items */}
              <div className="px-5 py-6 sm:px-6">

                <h3 className="mb-4 text-sm font-bold text-gray-800">
                  Order Items
                </h3>

                <div className="space-y-3">
                  {order.items?.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-[#FFFDF5] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            ₹{item.price} ×{' '}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-gray-800">
                          ₹{item.subtotal}
                        </p>
                      </div>
                    )
                  )}
                </div>

              </div>

              {/* Price Summary */}
              <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-5 sm:px-6">

                <div className="space-y-2 text-sm">

                  <div className="flex justify-between text-gray-500">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      ₹{order.subtotal}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500">
                    <span>
                      Delivery Charge
                    </span>

                    <span>
                      ₹{order.deliveryCharge}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-800">
                    <span>
                      Total
                    </span>

                    <span className="text-green-700">
                      ₹{order.total}
                    </span>
                  </div>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-500">
                    Payment:{' '}
                    {order.paymentMethod}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-500">
                    Payment Status:{' '}
                    {order.paymentStatus}
                  </span>
                </div>

              </div>

            </div>
          ))}
        </div>

        {/* Back Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm font-medium text-green-700 transition hover:text-green-800"
          >
            ← Back to Home
          </a>
        </div>

      </div>
    </div>
  )
}

export default MyOrders