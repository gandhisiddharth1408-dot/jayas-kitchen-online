import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'

import { useAuth } from '../context/AuthContext'

type AuthMode = 'login' | 'signup'

export default function AuthScreen() {
  const {
    sendOtp,
    verifyOtp,
  } = useAuth()

  const [isSignup, setIsSignup] =
    useState(false)

  const [name, setName] =
    useState('')

  const [phone, setPhone] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [otp, setOtp] =
    useState('')

  const [otpSent, setOtpSent] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [isVerifying, setIsVerifying] =
    useState(false)

  const [resendCooldown, setResendCooldown] =
    useState(0)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  function getMode(): AuthMode {
    return isSignup
      ? 'signup'
      : 'login'
  }

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function startResendCooldown(
    seconds = 30
  ) {
    setResendCooldown(seconds)

    let remaining = seconds

    const timer = setInterval(() => {
      remaining -= 1

      setResendCooldown(
        remaining
      )

      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  }

  async function handleSendOtp() {
    clearMessages()

    const cleanPhone =
      phone.trim().replace(/\D/g, '')

    if (!cleanPhone) {
      setErrorMessage(
        'Mobile number is required.'
      )
      return
    }

    if (
      !/^[0-9]{10}$/.test(cleanPhone)
    ) {
      setErrorMessage(
        'Please enter a valid 10-digit mobile number.'
      )
      return
    }

    if (
      isSignup &&
      !name.trim()
    ) {
      setErrorMessage(
        'Full name is required.'
      )
      return
    }

    if (
      isSignup &&
      name.trim().length > 100
    ) {
      setErrorMessage(
        'Full name cannot be longer than 100 characters.'
      )
      return
    }

    if (
      isSignup &&
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      setErrorMessage(
        'Please enter a valid email address.'
      )
      return
    }

    if (resendCooldown > 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const response =
        await sendOtp(
          getMode(),
          cleanPhone,
          isSignup
            ? name.trim()
            : undefined,
          isSignup
            ? email.trim()
            : undefined
        )

      setOtpSent(true)
      setOtp('')
      startResendCooldown(30)

      setSuccessMessage(
        response.message ||
          'A verification OTP has been sent to your mobile number.'
      )
    } catch (error: any) {
      const message =
        error?.message ||
        'Something went wrong. Please try again.'

      const normalizedMessage =
        String(message)
          .toLowerCase()
          .trim()

      const accountAlreadyExists =
        isSignup &&
        (
          normalizedMessage.includes(
            'account already exists with this mobile number'
          ) ||
          normalizedMessage.includes(
            'account already exists'
          ) ||
          normalizedMessage.includes(
            'already registered'
          ) ||
          normalizedMessage.includes(
            'mobile number is already'
          ) ||
          normalizedMessage.includes(
            'phone number is already'
          )
        )

      if (accountAlreadyExists) {
        setErrorMessage(
          'An account already exists with this mobile number. Please login instead.'
        )

        return
      }

      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyOtp() {
    clearMessages()

    const cleanPhone =
      phone.trim().replace(/\D/g, '')

    const cleanOtp =
      otp.trim().replace(/\D/g, '')

    if (
      !/^[0-9]{6}$/.test(cleanOtp)
    ) {
      setErrorMessage(
        'Please enter the 6-digit OTP sent to your mobile number.'
      )
      return
    }

    try {
      setIsVerifying(true)

      await verifyOtp(
        getMode(),
        cleanPhone,
        cleanOtp,
        isSignup
          ? name.trim()
          : undefined,
        isSignup
          ? email.trim()
          : undefined
      )

      setSuccessMessage(
        isSignup
          ? 'Your account has been created successfully.'
          : 'You have been logged in successfully.'
      )

      setTimeout(() => {
        router.replace(
          '/(tabs)/account'
        )
      }, 500)
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          'Invalid OTP. Please try again.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  function changePhone() {
    clearMessages()
    setOtpSent(false)
    setOtp('')
  }

  function switchMode() {
    setIsSignup(
      (current) => !current
    )

    setName('')
    setPhone('')
    setEmail('')
    setOtp('')
    setOtpSent(false)
    setResendCooldown(0)
    clearMessages()
  }

  function goToLogin() {
    setIsSignup(false)
    setName('')
    setEmail('')
    setOtp('')
    setOtpSent(false)
    setResendCooldown(0)
    clearMessages()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Brand */}
        <View style={styles.header}>
          <Text style={styles.brand}>
            JAYA'S KITCHEN
          </Text>

          <Text style={styles.tagline}>
            Fresh • Homemade • Pure Veg
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <Text style={styles.title}>
            {isSignup
              ? 'Create Account'
              : 'Welcome Back'}
          </Text>

          <Text style={styles.subtitle}>
            {isSignup
              ? 'Create your Jaya’s Kitchen account using your mobile number.'
              : 'Login using the OTP sent to your mobile number.'}
          </Text>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                {errorMessage.includes(
                  'already exists'
                )
                  ? 'Account Already Exists'
                  : 'Unable to Continue'}
              </Text>

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>

              {isSignup &&
                errorMessage.includes(
                  'already exists'
                ) && (
                  <Pressable
                    onPress={goToLogin}
                    style={styles.loginButton}
                  >
                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      Go to Login
                    </Text>
                  </Pressable>
                )}
            </View>
          ) : null}

          {/* Success Message */}
          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                {successMessage}
              </Text>
            </View>
          ) : null}

          {/* Signup Name */}
          {isSignup && (
            <>
              <Text style={styles.label}>
                Full Name
                <Text style={styles.required}>
                  {' '}*
                </Text>
              </Text>

              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value)
                  clearMessages()
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                style={styles.input}
                autoCapitalize="words"
                editable={!otpSent}
              />
            </>
          )}

          {/* Mobile Number */}
          <Text style={styles.label}>
            Mobile Number
            <Text style={styles.required}>
              {' '}*
            </Text>
          </Text>

          <TextInput
            value={phone}
            onChangeText={(value) => {
              setPhone(
                value
                  .replace(/\D/g, '')
                  .slice(0, 10)
              )
              clearMessages()
            }}
            placeholder="Enter your 10-digit mobile number"
            placeholderTextColor="#999"
            style={[
              styles.input,
              otpSent &&
                styles.disabledInput,
            ]}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!otpSent}
          />

          {/* Optional Email */}
          {isSignup && (
            <>
              <Text style={styles.label}>
                Email Address
                <Text style={styles.optional}>
                  {' '}Optional
                </Text>
              </Text>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value)
                  clearMessages()
                }}
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                style={[
                  styles.input,
                  otpSent &&
                    styles.disabledInput,
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!otpSent}
              />

              <Text style={styles.helperText}>
                You can verify your email later from Account → Settings.
              </Text>
            </>
          )}

          {/* OTP */}
          {otpSent && (
            <>
              <View style={styles.otpHeader}>
                <Text style={styles.label}>
                  Enter OTP
                </Text>

                <Pressable
                  onPress={changePhone}
                >
                  <Text style={styles.changeText}>
                    Change Number
                  </Text>
                </Pressable>
              </View>

              <TextInput
                value={otp}
                onChangeText={(value) => {
                  setOtp(
                    value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                  clearMessages()
                }}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#999"
                style={[
                  styles.input,
                  styles.otpInput,
                ]}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <Text style={styles.otpInfo}>
                OTP sent to +91 {phone}
              </Text>
            </>
          )}

          {/* Required Note */}
          {!otpSent && (
            <Text style={styles.requiredNote}>
              * Required fields
            </Text>
          )}

          {/* Send OTP */}
          {!otpSent && (
            <Pressable
              onPress={handleSendOtp}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  !isSubmitting &&
                  styles.buttonPressed,
                isSubmitting &&
                  styles.buttonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Send OTP
                </Text>
              )}
            </Pressable>
          )}

          {/* Verify OTP */}
          {otpSent && (
            <>
              <Pressable
                onPress={
                  handleVerifyOtp
                }
                disabled={isVerifying}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed &&
                    !isVerifying &&
                    styles.buttonPressed,
                  isVerifying &&
                    styles.buttonDisabled,
                ]}
              >
                {isVerifying ? (
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

              {/* Resend */}
              <Pressable
                onPress={
                  handleSendOtp
                }
                disabled={
                  resendCooldown > 0 ||
                  isSubmitting
                }
                style={styles.resendButton}
              >
                <Text
                  style={[
                    styles.resendText,
                    resendCooldown > 0 &&
                      styles.resendDisabled,
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend OTP'}
                </Text>
              </Pressable>
            </>
          )}

          {/* Switch Login / Signup */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignup
                ? 'Already have an account?'
                : "Don't have an account?"}
            </Text>

            <Pressable
              onPress={switchMode}
            >
              <Text
                style={styles.switchButton}
              >
                {isSignup
                  ? ' Login'
                  : ' Sign Up'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Back */}
        <Pressable
          onPress={() =>
            router.replace(
              '/(tabs)'
            )
          }
          style={styles.backButton}
        >
          <Text
            style={styles.backButtonText}
          >
            ← Back to Home
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Homemade food, made with love. ❤️
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1,
  },

  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },

  errorBox: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },

  errorTitle: {
    marginBottom: 5,
    fontSize: 15,
    fontWeight: '800',
    color: '#B91C1C',
  },

  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7F1D1D',
  },

  loginButton: {
    height: 44,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#2E7D32',
  },

  loginButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  successBox: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },

  successText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#166534',
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  required: {
    color: '#DC2626',
    fontWeight: '800',
  },

  optional: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },

  input: {
    width: '100%',
    height: 52,
    marginBottom: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#111827',
  },

  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },

  helperText: {
    marginTop: -10,
    marginBottom: 18,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },

  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  changeText: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },

  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
  },

  otpInfo: {
    marginTop: -8,
    marginBottom: 18,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  requiredNote: {
    marginTop: -5,
    marginBottom: 15,
    fontSize: 12,
    color: '#6B7280',
  },

  primaryButton: {
    height: 52,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#2E7D32',
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },

  resendDisabled: {
    color: '#9CA3AF',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  switchText: {
    fontSize: 14,
    color: '#6B7280',
  },

  switchButton: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },

  backButton: {
    alignItems: 'center',
    marginTop: 24,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },

  footer: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 13,
    color: '#888',
  },
})