import { useEffect, useState } from 'react'
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
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from '../api/api'

type DeliveryType =
  | 'delivery'
  | 'pickup'

type PaymentMethod =
  | 'cash'
  | 'online'

type AddressLabel =
  | 'Home'
  | 'Work'
  | 'Other'

type SavedAddress = {
  id: number
  customer_id?: number
  label: AddressLabel
  full_name: string
  phone: string
  house_number: string | null
  street: string | null
  address_line2: string | null
  landmark: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
  address?: string
  created_at?: string
  updated_at?: string
}

type AddressForm = {
  label: AddressLabel
  fullName: string
  phone: string
  houseNumber: string
  street: string
  addressLine2: string
  landmark: string
  city: string
  state: string
  pincode: string
}

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

const emptyAddressForm: AddressForm = {
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

  const [instructions, setInstructions] =
    useState('')

  const [addresses, setAddresses] =
    useState<SavedAddress[]>([])

  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null)

  const [isLoadingAddresses, setIsLoadingAddresses] =
    useState(false)

  const [isAddressFormOpen, setIsAddressFormOpen] =
    useState(false)

  const [editingAddressId, setEditingAddressId] =
    useState<number | null>(null)

  const [addressForm, setAddressForm] =
    useState<AddressForm>(
      emptyAddressForm
    )

  const [isSavingAddress, setIsSavingAddress] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [orderError, setOrderError] =
    useState('')

  const [checkoutStatus, setCheckoutStatus] =
    useState('')

  const [showOrderSuccess, setShowOrderSuccess] =
    useState(false)

  const [successfulOrderId, setSuccessfulOrderId] =
    useState<number | null>(null)

  function formatPrice(value: number) {
    return Number(value).toFixed(0)
  }

  function showError(
    title: string,
    message: string
  ) {
    Alert.alert(title, message)
  }

  function getSelectedAddress() {
    return addresses.find(
      (address) =>
        address.id === selectedAddressId
    )
  }

  function formatAddress(address: SavedAddress) {
    const parts = [
      address.house_number,
      address.street,
      address.address_line2,
      address.landmark
        ? `Near ${address.landmark}`
        : null,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean)

    return parts.join(', ')
  }

  function openAddAddressForm() {
    setEditingAddressId(null)

    setAddressForm({
      ...emptyAddressForm,
      fullName:
        customer?.name || '',
      phone:
        customer?.phone || '',
    })

    setIsAddressFormOpen(true)
  }

  function openEditAddressForm(
    address: SavedAddress
  ) {
    setEditingAddressId(address.id)

    setAddressForm({
      label:
        address.label || 'Home',
      fullName:
        address.full_name ||
        customer?.name ||
        '',
      phone:
        address.phone ||
        customer?.phone ||
        '',
      houseNumber:
        address.house_number || '',
      street:
        address.street || '',
      addressLine2:
        address.address_line2 || '',
      landmark:
        address.landmark || '',
      city:
        address.city || '',
      state:
        address.state || '',
      pincode:
        address.pincode || '',
    })

    setIsAddressFormOpen(true)
  }

  function closeAddressForm() {
    if (isSavingAddress) {
      return
    }

    setIsAddressFormOpen(false)
    setEditingAddressId(null)
    setAddressForm(
      emptyAddressForm
    )
  }

  function updateAddressField(
    field: keyof AddressForm,
    value: string
  ) {
    setAddressForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    )
  }

  async function loadAddresses() {
    if (!isLoggedIn || !customer) {
      return
    }

    try {
      setIsLoadingAddresses(true)

      const response =
        await apiGet<{
          success: boolean
          addresses: SavedAddress[]
        }>('/api/otp/me/addresses')

      if (!response.success) {
        throw new Error(
          'Unable to load saved addresses.'
        )
      }

      const loadedAddresses =
        response.addresses || []

      setAddresses(
        loadedAddresses
      )

      const defaultAddress =
        loadedAddresses.find(
          (address) =>
            address.is_default
        )

      if (defaultAddress) {
        setSelectedAddressId(
          defaultAddress.id
        )
      } else if (
        loadedAddresses.length > 0
      ) {
        setSelectedAddressId(
          loadedAddresses[0].id
        )
      } else {
        setSelectedAddressId(null)
      }
    } catch (error: any) {
      console.error(
        'Load addresses error:',
        error
      )

      showError(
        'Address Error',
        error?.message ||
          'Unable to load your saved addresses.'
      )
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  useEffect(() => {
    if (
      isLoggedIn &&
      customer &&
      deliveryType === 'delivery'
    ) {
      loadAddresses()
    }
  }, [
    isLoggedIn,
    customer,
    deliveryType,
  ])

  async function saveAddress() {
    const cleanFullName =
      addressForm.fullName.trim()

    const cleanPhone =
      addressForm.phone
        .trim()
        .replace(/\D/g, '')

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
      addressForm.pincode
        .trim()
        .replace(/\D/g, '')

    if (!cleanFullName) {
      showError(
        'Full Name Required',
        'Please enter the full name.'
      )
      return
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      showError(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number.'
      )
      return
    }

    if (!cleanHouseNumber) {
      showError(
        'House / Flat Number Required',
        'Please enter your house or flat number.'
      )
      return
    }

    if (!cleanStreet) {
      showError(
        'Street / Society Required',
        'Please enter your street or society.'
      )
      return
    }

    if (!cleanCity) {
      showError(
        'City Required',
        'Please enter the city.'
      )
      return
    }

    if (!cleanState) {
      showError(
        'State Required',
        'Please enter the state.'
      )
      return
    }

    if (!/^[0-9]{6}$/.test(cleanPincode)) {
      showError(
        'Invalid Pincode',
        'Please enter a valid 6-digit pincode.'
      )
      return
    }

    if (isSavingAddress) {
      return
    }

    try {
      setIsSavingAddress(true)

      const body = {
        label:
          addressForm.label,
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

      if (editingAddressId) {
        const response =
          await apiPut<{
            success: boolean
            message: string
            address: SavedAddress
          }>(
            `/api/otp/me/addresses/${editingAddressId}`,
            body
          )

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to update address.'
          )
        }

        setAddresses(
          (current) =>
            current.map(
              (address) =>
                address.id ===
                editingAddressId
                  ? response.address
                  : address
            )
        )

        setSelectedAddressId(
          editingAddressId
        )

        Alert.alert(
          'Address Updated',
          'Your address has been updated successfully.'
        )
      } else {
        const response =
          await apiPost<{
            success: boolean
            message: string
            address: SavedAddress
          }>(
            '/api/otp/me/addresses',
            body
          )

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to add address.'
          )
        }

        const newAddress =
          response.address

        setAddresses(
          (current) => [
            ...current,
            newAddress,
          ]
        )

        setSelectedAddressId(
          newAddress.id
        )

        Alert.alert(
          'Address Added',
          'Your new address has been saved successfully.'
        )
      }

      setIsAddressFormOpen(false)
      setEditingAddressId(null)
      setAddressForm(
        emptyAddressForm
      )

      await loadAddresses()
    } catch (error: any) {
      console.error(
        'Save address error:',
        error
      )

      showError(
        'Address Error',
        error?.message ||
          'Unable to save your address.'
      )
    } finally {
      setIsSavingAddress(false)
    }
  }

  async function selectAddress(
    addressId: number
  ) {
    if (
      selectedAddressId ===
      addressId
    ) {
      return
    }

    try {
      setSelectedAddressId(
        addressId
      )

      const response =
        await apiPut<{
          success: boolean
          message: string
          address: SavedAddress
        }>(
          `/api/otp/me/addresses/${addressId}/default`,
          {}
        )

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to select this address.'
        )
      }

      setAddresses(
        (current) =>
          current.map(
            (address) => ({
              ...address,
              is_default:
                address.id ===
                addressId,
            })
          )
      )
    } catch (error: any) {
      console.error(
        'Select address error:',
        error
      )

      showError(
        'Address Error',
        error?.message ||
          'Unable to select this address.'
      )

      await loadAddresses()
    }
  }

  function confirmDeleteAddress(
    address: SavedAddress
  ) {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete your ${address.label.toLowerCase()} address?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteAddress(
              address.id
            ),
        },
      ]
    )
  }

  async function deleteAddress(
    addressId: number
  ) {
    try {
      const response =
        await apiDelete<{
          success: boolean
          message: string
        }>(
          `/api/otp/me/addresses/${addressId}`
        )

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to delete address.'
        )
      }

      await loadAddresses()

      Alert.alert(
        'Address Deleted',
        'The address has been deleted successfully.'
      )
    } catch (error: any) {
      console.error(
        'Delete address error:',
        error
      )

      showError(
        'Address Error',
        error?.message ||
          'Unable to delete this address.'
      )
    }
  }

  async function createCashOrder() {
    if (!customer) {
      throw new Error(
        'Customer account could not be found.'
      )
    }

    const selectedAddress =
      getSelectedAddress()

    if (
      deliveryType === 'delivery' &&
      !selectedAddress
    ) {
      throw new Error(
        'Please select or add a delivery address.'
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
            ? formatAddress(
                selectedAddress!
              )
            : null,

        landmark:
          deliveryType === 'delivery'
            ? selectedAddress?.landmark ||
              null
            : null,

        instructions:
          instructions.trim() ||
          null,

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

    const selectedAddress =
      getSelectedAddress()

    if (
      deliveryType === 'delivery' &&
      !selectedAddress
    ) {
      throw new Error(
        'Please select or add a delivery address.'
      )
    }

    if (Platform.OS === 'web') {
      throw new Error(
        'Online payment is available in the Android/iOS app. Please use Cash on Delivery while testing on the web.'
      )
    }

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

    const paymentResult =
      (await RazorpayCheckout.open({
        description:
          "Jaya's Kitchen Order",
        currency:
          razorpayOrder.currency,
        key:
          razorpayOrder.keyId,
        amount:
          String(
            razorpayOrder.amount
          ),
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
            ? formatAddress(
                selectedAddress!
              )
            : null,

        landmark:
          deliveryType === 'delivery'
            ? selectedAddress?.landmark ||
              null
            : null,

        instructions:
          instructions.trim() ||
          null,

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
      !getSelectedAddress()
    ) {
      showError(
        'Delivery Address Required',
        'Please select a saved address or add a new delivery address.'
      )

      return
    }

    if (isSubmitting) {
      return
    }

    try {
      setOrderError('')
      setCheckoutStatus('Creating your order...')
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

      setCheckoutStatus('')
      setSuccessfulOrderId(createdOrder.id)
      setShowOrderSuccess(true)
    } catch (error: any) {
      console.error(
        'Place order error:',
        error
      )

      const message =
        error?.description ||
        error?.message ||
        'Unable to place your order. Please try again.'

      setOrderError(message)
      setCheckoutStatus('Order creation failed.')

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
    <>
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
              <Text>👤</Text>
            </View>

            <View style={styles.customerInfo}>
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
                setDeliveryType('delivery')
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

              <View style={styles.optionContent}>
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
                    style={styles.radioInner}
                  />
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                setDeliveryType('pickup')
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

              <View style={styles.optionContent}>
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
                    style={styles.radioInner}
                  />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Saved Addresses */}
        {deliveryType === 'delivery' && (
          <View style={styles.section}>
            <View style={styles.addressHeader}>
              <Text style={styles.sectionTitle}>
                Delivery Address
              </Text>

              {!isAddressFormOpen &&
                addresses.length > 0 && (
                  <Pressable
                    onPress={openAddAddressForm}
                    style={styles.smallAddButton}
                  >
                    <Text style={styles.smallAddButtonText}>
                      + Add
                    </Text>
                  </Pressable>
                )}
            </View>

            {isLoadingAddresses ? (
              <View style={styles.addressLoading}>
                <ActivityIndicator
                  color="#2E7D32"
                />

                <Text style={styles.addressLoadingText}>
                  Loading saved addresses...
                </Text>
              </View>
            ) : null}

            {!isLoadingAddresses &&
              addresses.length === 0 &&
              !isAddressFormOpen && (
                <View style={styles.noAddressCard}>
                  <Text style={styles.noAddressIcon}>
                    📍
                  </Text>

                  <Text style={styles.noAddressTitle}>
                    No Saved Address
                  </Text>

                  <Text style={styles.noAddressText}>
                    Add your delivery address to
                    continue with your order.
                  </Text>

                  <Pressable
                    onPress={openAddAddressForm}
                    style={styles.addAddressButton}
                  >
                    <Text style={styles.addAddressButtonText}>
                      + Add New Address
                    </Text>
                  </Pressable>
                </View>
              )}

            {!isAddressFormOpen &&
              addresses.map((address) => {
                const selected =
                  selectedAddressId ===
                  address.id

                return (
                  <View
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selected &&
                        styles.addressCardSelected,
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        selectAddress(
                          address.id
                        )
                      }
                      style={styles.addressSelectArea}
                    >
                      <View
                        style={styles.addressTopRow}
                      >
                        <View
                          style={
                            styles.addressLabelRow
                          }
                        >
                          <Text
                            style={
                              styles.addressLabelIcon
                            }
                          >
                            {address.label ===
                            'Home'
                              ? '🏠'
                              : address.label ===
                                  'Work'
                                ? '💼'
                                : '📍'}
                          </Text>

                          <Text
                            style={
                              styles.addressLabel
                            }
                          >
                            {address.label}
                          </Text>

                          {address.is_default && (
                            <View
                              style={
                                styles.defaultBadge
                              }
                            >
                              <Text
                                style={
                                  styles.defaultBadgeText
                                }
                              >
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>

                        <View
                          style={[
                            styles.radio,
                            selected &&
                              styles.radioSelected,
                          ]}
                        >
                          {selected && (
                            <View
                              style={
                                styles.radioInner
                              }
                            />
                          )}
                        </View>
                      </View>

                      <Text
                        style={
                          styles.addressFullName
                        }
                      >
                        {address.full_name}
                      </Text>

                      <Text
                        style={
                          styles.addressPhone
                        }
                      >
                        {address.phone}
                      </Text>

                      <Text
                        style={
                          styles.addressText
                        }
                      >
                        {formatAddress(
                          address
                        )}
                      </Text>
                    </Pressable>

                    <View
                      style={
                        styles.addressActions
                      }
                    >
                      <Pressable
                        onPress={() =>
                          openEditAddressForm(
                            address
                          )
                        }
                        style={
                          styles.addressActionButton
                        }
                      >
                        <Text
                          style={
                            styles.addressActionText
                          }
                        >
                          Edit
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          confirmDeleteAddress(
                            address
                          )
                        }
                        style={
                          styles.addressActionButton
                        }
                      >
                        <Text
                          style={[
                            styles.addressActionText,
                            styles.deleteText,
                          ]}
                        >
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )
              })}

            {/* Add / Edit Address Form */}
            {isAddressFormOpen && (
              <View style={styles.addressFormCard}>
                <View style={styles.formHeader}>
                  <View>
                    <Text style={styles.formTitle}>
                      {editingAddressId
                        ? 'Edit Address'
                        : 'Add New Address'}
                    </Text>

                    <Text
                      style={styles.formSubtitle}
                    >
                      Enter your complete delivery
                      address
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeAddressForm}
                    style={styles.formCloseButton}
                  >
                    <Text
                      style={styles.formCloseText}
                    >
                      ×
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>
                  Address Type *
                </Text>

                <View style={styles.addressTypeRow}>
                  {(
                    [
                      'Home',
                      'Work',
                      'Other',
                    ] as AddressLabel[]
                  ).map((label) => (
                    <Pressable
                      key={label}
                      onPress={() =>
                        updateAddressField(
                          'label',
                          label
                        )
                      }
                      style={[
                        styles.addressTypeButton,
                        addressForm.label ===
                          label &&
                          styles.addressTypeButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.addressTypeText,
                          addressForm.label ===
                            label &&
                            styles.addressTypeTextSelected,
                        ]}
                      >
                        {label ===
                        'Home'
                          ? '🏠 Home'
                          : label ===
                              'Work'
                            ? '💼 Work'
                            : '📍 Other'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>
                  Full Name *
                </Text>

                <TextInput
                  value={
                    addressForm.fullName
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'fullName',
                      value
                    )
                  }
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

                <Text style={styles.label}>
                  Mobile Number *
                </Text>

                <TextInput
                  value={
                    addressForm.phone
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'phone',
                      value
                    )
                  }
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                />

                <Text style={styles.label}>
                  House / Flat No. *
                </Text>

                <TextInput
                  value={
                    addressForm.houseNumber
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'houseNumber',
                      value
                    )
                  }
                  placeholder="e.g. 12, Flat 204"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

                <Text style={styles.label}>
                  Street / Society *
                </Text>

                <TextInput
                  value={
                    addressForm.street
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'street',
                      value
                    )
                  }
                  placeholder="Street, society or building name"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

                <Text style={styles.label}>
                  Address Line 2
                </Text>

                <TextInput
                  value={
                    addressForm.addressLine2
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'addressLine2',
                      value
                    )
                  }
                  placeholder="Area, locality, etc. (optional)"
                  placeholderTextColor="#999"
                  style={[
                    styles.input,
                    styles.multilineInputSmall,
                  ]}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.label}>
                  Landmark
                </Text>

                <TextInput
                  value={
                    addressForm.landmark
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'landmark',
                      value
                    )
                  }
                  placeholder="Nearby landmark (optional)"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

                <Text style={styles.label}>
                  City *
                </Text>

                <TextInput
                  value={
                    addressForm.city
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'city',
                      value
                    )
                  }
                  placeholder="City"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

                <Text style={styles.label}>
                  State *
                </Text>

                <TextInput
                  value={
                    addressForm.state
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'state',
                      value
                    )
                  }
                  placeholder="State"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

                <Text style={styles.label}>
                  Pincode *
                </Text>

                <TextInput
                  value={
                    addressForm.pincode
                  }
                  onChangeText={(value) =>
                    updateAddressField(
                      'pincode',
                      value
                    )
                  }
                  placeholder="6-digit pincode"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                />

                <View
                  style={
                    styles.formButtons
                  }
                >
                  <Pressable
                    onPress={
                      closeAddressForm
                    }
                    disabled={
                      isSavingAddress
                    }
                    style={
                      styles.cancelAddressButton
                    }
                  >
                    <Text
                      style={
                        styles.cancelAddressText
                      }
                    >
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={
                      saveAddress
                    }
                    disabled={
                      isSavingAddress
                    }
                    style={[
                      styles.saveAddressButton,
                      isSavingAddress &&
                        styles.buttonDisabled,
                    ]}
                  >
                    {isSavingAddress ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text
                        style={
                          styles.saveAddressText
                        }
                      >
                        {editingAddressId
                          ? 'Update Address'
                          : 'Save Address'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {!isAddressFormOpen &&
              addresses.length > 0 && (
                <Pressable
                  onPress={
                    openAddAddressForm
                  }
                  style={
                    styles.fullAddAddressButton
                  }
                >
                  <Text
                    style={
                      styles.fullAddAddressText
                    }
                  >
                    + Add New Address
                  </Text>
                </Pressable>
              )}

            {!isAddressFormOpen &&
              addresses.length > 0 && (
                <View style={styles.selectedAddressNote}>
                  <Text
                    style={
                      styles.selectedAddressNoteText
                    }
                  >
                    ✓ The selected address will be
                    used for this order.
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* Delivery Instructions */}
        {deliveryType === 'delivery' &&
          !isAddressFormOpen && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Delivery Instructions
              </Text>

              <TextInput
                value={instructions}
                onChangeText={
                  setInstructions
                }
                placeholder="Any special instructions for delivery? (optional)"
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
        {deliveryType === 'pickup' && (
          <View style={styles.pickupNote}>
            <Text style={styles.pickupIcon}>
              🏠
            </Text>

            <View style={styles.pickupContent}>
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
              setPaymentMethod('cash')
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

            <View style={styles.paymentContent}>
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
                  style={styles.radioInner}
                />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              setPaymentMethod('online')
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

            <View style={styles.paymentContent}>
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
                  style={styles.radioInner}
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

              <View
                style={styles.webPaymentContent}
              >
                <Text
                  style={styles.webPaymentTitle}
                >
                  Mobile App Required
                </Text>

                <Text
                  style={styles.webPaymentText}
                >
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
                style={styles.summaryItemInfo}
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

          <View style={styles.totalRow}>
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

        {orderError ? (
          <View style={styles.orderErrorCard}>
            <Text style={styles.orderErrorTitle}>
              {paymentMethod === 'online'
                ? 'Payment Failed'
                : 'Order Failed'}
            </Text>

            <Text style={styles.orderErrorText}>
              {orderError}
            </Text>

            <Pressable
              onPress={() => setOrderError('')}
              style={styles.orderErrorDismiss}
            >
              <Text style={styles.orderErrorDismissText}>
                Dismiss
              </Text>
            </Pressable>
          </View>
        ) : null}

        {checkoutStatus ? (
          <View style={styles.checkoutStatusCard}>
            <Text style={styles.checkoutStatusText}>
              {checkoutStatus}
            </Text>
          </View>
        ) : null}

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
            <View style={styles.loadingRow}>
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

      {showOrderSuccess ? (
        <View style={styles.successOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIcon}>
                ✓
              </Text>
            </View>

            <Text style={styles.successTitle}>
              Your Order Has Been Successfully Placed! 🎉
            </Text>

            <Text style={styles.successMessage}>
              Thank you for ordering from Jaya's Kitchen.
              Your order has been confirmed successfully.
            </Text>

            <Pressable
              onPress={() => {
                clearCart()
                setShowOrderSuccess(false)
                router.replace('/(tabs)/orders')
              }}
              style={styles.trackOrderButton}
            >
              <Text style={styles.trackOrderButtonText}>
                Track My Order
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                clearCart()
                setShowOrderSuccess(false)
                router.replace('/(tabs)/menu')
              }}
              style={styles.continueShoppingButton}
            >
              <Text style={styles.continueShoppingText}>
                Continue Shopping
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </>
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

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  smallAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
  },

  smallAddButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
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

  addressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  addressLoadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#6B7280',
  },

  noAddressCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  noAddressIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  noAddressTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  noAddressText: {
    maxWidth: 350,
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: '#6B7280',
  },

  addAddressButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
  },

  addAddressButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  addressCard: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  addressCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },

  addressSelectArea: {
    padding: 17,
  },

  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  addressLabelIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  addressLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  defaultBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },

  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#166534',
  },

  addressFullName: {
    marginTop: 13,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  addressPhone: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  addressText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
  },

  addressActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  addressActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  addressActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },

  deleteText: {
    color: '#DC2626',
  },

  fullAddAddressButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },

  fullAddAddressText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },

  selectedAddressNote: {
    marginTop: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },

  selectedAddressNoteText: {
    fontSize: 12,
    color: '#166534',
  },

  addressFormCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  formTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  formSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  formCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
  },

  formCloseText: {
    fontSize: 25,
    lineHeight: 27,
    color: '#4B5563',
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  addressTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },

  addressTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },

  addressTypeButtonSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },

  addressTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },

  addressTypeTextSelected: {
    color: '#2E7D32',
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

  multilineInputSmall: {
    minHeight: 75,
    paddingTop: 13,
    paddingBottom: 13,
  },

  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  cancelAddressButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },

  cancelAddressText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5563',
  },

  saveAddressButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#2E7D32',
  },

  saveAddressText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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

  checkoutStatusCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  checkoutStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    textAlign: 'center',
  },

  successOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  successModal: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  successIconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
  },

  successIcon: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2E7D32',
  },

  successTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    textAlign: 'center',
    color: '#111827',
  },

  successMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#6B7280',
  },

  trackOrderButton: {
    width: '100%',
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#2E7D32',
  },

  trackOrderButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  continueShoppingButton: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },

  continueShoppingText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
  },

  orderErrorCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  orderErrorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
  },

  orderErrorText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#7F1D1D',
  },

  orderErrorDismiss: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },

  orderErrorDismissText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
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