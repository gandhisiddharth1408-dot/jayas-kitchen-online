import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'

import { apiPost } from '../api/api'

type Customer = {
  id: number
  name: string
  phone: string
  email: string | null
  email_verified: boolean
  created_at?: string
}

type AuthMode = 'login' | 'signup'

type AuthContextType = {
  customer: Customer | null
  token: string | null
  isLoading: boolean
  isLoggedIn: boolean

  sendOtp: (
    mode: AuthMode,
    phone: string,
    name?: string,
    email?: string
  ) => Promise<{
    success: boolean
    message: string
    expiresIn?: number
  }>

  verifyOtp: (
    mode: AuthMode,
    phone: string,
    otp: string,
    name?: string,
    email?: string
  ) => Promise<void>

  updateCustomer: (
    updatedCustomer: Customer,
    updatedToken?: string
  ) => Promise<void>

  logout: () => Promise<void>
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  )

const TOKEN_KEY =
  '@jayas_kitchen_customer_token'

const CUSTOMER_KEY =
  '@jayas_kitchen_customer'

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [customer, setCustomer] =
    useState<Customer | null>(null)

  const [token, setToken] =
    useState<string | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    loadStoredAuth()
  }, [])

  async function loadStoredAuth() {
    try {
      const [
        storedToken,
        storedCustomer,
      ] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(CUSTOMER_KEY),
      ])

      if (storedToken) {
        setToken(storedToken)
      }

      if (storedCustomer) {
        setCustomer(
          JSON.parse(storedCustomer)
        )
      }
    } catch (error) {
      console.error(
        'Failed to load customer authentication:',
        error
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function sendOtp(
    mode: AuthMode,
    phone: string,
    name?: string,
    email?: string
  ) {
    const cleanPhone =
      phone.trim().replace(/\D/g, '')

    const cleanName =
      name?.trim() || ''

    const cleanEmail =
      email?.trim().toLowerCase() || ''

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      throw new Error(
        'Please enter a valid 10-digit mobile number.'
      )
    }

    if (
      mode === 'signup' &&
      !cleanName
    ) {
      throw new Error(
        'Full name is required.'
      )
    }

    const response =
      await apiPost<{
        success: boolean
        message: string
        expiresIn?: number
      }>('/api/otp/send', {
        method: 'mobile',
        authMode: mode,
        phone: cleanPhone,
        ...(mode === 'signup'
          ? {
              name: cleanName,
              email:
                cleanEmail || undefined,
            }
          : {}),
      })

    if (!response.success) {
      throw new Error(
        response.message ||
          'Unable to send OTP.'
      )
    }

    return response
  }

  async function verifyOtp(
    mode: AuthMode,
    phone: string,
    otp: string,
    name?: string,
    email?: string
  ) {
    const cleanPhone =
      phone.trim().replace(/\D/g, '')

    const cleanOtp =
      otp.trim().replace(/\D/g, '')

    const cleanName =
      name?.trim() || ''

    const cleanEmail =
      email?.trim().toLowerCase() || ''

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      throw new Error(
        'Please enter a valid 10-digit mobile number.'
      )
    }

    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      throw new Error(
        'Please enter the 6-digit OTP.'
      )
    }

    if (
      mode === 'signup' &&
      !cleanName
    ) {
      throw new Error(
        'Full name is required.'
      )
    }

    const response =
      await apiPost<{
        success: boolean
        message: string
        token: string
        customer: Customer
      }>('/api/otp/verify', {
        method: 'mobile',
        authMode: mode,
        phone: cleanPhone,
        otp: cleanOtp,
        ...(mode === 'signup'
          ? {
              name: cleanName,
              email:
                cleanEmail || undefined,
            }
          : {}),
      })

    if (
      !response.success ||
      !response.token ||
      !response.customer
    ) {
      throw new Error(
        response.message ||
          'OTP verification failed.'
      )
    }

    await AsyncStorage.multiSet([
      [
        TOKEN_KEY,
        response.token,
      ],
      [
        CUSTOMER_KEY,
        JSON.stringify(
          response.customer
        ),
      ],
    ])

    setToken(response.token)
    setCustomer(response.customer)
  }

  async function updateCustomer(
    updatedCustomer: Customer,
    updatedToken?: string
  ) {
    await AsyncStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify(
        updatedCustomer
      )
    )

    setCustomer(updatedCustomer)

    if (updatedToken) {
      await AsyncStorage.setItem(
        TOKEN_KEY,
        updatedToken
      )

      setToken(updatedToken)
    }
  }

  async function logout() {
    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      CUSTOMER_KEY,
    ])

    setToken(null)
    setCustomer(null)
  }

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        isLoggedIn:
          Boolean(token && customer),
        sendOtp,
        verifyOtp,
        updateCustomer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}