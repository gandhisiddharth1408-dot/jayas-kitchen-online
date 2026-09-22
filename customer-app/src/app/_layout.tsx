import { Stack } from 'expo-router'
import { CartProvider } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="checkout"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="explore"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  )
}