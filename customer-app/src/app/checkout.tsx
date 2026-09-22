import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import RazorpayCheckout from 'react-native-razorpay'

import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { apiPost } from '../api/api'

type DeliveryType =
  | 'delivery'
  | 'pickup'

type PaymentMethod =
  | 'cash'
  | 'online'

type CreatedOrder = {
  id: number
  order_status?: string
  payment_status?: string
  subtotal: number
  delivery_charge: number
  total: number
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
}

type RazorpayOrderResponse = {
  success: boolean
  message: string
  order: {
    id: string
    amount: number
    currency: string
    keyId: string
    calculatedTotal: number
  }
}

type RazorpayPaymentResult = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export default function CheckoutScreen() {
  const {
    customer,
    isLoggedIn,
  } = useAuth()

  const {
    items,
    subtotal,
    deliveryCharge,
    total,
    clearCart,
  } = useCart()

  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>('delivery')

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash')

  const [address, setAddress] =
    useState('')

  const [landmark, setLandmark] =
    useState('')

  const [instructions, setInstructions] =
    useState('')

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  function formatPrice(value: number) {
    return Number(value).toFixed(0)
  }

  function showError(
    title: string,
    message: string
  ) {
    Alert.alert(title, message)
  }

  async function createCashOrder() {
    if (!customer) {
      throw new Error(
        'Customer account could not be found.'
      )
    }

    const response =
      await apiPost<{
        success: boolean
        message: string
        order: CreatedOrder
      }>('/api/orders', {
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },

        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),

        deliveryType,

        address:
          deliveryType === 'delivery'
            ? address.trim()
            : null,

        landmark:
          deliveryType === 'delivery'
            ? landmark.trim()
            : null,

        instructions:
          instructions.trim() || null,

        paymentMethod: 'cash',

        paymentStatus: 'pending',
      })

    if (
      !response.success ||
      !response.order
    ) {
      throw new Error(
        response.message ||
          'Unable to place your order.'
      )
    }

    return response.order
  }

  async function handleOnlinePayment() {
    if (!customer) {
      throw new Error(
        'Customer account could not be found.'
      )
    }

    // Razorpay native SDK is not available on Expo Web.
    if (Platform.OS === 'web') {
      throw new Error(
        'Online payment is available in the Android/iOS app. Please use Cash on Delivery while testing on the web.'
      )
    }

    // ------------------------------------------------
    // STEP 1:
    // Ask backend to create a Razorpay order.
    // The backend calculates the amount from the
    // database, so we never trust the frontend total.
    // ------------------------------------------------

    const razorpayOrderResponse =
      await apiPost<RazorpayOrderResponse>(
        '/api/orders/payment/create-order',
        {
          items: items.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),

          deliveryType,
        }
      )

    if (
      !razorpayOrderResponse.success ||
      !razorpayOrderResponse.order
    ) {
      throw new Error(
        razorpayOrderResponse.message ||
          'Unable to start online payment.'
      )
    }

    const razorpayOrder =
      razorpayOrderResponse.order

    // Make sure the backend returned
    // a valid Razorpay order.
    if (
      !razorpayOrder.id ||
      !razorpayOrder.keyId ||
      !razorpayOrder.amount ||
      !razorpayOrder.currency
    ) {
      throw new Error(
        'Invalid Razorpay order received from the server.'
      )
    }

    // ------------------------------------------------
    // STEP 2:
    // Open Razorpay native checkout.
    // ------------------------------------------------

    const paymentResult =
      (await RazorpayCheckout.open({
        description:
          "Jaya's Kitchen Order",
        currency:
          razorpayOrder.currency,
        key:
          razorpayOrder.keyId,
        amount:
          String(razorpayOrder.amount),
        name:
          "Jaya's Kitchen",
        order_id:
          razorpayOrder.id,

        prefill: {
          name:
            customer.name,
          contact:
            customer.phone,
          ...(customer.email
            ? {
                email:
                  customer.email,
              }
            : {}),
        },

        theme: {
          color:
            '#2E7D32',
        },
      })) as RazorpayPaymentResult

    // ------------------------------------------------
    // STEP 3:
    // Verify payment and create the actual
    // Jaya's Kitchen order on the backend.
    //
    // The backend independently verifies:
    // - Razorpay signature
    // - payment/order relationship
    // - captured status
    // - currency
    // - amount
    // - duplicate payment
    // ------------------------------------------------

    if (
      !paymentResult ||
      !paymentResult.razorpay_payment_id ||
      !paymentResult.razorpay_order_id ||
      !paymentResult.razorpay_signature
    ) {
      throw new Error(
        'Razorpay did not return complete payment details.'
      )
    }

    const response =
      await apiPost<{
        success: boolean
        message: string
        order: CreatedOrder
      }>('/api/orders', {
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },

        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),

        deliveryType,

        address:
          deliveryType === 'delivery'
            ? address.trim()
            : null,

        landmark:
          deliveryType === 'delivery'
            ? landmark.trim()
            : null,

        instructions:
          instructions.trim() || null,

        paymentMethod:
          'online',

        paymentStatus:
          'paid',

        razorpayOrderId:
          paymentResult.razorpay_order_id,

        razorpayPaymentId:
          paymentResult.razorpay_payment_id,

        razorpaySignature:
          paymentResult.razorpay_signature,
      })

    if (
      !response.success ||
      !response.order
    ) {
      throw new Error(
        response.message ||
          'Payment succeeded, but the order could not be created.'
      )
    }

    return response.order
  }

  async function handlePlaceOrder() {
    if (!isLoggedIn || !customer) {
      Alert.alert(
        'Login Required',
        'Please login to your account before placing an order.',
        [
          {
            text: 'Login',
            onPress: () =>
              router.push('/auth'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      )

      return
    }

    if (items.length === 0) {
      showError(
        'Cart is Empty',
        'Please add items to your cart before checkout.'
      )

      return
    }

    if (
      deliveryType === 'delivery' &&
      !address.trim()
    ) {
      showError(
        'Delivery Address Required',
        'Please enter your complete delivery address.'
      )

      return
    }

    if (isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)

      let createdOrder:
        | CreatedOrder
        | undefined

      if (paymentMethod === 'cash') {
        createdOrder =
          await createCashOrder()
      } else {
        createdOrder =
          await handleOnlinePayment()
      }

      if (!createdOrder) {
        throw new Error(
          'Order could not be created.'
        )
      }

      clearCart()

      Alert.alert(
        paymentMethod === 'online'
          ? 'Payment Successful! 🎉'
          : 'Order Placed Successfully! 🎉',
        `Your order #${createdOrder.id} has been placed successfully.`,
        [
          {
            text: 'View Orders',
            onPress: () =>
              router.replace(
                '/(tabs)/orders'
              ),
          },
        ]
      )
    } catch (error: any) {
      console.error(
        'Place order error:',
        error
      )

      const message =
        error?.description ||
        error?.message ||
        'Unable to place your order. Please try again.'

      showError(
        paymentMethod === 'online'
          ? 'Payment Failed'
          : 'Order Failed',
        message
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn || !customer) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <Text style={styles.loginIcon}>
            🔐
          </Text>

          <Text style={styles.loginTitle}>
            Login Required
          </Text>

          <Text style={styles.loginDescription}>
            Please login to your Jaya's Kitchen
            account before placing an order.
          </Text>

          <Pressable
            onPress={() =>
              router.push('/auth')
            }
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              Login / Create Account
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              ← Back to Cart
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          🛒
        </Text>

        <Text style={styles.emptyTitle}>
          Your Cart is Empty
        </Text>

        <Text style={styles.emptyDescription}>
          Add some delicious homemade food
          before checking out.
        </Text>

        <Pressable
          onPress={() =>
            router.replace(
              '/(tabs)/menu'
            )
          }
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Browse Menu
          </Text>
        </Pressable>
      </View>
    )
  }

  const displayedTotal =
    deliveryType === 'delivery'
      ? total
      : subtotal

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.headerBack}
          >
            <Text style={styles.headerBackText}>
              ←
            </Text>
          </Pressable>

          <View>
            <Text style={styles.brand}>
              JAYA'S KITCHEN
            </Text>

            <Text style={styles.headerTitle}>
              Checkout
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Customer Details
          </Text>

          <View style={styles.customerCard}>
            <View style={styles.customerIcon}>
              <Text>
                👤
              </Text>
            </View>

            <View
              style={
                styles.customerInfo
              }
            >
              <Text style={styles.customerName}>
                {customer.name}
              </Text>

              <Text style={styles.customerDetail}>
                {customer.phone}
              </Text>

              {customer.email ? (
                <Text style={styles.customerDetail}>
                  {customer.email}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Delivery Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Type
          </Text>

          <View style={styles.optionRow}>
            <Pressable
              onPress={() =>
                setDeliveryType(
                  'delivery'
                )
              }
              style={[
                styles.optionCard,
                deliveryType ===
                  'delivery' &&
                  styles.optionCardSelected,
              ]}
            >
              <Text style={styles.optionIcon}>
                🛵
              </Text>

              <View
                style={
                  styles.optionContent
                }
              >
                <Text
                  style={[
                    styles.optionTitle,
                    deliveryType ===
                      'delivery' &&
                      styles.optionTitleSelected,
                  ]}
                >
                  Home Delivery
                </Text>

                <Text style={styles.optionDescription}>
                  Delivered to your address
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  deliveryType ===
                    'delivery' &&
                    styles.radioSelected,
                ]}
              >
                {deliveryType ===
                  'delivery' && (
                  <View
                    style={
                      styles.radioInner
                    }
                  />
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                setDeliveryType(
                  'pickup'
                )
              }
              style={[
                styles.optionCard,
                deliveryType ===
                  'pickup' &&
                  styles.optionCardSelected,
              ]}
            >
              <Text style={styles.optionIcon}>
                🏠
              </Text>

              <View
                style={
                  styles.optionContent
                }
              >
                <Text
                  style={[
                    styles.optionTitle,
                    deliveryType ===
                      'pickup' &&
                      styles.optionTitleSelected,
                  ]}
                >
                  Pickup
                </Text>

                <Text style={styles.optionDescription}>
                  Pick up from Jaya's Kitchen
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  deliveryType ===
                    'pickup' &&
                    styles.radioSelected,
                ]}
              >
                {deliveryType ===
                  'pickup' && (
                  <View
                    style={
                      styles.radioInner
                    }
                  />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Address */}
        {deliveryType ===
          'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Delivery Address
            </Text>

            <Text style={styles.label}>
              Complete Address *
            </Text>

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="House/Flat No., Street, Society"
              placeholderTextColor="#999"
              style={[
                styles.input,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>
              Landmark
            </Text>

            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Nearby landmark"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={styles.label}>
              Delivery Instructions
            </Text>

            <TextInput
              value={instructions}
              onChangeText={
                setInstructions
              }
              placeholder="Any special instructions?"
              placeholderTextColor="#999"
              style={[
                styles.input,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Pickup Note */}
        {deliveryType ===
          'pickup' && (
          <View style={styles.pickupNote}>
            <Text style={styles.pickupIcon}>
              🏠
            </Text>

            <View
              style={
                styles.pickupContent
              }
            >
              <Text style={styles.pickupTitle}>
                Pickup Order
              </Text>

              <Text style={styles.pickupText}>
                Your order will be prepared
                for pickup from Jaya's Kitchen.
              </Text>
            </View>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <Pressable
            onPress={() =>
              setPaymentMethod(
                'cash'
              )
            }
            style={[
              styles.paymentCard,
              paymentMethod ===
                'cash' &&
                styles.paymentCardSelected,
            ]}
          >
            <Text style={styles.paymentIcon}>
              💵
            </Text>

            <View
              style={
                styles.paymentContent
              }
            >
              <Text
                style={[
                  styles.paymentTitle,
                  paymentMethod ===
                    'cash' &&
                    styles.paymentTitleSelected,
                ]}
              >
                Cash on Delivery
              </Text>

              <Text style={styles.paymentDescription}>
                Pay when your order is delivered
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  'cash' &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod ===
                'cash' && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              setPaymentMethod(
                'online'
              )
            }
            style={[
              styles.paymentCard,
              paymentMethod ===
                'online' &&
                styles.paymentCardSelected,
            ]}
          >
            <Text style={styles.paymentIcon}>
              💳
            </Text>

            <View
              style={
                styles.paymentContent
              }
            >
              <Text
                style={[
                  styles.paymentTitle,
                  paymentMethod ===
                    'online' &&
                    styles.paymentTitleSelected,
                ]}
              >
                Online Payment
              </Text>

              <Text style={styles.paymentDescription}>
                Pay securely using Razorpay
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  'online' &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod ===
                'online' && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* Web Payment Notice */}
        {paymentMethod === 'online' &&
          Platform.OS === 'web' && (
            <View style={styles.webPaymentNote}>
              <Text style={styles.webPaymentIcon}>
                📱
              </Text>

              <View style={styles.webPaymentContent}>
                <Text style={styles.webPaymentTitle}>
                  Mobile App Required
                </Text>

                <Text style={styles.webPaymentText}>
                  Razorpay online payment will open
                  in the Android/iOS app. Cash on
                  Delivery can be tested on the web.
                </Text>
              </View>
            </View>
          )}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Order Summary
          </Text>

          {items.map((item) => (
            <View
              key={item.id}
              style={styles.summaryItem}
            >
              <View
                style={
                  styles.summaryItemInfo
                }
              >
                <Text
                  style={
                    styles.summaryItemName
                  }
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.summaryItemQuantity
                  }
                >
                  {item.quantity} × ₹
                  {formatPrice(
                    item.price
                  )}
                </Text>
              </View>

              <Text
                style={
                  styles.summaryItemPrice
                }
              >
                ₹
                {formatPrice(
                  item.price *
                    item.quantity
                )}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>

            <Text style={styles.summaryValue}>
              ₹{formatPrice(subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery
            </Text>

            <Text style={styles.summaryValue}>
              {deliveryType ===
              'delivery'
                ? `₹${formatPrice(
                    deliveryCharge
                  )}`
                : '₹0'}
            </Text>
          </View>

          <View
            style={styles.totalRow}
          >
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalValue}>
              ₹
              {formatPrice(
                displayedTotal
              )}
            </Text>
          </View>
        </View>

        {/* Place Order */}
        <Pressable
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.placeOrderButton,
            pressed &&
              !isSubmitting &&
              styles.buttonPressed,
            isSubmitting &&
              styles.buttonDisabled,
          ]}
        >
          {isSubmitting ? (
            <View
              style={
                styles.loadingRow
              }
            >
              <ActivityIndicator
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.placeOrderText
                }
              >
                {paymentMethod ===
                'online'
                  ? 'Processing Payment...'
                  : 'Placing Order...'}
              </Text>
            </View>
          ) : (
            <Text
              style={
                styles.placeOrderText
              }
            >
              {paymentMethod ===
              'online'
                ? 'Pay Now • ₹'
                : 'Place Order • ₹'}
              {formatPrice(
                displayedTotal
              )}
            </Text>
          )}
        </Pressable>

        <Text style={styles.secureText}>
          🔒 Your order is securely processed.
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
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },

  headerBack: {
    width: 42,
    height: 42,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  headerBackText: {
    fontSize: 24,
    color: '#2E7D32',
  },

  brand: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#2E7D32',
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  customerIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
  },

  customerInfo: {
    flex: 1,
    marginLeft: 14,
  },

  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  customerDetail: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  optionRow: {
    gap: 10,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  optionCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },

  optionIcon: {
    fontSize: 25,
  },

  optionContent: {
    flex: 1,
    marginLeft: 13,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  optionTitleSelected: {
    color: '#2E7D32',
  },

  optionDescription: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },

  radioSelected: {
    borderColor: '#2E7D32',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  input: {
    width: '100%',
    height: 52,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },

  multilineInput: {
    minHeight: 95,
    paddingTop: 14,
    paddingBottom: 14,
  },

  pickupNote: {
    flexDirection: 'row',
    marginBottom: 24,
    padding: 17,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  pickupIcon: {
    fontSize: 25,
  },

  pickupContent: {
    flex: 1,
    marginLeft: 13,
  },

  pickupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },

  pickupText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
  },

  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  paymentCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },

  paymentIcon: {
    fontSize: 24,
  },

  paymentContent: {
    flex: 1,
    marginLeft: 13,
  },

  paymentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  paymentTitleSelected: {
    color: '#2E7D32',
  },

  paymentDescription: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  webPaymentNote: {
    flexDirection: 'row',
    marginTop: -10,
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },

  webPaymentIcon: {
    fontSize: 24,
  },

  webPaymentContent: {
    flex: 1,
    marginLeft: 12,
  },

  webPaymentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
  },

  webPaymentText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#7C2D12',
  },

  summaryCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  summaryTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  summaryItemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  summaryItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  summaryItemQuantity: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  divider: {
    height: 1,
    marginVertical: 6,
    backgroundColor: '#E5E7EB',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },

  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D32',
  },

  placeOrderButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#2E7D32',
  },

  placeOrderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  secureText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
  },

  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFDF5',
  },

  loginCard: {
    width: '100%',
    maxWidth: 500,
    padding: 26,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  loginIcon: {
    fontSize: 42,
    marginBottom: 15,
  },

  loginTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  loginDescription: {
    marginTop: 9,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#6B7280',
  },

  primaryButton: {
    width: '100%',
    height: 52,
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

  backButton: {
    marginTop: 17,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#FFFDF5',
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  emptyDescription: {
    maxWidth: 400,
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#6B7280',
  },
})