import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import pool from '../config/db.js'
import customerAuth from '../middleware/customerAuth.js'

const router = express.Router()

// ===============================
// RESEND EMAIL
// ===============================

const resend = new Resend(
  process.env.RESEND_API_KEY
)

// ===============================
// OTP SETTINGS
// ===============================

const OTP_EXPIRY_MINUTES = 5
const MAX_OTP_ATTEMPTS = 5
const OTP_RESEND_COOLDOWN_SECONDS = 60

// ===============================
// 2FACTOR SETTINGS
// ===============================

const TWOFACTOR_API_KEY =
  process.env.TWOFACTOR_API_KEY

const TWOFACTOR_TEMPLATE =
  'JAYAS_KITCHEN_OTP'

// ===============================
// OTP COOLDOWN STORAGE
// ===============================

const otpCooldowns = new Map()

// Clean old cooldown entries
setInterval(() => {
  const expiry =
    OTP_RESEND_COOLDOWN_SECONDS * 1000

  const now = Date.now()

  for (
    const [key, timestamp]
    of otpCooldowns.entries()
  ) {
    if (now - timestamp >= expiry) {
      otpCooldowns.delete(key)
    }
  }
}, 60 * 1000)

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
// GENERATE OTP
// ===============================

const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString()
}

// ===============================
// HASH OTP
// ===============================

const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10)
}

// ===============================
// VALIDATE MOBILE
// ===============================

const isValidPhone = (phone) => {
  return /^[0-9]{10}$/.test(phone)
}

// ===============================
// VALIDATE EMAIL
// ===============================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  )
}

// ==================================================
// GET CURRENT LOGGED-IN CUSTOMER
// ==================================================

router.get(
  '/me',
  customerAuth,
  async (req, res) => {
    try {
      const customerId =
        req.customer?.customerId

      if (
        !customerId ||
        !Number.isInteger(
          Number(customerId)
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            address,
            landmark,
            house_number,
            street,
            address_line2,
            city,
            state,
            pincode,
            address_type,
            created_at,
            updated_at
          FROM customers
          WHERE id = $1
          LIMIT 1
          `,
          [Number(customerId)]
        )

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const customer =
        result.rows[0]

      return res.json({
        success: true,
        customer,
      })
    } catch (error) {
      console.error(
        'Fetch current customer failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to fetch customer account.',
      })
    }
  }
)

// ==================================================
// UPDATE CURRENT LOGGED-IN CUSTOMER
// ==================================================

router.put(
  '/me',
  customerAuth,
  async (req, res) => {
    try {
      const customerId =
        req.customer?.customerId

      if (
        !customerId ||
        !Number.isInteger(
          Number(customerId)
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      const {
        name,
        phone,
        email,
      } = req.body

      const cleanName =
        typeof name === 'string'
          ? name.trim()
          : ''

      const cleanPhone =
        typeof phone === 'string'
          ? phone.trim()
          : ''

      const cleanEmail =
        typeof email === 'string'
          ? email.trim().toLowerCase()
          : ''

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            'Full name is required.',
        })
      }

      if (cleanName.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'Full name must be 100 characters or less.',
        })
      }

      if (
        !cleanPhone ||
        !isValidPhone(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit mobile number.',
        })
      }

      if (
        cleanEmail &&
        !isValidEmail(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.',
        })
      }

      // ===============================
      // CHECK DUPLICATE MOBILE
      // ===============================

      const phoneResult =
        await pool.query(
          `
          SELECT id
          FROM customers
          WHERE phone = $1
          AND id <> $2
          LIMIT 1
          `,
          [
            cleanPhone,
            Number(customerId),
          ]
        )

      if (
        phoneResult.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            'This mobile number is already linked to another account.',
        })
      }

      // ===============================
      // CHECK DUPLICATE EMAIL
      // ===============================

      if (cleanEmail) {
        const emailResult =
          await pool.query(
            `
            SELECT id
            FROM customers
            WHERE LOWER(email) = $1
            AND id <> $2
            LIMIT 1
            `,
            [
              cleanEmail,
              Number(customerId),
            ]
          )

        if (
          emailResult.rows.length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'This email address is already linked to another account.',
          })
        }
      }

      // ===============================
      // UPDATE CUSTOMER
      // ===============================

      const result =
        await pool.query(
          `
          UPDATE customers
          SET
            name = $1,
            phone = $2,
            email = NULLIF($3, ''),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING
            id,
            name,
            phone,
            email,
            address,
            landmark,
            house_number,
            street,
            address_line2,
            city,
            state,
            pincode,
            address_type,
            created_at,
            updated_at
          `,
          [
            cleanName,
            cleanPhone,
            cleanEmail,
            Number(customerId),
          ]
        )

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const customer =
        result.rows[0]

      const token =
        createCustomerToken(customer)

      return res.json({
        success: true,
        message:
          'Profile updated successfully.',
        token,
        customer,
      })
    } catch (error) {
      console.error(
        'Update customer profile failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update customer profile.',
      })
    }
  }
)

// ==================================================
// UPDATE SAVED DELIVERY ADDRESS
// ==================================================

router.put(
  '/me/address',
  customerAuth,
  async (req, res) => {
    try {
      const customerId =
        req.customer?.customerId

      if (
        !customerId ||
        !Number.isInteger(
          Number(customerId)
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      const {
        address,
        landmark,
        houseNumber,
        street,
        addressLine2,
        city,
        state,
        pincode,
        addressType,
      } = req.body

      // ===============================
      // CLEAN INPUT
      // ===============================

      const cleanAddress =
        typeof address === 'string'
          ? address.trim()
          : ''

      const cleanHouseNumber =
        typeof houseNumber === 'string'
          ? houseNumber.trim()
          : ''

      const cleanStreet =
        typeof street === 'string'
          ? street.trim()
          : ''

      const cleanAddressLine2 =
        typeof addressLine2 === 'string'
          ? addressLine2.trim()
          : ''

      const cleanLandmark =
        typeof landmark === 'string'
          ? landmark.trim()
          : ''

      const cleanCity =
        typeof city === 'string'
          ? city.trim()
          : ''

      const cleanState =
        typeof state === 'string'
          ? state.trim()
          : ''

      const cleanPincode =
        typeof pincode === 'string'
          ? pincode.trim()
          : ''

      const cleanAddressType =
        typeof addressType === 'string'
          ? addressType.trim()
          : 'Home'

      // ===============================
      // REQUIRED FIELD VALIDATION
      // ===============================

      if (!cleanHouseNumber) {
        return res.status(400).json({
          success: false,
          message:
            'House / Flat / Building number is required.',
        })
      }

      if (!cleanStreet) {
        return res.status(400).json({
          success: false,
          message:
            'Street / Area / Society is required.',
        })
      }

      if (!cleanCity) {
        return res.status(400).json({
          success: false,
          message:
            'City is required.',
        })
      }

      if (!cleanState) {
        return res.status(400).json({
          success: false,
          message:
            'State is required.',
        })
      }

      if (
        !/^[0-9]{6}$/.test(
          cleanPincode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 6-digit pincode.',
        })
      }

      // ===============================
      // LENGTH VALIDATION
      // ===============================

      if (cleanHouseNumber.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'House / Flat / Building number must be 100 characters or less.',
        })
      }

      if (cleanStreet.length > 255) {
        return res.status(400).json({
          success: false,
          message:
            'Street / Area / Society must be 255 characters or less.',
        })
      }

      if (cleanAddressLine2.length > 255) {
        return res.status(400).json({
          success: false,
          message:
            'Address Line 2 must be 255 characters or less.',
        })
      }

      if (cleanLandmark.length > 255) {
        return res.status(400).json({
          success: false,
          message:
            'Landmark must be 255 characters or less.',
        })
      }

      if (cleanCity.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'City must be 100 characters or less.',
        })
      }

      if (cleanState.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'State must be 100 characters or less.',
        })
      }

      if (
        !['Home', 'Work', 'Other'].includes(
          cleanAddressType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid address type.',
        })
      }

      if (cleanAddress.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            'Delivery address must be 500 characters or less.',
        })
      }

      // ===============================
      // UPDATE CUSTOMER ADDRESS
      // ===============================

      const result =
        await pool.query(
          `
          UPDATE customers
          SET
            address = $1,
            landmark = NULLIF($2, ''),
            house_number = $3,
            street = $4,
            address_line2 = NULLIF($5, ''),
            city = $6,
            state = $7,
            pincode = $8,
            address_type = $9,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING
            id,
            name,
            phone,
            email,
            address,
            landmark,
            house_number,
            street,
            address_line2,
            city,
            state,
            pincode,
            address_type,
            created_at,
            updated_at
          `,
          [
            cleanAddress,
            cleanLandmark,
            cleanHouseNumber,
            cleanStreet,
            cleanAddressLine2,
            cleanCity,
            cleanState,
            cleanPincode,
            cleanAddressType,
            Number(customerId),
          ]
        )

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const customer =
        result.rows[0]

      // ===============================
      // CREATE UPDATED JWT
      // ===============================

      const token =
        createCustomerToken(customer)

      return res.json({
        success: true,
        message:
          'Delivery address saved successfully.',
        token,
        customer,
      })
    } catch (error) {
      console.error(
        'Update customer address failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to save delivery address.',
      })
    }
  }
)

// ===============================
// SEND OTP
// ===============================

router.post('/send', async (req, res) => {
  try {
    const {
      method,
      authMode,
      phone,
      email,
      name,
    } = req.body

    const now = Date.now()

    // ===============================
    // VALIDATE METHOD
    // ===============================

    if (
      method !== 'mobile' &&
      method !== 'email'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid OTP method.',
      })
    }

    // ===============================
    // VALIDATE AUTH MODE
    // ===============================

    if (
      authMode !== 'login' &&
      authMode !== 'signup'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid authentication mode.',
      })
    }

    const isSignup =
      authMode === 'signup'

    // ===============================
    // CLEAN INPUT
    // ===============================

    const cleanPhone =
      typeof phone === 'string'
        ? phone.trim()
        : ''

    const cleanEmail =
      typeof email === 'string'
        ? email.trim().toLowerCase()
        : ''

    const cleanName =
      typeof name === 'string'
        ? name.trim()
        : ''

    // ===============================
    // SIGNUP VALIDATION
    // ===============================

    if (isSignup) {
      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            'Full name is required to create an account.',
        })
      }

      if (cleanName.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'Full name must be 100 characters or less.',
        })
      }

      if (
        !cleanPhone ||
        !isValidPhone(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit mobile number.',
        })
      }

      if (
        !cleanEmail ||
        !isValidEmail(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.',
        })
      }
    }

    // ===============================
    // MOBILE OTP
    // ===============================

    if (method === 'mobile') {
      if (
        !cleanPhone ||
        !isValidPhone(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit mobile number.',
        })
      }

      // --------------------------------
      // CHECK 2FACTOR API KEY
      // --------------------------------

      if (!TWOFACTOR_API_KEY) {
        console.error(
          'TWOFACTOR_API_KEY is missing.'
        )

        return res.status(500).json({
          success: false,
          message:
            'Mobile OTP service is not configured.',
        })
      }

      // --------------------------------
      // MOBILE OTP COOLDOWN
      // --------------------------------

      const cooldownKey =
        `mobile:${cleanPhone}`

      const lastSentAt =
        otpCooldowns.get(cooldownKey)

      if (
        lastSentAt &&
        now - lastSentAt <
          OTP_RESEND_COOLDOWN_SECONDS * 1000
      ) {
        const remainingSeconds =
          Math.ceil(
            (
              OTP_RESEND_COOLDOWN_SECONDS * 1000 -
              (now - lastSentAt)
            ) / 1000
          )

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
          retryAfter:
            remainingSeconds,
        })
      }

      // --------------------------------
      // FIND CUSTOMER BY MOBILE
      // --------------------------------

      const mobileCustomerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email
          FROM customers
          WHERE phone = $1
          LIMIT 1
          `,
          [cleanPhone]
        )

      const mobileCustomer =
        mobileCustomerResult.rows[0] || null

      // --------------------------------
      // SIGNUP:
      // CHECK MOBILE DUPLICATE
      // --------------------------------

      if (isSignup) {
        if (mobileCustomer) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this mobile number. Please login instead.',
          })
        }

        // --------------------------------
        // CHECK EMAIL DUPLICATE
        // --------------------------------

        const emailCustomerResult =
          await pool.query(
            `
            SELECT
              id,
              name,
              phone,
              email
            FROM customers
            WHERE LOWER(email) = $1
            LIMIT 1
            `,
            [cleanEmail]
          )

        if (
          emailCustomerResult.rows.length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this email address. Please login instead.',
          })
        }
      }

      // --------------------------------
      // LOGIN:
      // CUSTOMER MUST EXIST
      // --------------------------------

      if (
        !isSignup &&
        !mobileCustomer
      ) {
        return res.status(404).json({
          success: false,
          message:
            'No account found with this mobile number. Please create an account first.',
        })
      }

      // --------------------------------
      // GENERATE OTP
      // --------------------------------

      const otp = generateOtp()

      console.log(
        `Generated mobile OTP for ${cleanPhone}`
      )

      // --------------------------------
      // SEND OTP THROUGH 2FACTOR
      // --------------------------------

      const internationalPhone =
        `+91${cleanPhone}`

      const twoFactorUrl =
        `https://2factor.in/API/V1/${encodeURIComponent(
          TWOFACTOR_API_KEY
        )}/SMS/${encodeURIComponent(
          internationalPhone
        )}/${encodeURIComponent(
          otp
        )}/${encodeURIComponent(
          TWOFACTOR_TEMPLATE
        )}`

      console.log(
        `Sending mobile OTP through 2Factor to ${internationalPhone}`
      )

      const twoFactorResponse =
        await fetch(twoFactorUrl, {
          method: 'GET',
          headers: {
            Accept:
              'application/json',
          },
        })

      const twoFactorData =
        await twoFactorResponse.json()

      console.log(
        '2Factor send OTP response:',
        twoFactorData
      )

      // --------------------------------
      // CHECK 2FACTOR RESPONSE
      // --------------------------------

      if (
        !twoFactorResponse.ok ||
        twoFactorData?.Status !==
          'Success'
      ) {
        console.error(
          '2Factor OTP sending failed:',
          twoFactorData
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to send OTP to your mobile number. Please try again.',
        })
      }

      // --------------------------------
      // START MOBILE COOLDOWN
      // --------------------------------

      otpCooldowns.set(
        cooldownKey,
        Date.now()
      )

      return res.json({
        success: true,
        message:
          'OTP sent successfully to your mobile number.',
        expiresIn:
          OTP_EXPIRY_MINUTES * 60,
      })
    }

    // ===============================
    // EMAIL OTP
    // ===============================

    if (method === 'email') {
      if (
        !cleanEmail ||
        !isValidEmail(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.',
        })
      }

      const cooldownKey =
        `email:${cleanEmail}`

      const lastSentAt =
        otpCooldowns.get(cooldownKey)

      if (
        lastSentAt &&
        now - lastSentAt <
          OTP_RESEND_COOLDOWN_SECONDS * 1000
      ) {
        const remainingSeconds =
          Math.ceil(
            (
              OTP_RESEND_COOLDOWN_SECONDS * 1000 -
              (now - lastSentAt)
            ) / 1000
          )

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
          retryAfter:
            remainingSeconds,
        })
      }

      // --------------------------------
      // FIND CUSTOMER BY EMAIL
      // --------------------------------

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email
          FROM customers
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [cleanEmail]
        )

      const customer =
        customerResult.rows[0] || null

      // --------------------------------
      // SIGNUP:
      // CHECK EMAIL DUPLICATE
      // --------------------------------

      if (isSignup) {
        if (customer) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this email address. Please login instead.',
          })
        }

        // --------------------------------
        // CHECK MOBILE DUPLICATE
        // --------------------------------

        const mobileCustomerResult =
          await pool.query(
            `
            SELECT
              id,
              name,
              phone,
              email
            FROM customers
            WHERE phone = $1
            LIMIT 1
            `,
            [cleanPhone]
          )

        if (
          mobileCustomerResult.rows.length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this mobile number. Please login instead.',
          })
        }
      }

      // --------------------------------
      // LOGIN:
      // CUSTOMER MUST EXIST
      // --------------------------------

      if (
        !isSignup &&
        !customer
      ) {
        return res.status(404).json({
          success: false,
          message:
            'No account found with this email address. Please create an account first.',
        })
      }

      // --------------------------------
      // GENERATE EMAIL OTP
      // --------------------------------

      const otp = generateOtp()

      const otpHash =
        await hashOtp(otp)

      const expiresAt =
        new Date(
          Date.now() +
            OTP_EXPIRY_MINUTES *
              60 *
              1000
        )

      // --------------------------------
      // REMOVE OLD OTP
      // --------------------------------

      await pool.query(
        `
        DELETE FROM customer_otps
        WHERE LOWER(email) = $1
        AND verified = FALSE
        `,
        [cleanEmail]
      )

      // --------------------------------
      // STORE NEW OTP
      // --------------------------------

      await pool.query(
        `
        INSERT INTO customer_otps (
          customer_id,
          email,
          otp_hash,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          customer?.id || null,
          cleanEmail,
          otpHash,
          expiresAt,
        ]
      )

      // ===============================
      // SEND EMAIL WITH RESEND
      // ===============================

      const {
        data,
        error,
      } = await resend.emails.send({
        from:
          "Jaya's Kitchen <onboarding@resend.dev>",

        to: [cleanEmail],

        subject:
          "Your Jaya's Kitchen Login OTP",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            background-color: #f8faf6;
            padding: 30px 15px;
          ">
            <div style="
              max-width: 500px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              padding: 30px;
              border: 1px solid #e5e7eb;
            ">

              <h2 style="
                margin: 0 0 10px;
                color: #166534;
              ">
                Jaya's Kitchen
              </h2>

              <p style="
                color: #374151;
                font-size: 15px;
              ">
                Your verification code is:
              </p>

              <div style="
                margin: 25px 0;
                text-align: center;
              ">
                <span style="
                  display: inline-block;
                  padding: 14px 24px;
                  background: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  border-radius: 10px;
                  color: #166534;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 8px;
                ">
                  ${otp}
                </span>
              </div>

              <p style="
                color: #4b5563;
                font-size: 14px;
              ">
                This OTP is valid for
                <strong>5 minutes</strong>.
              </p>

              <p style="
                color: #6b7280;
                font-size: 13px;
              ">
                If you did not request this code,
                you can safely ignore this email.
              </p>

              <hr style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin: 25px 0;
              ">

              <p style="
                color: #9ca3af;
                font-size: 12px;
                margin: 0;
              ">
                Jaya's Kitchen — Home Tiffin & Catering
              </p>

            </div>
          </div>
        `,
      })

      // --------------------------------
      // CHECK RESEND RESPONSE
      // --------------------------------

      if (error) {
        console.error(
          'Resend email error:',
          error
        )

        await pool.query(
          `
          DELETE FROM customer_otps
          WHERE LOWER(email) = $1
          AND verified = FALSE
          `,
          [cleanEmail]
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to send OTP email. Please try again.',
        })
      }

      // --------------------------------
      // START EMAIL COOLDOWN
      // --------------------------------

      otpCooldowns.set(
        cooldownKey,
        Date.now()
      )

      console.log(
        `OTP email sent successfully. Resend ID: ${
          data?.id || 'unknown'
        }`
      )

      return res.json({
        success: true,
        message:
          'OTP sent successfully to your email.',
        expiresIn:
          OTP_EXPIRY_MINUTES * 60,
      })
    }
  } catch (error) {
    console.error(
      'Send OTP error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to send OTP.',
    })
  }
})

// ===============================
// VERIFY OTP
// ===============================

router.post('/verify', async (req, res) => {
  try {
    const {
      method,
      authMode,
      phone,
      email,
      otp,
      name,
    } = req.body

    // ===============================
    // VALIDATE METHOD
    // ===============================

    if (
      method !== 'mobile' &&
      method !== 'email'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid OTP method.',
      })
    }

    // ===============================
    // VALIDATE AUTH MODE
    // ===============================

    if (
      authMode !== 'login' &&
      authMode !== 'signup'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid authentication mode.',
      })
    }

    const isSignup =
      authMode === 'signup'

    // ===============================
    // VALIDATE OTP
    // ===============================

    if (
      !otp ||
      !/^[0-9]{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid 6-digit OTP.',
      })
    }

    // ===============================
    // CLEAN INPUT
    // ===============================

    const cleanPhone =
      typeof phone === 'string'
        ? phone.trim()
        : ''

    const cleanEmail =
      typeof email === 'string'
        ? email.trim().toLowerCase()
        : ''

    const cleanName =
      typeof name === 'string'
        ? name.trim()
        : ''

    // ===============================
    // SIGNUP VALIDATION
    // ===============================

    if (isSignup) {
      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            'Full name is required to create an account.',
        })
      }

      if (cleanName.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'Full name must be 100 characters or less.',
        })
      }

      if (
        !cleanPhone ||
        !isValidPhone(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit mobile number.',
        })
      }

      if (
        !cleanEmail ||
        !isValidEmail(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.',
        })
      }
    }

    let customer = null
    let otpRecord = null

    // ===============================
    // MOBILE OTP
    // ===============================

    if (method === 'mobile') {
      if (
        !cleanPhone ||
        !isValidPhone(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit mobile number.',
        })
      }

      // --------------------------------
      // CHECK 2FACTOR API KEY
      // --------------------------------

      if (!TWOFACTOR_API_KEY) {
        console.error(
          'TWOFACTOR_API_KEY is missing.'
        )

        return res.status(500).json({
          success: false,
          message:
            'Mobile OTP service is not configured.',
        })
      }

      // --------------------------------
      // VERIFY OTP THROUGH 2FACTOR
      // --------------------------------

      const internationalPhone =
        `+91${cleanPhone}`

      const twoFactorVerifyUrl =
        `https://2factor.in/API/V1/${encodeURIComponent(
          TWOFACTOR_API_KEY
        )}/SMS/VERIFY3/${encodeURIComponent(
          internationalPhone
        )}/${encodeURIComponent(
          otp
        )}`

      console.log(
        `Verifying mobile OTP through 2Factor for ${internationalPhone}`
      )

      const twoFactorResponse =
        await fetch(
          twoFactorVerifyUrl,
          {
            method: 'GET',
            headers: {
              Accept:
                'application/json',
            },
          }
        )

      const twoFactorData =
        await twoFactorResponse.json()

      console.log(
        '2Factor verify OTP response:',
        twoFactorData
      )

      // --------------------------------
      // CHECK 2FACTOR VERIFICATION
      // --------------------------------

      if (
        !twoFactorResponse.ok ||
        twoFactorData?.Status !==
          'Success'
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Incorrect or expired OTP. Please try again.',
        })
      }

      // --------------------------------
      // FIND CUSTOMER BY MOBILE
      // --------------------------------

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            address,
            landmark,
            house_number,
            street,
            address_line2,
            city,
            state,
            pincode,
            address_type,
            created_at,
            updated_at
          FROM customers
          WHERE phone = $1
          LIMIT 1
          `,
          [cleanPhone]
        )

      customer =
        customerResult.rows[0] || null

      // ===============================
      // LOGIN
      // ===============================

      if (!isSignup) {
        if (!customer) {
          return res.status(404).json({
            success: false,
            message:
              'No account found with this mobile number. Please create an account first.',
          })
        }
      }

      // ===============================
      // SIGNUP
      // ===============================

      if (isSignup) {
        // --------------------------------
        // CHECK MOBILE AGAIN
        // --------------------------------

        if (customer) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this mobile number. Please login instead.',
          })
        }

        // --------------------------------
        // CHECK EMAIL AGAIN
        // --------------------------------

        const emailCustomerResult =
          await pool.query(
            `
            SELECT
              id,
              name,
              phone,
              email
            FROM customers
            WHERE LOWER(email) = $1
            LIMIT 1
            `,
            [cleanEmail]
          )

        if (
          emailCustomerResult.rows.length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this email address. Please login instead.',
          })
        }

        // --------------------------------
        // CREATE CUSTOMER
        // --------------------------------

        const result =
          await pool.query(
            `
            INSERT INTO customers (
              name,
              phone,
              email
            )
            VALUES ($1, $2, $3)
            RETURNING
              id,
              name,
              phone,
              email,
              address,
              landmark,
              house_number,
              street,
              address_line2,
              city,
              state,
              pincode,
              address_type,
              created_at,
              updated_at
            `,
            [
              cleanName,
              cleanPhone,
              cleanEmail,
            ]
          )

        customer =
          result.rows[0]
      }

      // --------------------------------
      // CLEAR MOBILE COOLDOWN
      // --------------------------------

      otpCooldowns.delete(
        `mobile:${cleanPhone}`
      )

      // --------------------------------
      // CREATE JWT
      // --------------------------------

      const token =
        createCustomerToken(customer)

      return res.json({
        success: true,
        message:
          isSignup
            ? 'Account created successfully.'
            : 'Login successful.',
        token,
        customer,
      })
    }

    // ===============================
    // EMAIL OTP
    // ===============================

    if (method === 'email') {
      if (
        !cleanEmail ||
        !isValidEmail(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.',
        })
      }

      // --------------------------------
      // FIND OTP
      // --------------------------------

      const otpResult =
        await pool.query(
          `
          SELECT *
          FROM customer_otps
          WHERE LOWER(email) = $1
          AND verified = FALSE
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [cleanEmail]
        )

      otpRecord =
        otpResult.rows[0] || null

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message:
            'OTP not found or expired. Please request a new OTP.',
        })
      }

      // --------------------------------
      // CHECK EXPIRY
      // --------------------------------

      if (
        new Date(otpRecord.expires_at) <
        new Date()
      ) {
        await pool.query(
          `
          DELETE FROM customer_otps
          WHERE id = $1
          `,
          [otpRecord.id]
        )

        return res.status(400).json({
          success: false,
          message:
            'OTP has expired. Please request a new OTP.',
        })
      }

      // --------------------------------
      // CHECK MAX ATTEMPTS
      // --------------------------------

      if (
        otpRecord.attempts >=
        MAX_OTP_ATTEMPTS
      ) {
        await pool.query(
          `
          DELETE FROM customer_otps
          WHERE id = $1
          `,
          [otpRecord.id]
        )

        return res.status(429).json({
          success: false,
          message:
            'Too many incorrect attempts. Please request a new OTP.',
        })
      }

      // --------------------------------
      // COMPARE OTP
      // --------------------------------

      const otpMatches =
        await bcrypt.compare(
          otp,
          otpRecord.otp_hash
        )

      if (!otpMatches) {
        await pool.query(
          `
          UPDATE customer_otps
          SET attempts = attempts + 1
          WHERE id = $1
          `,
          [otpRecord.id]
        )

        return res.status(401).json({
          success: false,
          message:
            'Incorrect OTP. Please try again.',
        })
      }

      // --------------------------------
      // MARK OTP VERIFIED
      // --------------------------------

      await pool.query(
        `
        UPDATE customer_otps
        SET verified = TRUE
        WHERE id = $1
        `,
        [otpRecord.id]
      )

      // --------------------------------
      // FIND CUSTOMER BY EMAIL
      // --------------------------------

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            address,
            landmark,
            house_number,
            street,
            address_line2,
            city,
            state,
            pincode,
            address_type,
            created_at,
            updated_at
          FROM customers
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [cleanEmail]
        )

      customer =
        customerResult.rows[0] || null

      // ===============================
      // LOGIN
      // ===============================

      if (!isSignup) {
        if (!customer) {
          return res.status(404).json({
            success: false,
            message:
              'No account found with this email address. Please create an account first.',
          })
        }
      }

      // ===============================
      // SIGNUP
      // ===============================

      if (isSignup) {
        // --------------------------------
        // CHECK EMAIL AGAIN
        // --------------------------------

        if (customer) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this email address. Please login instead.',
          })
        }

        // --------------------------------
        // CHECK MOBILE AGAIN
        // --------------------------------

        const mobileCustomerResult =
          await pool.query(
            `
            SELECT
              id,
              name,
              phone,
              email
            FROM customers
            WHERE phone = $1
            LIMIT 1
            `,
            [cleanPhone]
          )

        if (
          mobileCustomerResult.rows.length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this mobile number. Please login instead.',
          })
        }

        // --------------------------------
        // CREATE CUSTOMER
        // --------------------------------

        const result =
          await pool.query(
            `
            INSERT INTO customers (
              name,
              phone,
              email
            )
            VALUES ($1, $2, $3)
            RETURNING
              id,
              name,
              phone,
              email,
              address,
              landmark,
              house_number,
              street,
              address_line2,
              city,
              state,
              pincode,
              address_type,
              created_at,
              updated_at
            `,
            [
              cleanName,
              cleanPhone,
              cleanEmail,
            ]
          )

        customer =
          result.rows[0]
      }

      // --------------------------------
      // CLEAR OTP
      // --------------------------------

      await pool.query(
        `
        DELETE FROM customer_otps
        WHERE id = $1
        `,
        [otpRecord.id]
      )

      // --------------------------------
      // CLEAR EMAIL COOLDOWN
      // --------------------------------

      otpCooldowns.delete(
        `email:${cleanEmail}`
      )

      // --------------------------------
      // CREATE JWT
      // --------------------------------

      const token =
        createCustomerToken(customer)

      return res.json({
        success: true,
        message:
          isSignup
            ? 'Account created successfully.'
            : 'Login successful.',
        token,
        customer,
      })
    }
  } catch (error) {
    console.error(
      'Verify OTP error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to verify OTP.',
    })
  }
})

export default router