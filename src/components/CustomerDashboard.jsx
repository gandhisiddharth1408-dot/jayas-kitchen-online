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

const emptyAddressForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  houseNumber: '',
  street: '',
  addressLine2: '',
  landmark: '',
  city: 'Vadodara',
  state: 'Gujarat',
  pincode: '',
}

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
  // MULTIPLE ADDRESS STATE
  // ===============================

  const [addresses, setAddresses] =
    useState([])

  const [isLoadingAddresses, setIsLoadingAddresses] =
    useState(false)

  const [isAddressModalOpen, setIsAddressModalOpen] =
    useState(false)

  const [editingAddressId, setEditingAddressId] =
    useState(null)

  const [addressForm, setAddressForm] =
    useState({
      ...emptyAddressForm,
    })

  const [isSavingAddress, setIsSavingAddress] =
    useState(false)

  const [addressMessage, setAddressMessage] =
    useState('')

  const [addressMessageType, setAddressMessageType] =
    useState('')

  const [deletingAddressId, setDeletingAddressId] =
    useState(null)

  const [settingDefaultAddressId, setSettingDefaultAddressId] =
    useState(null)

  // ===============================
  // EMAIL VERIFICATION STATE
  // ===============================

  const [isVerifyingEmail, setIsVerifyingEmail] =
    useState(false)

  const [emailOtp, setEmailOtp] =
    useState('')

  const [isSendingEmailOtp, setIsSendingEmailOtp] =
    useState(false)

  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] =
    useState(false)

  const [emailVerificationMessage, setEmailVerificationMessage] =
    useState('')

  const [emailVerificationMessageType, setEmailVerificationMessageType] =
    useState('')

  const [emailResendCooldown, setEmailResendCooldown] =
    useState(0)

  // ===============================
  // SETTINGS STATE
  // ===============================

  const [showSettings, setShowSettings] =
    useState(false)

  const [orderNotifications, setOrderNotifications] =
    useState(true)

  const [offersNotifications, setOffersNotifications] =
    useState(true)

  // ===============================
  // CLEAR CUSTOMER SESSION
  // ===============================

  const clearCustomerSession = () => {
    localStorage.removeItem(
      'customerToken'
    )

    localStorage.removeItem(
      'customer'
    )

    window.dispatchEvent(
      new Event(
        'customerAuthChanged'
      )
    )
  }

  // ===============================
  // GET TOKEN
  // ===============================

  const getCustomerToken = () => {
    return localStorage.getItem(
      'customerToken'
    )
  }

  // ===============================
  // LOAD DASHBOARD
  // ===============================

  useEffect(() => {
    const token =
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

      window.location.href =
        '/account'

      return
    }

    fetchCustomerProfile(token)
    fetchRecentOrder(token)
    fetchAddresses(token)

    const searchParams =
      new URLSearchParams(
        window.location.search
      )

    if (
      searchParams.get(
        'settings'
      ) === 'true'
    ) {
      setShowSettings(true)

      window.history.replaceState(
        {},
        '',
        '/dashboard'
      )
    }
  }, [])

  // ===============================
  // EMAIL RESEND COOLDOWN
  // ===============================

  useEffect(() => {
    if (emailResendCooldown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setEmailResendCooldown(
        (previous) =>
          previous > 0
            ? previous - 1
            : 0
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [emailResendCooldown])

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
          response.status === 401 ||
          response.status === 404
        ) {
          clearCustomerSession()

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
  // FETCH ADDRESSES
  // ===============================

  const fetchAddresses = async (
    token = getCustomerToken()
  ) => {
    if (!token) {
      return
    }

    setIsLoadingAddresses(true)

    try {
      const response =
        await fetch(
          `${API_URL}/api/otp/me/addresses`,
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

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        clearCustomerSession()

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to fetch saved addresses.'
        )
      }

      setAddresses(
        Array.isArray(data.addresses)
          ? data.addresses
          : []
      )
    } catch (error) {
      console.error(
        'Address fetch failed:',
        error
      )

      setAddressMessage(
        error.message ||
          'Unable to load your saved addresses.'
      )

      setAddressMessageType(
        'error'
      )
    } finally {
      setIsLoadingAddresses(false)
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
          response.status === 401
        ) {
          clearCustomerSession()

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
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

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
        clearCustomerSession()

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

        window.dispatchEvent(
          new Event(
            'customerAuthChanged'
          )
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
  // OPEN ADD ADDRESS
  // ===============================

  const handleOpenAddAddress = () => {
    setEditingAddressId(null)

    setAddressForm({
      ...emptyAddressForm,
      fullName:
        customer?.name || '',
      phone:
        customer?.phone || '',
      city:
        customer?.city ||
        'Vadodara',
      state:
        customer?.state ||
        'Gujarat',
    })

    setAddressMessage('')
    setAddressMessageType('')
    setIsAddressModalOpen(true)
  }

  // ===============================
  // OPEN EDIT ADDRESS
  // ===============================

  const handleOpenEditAddress = (
    address
  ) => {
    if (!address) {
      return
    }

    setEditingAddressId(
      address.id
    )

    setAddressForm({
      label:
        address.label ||
        'Home',

      fullName:
        address.full_name ||
        address.fullName ||
        customer?.name ||
        '',

      phone:
        address.phone ||
        customer?.phone ||
        '',

      houseNumber:
        address.house_number ||
        address.houseNumber ||
        '',

      street:
        address.street ||
        '',

      addressLine2:
        address.address_line2 ||
        address.addressLine2 ||
        '',

      landmark:
        address.landmark ||
        '',

      city:
        address.city ||
        'Vadodara',

      state:
        address.state ||
        'Gujarat',

      pincode:
        address.pincode ||
        '',
    })

    setAddressMessage('')
    setAddressMessageType('')
    setIsAddressModalOpen(true)
  }

  // ===============================
  // CLOSE ADDRESS MODAL
  // ===============================

  const handleCloseAddressModal = () => {
    if (isSavingAddress) {
      return
    }

    setIsAddressModalOpen(false)
    setEditingAddressId(null)

    setAddressForm({
      ...emptyAddressForm,
    })

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
            : name === 'phone'
            ? value
                .replace(
                  /\D/g,
                  ''
                )
                .slice(0, 10)
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
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

      window.location.href =
        '/account'

      return
    }

    setIsSavingAddress(true)
    setAddressMessage('')
    setAddressMessageType('')

    try {
      const cleanLabel =
        addressForm.label.trim()

      const cleanFullName =
        addressForm.fullName.trim()

      const cleanPhone =
        addressForm.phone.trim()

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

      if (
        !['Home', 'Work', 'Other'].includes(
          cleanLabel
        )
      ) {
        setAddressMessage(
          'Please select a valid address type.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (!cleanFullName) {
        setAddressMessage(
          'Please enter the full name.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

      if (
        !/^[0-9]{10}$/.test(
          cleanPhone
        )
      ) {
        setAddressMessage(
          'Please enter a valid 10-digit mobile number.'
        )

        setAddressMessageType(
          'error'
        )

        setIsSavingAddress(false)
        return
      }

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

      const body = {
        label:
          cleanLabel,

        fullName:
          cleanFullName,

        phone:
          cleanPhone,

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
      }

      const url =
        editingAddressId
          ? `${API_URL}/api/otp/me/addresses/${editingAddressId}`
          : `${API_URL}/api/otp/me/addresses`

      const response =
        await fetch(
          url,
          {
            method:
              editingAddressId
                ? 'PUT'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              body
            ),
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        clearCustomerSession()

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to save delivery address.'
        )
      }

      setAddressMessage(
        editingAddressId
          ? 'Address updated successfully.'
          : 'Address added successfully.'
      )

      setAddressMessageType(
        'success'
      )

      await fetchAddresses(token)

      setTimeout(() => {
        handleCloseAddressModal()
      }, 700)
    } catch (error) {
      console.error(
        'Address save failed:',
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
  // DELETE ADDRESS
  // ===============================

  const handleDeleteAddress = async (
    addressId
  ) => {
    const token =
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

      window.location.href =
        '/account'

      return
    }

    const address =
      addresses.find(
        (item) =>
          item.id === addressId
      )

    if (!address) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete your ${address.label || 'saved'} address?`
      )

    if (!confirmed) {
      return
    }

    setDeletingAddressId(
      addressId
    )

    setAddressMessage('')
    setAddressMessageType('')

    try {
      const response =
        await fetch(
          `${API_URL}/api/otp/me/addresses/${addressId}`,
          {
            method: 'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        clearCustomerSession()

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to delete address.'
        )
      }

      await fetchAddresses(token)
    } catch (error) {
      console.error(
        'Address delete failed:',
        error
      )

      setAddressMessage(
        error.message ||
          'Unable to delete the address.'
      )

      setAddressMessageType(
        'error'
      )
    } finally {
      setDeletingAddressId(null)
    }
  }

  // ===============================
  // SET DEFAULT ADDRESS
  // ===============================

  const handleSetDefaultAddress = async (
    addressId
  ) => {
    const token =
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

      window.location.href =
        '/account'

      return
    }

    setSettingDefaultAddressId(
      addressId
    )

    setAddressMessage('')
    setAddressMessageType('')

    try {
      const response =
        await fetch(
          `${API_URL}/api/otp/me/addresses/${addressId}/default`,
          {
            method: 'PUT',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        clearCustomerSession()

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to set default address.'
        )
      }

      await fetchAddresses(token)
    } catch (error) {
      console.error(
        'Set default address failed:',
        error
      )

      setAddressMessage(
        error.message ||
          'Unable to set the default address.'
      )

      setAddressMessageType(
        'error'
      )
    } finally {
      setSettingDefaultAddressId(
        null
      )
    }
  }

  // ===============================
  // OPEN EMAIL VERIFICATION
  // ===============================

  const handleOpenEmailVerification = () => {
    if (!customer?.email) {
      handleOpenEditProfile()
      return
    }

    if (customer.email_verified) {
      return
    }

    setEmailOtp('')
    setEmailVerificationMessage('')
    setEmailVerificationMessageType('')
    setIsVerifyingEmail(true)
  }

  // ===============================
  // CLOSE EMAIL VERIFICATION
  // ===============================

  const handleCloseEmailVerification = () => {
    if (
      isSendingEmailOtp ||
      isVerifyingEmailOtp
    ) {
      return
    }

    setIsVerifyingEmail(false)
    setEmailOtp('')
    setEmailVerificationMessage('')
    setEmailVerificationMessageType('')
  }

  // ===============================
  // SEND EMAIL VERIFICATION OTP
  // ===============================

  const handleSendEmailVerificationOtp = async () => {
    const token =
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

      window.location.href =
        '/account'

      return
    }

    if (!customer?.email) {
      setEmailVerificationMessage(
        'Please add your email address first.'
      )

      setEmailVerificationMessageType(
        'error'
      )

      return
    }

    if (
      customer.email_verified
    ) {
      setEmailVerificationMessage(
        'Your email is already verified.'
      )

      setEmailVerificationMessageType(
        'success'
      )

      return
    }

    if (emailResendCooldown > 0) {
      return
    }

    setIsSendingEmailOtp(true)
    setEmailVerificationMessage('')
    setEmailVerificationMessageType('')

    try {
      const response =
        await fetch(
          `${API_URL}/api/otp/me/email/send`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        clearCustomerSession()

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to send verification OTP.'
        )
      }

      setEmailOtp('')

      setEmailResendCooldown(
        60
      )

      setEmailVerificationMessage(
        data.message ||
          'Verification OTP sent to your email address.'
      )

      setEmailVerificationMessageType(
        'success'
      )
    } catch (error) {
      console.error(
        'Email verification OTP error:',
        error
      )

      setEmailVerificationMessage(
        error.message ||
          'Unable to send verification OTP.'
      )

      setEmailVerificationMessageType(
        'error'
      )
    } finally {
      setIsSendingEmailOtp(false)
    }
  }

  // ===============================
  // VERIFY EMAIL OTP
  // ===============================

  const handleVerifyEmailOtp = async (
    event
  ) => {
    event.preventDefault()

    const token =
      getCustomerToken()

    if (!token) {
      clearCustomerSession()

      window.location.href =
        '/account'

      return
    }

    const cleanOtp =
      emailOtp.trim()

    if (
      !/^[0-9]{6}$/.test(
        cleanOtp
      )
    ) {
      setEmailVerificationMessage(
        'Please enter a valid 6-digit OTP.'
      )

      setEmailVerificationMessageType(
        'error'
      )

      return
    }

    setIsVerifyingEmailOtp(true)
    setEmailVerificationMessage('')
    setEmailVerificationMessageType('')

    try {
      const response =
        await fetch(
          `${API_URL}/api/otp/me/email/verify`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              otp: cleanOtp,
            }),
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 404
      ) {
        clearCustomerSession()

        window.location.href =
          '/account'

        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to verify email.'
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
      } else {
        setCustomer(
          (previous) => ({
            ...previous,
            email_verified:
              true,
          })
        )
      }

      window.dispatchEvent(
        new Event(
          'customerAuthChanged'
        )
      )

      setEmailVerificationMessage(
        'Email verified successfully!'
      )

      setEmailVerificationMessageType(
        'success'
      )

      setTimeout(() => {
        setIsVerifyingEmail(false)
        setEmailOtp('')
        setEmailVerificationMessage('')
        setEmailVerificationMessageType('')
      }, 1200)
    } catch (error) {
      console.error(
        'Email verification failed:',
        error
      )

      setEmailVerificationMessage(
        error.message ||
          'Unable to verify email. Please try again.'
      )

      setEmailVerificationMessageType(
        'error'
      )
    } finally {
      setIsVerifyingEmailOtp(false)
    }
  }

  // ===============================
  // OPEN SETTINGS
  // ===============================

  const handleOpenSettings = () => {
    setShowSettings(true)
  }

  // ===============================
  // CLOSE SETTINGS
  // ===============================

  const handleCloseSettings = () => {
    setShowSettings(false)
  }

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = () => {
    clearCustomerSession()

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

  const defaultAddress =
    addresses.find(
      (address) =>
        address.is_default
    ) ||
    addresses[0] ||
    null

  return (
    <div className="min-h-screen bg-[#f8f5ec] px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

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

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-lg border border-red-200 bg-white px-5 py-2.5 font-medium text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>

          </div>

        </div>

        {/* ================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* My Orders */}
          <button
            type="button"
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
            type="button"
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

        {/* ================================= */}
        {/* SAVED ADDRESSES */}
        {/* ================================= */}

        <div className="mb-8 rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Delivery Addresses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your saved delivery addresses
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleOpenAddAddress
              }
              className="w-fit rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              + Add Address
            </button>

          </div>

          {isLoadingAddresses ? (
            <div className="rounded-xl bg-green-50 p-8 text-center text-sm text-gray-500">
              Loading your saved addresses...
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 p-8 text-center">

              <div className="mb-3 text-4xl">
                📍
              </div>

              <h3 className="font-bold text-gray-900">
                No Saved Addresses
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Add an address to make checkout faster.
              </p>

              <button
                type="button"
                onClick={
                  handleOpenAddAddress
                }
                className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Add Delivery Address
              </button>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">

              {addresses.map(
                (address) => (
                  <div
                    key={
                      address.id
                    }
                    className={`rounded-2xl border p-5 transition ${
                      address.is_default
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-100 bg-white hover:border-green-200'
                    }`}
                  >

                    {/* Address Header */}

                    <div className="mb-4 flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                          {address.label ===
                          'Work'
                            ? '💼'
                            : address.label ===
                              'Other'
                            ? '📍'
                            : '🏠'}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-bold text-gray-900">
                              {address.label ||
                                'Home'}
                            </h3>

                            {address.is_default && (
                              <span className="rounded-full bg-green-700 px-2.5 py-1 text-xs font-semibold text-white">
                                Default
                              </span>
                            )}

                          </div>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Delivery Address
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* Address Details */}

                    <div className="space-y-1.5 text-sm text-gray-700">

                      <p className="font-semibold text-gray-900">
                        {address.full_name ||
                          address.fullName}
                      </p>

                      {(address.phone) && (
                        <p>
                          {address.phone}
                        </p>
                      )}

                      {address.house_number && (
                        <p className="font-medium text-gray-900">
                          {address.house_number}
                        </p>
                      )}

                      {address.street && (
                        <p className="break-words">
                          {address.street}
                        </p>
                      )}

                      {address.address_line2 && (
                        <p className="break-words">
                          {address.address_line2}
                        </p>
                      )}

                      <p>
                        {address.city}
                        {address.state
                          ? `, ${address.state}`
                          : ''}
                        {address.pincode
                          ? ` - ${address.pincode}`
                          : ''}
                      </p>

                      {address.landmark && (
                        <p className="pt-1 text-gray-600">
                          <span className="font-medium text-gray-800">
                            Landmark:
                          </span>{' '}
                          {address.landmark}
                        </p>
                      )}

                    </div>

                    {/* Actions */}

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-200 pt-4">

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEditAddress(
                            address
                          )
                        }
                        className="rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                      >
                        Edit
                      </button>

                      {!address.is_default && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSetDefaultAddress(
                              address.id
                            )
                          }
                          disabled={
                            settingDefaultAddressId ===
                            address.id
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {settingDefaultAddressId ===
                          address.id
                            ? 'Setting...'
                            : 'Set as Default'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAddress(
                            address.id
                          )
                        }
                        disabled={
                          deletingAddressId ===
                          address.id
                        }
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingAddressId ===
                        address.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

          {addressMessage && !isAddressModalOpen && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                addressMessageType ===
                'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {addressMessage}
            </div>
          )}

        </div>

        {/* ================================= */}
        {/* DEFAULT ADDRESS SUMMARY */}
        {/* ================================= */}

        {defaultAddress && (
          <div className="mb-8 rounded-2xl border border-green-100 bg-green-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                ⭐
              </div>

              <div className="min-w-0">

                <p className="text-sm font-semibold text-green-700">
                  Default delivery address
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {defaultAddress.label ||
                    'Home'}{' '}
                  ·{' '}
                  {defaultAddress.full_name ||
                    defaultAddress.fullName}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-700">
                  {defaultAddress.house_number
                    ? `${defaultAddress.house_number}, `
                    : ''}
                  {defaultAddress.street
                    ? `${defaultAddress.street}, `
                    : ''}
                  {defaultAddress.city}
                  {defaultAddress.state
                    ? `, ${defaultAddress.state}`
                    : ''}
                  {defaultAddress.pincode
                    ? ` - ${defaultAddress.pincode}`
                    : ''}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ================================= */}
        {/* RECENT ORDER */}
        {/* ================================= */}

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
                type="button"
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
                type="button"
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

        {/* ================================= */}
        {/* FOOTER */}
        {/* ================================= */}

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

                <p className="mt-1.5 text-xs text-gray-400">
                  You can verify your email after saving it.
                </p>

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
      {/* ADD / EDIT ADDRESS MODAL */}
      {/* ================================= */}

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">

            <div className="mb-6 flex items-start justify-between gap-4">

              <div>

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                  {editingAddressId
                    ? '✏️'
                    : '📍'}
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAddressId
                    ? 'Edit Address'
                    : 'Add Address'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Save an address for faster checkout.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseAddressModal
                }
                disabled={
                  isSavingAddress
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleSaveAddress
              }
            >

              {/* Address Type */}

              <div className="mb-5">

                <label
                  htmlFor="customer-address-label"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Address Type
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">

                  {[
                    {
                      value: 'Home',
                      icon: '🏠',
                    },
                    {
                      value: 'Work',
                      icon: '💼',
                    },
                    {
                      value: 'Other',
                      icon: '📍',
                    },
                  ].map(
                    (option) => (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          setAddressForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              label:
                                option.value,
                            })
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                          addressForm.label ===
                          option.value
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-1.5">
                          {
                            option.icon
                          }
                        </span>

                        {
                          option.value
                        }
                      </button>
                    )
                  )}

                </div>

              </div>

              {/* Full Name */}

              <div className="mb-4">

                <label
                  htmlFor="customer-full-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Full Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="customer-full-name"
                  name="fullName"
                  type="text"
                  value={
                    addressForm.fullName
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="Enter recipient's full name"
                  maxLength="100"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* Phone */}

              <div className="mb-4">

                <label
                  htmlFor="customer-address-phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Mobile Number
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="customer-address-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  value={
                    addressForm.phone
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="Enter 10-digit mobile number"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* House Number */}

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

              {/* Street */}

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

              <div className="mb-5">

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

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    handleCloseAddressModal
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
                    : editingAddressId
                    ? 'Update Address'
                    : 'Save Address'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================================= */}
      {/* EMAIL VERIFICATION MODAL */}
      {/* ================================= */}

      {isVerifyingEmail && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">

            <div className="mb-6 flex items-start justify-between gap-4">

              <div>

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                  ✉️
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  Verify Email
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  We'll send a 6-digit verification code to:
                </p>

                <p className="mt-1 break-all font-semibold text-green-700">
                  {customer?.email}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseEmailVerification
                }
                disabled={
                  isSendingEmailOtp ||
                  isVerifyingEmailOtp
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <button
              type="button"
              onClick={
                handleSendEmailVerificationOtp
              }
              disabled={
                isSendingEmailOtp ||
                emailResendCooldown > 0
              }
              className="mb-5 w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingEmailOtp
                ? 'Sending OTP...'
                : emailResendCooldown > 0
                ? `Resend OTP in ${emailResendCooldown}s`
                : 'Send Verification OTP'}
            </button>

            <form
              onSubmit={
                handleVerifyEmailOtp
              }
            >

              <div className="mb-5">

                <label
                  htmlFor="email-verification-otp"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Enter Verification OTP
                </label>

                <input
                  id="email-verification-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={
                    emailOtp
                  }
                  onChange={(
                    event
                  ) =>
                    setEmailOtp(
                      event.target.value
                        .replace(
                          /\D/g,
                          ''
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-xl border border-gray-200 bg-[#FFFDF5] px-4 py-3 text-center text-lg tracking-[0.4em] outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {emailVerificationMessage && (
                <div
                  className={`mb-5 rounded-xl px-4 py-3 text-sm ${
                    emailVerificationMessageType ===
                    'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {
                    emailVerificationMessage
                  }
                </div>
              )}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    handleCloseEmailVerification
                  }
                  disabled={
                    isSendingEmailOtp ||
                    isVerifyingEmailOtp
                  }
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isVerifyingEmailOtp ||
                    !emailOtp
                  }
                  className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifyingEmailOtp
                    ? 'Verifying...'
                    : 'Verify Email'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ================================= */}
      {/* SETTINGS MODAL */}
      {/* ================================= */}

      {showSettings && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* Settings Header */}

            <div className="border-b border-gray-100 p-6 sm:p-8">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                    ⚙️
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900">
                    Profile Settings
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage your account and preferences.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseSettings
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="space-y-6 p-6 sm:p-8">

              {/* Account Settings */}

              <div>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
                  Account
                </h3>

                <div className="overflow-hidden rounded-2xl border border-gray-100">

                  {/* Profile */}

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseSettings()
                      handleOpenEditProfile()
                    }}
                    className="flex w-full items-center gap-4 border-b border-gray-100 p-4 text-left transition hover:bg-green-50"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      👤
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-gray-900">
                        Personal Information
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Name, mobile number and email
                      </p>

                    </div>

                    <span className="text-gray-400">
                      →
                    </span>

                  </button>

                  {/* Email */}

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseSettings()

                      if (
                        customer?.email
                      ) {
                        handleOpenEmailVerification()
                      } else {
                        handleOpenEditProfile()
                      }
                    }}
                    className="flex w-full items-center gap-4 border-b border-gray-100 p-4 text-left transition hover:bg-green-50"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      ✉️
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-gray-900">
                        Email Verification
                      </p>

                      <p className="mt-0.5 break-all text-xs text-gray-500">
                        {customer?.email
                          ? customer.email
                          : 'Add an email address'}
                      </p>

                    </div>

                    {customer?.email_verified ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Verified
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    )}

                  </button>

                  {/* Address */}

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseSettings()
                      setAddressMessage('')
                      setAddressMessageType('')
                      setIsAddressModalOpen(
                        false
                      )

                      window.setTimeout(() => {
                        const token =
                          getCustomerToken()

                        if (token) {
                          fetchAddresses(
                            token
                          )
                        }
                      }, 0)
                    }}
                    className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-green-50"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      📍
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-gray-900">
                        Delivery Address
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {addresses.length > 0
                          ? `${addresses.length} saved address${addresses.length === 1 ? '' : 'es'}`
                          : 'Add your delivery address'}
                      </p>

                    </div>

                    <span className="text-gray-400">
                      →
                    </span>

                  </button>

                </div>

              </div>

              {/* Notifications */}

              <div>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
                  Notifications
                </h3>

                <div className="overflow-hidden rounded-2xl border border-gray-100">

                  {/* Order Notifications */}

                  <div className="flex items-center gap-4 border-b border-gray-100 p-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      📦
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-gray-900">
                        Order Updates
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Updates about your orders
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setOrderNotifications(
                          (previous) =>
                            !previous
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        orderNotifications
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    >

                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          orderNotifications
                            ? 'left-6'
                            : 'left-1'
                        }`}
                      />

                    </button>

                  </div>

                  {/* Offers */}

                  <div className="flex items-center gap-4 p-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      🎁
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-gray-900">
                        Offers & Updates
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Special offers and announcements
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setOffersNotifications(
                          (previous) =>
                            !previous
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        offersNotifications
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    >

                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          offersNotifications
                            ? 'left-6'
                            : 'left-1'
                        }`}
                      />

                    </button>

                  </div>

                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Notification preferences are currently saved for this session.
                </p>

              </div>

              {/* Security */}

              <div>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
                  Security
                </h3>

                <div className="overflow-hidden rounded-2xl border border-gray-100">

                  <div className="flex items-center gap-4 p-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      🔐
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-gray-900">
                        Account Security
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Your account uses OTP-based authentication.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* Logout */}

              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xl">
                    🚪
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-semibold text-gray-900">
                      Logout
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Sign out of your Jaya's Kitchen account.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Logout
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default CustomerDashboard