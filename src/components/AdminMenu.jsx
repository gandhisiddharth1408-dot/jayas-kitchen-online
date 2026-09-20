import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  isPopular: false,
  isAvailable: true,
}

function AdminMenu({ onAuthExpired }) {
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

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

  const fetchMenu = async () => {
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
        `${API_URL}/api/orders/admin/menu`,
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
          data.message || 'Failed to load menu'
        )
      }

      setMenuItems(data.menuItems || [])
    } catch (error) {
      console.error(
        'Menu loading failed:',
        error
      )

      setError(
        error.message ||
          'Unable to load menu. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))

    setError('')
    setSuccess('')
  }

  const openAddForm = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setIsFormOpen(true)
    setError('')
    setSuccess('')
  }

  const openEditForm = (item) => {
    setEditingItem(item)

    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      imageUrl: item.image_url || '',
      isPopular: item.is_popular,
      isAvailable: item.is_available,
    })

    setIsFormOpen(true)
    setError('')
    setSuccess('')
  }

  const closeForm = () => {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingItem(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        handleAuthExpired()
        return
      }

      const url = editingItem
        ? `${API_URL}/api/orders/admin/menu/${editingItem.id}`
        : `${API_URL}/api/orders/admin/menu`

      const method = editingItem
        ? 'PATCH'
        : 'POST'

      const response = await fetch(url, {
        method,

        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },

        body: JSON.stringify(formData),
      })

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
            'Failed to save menu item'
        )
      }

      if (editingItem) {
        setMenuItems((currentItems) =>
          currentItems.map((item) =>
            item.id === editingItem.id
              ? data.menuItem
              : item
          )
        )

        setSuccess(
          'Menu item updated successfully.'
        )
      } else {
        setMenuItems((currentItems) => [
          ...currentItems,
          data.menuItem,
        ])

        setSuccess(
          'Menu item added successfully.'
        )
      }

      setIsFormOpen(false)
      setEditingItem(null)
      setFormData(emptyForm)
    } catch (error) {
      console.error(
        'Menu item save failed:',
        error
      )

      setError(
        error.message ||
          'Something went wrong while saving the menu item.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAvailability = async (item) => {
    try {
      setError('')
      setSuccess('')

      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        handleAuthExpired()
        return
      }

      const response = await fetch(
        `${API_URL}/api/orders/admin/menu/${item.id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },

          body: JSON.stringify({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category,
            imageUrl: item.image_url || '',
            isPopular: item.is_popular,
            isAvailable: !item.is_available,
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
            'Failed to update item availability'
        )
      }

      setMenuItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? data.menuItem
            : currentItem
        )
      )

      setSuccess(
        data.menuItem.is_available
          ? `${item.name} is now available.`
          : `${item.name} is now unavailable.`
      )
    } catch (error) {
      console.error(
        'Availability update failed:',
        error
      )

      setError(
        error.message ||
          'Unable to update item availability.'
      )
    }
  }

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const token = localStorage.getItem(
        'jayasKitchenAdminToken'
      )

      if (!token) {
        handleAuthExpired()
        return
      }

      const response = await fetch(
        `${API_URL}/api/orders/admin/menu/${item.id}`,
        {
          method: 'DELETE',

          headers: {
            ...getAuthHeaders(),
          },
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
            'Failed to delete menu item'
        )
      }

      setMenuItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !== item.id
        )
      )

      setSuccess(
        `${item.name} was deleted successfully.`
      )
    } catch (error) {
      console.error(
        'Menu item deletion failed:',
        error
      )

      setError(
        error.message ||
          'Unable to delete this menu item.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5]">

      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">

          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-2xl font-bold text-gray-900">
              Menu Management
            </h1>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            + Add Item
          </button>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-700">
              {success}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

            <p className="mt-4 text-sm text-gray-500">
              Loading menu...
            </p>

          </div>
        )}

        {!isLoading &&
          menuItems.length === 0 && (
            <div className="rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500">
                No menu items found.
              </p>
            </div>
          )}

        {!isLoading &&
          menuItems.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                    item.is_available
                      ? 'border-green-100'
                      : 'border-gray-200 opacity-75'
                  }`}
                >

                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-48 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none'
                      }}
                    />
                  )}

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {item.name}
                        </h2>

                        <p className="mt-1 text-sm text-green-700">
                          {item.category}
                        </p>
                      </div>

                      {item.is_popular && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Popular
                        </span>
                      )}

                    </div>

                    <p className="mt-4 min-h-12 text-sm leading-6 text-gray-600">
                      {item.description ||
                        'No description added.'}
                    </p>

                    <div className="mt-5 flex items-center justify-between">

                      <span className="text-xl font-bold text-gray-900">
                        ₹{Number(item.price)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.is_available
                          ? 'Available'
                          : 'Unavailable'}
                      </span>

                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">

                      <button
                        onClick={() =>
                          openEditForm(item)
                        }
                        className="rounded-xl border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          toggleAvailability(item)
                        }
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        {item.is_available
                          ? 'Hide'
                          : 'Show'}
                      </button>

                      <button
                        onClick={() =>
                          deleteItem(item)
                        }
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

      </main>

      {isFormOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeForm}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">

            <div
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Jaya's Kitchen
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    {editingItem
                      ? 'Edit Menu Item'
                      : 'Add Menu Item'}
                  </h2>
                </div>

                <button
                  onClick={closeForm}
                  disabled={isSaving}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Dish Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Gujarati Thali"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the dish..."
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Image URL
                  </label>

                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/food-image.jpg"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  {formData.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-green-100">

                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="h-40 w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            'none'
                        }}
                      />

                    </div>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Price *
                    </label>

                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="120"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Category *
                    </label>

                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Thali"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <label className="flex cursor-pointer items-center rounded-xl border border-green-100 bg-green-50 p-4">

                    <input
                      type="checkbox"
                      name="isPopular"
                      checked={formData.isPopular}
                      onChange={handleChange}
                      className="h-5 w-5 accent-green-700"
                    />

                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">
                        Popular Item
                      </p>

                      <p className="text-sm text-gray-500">
                        Show the Popular badge.
                      </p>
                    </div>

                  </label>

                  <label className="flex cursor-pointer items-center rounded-xl border border-green-100 bg-green-50 p-4">

                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                      className="h-5 w-5 accent-green-700"
                    />

                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">
                        Available
                      </p>

                      <p className="text-sm text-gray-500">
                        Show this item on the website.
                      </p>
                    </div>

                  </label>

                </div>

                <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={isSaving}
                    className="rounded-full border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? 'Saving...'
                      : editingItem
                        ? 'Save Changes'
                        : 'Add Menu Item'}
                  </button>

                </div>

              </form>

            </div>

          </div>
        </>
      )}

    </div>
  )
}

export default AdminMenu