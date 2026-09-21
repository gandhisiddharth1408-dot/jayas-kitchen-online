import { useState } from 'react'

function Cart({
  cart,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}) {
  const [showAuthPopup, setShowAuthPopup] =
    useState(false)

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  )

  const handleCheckout = () => {
    const token =
      localStorage.getItem('customerToken')

    if (!token) {
      setShowAuthPopup(true)
      return
    }

    onCheckout()
  }

  const handleLoginSignup = () => {
    window.location.href = '/account'
  }

  return (
    <>
      {/* Cart Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />

      {/* Cart */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#FFFDF5] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-green-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Your Cart
            </h2>

            <p className="text-sm text-gray-500">
              {totalItems}{' '}
              {totalItems === 1
                ? 'item'
                : 'items'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-xl text-green-800 transition hover:bg-green-100"
          >
            ×
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">

              <div className="text-6xl">
                🛒
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Your cart is empty
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add some delicious
                homemade food to get
                started.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-green-100 bg-white p-4"
                >
                  <div className="flex justify-between gap-4">

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        ₹{item.price} each
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        onRemove(item.id)
                      }
                      className="text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>

                  </div>

                  <div className="mt-4 flex items-center justify-between">

                    {/* Quantity */}
                    <div className="flex items-center rounded-full border border-green-200">

                      <button
                        onClick={() =>
                          onDecrease(item.id)
                        }
                        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-green-700"
                      >
                        −
                      </button>

                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          onIncrease(item.id)
                        }
                        className="flex h-9 w-9 items-center justify-center text-lg font-bold text-green-700"
                      >
                        +
                      </button>

                    </div>

                    {/* Item Total */}
                    <span className="font-bold text-gray-900">
                      ₹
                      {item.price *
                        item.quantity}
                    </span>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Checkout Section */}
        {cart.length > 0 && (
          <div className="border-t border-green-100 bg-white p-5">

            <div className="flex items-center justify-between">

              <span className="text-gray-600">
                Subtotal
              </span>

              <span className="text-xl font-bold text-gray-900">
                ₹{subtotal}
              </span>

            </div>

            <p className="mt-2 text-xs text-gray-500">
              Delivery charges and final
              total will be calculated at
              checkout.
            </p>

            <button
              onClick={handleCheckout}
              className="mt-5 w-full rounded-full bg-green-700 py-3.5 font-semibold text-white transition hover:bg-green-800"
            >
              Proceed to Checkout
            </button>

          </div>
        )}
      </aside>

      {/* Login / Signup Popup */}
      {showAuthPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
          onClick={() =>
            setShowAuthPopup(false)
          }
        >

          <div
            className="relative w-full max-w-md rounded-3xl bg-[#FFFDF5] p-6 shadow-2xl sm:p-8"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

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
              onClick={handleLoginSignup}
              className="mt-6 w-full rounded-full bg-green-700 py-3.5 font-semibold text-white transition hover:bg-green-800"
            >
              Login / Signup
            </button>

            {/* Continue Shopping */}
            <button
              onClick={() =>
                setShowAuthPopup(false)
              }
              className="mt-3 w-full rounded-full border border-green-200 bg-white py-3.5 font-semibold text-green-700 transition hover:bg-green-50"
            >
              Continue Shopping
            </button>

          </div>
        </div>
      )}
    </>
  )
}

export default Cart