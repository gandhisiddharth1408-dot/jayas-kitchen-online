import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool from './config/db.js'
import ordersRouter from './routes/orders.js'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 5001

const allowedOrigins = [
  'http://localhost:5173',
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

      return callback(new Error('Not allowed by CORS'))
    },
  })
)

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Jaya's Kitchen API is running",
  })
})

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time')

    res.json({
      success: true,
      message: 'PostgreSQL connection is working',
      databaseTime: result.rows[0].current_time,
    })
  } catch (error) {
    console.error('Database test failed:', error)

    res.status(500).json({
      success: false,
      message: 'PostgreSQL connection failed',
    })
  }
})

app.use('/api/orders', ordersRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})