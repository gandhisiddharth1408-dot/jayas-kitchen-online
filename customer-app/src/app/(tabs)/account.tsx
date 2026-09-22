import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'

import { useAuth } from '../../context/AuthContext'

export default function AccountScreen() {
  const {
    customer,
    isLoggedIn,
    isLoading,
    logout,
  } = useAuth()

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false)

  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  async function handleLogout() {
    try {
      setIsLoggingOut(true)

      await logout()

      setShowLogoutConfirm(false)
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingText}>
          Loading your account...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          JAYA'S KITCHEN
        </Text>

        <Text style={styles.title}>
          My Account
        </Text>

        <Text style={styles.subtitle}>
          Manage your account and orders.
        </Text>
      </View>

      {!isLoggedIn || !customer ? (
        <>
          {/* Logged Out */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>
                👤
              </Text>
            </View>

            <Text style={styles.cardTitle}>
              Welcome to Jaya's Kitchen
            </Text>

            <Text style={styles.cardDescription}>
              Login to your account to place
              orders, manage your details and
              view your order history.
            </Text>

            <Pressable
              onPress={() =>
                router.push('/auth')
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Login
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push('/auth')
              }
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Why create an account?
            </Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>
                🛒
              </Text>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  Easy Ordering
                </Text>

                <Text style={styles.infoDescription}>
                  Quickly place your favourite
                  homemade food orders.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>
                📦
              </Text>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  Track Your Orders
                </Text>

                <Text style={styles.infoDescription}>
                  View your previous and current
                  orders from one place.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>
                ❤️
              </Text>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  Homemade Goodness
                </Text>

                <Text style={styles.infoDescription}>
                  Enjoy fresh, pure-vegetarian
                  homemade food.
                </Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Profile */}
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {customer.name
                    ? customer.name
                        .charAt(0)
                        .toUpperCase()
                    : 'U'}
                </Text>
              </View>

              <View style={styles.profileHeading}>
                <Text style={styles.welcomeText}>
                  Welcome back!
                </Text>

                <Text
                  style={styles.customerName}
                  numberOfLines={1}
                >
                  {customer.name}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Name */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text>👤</Text>
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Name
                </Text>

                <Text style={styles.detailValue}>
                  {customer.name}
                </Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text>✉️</Text>
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Email
                </Text>

                <Text
                  style={styles.detailValue}
                  numberOfLines={2}
                >
                  {customer.email ||
                    'Not added'}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text>📱</Text>
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Mobile Number
                </Text>

                <Text style={styles.detailValue}>
                  {customer.phone}
                </Text>
              </View>
            </View>

            {/* Status */}
            <View style={styles.statusBox}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                Account Active
              </Text>
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Account
            </Text>

            {/* Orders */}
            <Pressable
              onPress={() =>
                router.push(
                  '/(tabs)/orders'
                )
              }
              style={({ pressed }) => [
                styles.actionCard,
                pressed &&
                  styles.actionPressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>
                  📦
                </Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  My Orders
                </Text>

                <Text style={styles.actionDescription}>
                  View your order history.
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </Pressable>

            {/* Browse Menu */}
            <Pressable
              onPress={() =>
                router.push(
                  '/(tabs)/menu'
                )
              }
              style={({ pressed }) => [
                styles.actionCard,
                pressed &&
                  styles.actionPressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>
                  🍱
                </Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  Browse Menu
                </Text>

                <Text style={styles.actionDescription}>
                  Explore today's homemade food.
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </Pressable>

            {/* Settings */}
            <Pressable
              onPress={() =>
                router.push(
                  '/settings'
                )
              }
              style={({ pressed }) => [
                styles.actionCard,
                pressed &&
                  styles.actionPressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>
                  ⚙️
                </Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  Settings
                </Text>

                <Text style={styles.actionDescription}>
                  Manage your account settings.
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </Pressable>
          </View>

          {/* Logout */}
          <Pressable
            onPress={() =>
              setShowLogoutConfirm(true)
            }
            disabled={isLoggingOut}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed &&
                styles.logoutPressed,
              isLoggingOut &&
                styles.logoutDisabled,
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator
                color="#DC2626"
              />
            ) : (
              <Text style={styles.logoutText}>
                Logout
              </Text>
            )}
          </Pressable>

          {/* Logout Confirmation */}
          {showLogoutConfirm && (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>
                Logout from your account?
              </Text>

              <Text style={styles.confirmDescription}>
                You can login again anytime using
                your mobile number and OTP.
              </Text>

              <View style={styles.confirmButtons}>
                <Pressable
                  onPress={() =>
                    setShowLogoutConfirm(false)
                  }
                  disabled={isLoggingOut}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                  style={({ pressed }) => [
                    styles.confirmLogoutButton,
                    pressed &&
                      styles.logoutPressed,
                  ]}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.confirmLogoutText
                      }
                    >
                      Logout
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}

      <Text style={styles.footer}>
        Homemade food, made with love. ❤️
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  content: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF5',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#2E7D32',
  },

  title: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    marginBottom: 16,
  },

  icon: {
    fontSize: 34,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#111827',
  },

  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#6B7280',
  },

  primaryButton: {
    width: '100%',
    height: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#2E7D32',
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  secondaryButton: {
    width: '100%',
    height: 52,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
  },

  buttonPressed: {
    opacity: 0.82,
  },

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  infoIcon: {
    width: 42,
    height: 42,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 9,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    fontSize: 20,
  },

  infoTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  infoDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
  },

  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  profileHeading: {
    flex: 1,
    marginLeft: 16,
  },

  welcomeText: {
    fontSize: 13,
    color: '#6B7280',
  },

  customerName: {
    marginTop: 3,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: '#E5E7EB',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  detailIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#F0FDF4',
  },

  detailContent: {
    flex: 1,
    marginLeft: 13,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  detailValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
    backgroundColor: '#2E7D32',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  actionPressed: {
    opacity: 0.75,
  },

  actionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
  },

  actionEmoji: {
    fontSize: 20,
  },

  actionContent: {
    flex: 1,
    marginLeft: 14,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  actionDescription: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  arrow: {
    marginLeft: 8,
    fontSize: 28,
    color: '#2E7D32',
  },

  logoutButton: {
    height: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },

  logoutPressed: {
    opacity: 0.7,
  },

  logoutDisabled: {
    opacity: 0.6,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },

  confirmCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },

  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  confirmDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },

  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  confirmLogoutButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#DC2626',
  },

  confirmLogoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 13,
    color: '#888',
  },
})