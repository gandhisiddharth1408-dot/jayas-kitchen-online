import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

function AdminOrders({ onAuthExpired }) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem(
      'jayasKitchenAdminToken'
    )

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const handleAuthExpired = () => {
    localStorage.removeItem(
      'jayasKitchenAdminToken'
    )

    if (onAuthExpired) {
      onAuthExpired()
    }
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError('')

      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        handleAuthExpired()
        return
      }

      const response = await fetch(
        `${API_URL}/api/orders/admin/all`,
        {
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleAuthExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load orders'
        )
      }

      setOrders(data.orders || [])
    } catch (error) {
      console.error(
        'Orders loading failed:',
        error
      )

      setError(
        error.message ||
          'Unable to load orders. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    try {
      setUpdatingOrderId(orderId)
      setError('')

      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        handleAuthExpired()
        return
      }

      const response = await fetch(
        `${API_URL}/api/orders/admin/${orderId}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },

          body: JSON.stringify({
            status,
          }),
        }
      )

      const data = await response.json()

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleAuthExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to update order status'
        )
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderStatus:
                  data.order.orderStatus,
                updatedAt:
                  data.order.updatedAt,
              }
            : order
        )
      )
    } catch (error) {
      console.error(
        'Order status update failed:',
        error
      )

      setError(
        error.message ||
          'Unable to update the order status.'
      )
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
  }

  const getStatusClasses = (status) => {
    if (status === 'completed') {
      return 'bg-green-100 text-green-800'
    }

    if (status === 'cancelled') {
      return 'bg-red-100 text-red-800'
    }

    if (status === 'preparing') {
      return 'bg-yellow-100 text-yellow-800'
    }

    if (status === 'out_for_delivery') {
      return 'bg-blue-100 text-blue-800'
    }

    if (status === 'confirmed') {
      return 'bg-purple-100 text-purple-800'
    }

    return 'bg-gray-100 text-gray-800'
  }

  const getQuickAction = (status) => {
    const actions = {
      pending: {
        label: 'Confirm Order',
        nextStatus: 'confirmed',
      },

      confirmed: {
        label: 'Start Preparing',
        nextStatus: 'preparing',
      },

      preparing: {
        label: 'Out for Delivery',
        nextStatus: 'out_for_delivery',
      },

      out_for_delivery: {
        label: 'Mark Delivered',
        nextStatus: 'completed',
      },
    }

    return actions[status] || null
  }

  const totalRevenue = orders.reduce(
    (total, order) =>
      total + Number(order.total || 0),
    0
  )

  const pendingOrders = orders.filter(
    (order) =>
      order.orderStatus === 'pending'
  ).length

  const activeOrders = orders.filter(
    (order) =>
      ![
        'completed',
        'cancelled',
      ].includes(order.orderStatus)
  ).length

  return (
    <div className="min-h-screen bg-[#FFFDF5]">

      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">

          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-2xl font-bold text-gray-900">
              Admin Orders
            </h1>
          </div>

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Active Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {activeOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Revenue
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              ₹{totalRevenue}
            </p>
          </div>

        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              {error}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

            <p className="mt-4 text-sm text-gray-500">
              Loading orders...
            </p>

          </div>
        )}

        {!isLoading &&
          !error &&
          orders.length === 0 && (
            <div className="rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500">
                No orders yet.
              </p>
            </div>
          )}

        {!isLoading &&
          orders.length > 0 && (
            <div className="space-y-6">

              {orders.map((order) => {
                const quickAction =
                  getQuickAction(
                    order.orderStatus
                  )

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"
                  >

                    {/* Order Header */}
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-xl font-bold text-gray-900">
                            Order #{order.id}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                              order.orderStatus
                            )}`}
                          >
                            {String(
                              order.orderStatus || ''
                            ).replaceAll(
                              '_',
                              ' '
                            )}
                          </span>

                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">

                        <p className="text-sm text-gray-500">
                          Order Total
                        </p>

                        <p className="text-2xl font-bold text-green-700">
                          ₹{order.total}
                        </p>

                      </div>

                    </div>

                    {/* Quick Action */}
                    {quickAction && (
                      <div className="border-b border-green-100 bg-green-50/60 px-5 py-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Next Order Action
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              Move this order to the next stage.
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                quickAction.nextStatus
                              )
                            }
                            disabled={
                              updatingOrderId ===
                              order.id
                            }
                            className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingOrderId ===
                            order.id
                              ? 'Updating...'
                              : quickAction.label}
                          </button>

                        </div>

                      </div>
                    )}

                    {/* Status Dropdown */}
                    <div className="border-b border-gray-100 bg-gray-50 px-5 py-5">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Update Order Status
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Or select a status manually.
                          </p>
                        </div>

                        <select
                          value={
                            order.orderStatus
                          }
                          onChange={(event) =>
                            updateOrderStatus(
                              order.id,
                              event.target.value
                            )
                          }
                          disabled={
                            updatingOrderId ===
                            order.id
                          }
                          className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold capitalize text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-64"
                        >

                          <option value="pending">
                            Pending
                          </option>

                          <option value="confirmed">
                            Confirmed
                          </option>

                          <option value="preparing">
                            Preparing
                          </option>

                          <option value="out_for_delivery">
                            Out for Delivery
                          </option>

                          <option value="completed">
                            Completed
                          </option>

                          <option value="cancelled">
                            Cancelled
                          </option>

                        </select>

                      </div>

                      {updatingOrderId ===
                        order.id && (
                        <p className="mt-2 text-right text-xs font-medium text-green-700">
                          Updating status...
                        </p>
                      )}

                      {order.updatedAt !==
                        order.createdAt && (
                        <p className="mt-2 text-xs text-gray-500">
                          Last updated:{' '}
                          {formatDate(
                            order.updatedAt
                          )}
                        </p>
                      )}

                    </div>

                    {/* Customer / Delivery / Payment */}
                    <div className="grid gap-6 p-5 lg:grid-cols-3">

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Customer
                        </h3>

                        <p className="mt-2 text-gray-700">
                          {order.customer?.name ||
                            'Unknown Customer'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {order.customer?.phone ||
                            'No phone number'}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Delivery
                        </h3>

                        <p className="mt-2 capitalize text-gray-700">
                          {order.deliveryType}
                        </p>

                        {order.address && (
                          <p className="mt-1 text-sm text-gray-500">
                            {order.address}
                          </p>
                        )}

                        {order.landmark && (
                          <p className="mt-1 text-sm text-gray-500">
                            Landmark:{' '}
                            {order.landmark}
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Payment
                        </h3>

                        <p className="mt-2 capitalize text-gray-700">
                          {order.paymentMethod}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Status:{' '}
                          {order.paymentStatus}
                        </p>
                      </div>

                    </div>

                    {/* Items */}
                    <div className="border-t border-gray-100 px-5 py-5">

                      <h3 className="font-semibold text-gray-900">
                        Items
                      </h3>

                      <div className="mt-4 space-y-3">

                        {order.items?.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3"
                            >

                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {item.quantity} × ₹
                                  {item.price}
                                </p>
                              </div>

                              <p className="font-semibold text-gray-900">
                                ₹{item.subtotal}
                              </p>

                            </div>
                          )
                        )}

                      </div>

                    </div>

                    {/* Instructions */}
                    {order.instructions && (
                      <div className="border-t border-gray-100 px-5 py-5">

                        <h3 className="font-semibold text-gray-900">
                          Customer Instructions
                        </h3>

                        <p className="mt-2 text-sm text-gray-600">
                          {order.instructions}
                        </p>

                      </div>
                    )}

                  </div>
                )
              })}

            </div>
          )}

      </main>
    </div>
  )
}

export default AdminOrders