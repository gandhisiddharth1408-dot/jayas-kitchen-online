import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const webhookSecret =
  process.env.RAZORPAY_WEBHOOK_SECRET

if (!webhookSecret) {
  console.error(
    '❌ RAZORPAY_WEBHOOK_SECRET is missing from server/.env'
  )

  process.exit(1)
}

const payload = {
  entity: 'event',
  account_id: 'test_account',
  event: 'payment.captured',
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: 'pay_test_webhook_123',
        entity: 'payment',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_test_webhook_123',
      },
    },
  },
}

const body = JSON.stringify(payload)

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex')

console.log('Sending signed test webhook...')

const response = await fetch(
  'https://jayas-kitchen-api.onrender.com/api/orders/payment/webhook',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
    body,
  }
)

const responseText = await response.text()

console.log('')
console.log('HTTP Status:', response.status)
console.log('Response:')
console.log(responseText)

if (response.ok) {
  console.log('')
  console.log('✅ Webhook signature was accepted by Render')
} else {
  console.log('')
  console.log('❌ Webhook test failed')
}