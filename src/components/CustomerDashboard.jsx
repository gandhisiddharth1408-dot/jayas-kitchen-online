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

function CustomerDashboard() {
  const [customer, setCustomer] =
    useState(null)

  const [recentOrder, setRecentOrder] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ===============================
  // EDIT PROFILE STATE
  // ===============================

  const [isEditingProfile, setIsEditingProfile] =
    useState(false)

  const [profileForm, setProfileForm] =
    useState({
      name: '',
      phone: '',
      email: '',
    })

  const [isSavingProfile, setIsSavingProfile] =
    useState(false)

  const [profileMessage, setProfileMessage] =
    useState('')

  const [profileMessageType, setProfileMessageType] =
    useState('')

  // ===============================
  // SAVED ADDRESS STATE
  // ===============================

  const [isEditingAddress, setIsEditingAddress] =
    useState(false)

  const [addressForm, setAddressForm] =
    useState({
      houseNumber: '',
      street: '',
      addressLine2: '',
      landmark: '',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '',
      addressType: 'Home',
    })

  const [isSavingAddress, setIsSavingAddress] =
    useState(false)

  const [addressMessage, setAddressMessage] =
    useState('')

  const [addressMessageType, setAddressMessageType] =
    useState('')

  useEffect(() => {
    const token =
      localStorage.getItem(
        'customerToken'
      )

    if (!token) {
      window.location.href =
        '/account'

      return
    }

    fetchCustomerProfile(token)
    fetchRecentOrder(token)
  }, [])

  // ===============================
  // FETCH CURRENT CUSTOMER
  // ===============================

  const fetchCustomerProfile = async (
    token
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/otp/me`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        if (
          response.status ===
          401 ||
          response.status ===
          404
        ) {
          localStorage.removeItem(
            'customerToken'
          )

          localStorage.removeItem(
            'customer'
          )

          window.location.href =
            '/account'

          return
        }

        throw new Error(
          data.message ||
            'Failed to fetch customer profile'
        )
      }

      if (data.customer) {
        setCustomer(
          data.customer
        )

        localStorage.setItem(
          'customer',
          JSON.stringify(
            data.customer
          )
        )
      }
    } catch (error) {
      console.error(
        'Customer profile fetch failed:',
        error
      )

      setError(
        'Unable to load your account details.'
      )
    }
  }

  // ===============================
  // FETCH RECENT ORDER
  // ===============================

  const fetchRecentOrder = async (
    token
  ) => {
    try {
      setIsLoading(true)
      setError('')

      const response =
        await fetch(
          `${API_URL}/api/orders/my-orders`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        if (
          response.status ===
          401
        ) {
          localStorage.removeItem(
            'customerToken'
          )

          localStorage.removeItem(
            'customer'
          )

          window.location.href =
            '/account'

          return
        }

        throw new Error(
          data.message ||
            'Failed to fetch orders'
        )
      }

      if (
        data.orders &&
        data.orders.length > 0
      ) {
        setRecentOrder(
          data.orders[0]
        )
      }
    } catch (error) {
      console.error(
        'Dashboard order fetch failed:',
        error
      )

      setError(
        'Unable to load your recent order.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ===============================
  // OPEN EDIT PROFILE
  // ===============================

  const handleOpenEditProfile = () => {
    if (!customer) {
      return
    }

    setProfileForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
    })

    setProfileMessage('')
    setProfileMessageType('')
    setIsEditingProfile(true)
  }

  // ===============================
  // CLOSE EDIT PROFILE
  // ===============================

  const handleCloseEditProfile = () => {
    if (isSavingProfile) {
      return
    }

    setIsEditingProfile(false)

    setProfileMessage('')
    setProfileMessageType('')
  }

  // ===============================
  // HANDLE PROFILE INPUT
  // ===============================

  const handleProfileChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target

    setProfileForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    )

    setProfileMessage('')
    setProfileMessageType('')
  }

  // ===============================
  // SAVE PROFILE
  // ===============================

  const handleSaveProfile = async (
    event
  ) => {
    event.preventDefault()

    const token =
      localStorage.getItem(
        'customerToken'
      )

    if (!token) {
      window.location.href =
        '/account'

      return
    }

    setIsSavingProfile(true)
    setProfileMessage('')
    setProfileMessageType('')

    try {
      const cleanName =
        profileForm.name.trim()

      const cleanPhone =
        profileForm.phone.trim()

      const cleanEmail =
        profileForm.email
          .trim()
          .toLowerCase()

      if (!cleanName) {
        setProfileMessage(
          'Please enter your full name.'
        )

        setProfileMessageType(
          'error'
        )

        setIsSavingProfile(false)
        return
      }

      if (
        !/^[0-9]{10}$/.test(
          cleanPhone
        )
      ) {
        setProfileMessage(
          'Please enter a valid 10-digit mobile number.'
        )

        setProfileMessageType(
          'error'
        )

        setIsSavingProfile(false)
        return
      }

      if (
        cleanEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {
        setProfileMessage(
          'Please enter a valid email address.'
        )

        setProfileMessageType(
          'error'
        )

        setIsSavingProfile(false)
        return
      }

      const response =
        await fetch(
          `${API_URL}/api/otp/me`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name: cleanName,
              phone: cleanPhone,
              email: cleanEmail,
            }),
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        localStorage.removeItem(
          'customerToken'
        )

        localStorage.removeItem(
          'customer'
        )

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to update profile.'
        )
      }

      if (data.token) {
        localStorage.setItem(
          'customerToken',
          data.token
        )
      }

      if (data.customer) {
        setCustomer(
          data.customer
        )

        localStorage.setItem(
          'customer',
          JSON.stringify(
            data.customer
          )
        )
      }

      setProfileMessage(
        'Profile updated successfully.'
      )

      setProfileMessageType(
        'success'
      )

      setTimeout(() => {
        setIsEditingProfile(false)
        setProfileMessage('')
        setProfileMessageType('')
      }, 1000)
    } catch (error) {
      console.error(
        'Profile update failed:',
        error
      )

      setProfileMessage(
        error.message ||
          'Unable to update your profile. Please try again.'
      )

      setProfileMessageType(
        'error'
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  // ===============================
  // OPEN EDIT ADDRESS
  // ===============================

  const handleOpenEditAddress = () => {
    if (!customer) {
      return
    }

    setAddressForm({
      houseNumber:
        customer.house_number ||
        customer.houseNumber ||
        '',

      street:
        customer.street ||
        '',

      addressLine2:
        customer.address_line2 ||
        customer.addressLine2 ||
        '',

      landmark:
        customer.landmark ||
        '',

      city:
        customer.city ||
        'Vadodara',

      state:
        customer.state ||
        'Gujarat',

      pincode:
        customer.pincode ||
        '',

      addressType:
        customer.address_type ||
        customer.addressType ||
        'Home',
    })

    setAddressMessage('')
    setAddressMessageType('')
    setIsEditingAddress(true)
  }

  // ===============================
  // CLOSE EDIT ADDRESS
  // ===============================

  const handleCloseEditAddress = () => {
    if (isSavingAddress) {
      return
    }

    setIsEditingAddress(false)

    setAddressMessage('')
    setAddressMessageType('')
  }

  // ===============================
  // HANDLE ADDRESS INPUT
  // ===============================

  const handleAddressChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target

    setAddressForm(
      (previous) => ({
        ...previous,
        [name]:
          name === 'pincode'
            ? value
                .replace(
                  /\D/g,
                  ''
                )
                .slice(0, 6)
            : value,
      })
    )

    setAddressMessage('')
    setAddressMessageType('')
  }

  // ===============================
  // SAVE ADDRESS
  // ===============================

  const handleSaveAddress = async (
    event
  ) => {
    event.preventDefault()

    const token =
      localStorage.getItem(
        'customerToken'
      )

    if (!token) {
      window.location.href =
        '/account'

      return
    }

    setIsSavingAddress(true)
    setAddressMessage('')
    setAddressMessageType('')

    try {
      const cleanHouseNumber =
        addressForm.houseNumber.trim()

      const cleanStreet =
        addressForm.street.trim()

      const cleanAddressLine2 =
        addressForm.addressLine2.trim()

      const cleanLandmark =
        addressForm.landmark.trim()

      const cleanCity =
        addressForm.city.trim()

      const cleanState =
        addressForm.state.trim()

      const cleanPincode =
        addressForm.pincode.trim()

      const cleanAddressType =
        addressForm.addressType.trim()

      // -------------------------------
      // REQUIRED FIELD VALIDATION
      // -------------------------------

      if (!cleanHouseNumber) {
        setAddressMessage(
          'Please enter your house, flat or building number.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (!cleanStreet) {
        setAddressMessage(
          'Please enter your street, area or society.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (!cleanCity) {
        setAddressMessage(
          'Please enter your city.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (!cleanState) {
        setAddressMessage(
          'Please enter your state.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (
        !/^[0-9]{6}$/.test(
          cleanPincode
        )
      ) {
        setAddressMessage(
          'Please enter a valid 6-digit pincode.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      // -------------------------------
      // LENGTH VALIDATION
      // -------------------------------

      if (
        cleanHouseNumber.length >
        100
      ) {
        setAddressMessage(
          'House / Flat / Building number must be 100 characters or less.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (
        cleanStreet.length >
        255
      ) {
        setAddressMessage(
          'Street / Area / Society must be 255 characters or less.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (
        cleanAddressLine2.length >
        255
      ) {
        setAddressMessage(
          'Address Line 2 must be 255 characters or less.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (
        cleanLandmark.length >
        255
      ) {
        setAddressMessage(
          'Landmark must be 255 characters or less.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      // -------------------------------
      // COMBINE ADDRESS
      // -------------------------------

      const addressParts = [
        cleanHouseNumber,
        cleanStreet,
        cleanAddressLine2,
        `${cleanCity}, ${cleanState} - ${cleanPincode}`,
      ].filter(Boolean)

      const combinedAddress =
        addressParts.join(', ')

      if (
        combinedAddress.length >
        500
      ) {
        setAddressMessage(
          'The complete address must be 500 characters or less.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      // -------------------------------
      // SAVE ADDRESS
      // -------------------------------

      const response =
        await fetch(
          `${API_URL}/api/otp/me/address`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              address:
                combinedAddress,

              houseNumber:
                cleanHouseNumber,

              street:
                cleanStreet,

              addressLine2:
                cleanAddressLine2,

              landmark:
                cleanLandmark,

              city:
                cleanCity,

              state:
                cleanState,

              pincode:
                cleanPincode,

              addressType:
                cleanAddressType,
            }),
          }
        )

      const data =
        await response.json()

      // -------------------------------
      // AUTH ERROR
      // -------------------------------

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        localStorage.removeItem(
          'customerToken'
        )

        localStorage.removeItem(
          'customer'
        )

        window.location.href =
          '/account'

        return
      }

      // -------------------------------
      // OTHER ERROR
      // -------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to save delivery address.'
        )
      }

      // -------------------------------
      // SAVE NEW JWT
      // -------------------------------

      if (data.token) {
        localStorage.setItem(
          'customerToken',
          data.token
        )
      }

      // -------------------------------
      // UPDATE CUSTOMER
      // -------------------------------

      if (data.customer) {
        setCustomer(
          data.customer
        )

        localStorage.setItem(
          'customer',
          JSON.stringify(
            data.customer
          )
        )
      } else {
        setCustomer(
          (previous) => ({
            ...previous,

            address:
              combinedAddress,

            house_number:
              cleanHouseNumber,

            street:
              cleanStreet,

            address_line2:
              cleanAddressLine2,

            landmark:
              cleanLandmark,

            city:
              cleanCity,

            state:
              cleanState,

            pincode:
              cleanPincode,

            address_type:
              cleanAddressType,
          })
        )
      }

      setAddressMessage(
        'Delivery address saved successfully.'
      )

      setAddressMessageType(
        'success'
      )

      setTimeout(() => {
        setIsEditingAddress(false)
        setAddressMessage('')
        setAddressMessageType('')
      }, 1000)
    } catch (error) {
      console.error(
        'Address update failed:',
        error
      )

      setAddressMessage(
        error.message ||
          'Unable to save your delivery address. Please try again.'
      )

      setAddressMessageType(
        'error'
      )
    } finally {
      setIsSavingAddress(false)
    }
  }

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = () => {
    localStorage.removeItem(
      'customerToken'
    )

    localStorage.removeItem(
      'customer'
    )

    window.location.href =
      '/account'
  }

  // ===============================
  // ORDER STATUS
  // ===============================

  const getStatusIndex = (
    status
  ) => {
    return statusSteps.findIndex(
      (step) =>
        step.key === status
    )
  }

  // ===============================
  // FORMAT DATE
  // ===============================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return ''
    }

    return new Date(
      date
    ).toLocaleString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  }

  const currentStatusIndex =
    recentOrder
      ? getStatusIndex(
          recentOrder.orderStatus
        )
      : -1

  return (
    <div className="min-h-screen bg-[#f8f5ec] px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-medium text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Welcome
              {customer?.name
                ? `, ${customer.name}`
                : ''}
              !
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your orders and
              account from here.
            </p>
          </div>

          <button
            onClick={
              handleLogout
            }
            className="w-fit rounded-lg border border-red-200 bg-white px-5 py-2.5 font-medium text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>

        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* My Orders */}
          <button
            onClick={() =>
              (window.location.href =
                '/my-orders')
            }
            className="rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
              📦
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              My Orders
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              View all your orders and
              track their status.
            </p>
          </button>

          {/* Browse Menu */}
          <button
            onClick={() =>
              (window.location.href =
                '/#menu')
            }
            className="rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
              🛒
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Browse Menu
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Explore our fresh vegetarian
              dishes and place an order.
            </p>
          </button>

          {/* Account */}
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                👤
              </div>

              {customer && (
                <button
                  type="button"
                  onClick={
                    handleOpenEditProfile
                  }
                  className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                >
                  Edit Profile
                </button>
              )}

            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Account
            </h2>

            {customer ? (
              <div className="mt-2 space-y-1 text-sm text-gray-600">

                <p>
                  <span className="font-medium text-gray-800">
                    Name:
                  </span>{' '}
                  {customer.name}
                </p>

                {customer.phone && (
                  <p>
                    <span className="font-medium text-gray-800">
                      Mobile:
                    </span>{' '}
                    {customer.phone}
                  </p>
                )}

                {customer.email && (
                  <p className="break-all">
                    <span className="font-medium text-gray-800">
                      Email:
                    </span>{' '}
                    {customer.email}
                  </p>
                )}

              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                Loading account...
              </p>
            )}

          </div>

        </div>

        {/* Saved Address */}
        <div className="mb-8 rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Saved Address
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your default delivery address
              </p>
            </div>

            {customer && (
              <button
                type="button"
                onClick={
                  handleOpenEditAddress
                }
                className="w-fit rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                {customer.address
                  ? 'Edit Address'
                  : 'Add Address'}
              </button>
            )}

          </div>

          {customer?.address ? (
            <div className="rounded-xl bg-green-50 p-5">

              <div className="flex items-start gap-4">

                {/* Location Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                  📍
                </div>

                <div className="min-w-0 flex-1">

                  {/* Address Type */}
                  <div className="flex flex-wrap items-center gap-2">

                    <p className="font-semibold text-gray-900">
                      {customer.address_type ||
                        customer.addressType ||
                        'Home'}
                    </p>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      Delivery Address
                    </span>

                  </div>

                  {/* House / Flat */}
                  {(customer.house_number ||
                    customer.houseNumber) && (
                    <p className="mt-3 text-sm font-semibold text-gray-900">
                      {customer.house_number ||
                        customer.houseNumber}
                    </p>
                  )}

                  {/* Street */}
                  {customer.street && (
                    <p className="mt-1 break-words text-sm leading-6 text-gray-700">
                      {customer.street}
                    </p>
                  )}

                  {/* Address Line 2 */}
                  {(customer.address_line2 ||
                    customer.addressLine2) && (
                    <p className="break-words text-sm leading-6 text-gray-700">
                      {customer.address_line2 ||
                        customer.addressLine2}
                    </p>
                  )}

                  {/* City / State / Pincode */}
                  {(customer.city ||
                    customer.state ||
                    customer.pincode) && (
                    <p className="mt-1 text-sm leading-6 text-gray-700">

                      {customer.city &&
                        customer.city}

                      {customer.city &&
                        customer.state &&
                        ', '}

                      {customer.state &&
                        customer.state}

                      {customer.pincode &&
                        ` - ${customer.pincode}`}

                    </p>
                  )}

                  {/* Landmark */}
                  {customer.landmark && (
                    <p className="mt-3 text-sm text-gray-600">

                      <span className="font-medium text-gray-800">
                        Landmark:
                      </span>{' '}

                      {customer.landmark}

                    </p>
                  )}

                </div>

              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 p-6 text-center">

              <div className="mb-3 text-3xl">
                📍
              </div>

              <h3 className="font-bold text-gray-900">
                No Saved Address
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Add your delivery address to make checkout faster.
              </p>

              {customer && (
                <button
                  type="button"
                  onClick={
                    handleOpenEditAddress
                  }
                  className="mt-4 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  Add Delivery Address
                </button>
              )}

            </div>
          )}

        </div>

        {/* Recent Order */}
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Order
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest order status
              </p>
            </div>

            {recentOrder && (
              <button
                onClick={() =>
                  (window.location.href =
                    '/my-orders')
                }
                className="text-sm font-semibold text-green-700 hover:text-green-800"
              >
                View all orders →
              </button>
            )}

          </div>

          {isLoading ? (
            <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-500">
              Loading your recent
              order...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
              {error}
            </div>
          ) : !recentOrder ? (
            <div className="rounded-xl bg-green-50 p-8 text-center">

              <div className="mb-3 text-4xl">
                🍽️
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                No Orders Yet
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Your orders will appear
                here once you place one.
              </p>

              <button
                onClick={() =>
                  (window.location.href =
                    '/#menu')
                }
                className="mt-5 rounded-lg bg-green-700 px-6 py-2.5 font-semibold text-white transition hover:bg-green-800"
              >
                Browse Menu
              </button>

            </div>
          ) : (
            <div>

              {/* Order Summary */}
              <div className="mb-8 grid gap-4 rounded-xl bg-green-50 p-5 sm:grid-cols-3">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Order
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    #{recentOrder.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    ₹
                    {Number(
                      recentOrder.total
                    ).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Placed
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(
                      recentOrder.createdAt
                    )}
                  </p>
                </div>

              </div>

              {/* Cancelled */}
              {recentOrder.orderStatus ===
              'cancelled' ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">

                  <div className="text-3xl">
                    ✕
                  </div>

                  <h3 className="mt-2 font-bold text-red-700">
                    Order Cancelled
                  </h3>

                  <p className="mt-1 text-sm text-red-600">
                    This order has been
                    cancelled.
                  </p>

                </div>
              ) : (
                <>
                  {/* Status Tracker */}
                  <div className="overflow-x-auto pb-4">

                    <div className="flex min-w-[700px] items-start">

                      {statusSteps.map(
                        (
                          step,
                          index
                        ) => {
                          const isCompleted =
                            index <=
                            currentStatusIndex

                          const isCurrent =
                            index ===
                            currentStatusIndex

                          return (
                            <div
                              key={
                                step.key
                              }
                              className="flex flex-1 items-start"
                            >

                              <div className="flex min-w-0 flex-1 flex-col items-center">

                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                                    isCompleted
                                      ? 'border-green-700 bg-green-700 text-white'
                                      : 'border-gray-300 bg-white text-gray-400'
                                  }`}
                                >
                                  {isCompleted
                                    ? '✓'
                                    : index +
                                      1}
                                </div>

                                <p
                                  className={`mt-2 text-center text-xs font-medium ${
                                    isCurrent
                                      ? 'text-green-700'
                                      : isCompleted
                                      ? 'text-gray-700'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {
                                    step.label
                                  }
                                </p>

                              </div>

                              {index <
                                statusSteps.length -
                                  1 && (
                                <div
                                  className={`mt-5 h-0.5 flex-1 ${
                                    index <
                                    currentStatusIndex
                                      ? 'bg-green-700'
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

                  {/* Items */}
                  <div className="mt-6 border-t border-gray-100 pt-6">

                    <h3 className="mb-4 font-bold text-gray-900">
                      Items
                    </h3>

                    <div className="space-y-3">

                      {recentOrder.items?.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="flex items-center justify-between gap-4"
                          >

                            <div>
                              <p className="font-medium text-gray-800">
                                {
                                  item.name
                                }
                              </p>

                              <p className="text-sm text-gray-500">
                                ×{' '}
                                {
                                  item.quantity
                                }
                              </p>
                            </div>

                            <p className="font-semibold text-gray-900">
                              ₹
                              {Number(
                                item.subtotal
                              ).toFixed(
                                2
                              )}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                </>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Jaya's Kitchen · Home Tiffin
          & Catering Services
        </div>

      </div>

      {/* ================================= */}
      {/* EDIT PROFILE MODAL */}
      {/* ================================= */}

      {isEditingProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">

            <div className="mb-6 flex items-start justify-between gap-4">

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update your account details.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseEditProfile
                }
                disabled={
                  isSavingProfile
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleSaveProfile
              }
            >

              <div className="mb-4">

                <label
                  htmlFor="profile-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Full Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  value={
                    profileForm.name
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter your full name"
                  maxLength="100"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              <div className="mb-4">

                <label
                  htmlFor="profile-phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Mobile Number
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  value={
                    profileForm.phone
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter 10-digit mobile number"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              <div className="mb-5">

                <label
                  htmlFor="profile-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={
                    profileForm.email
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {profileMessage && (
                <div
                  className={`mb-5 rounded-xl px-4 py-3 text-sm ${
                    profileMessageType ===
                    'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {profileMessage}
                </div>
              )}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    handleCloseEditProfile
                  }
                  disabled={
                    isSavingProfile
                  }
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSavingProfile
                  }
                  className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================================= */}
      {/* EDIT ADDRESS MODAL */}
      {/* ================================= */}

      {isEditingAddress && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {customer?.address
                    ? 'Edit Address'
                    : 'Add Address'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add your complete delivery address.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseEditAddress
                }
                disabled={
                  isSavingAddress
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* Address Form */}
            <form
              onSubmit={
                handleSaveAddress
              }
            >

              {/* House / Flat */}
              <div className="mb-4">

                <label
                  htmlFor="customer-house-number"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  House / Flat / Building No.
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="customer-house-number"
                  name="houseNumber"
                  type="text"
                  value={
                    addressForm.houseNumber
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="e.g. Flat 204, House No. 12"
                  maxLength="100"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* Street / Area */}
              <div className="mb-4">

                <label
                  htmlFor="customer-street"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Street / Area / Society
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="customer-street"
                  name="street"
                  type="text"
                  value={
                    addressForm.street
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="e.g. Shree Residency, Manjalpur"
                  maxLength="255"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* Address Line 2 */}
              <div className="mb-4">

                <label
                  htmlFor="customer-address-line-2"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Address Line 2

                  <span className="ml-2 text-xs font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <input
                  id="customer-address-line-2"
                  name="addressLine2"
                  type="text"
                  value={
                    addressForm.addressLine2
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="Apartment, floor, block, etc."
                  maxLength="255"
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* City + State */}
              <div className="mb-4 grid gap-4 sm:grid-cols-2">

                {/* City */}
                <div>

                  <label
                    htmlFor="customer-city"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    City

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="customer-city"
                    name="city"
                    type="text"
                    value={
                      addressForm.city
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Vadodara"
                    maxLength="100"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                </div>

                {/* State */}
                <div>

                  <label
                    htmlFor="customer-state"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    State

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="customer-state"
                    name="state"
                    type="text"
                    value={
                      addressForm.state
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Gujarat"
                    maxLength="100"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                </div>

              </div>

              {/* Pincode */}
              <div className="mb-4">

                <label
                  htmlFor="customer-pincode"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Pincode

                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="customer-pincode"
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  value={
                    addressForm.pincode
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="Enter 6-digit pincode"
                  maxLength="6"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* Landmark */}
              <div className="mb-4">

                <label
                  htmlFor="customer-landmark"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Landmark

                  <span className="ml-2 text-xs font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <input
                  id="customer-landmark"
                  name="landmark"
                  type="text"
                  value={
                    addressForm.landmark
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="e.g. Near ABC School"
                  maxLength="255"
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* Address Type */}
              <div className="mb-5">

                <label
                  htmlFor="customer-address-type"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Address Type
                </label>

                <select
                  id="customer-address-type"
                  name="addressType"
                  value={
                    addressForm.addressType
                  }
                  onChange={
                    handleAddressChange
                  }
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="Home">
                    Home
                  </option>

                  <option value="Work">
                    Work
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

              </div>

              {/* Message */}
              {addressMessage && (
                <div
                  className={`mb-5 rounded-xl px-4 py-3 text-sm ${
                    addressMessageType ===
                    'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {addressMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    handleCloseEditAddress
                  }
                  disabled={
                    isSavingAddress
                  }
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSavingAddress
                  }
                  className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAddress
                    ? 'Saving...'
                    : 'Save Address'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default CustomerDashboard