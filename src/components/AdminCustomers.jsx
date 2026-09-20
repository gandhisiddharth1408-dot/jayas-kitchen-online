import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

function AdminCustomers({ onAuthExpired }) {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] =
    useState(null)
  const [customerOrders, setCustomerOrders] =
    useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdersLoading, setIsOrdersLoading] =
    useState(false)
  const [error, setError] = useState('')

  const handleAuthExpired = () => {
    localStorage.removeItem(
      'jayasKitchenAdminToken'
    )

    if (onAuthExpired) {
      onAuthExpired()
    }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem(
      'jayasKitchenAdminToken'
    )

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchCustomers = async () => {
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
        `${API_URL}/api/orders/admin/customers`,
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
          data.message ||
            'Failed to load customers'
        )
      }

      setCustomers(data.customers || [])
    } catch (error) {
      console.error(
        'Customers loading failed:',
        error
      )

      setError(
        error.message ||
          'Unable to load customers. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomerOrders = async (
    customer
  ) => {
    try {
      setSelectedCustomer(customer)
      setCustomerOrders([])
      setIsOrdersLoading(true)
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
          data.message ||
            'Failed to load customer orders'
        )
      }

      const orders = (
        data.orders || []
      ).filter(
        (order) =>
          order.customer?.id === customer.id
      )

      setCustomerOrders(orders)
    } catch (error) {
      console.error(
        'Customer orders loading failed:',
        error
      )

      setError(
        error.message ||
          'Unable to load customer order history.'
      )
    } finally {
      setIsOrdersLoading(false)
    }
  }

  const closeCustomerDetails = () => {
    setSelectedCustomer(null)
    setCustomerOrders([])
  }

  const formatDate = (date) => {
    if (!date) {
      return 'No orders yet'
    }

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

  const totalCustomers = customers.length

  const totalOrders = customers.reduce(
    (total, customer) =>
      total + Number(customer.orderCount || 0),
    0
  )

  const totalRevenue = customers.reduce(
    (total, customer) =>
      total + Number(customer.totalSpent || 0),
    0
  )

  return (
    <div className="min-h-screen bg-[#FFFDF5]">

      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">

          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-2xl font-bold text-gray-900">
              Customers
            </h1>
          </div>

          <button
            onClick={fetchCustomers}
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

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Customers
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalCustomers}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Customer Revenue
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
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
              Loading customers...
            </p>

          </div>
        )}

        {!isLoading &&
          !error &&
          customers.length === 0 && (
            <div className="rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">

              <div className="text-5xl">
                👥
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                No customers yet
              </h2>

              <p className="mt-2 text-gray-500">
                Customers will appear here after
                they place an order.
              </p>

            </div>
          )}

        {!isLoading &&
          customers.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-green-50">
                    <tr>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-green-800">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-green-800">
                        Phone
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-green-800">
                        Orders
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-green-800">
                        Total Spent
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-green-800">
                        Last Order
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-green-800">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {customers.map(
                      (customer) => (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-green-50/50"
                        >

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
                                {customer.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  '?'}
                              </div>

                              <div>

                                <p className="font-semibold text-gray-900">
                                  {customer.name}
                                </p>

                                <p className="text-xs text-gray-500">
                                  Customer #
                                  {customer.id}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-5">

                            <a
                              href={`tel:${customer.phone}`}
                              className="font-medium text-green-700 hover:text-green-800"
                            >
                              {customer.phone}
                            </a>

                          </td>

                          <td className="px-5 py-5">

                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                              {customer.orderCount}
                            </span>

                          </td>

                          <td className="px-5 py-5">

                            <p className="font-bold text-gray-900">
                              ₹
                              {customer.totalSpent}
                            </p>

                          </td>

                          <td className="px-5 py-5">

                            <p className="text-sm text-gray-700">
                              {formatDate(
                                customer.lastOrderAt
                              )}
                            </p>

                          </td>

                          <td className="px-5 py-5 text-right">

                            <button
                              onClick={() =>
                                fetchCustomerOrders(
                                  customer
                                )
                              }
                              className="rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                              View Details
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

      </main>

      {selectedCustomer && (
        <>

          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeCustomerDetails}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">

            <div
              className="w-full max-w-5xl rounded-3xl bg-[#FFFDF5] shadow-2xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="sticky top-0 z-10 rounded-t-3xl border-b border-green-100 bg-white px-6 py-5 sm:px-8">

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-800">
                      {selectedCustomer.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        '?'}
                    </div>

                    <div>

                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCustomer.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {selectedCustomer.phone}
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={
                      closeCustomerDetails
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200"
                  >
                    ×
                  </button>

                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl bg-green-50 p-4">

                    <p className="text-sm text-gray-500">
                      Total Orders
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {
                        selectedCustomer.orderCount
                      }
                    </p>

                  </div>

                  <div className="rounded-2xl bg-green-50 p-4">

                    <p className="text-sm text-gray-500">
                      Total Spent
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      ₹
                      {
                        selectedCustomer.totalSpent
                      }
                    </p>

                  </div>

                  <div className="rounded-2xl bg-green-50 p-4">

                    <p className="text-sm text-gray-500">
                      Last Order
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {formatDate(
                        selectedCustomer.lastOrderAt
                      )}
                    </p>

                  </div>

                </div>

              </div>

              <div className="max-h-[65vh] overflow-y-auto px-6 py-6 sm:px-8">

                <div className="mb-5">

                  <h3 className="text-xl font-bold text-gray-900">
                    Order History
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Complete order history for this customer.
                  </p>

                </div>

                {isOrdersLoading && (
                  <div className="rounded-2xl border border-green-100 bg-white p-10 text-center">

                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

                    <p className="mt-3 text-sm text-gray-500">
                      Loading order history...
                    </p>

                  </div>
                )}

                {!isOrdersLoading &&
                  customerOrders.length === 0 && (
                    <div className="rounded-2xl border border-green-100 bg-white p-10 text-center">

                      <p className="text-gray-500">
                        No orders found for this customer.
                      </p>

                    </div>
                  )}

                {!isOrdersLoading &&
                  customerOrders.length > 0 && (
                    <div className="space-y-5">

                      {customerOrders.map(
                        (order) => (
                          <div
                            key={order.id}
                            className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"
                          >

                            <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                              <div>

                                <div className="flex flex-wrap items-center gap-3">

                                  <h4 className="text-lg font-bold text-gray-900">
                                    Order #
                                    {order.id}
                                  </h4>

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                                      order.orderStatus
                                    )}`}
                                  >
                                    {String(
                                      order.orderStatus ||
                                        ''
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

                              <p className="text-xl font-bold text-green-700">
                                ₹{order.total}
                              </p>

                            </div>

                            <div className="grid gap-5 p-5 sm:grid-cols-3">

                              <div>

                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Delivery
                                </p>

                                <p className="mt-2 capitalize font-medium text-gray-900">
                                  {
                                    order.deliveryType
                                  }
                                </p>

                                {order.address && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {
                                      order.address
                                    }
                                  </p>
                                )}

                                {order.landmark && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    Landmark:{' '}
                                    {
                                      order.landmark
                                    }
                                  </p>
                                )}

                              </div>

                              <div>

                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Payment
                                </p>

                                <p className="mt-2 capitalize font-medium text-gray-900">
                                  {
                                    order.paymentMethod
                                  }
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                  Status:{' '}
                                  {
                                    order.paymentStatus
                                  }
                                </p>

                              </div>

                              <div>

                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Amount
                                </p>

                                <p className="mt-2 text-sm text-gray-600">
                                  Subtotal: ₹
                                  {
                                    order.subtotal
                                  }
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                  Delivery: ₹
                                  {
                                    order.deliveryCharge
                                  }
                                </p>

                                <p className="mt-1 font-bold text-gray-900">
                                  Total: ₹
                                  {order.total}
                                </p>

                              </div>

                            </div>

                            <div className="border-t border-gray-100 px-5 py-5">

                              <p className="text-sm font-bold text-gray-900">
                                Items
                              </p>

                              <div className="mt-3 space-y-2">

                                {order.items?.map(
                                  (item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3"
                                    >

                                      <div>

                                        <p className="font-medium text-gray-900">
                                          {
                                            item.name
                                          }
                                        </p>

                                        <p className="text-sm text-gray-500">
                                          {
                                            item.quantity
                                          }{' '}
                                          × ₹
                                          {
                                            item.price
                                          }
                                        </p>

                                      </div>

                                      <p className="font-semibold text-gray-900">
                                        ₹
                                        {
                                          item.subtotal
                                        }
                                      </p>

                                    </div>
                                  )
                                )}

                              </div>

                            </div>

                            {order.instructions && (
                              <div className="border-t border-gray-100 px-5 py-5">

                                <p className="text-sm font-bold text-gray-900">
                                  Customer Instructions
                                </p>

                                <p className="mt-2 text-sm text-gray-600">
                                  {
                                    order.instructions
                                  }
                                </p>

                              </div>
                            )}

                          </div>
                        )
                      )}

                    </div>
                  )}

              </div>

              <div className="rounded-b-3xl border-t border-green-100 bg-white px-6 py-4 sm:px-8">

                <div className="flex justify-end">

                  <button
                    onClick={
                      closeCustomerDetails
                    }
                    className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>

        </>
      )}

    </div>
  )
}

export default AdminCustomers