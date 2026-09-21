import { useEffect, useState } from 'react'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5001'

function CustomerAuth() {
  const [authMode, setAuthMode] = useState('login')
  const [loginMethod, setLoginMethod] = useState('mobile')
  const [otpSent, setOtpSent] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    otp: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const isSignup = authMode === 'signup'

  // ===============================
  // CHECK EXISTING LOGIN
  // ===============================

  useEffect(() => {
    const token =
      localStorage.getItem(
        'customerToken'
      )

    if (token) {
      window.location.href =
        '/dashboard'
    }
  }, [])

  // ===============================
  // HANDLE INPUT
  // ===============================

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setMessage('')
  }

  // ===============================
  // SWITCH LOGIN / SIGNUP
  // ===============================

  const switchAuthMode = () => {
    setAuthMode((previous) =>
      previous === 'login'
        ? 'signup'
        : 'login'
    )

    setOtpSent(false)

    setFormData({
      name: '',
      phone: '',
      email: '',
      otp: '',
    })

    setMessage('')
    setMessageType('')
  }

  // ===============================
  // SWITCH LOGIN METHOD
  // ===============================

  const switchLoginMethod = (method) => {
    setLoginMethod(method)
    setOtpSent(false)

    setFormData((previous) => ({
      ...previous,
      otp: '',
    }))

    setMessage('')
    setMessageType('')
  }

  // ===============================
  // SEND OTP
  // ===============================

  const handleSendOtp = async (event) => {
    event.preventDefault()

    setIsLoading(true)
    setMessage('')
    setMessageType('')

    try {
      // Basic frontend validation
      if (
        isSignup &&
        !formData.name.trim()
      ) {
        setMessage(
          'Please enter your full name.'
        )

        setMessageType('error')
        setIsLoading(false)
        return
      }

      if (
        (isSignup ||
          loginMethod === 'mobile') &&
        !/^[0-9]{10}$/.test(
          formData.phone.trim()
        )
      ) {
        setMessage(
          'Please enter a valid 10-digit mobile number.'
        )

        setMessageType('error')
        setIsLoading(false)
        return
      }

      if (
        (isSignup ||
          loginMethod === 'email') &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.email.trim()
        )
      ) {
        setMessage(
          'Please enter a valid email address.'
        )

        setMessageType('error')
        setIsLoading(false)
        return
      }

      const response = await fetch(
        `${API_URL}/api/otp/send`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            method: loginMethod,
            phone:
              formData.phone.trim(),
            email:
              formData.email
                .trim()
                .toLowerCase(),
            name: isSignup
              ? formData.name.trim()
              : undefined,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to send OTP.'
        )
      }

      setOtpSent(true)

      setMessage(
        'OTP generated successfully. Check the server terminal for the OTP.'
      )

      setMessageType('success')
    } catch (error) {
      console.error(
        'Send OTP error:',
        error
      )

      setMessage(
        error.message ||
          'Unable to send OTP. Please try again.'
      )

      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  // ===============================
  // VERIFY OTP
  // ===============================

  const handleVerifyOtp = async (
    event
  ) => {
    event.preventDefault()

    setIsLoading(true)
    setMessage('')
    setMessageType('')

    try {
      if (
        !/^[0-9]{6}$/.test(
          formData.otp.trim()
        )
      ) {
        setMessage(
          'Please enter a valid 6-digit OTP.'
        )

        setMessageType('error')
        setIsLoading(false)
        return
      }

      const response = await fetch(
        `${API_URL}/api/otp/verify`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            method: loginMethod,
            phone:
              formData.phone.trim(),
            email:
              formData.email
                .trim()
                .toLowerCase(),
            otp:
              formData.otp.trim(),
            name: isSignup
              ? formData.name.trim()
              : undefined,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to verify OTP.'
        )
      }

      // ===============================
      // SAVE JWT
      // ===============================

      localStorage.setItem(
        'customerToken',
        data.token
      )

      // ===============================
      // SAVE CUSTOMER
      // ===============================

      localStorage.setItem(
        'customer',
        JSON.stringify(
          data.customer
        )
      )

      setMessage(
        isSignup
          ? 'Account created successfully!'
          : 'Login successful!'
      )

      setMessageType('success')

      console.log(
        'Customer authenticated:',
        data.customer
      )

      // ===============================
      // REDIRECT TO DASHBOARD
      // ===============================

      setTimeout(() => {
        window.location.href =
          '/dashboard'
      }, 700)
    } catch (error) {
      console.error(
        'Verify OTP error:',
        error
      )

      setMessage(
        error.message ||
          'Unable to verify OTP. Please try again.'
      )

      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  // ===============================
  // RESEND OTP
  // ===============================

  const handleResendOtp = async () => {
    setIsLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await fetch(
        `${API_URL}/api/otp/send`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            method: loginMethod,
            phone:
              formData.phone.trim(),
            email:
              formData.email
                .trim()
                .toLowerCase(),
            name: isSignup
              ? formData.name.trim()
              : undefined,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to resend OTP.'
        )
      }

      setMessage(
        'New OTP generated successfully. Check the server terminal.'
      )

      setMessageType('success')

      setFormData((previous) => ({
        ...previous,
        otp: '',
      }))
    } catch (error) {
      console.error(
        'Resend OTP error:',
        error
      )

      setMessage(
        error.message ||
          'Unable to resend OTP.'
      )

      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-green-100 bg-white p-6 shadow-xl sm:p-8">

          {/* Logo / Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-green-800">
              Jaya's Kitchen
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Home Tiffin & Catering
            </p>

            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-green-600" />

            <h2 className="mt-6 text-2xl font-bold text-gray-800">
              {isSignup
                ? 'Create Your Account'
                : 'Welcome'}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {isSignup
                ? 'Create an account to easily manage your orders.'
                : 'Login to view your orders and track deliveries.'}
            </p>
          </div>

          {/* Login / Signup Toggle */}
          <div className="mb-6 flex rounded-xl bg-green-50 p-1">

            <button
              type="button"
              onClick={() => {
                if (
                  authMode !==
                  'login'
                ) {
                  switchAuthMode()
                }
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                authMode === 'login'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-green-700'
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  authMode !==
                  'signup'
                ) {
                  switchAuthMode()
                }
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                authMode === 'signup'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-green-700'
              }`}
            >
              Create Account
            </button>

          </div>

          {/* Login Method */}
          {!isSignup && (
            <div className="mb-6">

              <p className="mb-2 text-sm font-medium text-gray-700">
                Login using
              </p>

              <div className="grid grid-cols-2 gap-3">

                {/* Mobile */}
                <button
                  type="button"
                  onClick={() =>
                    switchLoginMethod(
                      'mobile'
                    )
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    loginMethod === 'mobile'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                  }`}
                >
                  📱 Mobile
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={() =>
                    switchLoginMethod(
                      'email'
                    )
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    loginMethod === 'email'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                  }`}
                >
                  ✉️ Email
                </button>

              </div>
            </div>
          )}

          {/* Signup Fields */}
          {isSignup && (
            <div className="mb-4">

              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Full Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={
                  handleChange
                }
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

            </div>
          )}

          {/* Mobile Field */}
          {(isSignup ||
            loginMethod ===
              'mobile') && (
            <div className="mb-4">

              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Mobile Number
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength="10"
                value={formData.phone}
                onChange={
                  handleChange
                }
                placeholder="Enter 10-digit mobile number"
                required
                className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

            </div>
          )}

          {/* Email Field */}
          {(isSignup ||
            loginMethod ===
              'email') && (
            <div className="mb-4">

              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email Address
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={
                  handleChange
                }
                placeholder="Enter your email address"
                required
                className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

            </div>
          )}

          {/* OTP Field */}
          {otpSent && (
            <div className="mb-4">

              <label
                htmlFor="otp"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Enter OTP
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={formData.otp}
                onChange={
                  handleChange
                }
                placeholder="Enter 6-digit OTP"
                required
                className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-center text-lg tracking-[0.4em] outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              <div className="mt-2 flex items-center justify-between">

                <button
                  type="button"
                  onClick={
                    handleResendOtp
                  }
                  disabled={
                    isLoading
                  }
                  className="text-xs font-semibold text-green-700 transition hover:text-green-800 disabled:opacity-50"
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false)

                    setFormData(
                      (previous) => ({
                        ...previous,
                        otp: '',
                      })
                    )

                    setMessage('')
                    setMessageType('')
                  }}
                  className="text-xs text-gray-400 transition hover:text-gray-600"
                >
                  Change{' '}
                  {loginMethod ===
                  'mobile'
                    ? 'number'
                    : 'email'}
                </button>

              </div>
            </div>
          )}

          {/* Required Fields Note */}
          <p className="mb-4 text-xs text-gray-400">
            <span className="text-red-500">
              *
            </span>{' '}
            Required fields
          </p>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                messageType ===
                'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit */}
          {!otpSent ? (
            <form
              onSubmit={
                handleSendOtp
              }
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Please wait...'
                  : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={
                handleVerifyOtp
              }
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Verifying...'
                  : isSignup
                  ? 'Verify OTP & Create Account'
                  : 'Verify OTP & Login'}
              </button>
            </form>
          )}

          {/* Bottom Switch */}
          <div className="mt-6 text-center text-sm text-gray-500">

            {isSignup
              ? 'Already have an account?'
              : "Don't have an account?"}

            <button
              type="button"
              onClick={
                switchAuthMode
              }
              className="ml-1 font-semibold text-green-700 transition hover:text-green-800"
            >
              {isSignup
                ? 'Login'
                : 'Create Account'}
            </button>

          </div>

          {/* Back to Home */}
          <div className="mt-5 text-center">

            <a
              href="/"
              className="text-sm text-gray-400 transition hover:text-green-700"
            >
              ← Back to Home
            </a>

          </div>

        </div>
      </div>
    </div>
  )
}

export default CustomerAuth