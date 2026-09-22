import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { apiGet, API_URL } from '../api/api'

export default function HomeScreen() {
  const [status, setStatus] = useState('Checking backend...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkBackend()
  }, [])

  async function checkBackend() {
    try {
      const data = await apiGet('/api/health')

      console.log('Backend response:', data)

      setStatus('Backend connected successfully')
    } catch (error) {
      console.error('Backend connection error:', error)

      setStatus(
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : 'Connection failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jaya's Kitchen</Text>

      <Text style={styles.subtitle}>
        Admin App
      </Text>

      {loading && (
        <ActivityIndicator size="large" />
      )}

      <Text style={styles.status}>
        {status}
      </Text>

      <Text style={styles.url}>
        {API_URL}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },

  status: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },

  url: {
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
})