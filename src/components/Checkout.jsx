import { useEffect, useState } from 'react'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5001'

function Checkout({
  cart,
  onBackToCart,
  onPlaceOrder,
}) {
  // --------------------------------------------------
  // GET LOGGED-IN CUSTOMER
  // --------------------------------------------------

  const savedCustomer = JSON.parse(
    localStorage.getItem('customer') || 'null'
  )

  // --------------------------------------------------
  // CHECKOUT FORM
  // --------------------------------------------------

  const [formData, setFormData] = useState({
    name: savedCustomer?.name || '',
    phone: savedCustomer?.phone || '',
    instructions: '',
    deliveryType: 'delivery',
    paymentMethod: 'cash',
  })

  // --------------------------------------------------
  // ADDRESS STATE
  // --------------------------------------------------

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] =
    useState(null)

  const [isLoadingAddresses, setIsLoadingAddresses] =
    useState(true)

  const [isAddingAddress, setIsAddingAddress] =
    useState(false)

  const [isSavingAddress, setIsSavingAddress] =
    useState(false)

  const [addressError, setAddressError] =
    useState('')

  const [newAddressForm, setNewAddressForm] =
    useState({
      label: 'Home',
      fullName: savedCustomer?.name || '',
      phone: savedCustomer?.phone || '',
      houseNumber: '',
      street: '',
      addressLine2: '',
      landmark: '',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '',
    })

  // --------------------------------------------------
  // GENERAL CHECKOUT STATE
  // --------------------------------------------------

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [error, setError] = useState('')

  // --------------------------------------------------
  // LOAD SAVED ADDRESSES
  // --------------------------------------------------

  const fetchAddresses = async () => {
    const token =
      localStorage.getItem('customerToken')

    if (!token) {
      setIsLoadingAddresses(false)
      setError(
        'Please login to place your order.'
      )
      return
    }

    try {
      setIsLoadingAddresses(true)
      setAddressError('')

      const response = await fetch(
        `${API_URL}/api/otp/me/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(
            'customerToken'
          )

          localStorage.removeItem(
            'customer'
          )

          throw new Error(
            'Your session has expired. Please login again.'
          )
        }

        throw new Error(
          data.message ||
            'Failed to load saved addresses.'
        )
      }

      const loadedAddresses =
        data.addresses || []

      setAddresses(loadedAddresses)

      // ------------------------------------------------
      // Select existing default address automatically.
      // ------------------------------------------------

      if (loadedAddresses.length > 0) {
        setSelectedAddressId(
          (currentSelectedId) => {
            const selectedStillExists =
              loadedAddresses.some(
                (address) =>
                  String(address.id) ===
                  String(currentSelectedId)
              )

            if (selectedStillExists) {
              return currentSelectedId
            }

            const defaultAddress =
              loadedAddresses.find(
                (address) =>
                  address.is_default
              )

            return (
              defaultAddress?.id ||
              loadedAddresses[0].id
            )
          }
        )
      } else {
        setSelectedAddressId(null)
      }
    } catch (error) {
      console.error(
        'Failed to load addresses:',
        error
      )

      setAddressError(
        error.message ||
          'Unable to load saved addresses.'
      )
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  // --------------------------------------------------
  // GET SELECTED ADDRESS
  // --------------------------------------------------

  const selectedAddress =
    addresses.find(
      (address) =>
        String(address.id) ===
        String(selectedAddressId)
    ) || null

  // --------------------------------------------------
  // FORMAT ADDRESS FOR ORDER
  // --------------------------------------------------

  const buildFullAddress = (
    address
  ) => {
    if (!address) {
      return ''
    }

    const parts = [
      address.house_number,
      address.street,
      address.address_line2,
      address.city,
      address.state,
      address.pincode,
    ].filter(
      (part) =>
        part &&
        String(part).trim()
    )

    return parts.join(', ')
  }

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  // --------------------------------------------------
  // NEW ADDRESS FORM CHANGE
  // --------------------------------------------------

  const handleNewAddressChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target

    setNewAddressForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    )

    setAddressError('')
  }

  // --------------------------------------------------
  // OPEN ADD ADDRESS
  // --------------------------------------------------

  const handleOpenAddAddress = () => {
    setAddressError('')

    setNewAddressForm({
      label: 'Home',
      fullName:
        formData.name ||
        savedCustomer?.name ||
        '',
      phone:
        formData.phone ||
        savedCustomer?.phone ||
        '',
      houseNumber: '',
      street: '',
      addressLine2: '',
      landmark: '',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '',
    })

    setIsAddingAddress(true)
  }

  // --------------------------------------------------
  // CLOSE ADD ADDRESS
  // --------------------------------------------------

  const handleCloseAddAddress = () => {
    if (isSavingAddress) {
      return
    }

    setIsAddingAddress(false)
    setAddressError('')
  }

  // --------------------------------------------------
  // SAVE NEW ADDRESS
  // --------------------------------------------------

  const handleSaveNewAddress =
    async (event) => {
      event.preventDefault()

      const token =
        localStorage.getItem(
          'customerToken'
        )

      if (!token) {
        setAddressError(
          'Please login to save an address.'
        )
        return
      }

      const cleanLabel =
        newAddressForm.label.trim()

      const cleanFullName =
        newAddressForm.fullName.trim()

      const cleanPhone =
        newAddressForm.phone
          .replace(/\D/g, '')
          .trim()

      const cleanHouseNumber =
        newAddressForm.houseNumber.trim()

      const cleanStreet =
        newAddressForm.street.trim()

      const cleanAddressLine2 =
        newAddressForm.addressLine2.trim()

      const cleanLandmark =
        newAddressForm.landmark.trim()

      const cleanCity =
        newAddressForm.city.trim()

      const cleanState =
        newAddressForm.state.trim()

      const cleanPincode =
        newAddressForm.pincode
          .replace(/\D/g, '')
          .trim()

      // ----------------------------------------------
      // VALIDATION
      // ----------------------------------------------

      if (
        !['Home', 'Work', 'Other'].includes(
          cleanLabel
        )
      ) {
        setAddressError(
          'Please select Home, Work or Other.'
        )
        return
      }

      if (!cleanFullName) {
        setAddressError(
          'Please enter your full name.'
        )
        return
      }

      if (!/^\d{10}$/.test(cleanPhone)) {
        setAddressError(
          'Please enter a valid 10-digit mobile number.'
        )
        return
      }

      if (!cleanHouseNumber) {
        setAddressError(
          'Please enter your house, flat or building number.'
        )
        return
      }

      if (!cleanStreet) {
        setAddressError(
          'Please enter your street, area or society.'
        )
        return
      }

      if (!cleanCity) {
        setAddressError(
          'Please enter your city.'
        )
        return
      }

      if (!cleanState) {
        setAddressError(
          'Please enter your state.'
        )
        return
      }

      if (!/^\d{6}$/.test(cleanPincode)) {
        setAddressError(
          'Please enter a valid 6-digit pincode.'
        )
        return
      }

      try {
        setIsSavingAddress(true)
        setAddressError('')

        const response = await fetch(
          `${API_URL}/api/otp/me/addresses`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              label: cleanLabel,
              fullName:
                cleanFullName,
              phone: cleanPhone,
              houseNumber:
                cleanHouseNumber,
              street:
                cleanStreet,
              addressLine2:
                cleanAddressLine2,
              landmark:
                cleanLandmark,
              city: cleanCity,
              state: cleanState,
              pincode:
                cleanPincode,
            }),
          }
        )

        const data =
          await response.json()

        if (!response.ok) {
          if (
            response.status === 401
          ) {
            localStorage.removeItem(
              'customerToken'
            )

            localStorage.removeItem(
              'customer'
            )
          }

          throw new Error(
            data.message ||
              'Failed to save address.'
          )
        }

        // --------------------------------------------
        // Reload addresses.
        // --------------------------------------------

        await fetchAddresses()

        // --------------------------------------------
        // Automatically select newly created address.
        // --------------------------------------------

        if (data.address?.id) {
          setSelectedAddressId(
            data.address.id
          )
        }

        // Update customer details using
        // the newly added address.
        setFormData(
          (current) => ({
            ...current,
            name:
              cleanFullName ||
              current.name,
            phone:
              cleanPhone ||
              current.phone,
          })
        )

        setIsAddingAddress(false)
      } catch (error) {
        console.error(
          'Failed to save address:',
          error
        )

        setAddressError(
          error.message ||
            'Unable to save address.'
        )
      } finally {
        setIsSavingAddress(false)
      }
    }

  // --------------------------------------------------
  // ADDRESS SELECTION
  // --------------------------------------------------

  const handleSelectAddress = (
    addressId
  ) => {
    setSelectedAddressId(
      addressId
    )

    setError('')
  }

  // --------------------------------------------------
  // SAVE ORDER
  // --------------------------------------------------

  const saveOrder = async ({
    paymentMethod,
    paymentStatus = 'pending',
    razorpayOrderId = null,
    razorpayPaymentId = null,
    razorpaySignature = null,
  }) => {
    const token =
      localStorage.getItem(
        'customerToken'
      )

    if (!token) {
      throw new Error(
        'Please login to place your order.'
      )
    }

    // ----------------------------------------------
    // Make sure a delivery address is selected.
    // ----------------------------------------------

    if (
      formData.deliveryType ===
        'delivery' &&
      !selectedAddress
    ) {
      throw new Error(
        'Please select a delivery address.'
      )
    }

    const order = {
      customer: {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      },

      items: cart,

      deliveryType:
        formData.deliveryType,

      address:
        formData.deliveryType ===
        'delivery'
          ? buildFullAddress(
              selectedAddress
            )
          : null,

      landmark:
        formData.deliveryType ===
          'delivery' &&
        selectedAddress
          ? (
              selectedAddress.landmark ||
              ''
            ).trim()
          : null,

      instructions:
        formData.instructions.trim(),

      paymentMethod,
      paymentStatus,

      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,

      // These are only for frontend display.
      // The backend recalculates the real values.
      subtotal,
      deliveryCharge,
      total,
    }

    const response = await fetch(
      `${API_URL}/api/orders`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(order),
      }
    )

    const data =
      await response.json()

    if (!response.ok) {
      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          'customerToken'
        )

        localStorage.removeItem(
          'customer'
        )

        throw new Error(
          'Your session has expired. Please login again.'
        )
      }

      throw new Error(
        data.message ||
          'Failed to place order'
      )
    }

    return data.order
  }

  // --------------------------------------------------
  // ONLINE PAYMENT
  // --------------------------------------------------

  const handleOnlinePayment =
    async () => {
      try {
        setIsSubmitting(true)
        setError('')

        const token =
          localStorage.getItem(
            'customerToken'
          )

        if (!token) {
          throw new Error(
            'Please login to place your order.'
          )
        }

        if (!selectedAddress) {
          throw new Error(
            'Please select a delivery address.'
          )
        }

        // --------------------------------------------
        // STEP 1
        // Ask backend to create Razorpay order.
        // Backend calculates the real amount.
        // --------------------------------------------

        const createResponse =
          await fetch(
            `${API_URL}/api/orders/payment/create-order`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                items: cart.map(
                  (item) => ({
                    id: item.id,
                    quantity:
                      item.quantity,
                  })
                ),

                deliveryType:
                  formData.deliveryType,
              }),
            }
          )

        const createData =
          await createResponse.json()

        if (!createResponse.ok) {
          if (
            createResponse.status ===
            401
          ) {
            localStorage.removeItem(
              'customerToken'
            )

            localStorage.removeItem(
              'customer'
            )
          }

          throw new Error(
            createData.message ||
              'Failed to create payment order'
          )
        }

        const razorpayOrder =
          createData.order

        // --------------------------------------------
        // STEP 2
        // Validate backend response.
        // --------------------------------------------

        if (
          !razorpayOrder ||
          !razorpayOrder.id ||
          !razorpayOrder.amount ||
          !razorpayOrder.currency ||
          !razorpayOrder.keyId
        ) {
          throw new Error(
            'Invalid payment order received from server'
          )
        }

        if (
          typeof window.Razorpay !==
          'function'
        ) {
          throw new Error(
            'Razorpay Checkout could not be loaded. Please refresh the page and try again.'
          )
        }

        // --------------------------------------------
        // STEP 3
        // Open Razorpay Checkout.
        // --------------------------------------------

        const options = {
          key:
            razorpayOrder.keyId,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,

          name: "Jaya's Kitchen",

          description:
            'Online Food Order',

          order_id:
            razorpayOrder.id,

          prefill: {
            name:
              formData.name.trim(),

            contact:
              formData.phone.trim(),
          },

          theme: {
            color: '#15803d',
          },

          handler:
            async function (
              paymentResponse
            ) {
              try {
                // ----------------------------------
                // STEP 4
                // Verify payment on backend.
                // ----------------------------------

                const verifyResponse =
                  await fetch(
                    `${API_URL}/api/orders/payment/verify`,
                    {
                      method: 'POST',

                      headers: {
                        'Content-Type':
                          'application/json',

                        Authorization:
                          `Bearer ${token}`,
                      },

                      body: JSON.stringify({
                        razorpayOrderId:
                          paymentResponse.razorpay_order_id,

                        razorpayPaymentId:
                          paymentResponse.razorpay_payment_id,

                        razorpaySignature:
                          paymentResponse.razorpay_signature,
                      }),
                    }
                  )

                const verifyData =
                  await verifyResponse.json()

                if (
                  !verifyResponse.ok
                ) {
                  if (
                    verifyResponse.status ===
                    401
                  ) {
                    localStorage.removeItem(
                      'customerToken'
                    )

                    localStorage.removeItem(
                      'customer'
                    )
                  }

                  throw new Error(
                    verifyData.message ||
                      'Payment verification failed'
                  )
                }

                // ----------------------------------
                // STEP 5
                // Save actual order.
                // ----------------------------------

                if (
                  verifyData.alreadyProcessed
                ) {
                  throw new Error(
                    'This payment has already been processed. Please contact Jaya\'s Kitchen if you do not see your order confirmation.'
                  )
                }

                const savedOrder =
                  await saveOrder({
                    paymentMethod:
                      'online',

                    paymentStatus:
                      'paid',

                    razorpayOrderId:
                      paymentResponse.razorpay_order_id,

                    razorpayPaymentId:
                      paymentResponse.razorpay_payment_id,

                    razorpaySignature:
                      paymentResponse.razorpay_signature,
                  })

                onPlaceOrder(
                  savedOrder
                )
              } catch (error) {
                console.error(
                  'Online payment processing failed:',
                  error
                )

                setError(
                  error.message ||
                    'Payment was successful, but we could not complete your order. Please contact Jaya\'s Kitchen.'
                )

                setIsSubmitting(false)
              }
            },

          modal: {
            ondismiss:
              function () {
                setIsSubmitting(
                  false
                )

                setError(
                  'Payment was cancelled. Your order has not been placed.'
                )
              },
          },
        }

        const razorpay =
          new window.Razorpay(
            options
          )

        // --------------------------------------------
        // PAYMENT FAILED
        // --------------------------------------------

        razorpay.on(
          'payment.failed',
          function (response) {
            console.error(
              'Razorpay payment failed:',
              response.error
            )

            setError(
              response.error
                ?.description ||
                'Payment failed. Please try again.'
            )

            setIsSubmitting(
              false
            )
          }
        )

        // --------------------------------------------
        // OPEN RAZORPAY
        // --------------------------------------------

        razorpay.open()
      } catch (error) {
        console.error(
          'Online payment initialization failed:',
          error
        )

        setError(
          error.message ||
            'Unable to start online payment.'
        )

        setIsSubmitting(false)
      }
    }

  // --------------------------------------------------
  // SUBMIT CHECKOUT
  // --------------------------------------------------

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault()

    setIsSubmitting(true)
    setError('')

    try {
      // --------------------------------------------
      // DELIVERY VALIDATION
      // --------------------------------------------

      if (
        formData.deliveryType ===
          'delivery' &&
        !selectedAddress
      ) {
        throw new Error(
          'Please select a delivery address before placing your order.'
        )
      }

      // --------------------------------------------
      // ONLINE PAYMENT
      // --------------------------------------------

      if (
        formData.paymentMethod ===
        'online'
      ) {
        await handleOnlinePayment()
        return
      }

      // --------------------------------------------
      // CASH ORDER
      // --------------------------------------------

      const savedOrder =
        await saveOrder({
          paymentMethod: 'cash',
          paymentStatus: 'pending',
        })

      onPlaceOrder(
        savedOrder
      )
    } catch (error) {
      console.error(
        'Order submission failed:',
        error
      )

      setError(
        error.message ||
          'Something went wrong while placing your order.'
      )

      setIsSubmitting(false)
    }
  }

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      item.price *
        item.quantity,
    0
  )

  const deliveryCharge =
    formData.deliveryType ===
    'delivery'
      ? 30
      : 0

  const total =
    subtotal + deliveryCharge

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <section className="min-h-screen bg-[#FFFDF5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------ */}

        <div className="mb-8">
          <button
            type="button"
            onClick={onBackToCart}
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Cart
          </button>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-600">
            Select your delivery address
            and complete your order.
          </p>
        </div>

        {/* ------------------------------------------ */}
        {/* ERROR */}
        {/* ------------------------------------------ */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          {/* ======================================== */}
          {/* CUSTOMER + DELIVERY */}
          {/* ======================================== */}

          <div className="space-y-6">
            {/* -------------------------------------- */}
            {/* CUSTOMER DETAILS */}
            {/* -------------------------------------- */}

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Customer Details
              </h2>

              <div className="mt-5">
                <label className="text-sm font-semibold text-gray-700">
                  Full Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Your mobile number is
                  taken from your selected
                  delivery address.
                </p>
              </div>
            </div>

            {/* -------------------------------------- */}
            {/* DELIVERY OPTIONS */}
            {/* -------------------------------------- */}

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Delivery Options
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="cursor-pointer rounded-xl border border-green-200 p-4">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="delivery"
                    checked={
                      formData.deliveryType ===
                      'delivery'
                    }
                    onChange={
                      handleChange
                    }
                    className="mr-2"
                  />

                  <span className="font-semibold">
                    Home Delivery
                  </span>

                  <p className="mt-1 pl-5 text-sm text-gray-500">
                    Delivery charge ₹30
                  </p>
                </label>

                <label className="cursor-pointer rounded-xl border border-green-200 p-4">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="pickup"
                    checked={
                      formData.deliveryType ===
                      'pickup'
                    }
                    onChange={
                      handleChange
                    }
                    className="mr-2"
                  />

                  <span className="font-semibold">
                    Pickup
                  </span>

                  <p className="mt-1 pl-5 text-sm text-gray-500">
                    No delivery charge
                  </p>
                </label>
              </div>
            </div>

            {/* -------------------------------------- */}
            {/* DELIVERY ADDRESS */}
            {/* -------------------------------------- */}

            {formData.deliveryType ===
              'delivery' && (
              <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Delivery Address
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Select where you want
                      this order delivered.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleOpenAddAddress
                    }
                    className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
                  >
                    + Add Address
                  </button>
                </div>

                {/* ADDRESS LOADING */}

                {isLoadingAddresses && (
                  <div className="mt-5 rounded-xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-green-700">
                    Loading your saved
                    addresses...
                  </div>
                )}

                {/* ADDRESS ERROR */}

                {!isLoadingAddresses &&
                  addressError && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {addressError}
                    </div>
                  )}

                {/* NO ADDRESSES */}

                {!isLoadingAddresses &&
                  !addressError &&
                  addresses.length ===
                    0 && (
                    <div className="mt-5 rounded-2xl border border-dashed border-green-300 bg-green-50 p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                        📍
                      </div>

                      <h3 className="mt-4 font-bold text-gray-900">
                        No saved addresses
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        Add a delivery address
                        to continue with home
                        delivery.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleOpenAddAddress
                        }
                        className="mt-4 rounded-full bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800"
                      >
                        + Add Your First
                        Address
                      </button>
                    </div>
                  )}

                {/* SAVED ADDRESSES */}

                {!isLoadingAddresses &&
                  addresses.length >
                    0 && (
                    <div className="mt-5 space-y-4">
                      {addresses.map(
                        (address) => {
                          const isSelected =
                            String(
                              address.id
                            ) ===
                            String(
                              selectedAddressId
                            )

                          return (
                            <label
                              key={
                                address.id
                              }
                              className={`block cursor-pointer rounded-2xl border p-4 transition ${
                                isSelected
                                  ? 'border-green-600 bg-green-50 ring-2 ring-green-100'
                                  : 'border-gray-200 bg-white hover:border-green-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="selectedAddress"
                                  value={
                                    address.id
                                  }
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    handleSelectAddress(
                                      address.id
                                    )
                                  }
                                  className="mt-1 h-4 w-4 accent-green-700"
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-gray-900">
                                      {
                                        address.label
                                      }
                                    </span>

                                    {address.is_default && (
                                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                        Default
                                      </span>
                                    )}

                                    {isSelected && (
                                      <span className="rounded-full bg-green-700 px-2.5 py-1 text-xs font-bold text-white">
                                        Selected
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-2 font-medium text-gray-900">
                                    {
                                      address.full_name
                                    }
                                  </p>

                                  <p className="mt-1 text-sm text-gray-600">
                                    {
                                      address.phone
                                    }
                                  </p>

                                  <p className="mt-2 text-sm leading-6 text-gray-600">
                                    {buildFullAddress(
                                      address
                                    )}
                                  </p>

                                  {address.landmark && (
                                    <p className="mt-1 text-sm text-gray-500">
                                      <span className="font-medium">
                                        Landmark:
                                      </span>{' '}
                                      {
                                        address.landmark
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>

                              <p className="mt-3 pl-7 text-xs text-gray-500">
                                To edit this
                                address, go to
                                Settings → Delivery
                                Address.
                              </p>
                            </label>
                          )
                        }
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* -------------------------------------- */}
            {/* INSTRUCTIONS */}
            {/* -------------------------------------- */}

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Additional Instructions
              </h2>

              <textarea
                name="instructions"
                value={
                  formData.instructions
                }
                onChange={
                  handleChange
                }
                rows="3"
                placeholder="Any special instructions for your order?"
                className="mt-5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* -------------------------------------- */}
            {/* PAYMENT METHOD */}
            {/* -------------------------------------- */}

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Payment Method
              </h2>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center rounded-xl border border-green-200 p-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={
                      formData.paymentMethod ===
                      'cash'
                    }
                    onChange={
                      handleChange
                    }
                    className="mr-3"
                  />

                  <div>
                    <p className="font-semibold">
                      Cash on Delivery /
                      Pickup
                    </p>

                    <p className="text-sm text-gray-500">
                      Pay when you receive
                      your order.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center rounded-xl border border-green-200 p-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={
                      formData.paymentMethod ===
                      'online'
                    }
                    onChange={
                      handleChange
                    }
                    className="mr-3"
                  />

                  <div>
                    <p className="font-semibold">
                      Online Payment
                    </p>

                    <p className="text-sm text-gray-500">
                      Pay securely online
                      with Razorpay.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ======================================== */}
          {/* ORDER SUMMARY */}
          {/* ======================================== */}

          <div>
            <div className="sticky top-6 rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4">
                {cart.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.name}
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

                      <p className="font-semibold">
                        ₹
                        {item.price *
                          item.quantity}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="my-5 border-t border-gray-100" />

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    Delivery
                  </span>

                  <span>
                    {deliveryCharge ===
                    0
                      ? 'Free'
                      : `₹${deliveryCharge}`}
                  </span>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-gray-900">
                  <span>
                    Total
                  </span>

                  <span>
                    ₹{total}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (formData.deliveryType ===
                    'delivery' &&
                    !selectedAddress)
                }
                className="mt-6 w-full rounded-full bg-green-700 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Processing...'
                  : formData.paymentMethod ===
                      'online'
                    ? `Pay Online · ₹${total}`
                    : `Place Order · ₹${total}`}
              </button>

              {formData.deliveryType ===
                'delivery' &&
                !selectedAddress && (
                  <p className="mt-3 text-center text-xs font-medium text-red-600">
                    Please select a delivery
                    address.
                  </p>
                )}
            </div>
          </div>
        </form>
      </div>

      {/* ================================================== */}
      {/* ADD ADDRESS MODAL */}
      {/* ================================================== */}

      {isAddingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#FFFDF5] shadow-2xl">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 border-b border-green-100 bg-[#FFFDF5] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Add New Address
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Save a delivery address to
                    your account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseAddAddress
                  }
                  disabled={
                    isSavingAddress
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-gray-500 shadow-sm hover:text-gray-900 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* MODAL CONTENT */}

            <form
              onSubmit={
                handleSaveNewAddress
              }
              className="space-y-5 px-6 py-6"
            >
              {addressError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {addressError}
                </div>
              )}

              {/* LABEL */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Address Type *
                </label>

                <select
                  name="label"
                  value={
                    newAddressForm.label
                  }
                  onChange={
                    handleNewAddressChange
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
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

              {/* NAME + PHONE */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={
                      newAddressForm.fullName
                    }
                    onChange={
                      handleNewAddressChange
                    }
                    required
                    placeholder="Enter full name"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Mobile Number *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      newAddressForm.phone
                    }
                    onChange={
                      handleNewAddressChange
                    }
                    required
                    maxLength="10"
                    placeholder="10-digit mobile number"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              {/* HOUSE */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  House / Flat / Building No. *
                </label>

                <input
                  type="text"
                  name="houseNumber"
                  value={
                    newAddressForm.houseNumber
                  }
                  onChange={
                    handleNewAddressChange
                  }
                  required
                  placeholder="e.g. 304, B-12"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* STREET */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Street / Area / Society *
                </label>

                <input
                  type="text"
                  name="street"
                  value={
                    newAddressForm.street
                  }
                  onChange={
                    handleNewAddressChange
                  }
                  required
                  placeholder="e.g. Manjalpur, Subh Flat"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* ADDRESS LINE 2 */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Address Line 2
                  <span className="ml-1 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  name="addressLine2"
                  value={
                    newAddressForm.addressLine2
                  }
                  onChange={
                    handleNewAddressChange
                  }
                  placeholder="Apartment, floor, block, etc."
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* CITY + STATE */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    City *
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={
                      newAddressForm.city
                    }
                    onChange={
                      handleNewAddressChange
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    State *
                  </label>

                  <input
                    type="text"
                    name="state"
                    value={
                      newAddressForm.state
                    }
                    onChange={
                      handleNewAddressChange
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              {/* PINCODE */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Pincode *
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={
                    newAddressForm.pincode
                  }
                  onChange={
                    handleNewAddressChange
                  }
                  required
                  maxLength="6"
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* LANDMARK */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Landmark
                  <span className="ml-1 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  name="landmark"
                  value={
                    newAddressForm.landmark
                  }
                  onChange={
                    handleNewAddressChange
                  }
                  placeholder="Nearby landmark"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* INFO */}

              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                <strong>Note:</strong> This
                address will be saved to your
                account. You can edit or delete it
                later from Settings → Delivery
                Address.
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    handleCloseAddAddress
                  }
                  disabled={
                    isSavingAddress
                  }
                  className="rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSavingAddress
                  }
                  className="rounded-full bg-green-700 px-6 py-3 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
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
    </section>
  )
}

export default Checkout
