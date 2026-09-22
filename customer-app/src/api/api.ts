import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://jayas-kitchen-api.onrender.com'

const TOKEN_KEY =
  '@jayas_kitchen_customer_token'

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    await AsyncStorage.getItem(TOKEN_KEY)

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type':
          'application/json',
        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
        ...(options.headers || {}),
      },
    }
  )

  let data: any = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return data as T
}

export function apiGet<T>(
  endpoint: string
): Promise<T> {
  return apiRequest<T>(endpoint)
}

export function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  )
}

export function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'PUT',
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  )
}

export function apiDelete<T>(
  endpoint: string
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'DELETE',
    }
  )
}

export { API_URL }