declare module 'react-native-razorpay' {
  type RazorpayPrefill = {
    name?: string
    email?: string
    contact?: string
  }

  type RazorpayTheme = {
    color?: string
  }

  type RazorpayOptions = {
    description?: string
    currency: string
    key: string
    amount: string | number
    name: string
    order_id: string
    prefill?: RazorpayPrefill
    theme?: RazorpayTheme
  }

  type RazorpayPaymentResult = {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }

  const RazorpayCheckout: {
    open(
      options: RazorpayOptions
    ): Promise<RazorpayPaymentResult>
  }

  export default RazorpayCheckout
}
