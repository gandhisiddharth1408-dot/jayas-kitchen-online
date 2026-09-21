import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

const router = express.Router()

// ===============================
// CREATE CUSTOMER JWT
// ===============================
const createCustomerToken = (customer) => {
  return jwt.sign(
    {
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )
}

// ===============================
// CUSTOMER SIGNUP
// ===============================
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
    } = req.body

    // Basic validation
    if (
      !name ||
      !phone ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, phone, email and password are required.',
      })
    }

    const cleanName = name.trim()
    const cleanPhone = phone.trim()
    const cleanEmail =
      email.trim().toLowerCase()

    // Validate phone
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid 10-digit mobile number.',
      })
    }

    // Validate email
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid email address.',
      })
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters long.',
      })
    }

    // Check existing email
    const existingEmail =
      await pool.query(
        `
        SELECT id
        FROM customers
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [cleanEmail]
      )

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'An account with this email already exists.',
      })
    }

    // Check existing phone
    const existingPhone =
      await pool.query(
        `
        SELECT id
        FROM customers
        WHERE phone = $1
        LIMIT 1
        `,
        [cleanPhone]
      )

    if (existingPhone.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'An account with this mobile number already exists.',
      })
    }

    // Hash password
    const passwordHash =
      await bcrypt.hash(password, 12)

    // Create customer
    const result =
      await pool.query(
        `
        INSERT INTO customers (
          name,
          phone,
          email,
          password_hash
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          phone,
          email,
          created_at
        `,
        [
          cleanName,
          cleanPhone,
          cleanEmail,
          passwordHash,
        ]
      )

    const customer =
      result.rows[0]

    // Create JWT
    const token =
      createCustomerToken(customer)

    return res.status(201).json({
      success: true,
      message:
        'Customer account created successfully.',
      token,
      customer,
    })
  } catch (error) {
    console.error(
      'Customer signup error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to create customer account.',
    })
  }
})

// ===============================
// CUSTOMER LOGIN
// ===============================
router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required.',
      })
    }

    const cleanEmail =
      email.trim().toLowerCase()

    // Find customer
    const result =
      await pool.query(
        `
        SELECT
          id,
          name,
          phone,
          email,
          password_hash
        FROM customers
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [cleanEmail]
      )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password.',
      })
    }

    const customer =
      result.rows[0]

    // Make sure this customer has a password
    if (!customer.password_hash) {
      return res.status(401).json({
        success: false,
        message:
          'This account has not been set up for login yet.',
      })
    }

    // Compare password
    const passwordMatches =
      await bcrypt.compare(
        password,
        customer.password_hash
      )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password.',
      })
    }

    // Create JWT
    const token =
      createCustomerToken(customer)

    // Never send password hash
    delete customer.password_hash

    return res.json({
      success: true,
      message:
        'Login successful.',
      token,
      customer,
    })
  } catch (error) {
    console.error(
      'Customer login error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to login.',
    })
  }
})

export default router