import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool from './config/db.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import authRouter from './routes/auth.js'
import otpRouter from './routes/otp.js'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 5001

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin
      // such as Postman or server-to-server requests
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(
        new Error('Not allowed by CORS')
      )
    },
  })
)

// Razorpay webhook needs the raw request body
// for HMAC signature verification.
app.use(
  '/api/orders/payment/webhook',
  express.raw({
    type: 'application/json',
  })
)

app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Jaya's Kitchen API is running",
  })
})

// Database test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT NOW() AS current_time'
    )

    res.json({
      success: true,
      message:
        'PostgreSQL connection is working',
      databaseTime:
        result.rows[0].current_time,
    })
  } catch (error) {
    console.error(
      'Database test failed:',
      error
    )

    res.status(500).json({
      success: false,
      message:
        'PostgreSQL connection failed',
    })
  }
})

// Customer authentication APIs
app.use('/api/auth', authRouter)

// Customer OTP APIs
app.use('/api/otp', otpRouter)

// Customer + order APIs
app.use('/api/orders', ordersRouter)

// Admin authentication API
app.use('/api/admin', adminRouter)

// Start server
app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  )

  console.log(
    `Admin username configured: ${
      process.env.ADMIN_USERNAME
        ? 'YES'
        : 'NO'
    }`
  )

  console.log(
    `Admin password configured: ${
      process.env.ADMIN_PASSWORD
        ? 'YES'
        : 'NO'
    }`
  )
})