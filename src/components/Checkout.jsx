import { useState } from 'react'

function Checkout({
  cart,
  onBackToCart,
  onPlaceOrder,
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    instructions: '',
    deliveryType: 'delivery',
    paymentMethod: 'cash',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const deliveryCharge =
    formData.deliveryType === 'delivery' ? 30 : 0

  const total = subtotal + deliveryCharge

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  const saveOrder = async ({
    paymentMethod,
    paymentStatus = 'pending',
    razorpayOrderId = null,
    razorpayPaymentId = null,
    razorpaySignature = null,
  }) => {
    const order = {
      customer: {
        name: formData.name,
        phone: formData.phone,
      },

      items: cart,

      deliveryType: formData.deliveryType,

      address:
        formData.deliveryType === 'delivery'
          ? formData.address
          : null,

      landmark:
        formData.deliveryType === 'delivery'
          ? formData.landmark
          : null,

      instructions: formData.instructions,

      paymentMethod,
      paymentStatus,

      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,

      subtotal,
      deliveryCharge,
      total,
    }

    const response = await fetch(
      'http://localhost:5001/api/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message || 'Failed to place order'
      )
    }

    return data.order
  }

  const handleOnlinePayment = async () => {
    try {
      setIsSubmitting(true)
      setError('')

      // Step 1:
      // Send cart information to the backend.
      // The backend calculates the real price
      // directly from PostgreSQL.
      const createResponse = await fetch(
        'http://localhost:5001/api/orders/payment/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),

            deliveryType:
              formData.deliveryType,
          }),
        }
      )

      const createData =
        await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(
          createData.message ||
            'Failed to create payment order'
        )
      }

      const razorpayOrder = createData.order

      // Step 2:
      // Open Razorpay Checkout
      const options = {
        key: 'rzp_test_TdpE7m32oogB4S',

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        name: "Jaya's Kitchen",

        description: 'Online Food Order',

        order_id: razorpayOrder.id,

        prefill: {
          name: formData.name,
          contact: formData.phone,
        },

        theme: {
          color: '#15803d',
        },

        handler: async function (paymentResponse) {
          try {
            // Step 3:
            // Verify payment on our backend.
            const verifyResponse = await fetch(
              'http://localhost:5001/api/orders/payment/verify',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
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

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  'Payment verification failed'
              )
            }

            // Step 4:
            // Save the order only after
            // successful payment verification.
            const savedOrder =
              await saveOrder({
                paymentMethod: 'online',

                paymentStatus: 'paid',

                razorpayOrderId:
                  paymentResponse.razorpay_order_id,

                razorpayPaymentId:
                  paymentResponse.razorpay_payment_id,

                razorpaySignature:
                  paymentResponse.razorpay_signature,
              })

            onPlaceOrder(savedOrder)
          } catch (error) {
            console.error(
              'Online payment processing failed:',
              error
            )

            setError(
              error.message ||
                'Payment was successful, but we could not complete your order. Please contact us.'
            )

            setIsSubmitting(false)
          }
        },

        modal: {
          ondismiss: function () {
            setIsSubmitting(false)

            setError(
              'Payment was cancelled. Your order has not been placed.'
            )
          },
        },
      }

      const razorpay =
        new window.Razorpay(options)

      razorpay.on(
        'payment.failed',
        function (response) {
          console.error(
            'Razorpay payment failed:',
            response.error
          )

          setError(
            response.error?.description ||
              'Payment failed. Please try again.'
          )

          setIsSubmitting(false)
        }
      )

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

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setError('')

    try {
      if (
        formData.paymentMethod === 'online'
      ) {
        await handleOnlinePayment()
        return
      }

      const savedOrder = await saveOrder({
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      })

      onPlaceOrder(savedOrder)
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

  return (
    <section className="min-h-screen bg-[#FFFDF5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <button
            onClick={onBackToCart}
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Cart
          </button>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your details to place your order.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Customer Details
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Mobile Number *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
            </div>

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
                    onChange={handleChange}
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
                    onChange={handleChange}
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

            {formData.deliveryType ===
              'delivery' && (
              <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Delivery Address
                </h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Address *
                    </label>

                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows="3"
                      placeholder="House / Flat, Street, Area"
                      className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Landmark
                    </label>

                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="Nearby landmark"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Additional Instructions
              </h2>

              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="3"
                placeholder="Any special instructions for your order?"
                className="mt-5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

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
                    onChange={handleChange}
                    className="mr-3"
                  />

                  <div>
                    <p className="font-semibold">
                      Cash on Delivery / Pickup
                    </p>

                    <p className="text-sm text-gray-500">
                      Pay when you receive your order.
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
                    onChange={handleChange}
                    className="mr-3"
                  />

                  <div>
                    <p className="font-semibold">
                      Online Payment
                    </p>

                    <p className="text-sm text-gray-500">
                      Pay securely online with Razorpay.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-6 rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4"
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

                    <p className="font-semibold">
                      ₹
                      {item.price *
                        item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-5 border-t border-gray-100" />

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>

                  <span>
                    {deliveryCharge === 0
                      ? 'Free'
                      : `₹${deliveryCharge}`}
                  </span>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-full bg-green-700 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Processing...'
                  : formData.paymentMethod ===
                      'online'
                    ? `Pay Online · ₹${total}`
                    : `Place Order · ₹${total}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

export default Checkout