import { useState } from 'react'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001'

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/admin/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            'Invalid username or password.'
        )
        return
      }

      if (data.success && data.token) {
        localStorage.setItem(
          'jayasKitchenAdminToken',
          data.token
        )

        onLogin()
        return
      }

      setError('Login failed. Please try again.')
    } catch (error) {
      console.error('Admin login error:', error)

      setError(
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-semibold text-green-700">
            Jaya's Kitchen
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your orders, menu and
            customers.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-green-100 bg-white p-6 shadow-lg sm:p-8"
        >
          <div>
            <label
              htmlFor="admin-username"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Username
            </label>

            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
            />
          </div>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-full bg-green-700 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <a
            href="/"
            className="mt-4 block text-center text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Customer Website
          </a>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin