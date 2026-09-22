import {
  useEffect,
  useState,
} from 'react'

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import {
  router,
} from 'expo-router'

import {
  useAuth,
} from '../context/AuthContext'

import {
  apiPost,
  apiPut,
} from '../api/api'

type CustomerResponse = {
  id: number
  name: string
  phone: string
  email: string | null
  email_verified: boolean
  created_at?: string
}

type ActionResponse = {
  success: boolean
  message: string
  token?: string
  customer?: CustomerResponse
  expiresIn?: number
}

export default function SettingsScreen() {
  const {
    customer,
    updateCustomer,
  } = useAuth()

  const [
    email,
    setEmail,
  ] = useState(
    customer?.email || ''
  )

  const [
    emailVerified,
    setEmailVerified,
  ] = useState(
    Boolean(
      customer?.email_verified
    )
  )

  const [
    showOtpInput,
    setShowOtpInput,
  ] = useState(false)

  const [
    otp,
    setOtp,
  ] = useState('')

  const [
    isSavingEmail,
    setIsSavingEmail,
  ] = useState(false)

  const [
    isSendingOtp,
    setIsSendingOtp,
  ] = useState(false)

  const [
    isVerifyingOtp,
    setIsVerifyingOtp,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    retryAfter,
    setRetryAfter,
  ] = useState(0)

  useEffect(() => {
    setEmail(
      customer?.email || ''
    )

    setEmailVerified(
      Boolean(
        customer?.email_verified
      )
    )
  }, [
    customer?.email,
    customer?.email_verified,
  ])

  useEffect(() => {
    if (retryAfter <= 0) {
      return
    }

    const timer =
      setInterval(() => {
        setRetryAfter(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        )
      }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [
    retryAfter,
  ])

  function clearMessages() {
    setMessage('')
    setError('')
  }

  function handleBack() {
    router.replace(
      '/(tabs)/account'
    )
  }

  async function saveEmail() {
    clearMessages()

    const cleanEmail =
      email.trim().toLowerCase()

    if (!cleanEmail) {
      setError(
        'Please enter your email address.'
      )
      return
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (
      !emailPattern.test(
        cleanEmail
      )
    ) {
      setError(
        'Please enter a valid email address.'
      )
      return
    }

    if (!customer) {
      setError(
        'Please login again.'
      )
      return
    }

    setIsSavingEmail(true)

    try {
      const response =
        await apiPut<ActionResponse>(
          '/api/otp/me',
          {
            name:
              customer.name,
            phone:
              customer.phone,
            email:
              cleanEmail,
          }
        )

      if (
        !response.success ||
        !response.customer
      ) {
        throw new Error(
          response.message ||
            'Failed to save email.'
        )
      }

      await updateCustomer(
        response.customer,
        response.token
      )

      setEmail(
        response.customer.email ||
          cleanEmail
      )

      setEmailVerified(
        Boolean(
          response.customer
            .email_verified
        )
      )

      setShowOtpInput(false)
      setOtp('')

      setMessage(
        response.message ||
          'Email address saved successfully.'
      )
    } catch (err: any) {
      setMessage('')

      setError(
        err?.message ||
          'Failed to save email address.'
      )
    } finally {
      setIsSavingEmail(false)
    }
  }

  async function sendVerificationOtp() {
    clearMessages()

    if (!email.trim()) {
      setError(
        'Please save your email address first.'
      )
      return
    }

    if (emailVerified) {
      setMessage(
        'Your email address is already verified.'
      )
      return
    }

    if (retryAfter > 0) {
      setError(
        `Please wait ${retryAfter} seconds before requesting another OTP.`
      )
      return
    }

    setIsSendingOtp(true)

    try {
      const response =
        await apiPost<ActionResponse>(
          '/api/otp/me/email/send'
        )

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to send verification OTP.'
        )
      }

      setShowOtpInput(true)
      setOtp('')

      setMessage(
        response.message ||
          'Verification OTP sent successfully to your email.'
      )
    } catch (err: any) {
      const errorMessage =
        err?.message ||
        'Unable to send verification OTP.'

      setMessage('')

      setError(
        errorMessage
      )

      const match =
        errorMessage.match(
          /wait\s+(\d+)\s+seconds/i
        )

      if (match) {
        setRetryAfter(
          Number(match[1])
        )
      }
    } finally {
      setIsSendingOtp(false)
    }
  }

  async function verifyEmail() {
    clearMessages()

    const cleanOtp =
      otp.trim().replace(
        /\D/g,
        ''
      )

    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      setError(
        'Please enter the 6-digit OTP.'
      )
      return
    }

    if (isVerifyingOtp) {
      return
    }

    setIsVerifyingOtp(true)

    try {
      const response =
        await apiPost<ActionResponse>(
          '/api/otp/me/email/verify',
          {
            otp: cleanOtp,
          }
        )

      if (
        !response.success ||
        !response.customer
      ) {
        throw new Error(
          response.message ||
            'Email verification failed.'
        )
      }

      await updateCustomer(
        response.customer,
        response.token
      )

      setEmail(
        response.customer.email ||
          email
      )

      setEmailVerified(
        Boolean(
          response.customer
            .email_verified
        )
      )

      setError('')
      setShowOtpInput(false)
      setOtp('')

      setMessage(
        response.message ||
          'Email verified successfully.'
      )
    } catch (err: any) {
      setMessage('')

      setError(
        err?.message ||
          'Email verification failed.'
      )
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <Pressable
          onPress={handleBack}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>

          <Text style={styles.backText}>
            Account
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Settings
        </Text>

        <View
          style={styles.headerSpacer}
        />

      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ACCOUNT INFORMATION */}
        <View style={styles.card}>

          <Text
            style={styles.sectionTitle}
          >
            Account Information
          </Text>

          <View style={styles.infoRow}>

            <Text
              style={styles.infoLabel}
            >
              Name
            </Text>

            <Text
              style={styles.infoValue}
            >
              {customer?.name ||
                'Not available'}
            </Text>

          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>

            <Text
              style={styles.infoLabel}
            >
              Mobile
            </Text>

            <Text
              style={styles.infoValue}
            >
              {customer?.phone ||
                'Not available'}
            </Text>

          </View>

        </View>

        {/* EMAIL VERIFICATION */}
        <View style={styles.card}>

          <View
            style={styles.titleRow}
          >

            <Text
              style={styles.sectionTitle}
            >
              Email Verification
            </Text>

            {emailVerified && (
              <View
                style={styles.verifiedBadge}
              >
                <Text
                  style={
                    styles.verifiedBadgeText
                  }
                >
                  ✓ Verified
                </Text>
              </View>
            )}

          </View>

          <Text
            style={styles.description}
          >
            Add your email address and
            verify it to keep your
            account information secure.
          </Text>

          <Text
            style={styles.inputLabel}
          >
            Email Address
          </Text>

          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value)

              if (
                value.trim().toLowerCase() !==
                (customer?.email || '')
                  .trim()
                  .toLowerCase()
              ) {
                setEmailVerified(false)
              }

              clearMessages()
            }}
            placeholder="siddharth@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSavingEmail}
            style={styles.input}
          />

          <Pressable
            onPress={saveEmail}
            disabled={isSavingEmail}
            style={[
              styles.primaryButton,
              isSavingEmail &&
                styles.disabledButton,
            ]}
          >

            {isSavingEmail ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Save Email
              </Text>
            )}

          </Pressable>

          {!emailVerified && (
            <>
              <Pressable
                onPress={
                  sendVerificationOtp
                }
                disabled={
                  isSendingOtp ||
                  retryAfter > 0
                }
                style={[
                  styles.secondaryButton,
                  (isSendingOtp ||
                    retryAfter > 0) &&
                    styles.disabledSecondaryButton,
                ]}
              >

                {isSendingOtp ? (
                  <ActivityIndicator
                    color="#2E7D32"
                  />
                ) : (
                  <Text
                    style={
                      styles.secondaryButtonText
                    }
                  >
                    {retryAfter > 0
                      ? `Resend in ${retryAfter}s`
                      : 'Verify Email'}
                  </Text>
                )}

              </Pressable>

              {showOtpInput && (
                <View
                  style={styles.otpSection}
                >

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    Enter Verification OTP
                  </Text>

                  <TextInput
                    value={otp}
                    onChangeText={(value) =>
                      setOtp(
                        value
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
                    placeholder="6-digit OTP"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[
                      styles.input,
                      styles.otpInput,
                    ]}
                  />

                  <Pressable
                    onPress={verifyEmail}
                    disabled={
                      isVerifyingOtp
                    }
                    style={[
                      styles.primaryButton,
                      isVerifyingOtp &&
                        styles.disabledButton,
                    ]}
                  >

                    {isVerifyingOtp ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Verify OTP
                      </Text>
                    )}

                  </Pressable>

                </View>
              )}

            </>
          )}

          {emailVerified && (
            <View
              style={styles.verifiedBox}
            >

              <Text
                style={
                  styles.verifiedCheck
                }
              >
                ✓
              </Text>

              <View
                style={
                  styles.verifiedContent
                }
              >

                <Text
                  style={
                    styles.verifiedTitle
                  }
                >
                  Email Verified
                </Text>

                <Text
                  style={
                    styles.verifiedEmail
                  }
                >
                  {email}
                </Text>

              </View>

            </View>
          )}

          {message ? (
            <View
              style={styles.successBox}
            >
              <Text
                style={
                  styles.successText
                }
              >
                {message}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={styles.errorBox}
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          ) : null}

        </View>

        {/* SAVED ADDRESSES */}
        <View style={styles.card}>

          <Text
            style={styles.sectionTitle}
          >
            Saved Addresses
          </Text>

          <Text
            style={styles.description}
          >
            Your saved delivery addresses
            will appear here.
          </Text>

          <View
            style={styles.comingSoonBox}
          >
            <Text
              style={styles.comingSoonText}
            >
              Address management will be
              available here.
            </Text>
          </View>

        </View>

        {/* APP INFORMATION */}
        <View style={styles.card}>

          <Text
            style={styles.sectionTitle}
          >
            App Information
          </Text>

          <View style={styles.infoRow}>

            <Text
              style={styles.infoLabel}
            >
              App
            </Text>

            <Text
              style={styles.infoValue}
            >
              Jaya's Kitchen
            </Text>

          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>

            <Text
              style={styles.infoLabel}
            >
              Version
            </Text>

            <Text
              style={styles.infoValue}
            >
              1.0.0
            </Text>

          </View>

        </View>

      </ScrollView>

    </View>
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  header: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 90,
  },

  backIcon: {
    fontSize: 34,
    lineHeight: 34,
    color: '#2E7D32',
    marginRight: 4,
  },

  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },

  headerSpacer: {
    width: 90,
  },

  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 60,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 14,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 5,
  },

  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },

  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  verifiedBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },

  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  verifiedCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 20,
    fontWeight: '800',
  },

  verifiedContent: {
    marginLeft: 12,
    flex: 1,
  },

  verifiedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },

  verifiedEmail: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },

  otpInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },

  primaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },

  secondaryButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledSecondaryButton: {
    opacity: 0.55,
  },

  otpSection: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  successBox: {
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
  },

  successText: {
    color: '#166534',
    fontSize: 14,
    lineHeight: 20,
  },

  errorBox: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
  },

  comingSoonBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },

  comingSoonText: {
    color: '#6B7280',
    fontSize: 14,
  },

})