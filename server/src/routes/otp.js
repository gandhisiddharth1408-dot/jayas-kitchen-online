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

// ===============================
// BUILD FULL ADDRESS
// ===============================

const buildFullAddress = ({
  houseNumber,
  street,
  addressLine2,
  city,
  state,
  pincode,
}) => {
  return [
    houseNumber,
    street,
    addressLine2,
    city,
    state,
    pincode
      ? `- ${pincode}`
      : '',
  ]
    .filter(Boolean)
    .join(', ')
}

// ===============================
// CLEAN ADDRESS INPUT
// ===============================

const cleanAddressInput = (body = {}) => {
  const {
    label,
    fullName,
    phone,
    houseNumber,
    street,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
  } = body

  return {
    label:
      typeof label === 'string'
        ? label.trim()
        : 'Home',

    fullName:
      typeof fullName === 'string'
        ? fullName.trim()
        : '',

    phone:
      typeof phone === 'string'
        ? phone.trim()
        : '',

    houseNumber:
      typeof houseNumber === 'string'
        ? houseNumber.trim()
        : '',

    street:
      typeof street === 'string'
        ? street.trim()
        : '',

    addressLine2:
      typeof addressLine2 === 'string'
        ? addressLine2.trim()
        : '',

    landmark:
      typeof landmark === 'string'
        ? landmark.trim()
        : '',

    city:
      typeof city === 'string'
        ? city.trim()
        : '',

    state:
      typeof state === 'string'
        ? state.trim()
        : '',

    pincode:
      typeof pincode === 'string'
        ? pincode.trim()
        : '',
  }
}

// ===============================
// VALIDATE ADDRESS
// ===============================

const validateAddress = (address) => {
  if (
    !['Home', 'Work', 'Other'].includes(
      address.label
    )
  ) {
    return 'Address label must be Home, Work, or Other.'
  }

  if (!address.fullName) {
    return 'Full name is required.'
  }

  if (address.fullName.length > 100) {
    return 'Full name must be 100 characters or less.'
  }

  if (
    !address.phone ||
    !isValidPhone(address.phone)
  ) {
    return 'Please enter a valid 10-digit mobile number.'
  }

  if (!address.houseNumber) {
    return 'House / Flat / Building number is required.'
  }

  if (address.houseNumber.length > 100) {
    return 'House / Flat / Building number must be 100 characters or less.'
  }

  if (!address.street) {
    return 'Street / Area / Society is required.'
  }

  if (address.street.length > 255) {
    return 'Street / Area / Society must be 255 characters or less.'
  }

  if (address.addressLine2.length > 255) {
    return 'Address Line 2 must be 255 characters or less.'
  }

  if (address.landmark.length > 255) {
    return 'Landmark must be 255 characters or less.'
  }

  if (!address.city) {
    return 'City is required.'
  }

  if (address.city.length > 100) {
    return 'City must be 100 characters or less.'
  }

  if (!address.state) {
    return 'State is required.'
  }

  if (address.state.length > 100) {
    return 'State must be 100 characters or less.'
  }

  if (
    !/^[0-9]{6}$/.test(
      address.pincode
    )
  ) {
    return 'Please enter a valid 6-digit pincode.'
  }

  return null
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
            email_verified,
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
      // GET CURRENT EMAIL
      // ===============================

      const currentCustomerResult =
        await pool.query(
          `
          SELECT
            email,
            email_verified
          FROM customers
          WHERE id = $1
          LIMIT 1
          `,
          [Number(customerId)]
        )

      if (
        currentCustomerResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const currentCustomer =
        currentCustomerResult.rows[0]

      const currentEmail =
        currentCustomer.email
          ? currentCustomer.email
              .trim()
              .toLowerCase()
          : ''

      const emailChanged =
        currentEmail !== cleanEmail

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

            email_verified =
              CASE
                WHEN NULLIF($3, '') IS NULL
                  THEN FALSE

                WHEN LOWER(COALESCE(email, '')) <> LOWER(NULLIF($3, ''))
                  THEN FALSE

                ELSE email_verified
              END,

            updated_at = CURRENT_TIMESTAMP

          WHERE id = $4

          RETURNING
            id,
            name,
            phone,
            email,
            email_verified,
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

      // Update full name and phone
      // on saved addresses belonging
      // to this customer.
      await pool.query(
        `
        UPDATE customer_addresses
        SET
          full_name = $1,
          phone = $2
        WHERE customer_id = $3
        `,
        [
          cleanName,
          cleanPhone,
          Number(customerId),
        ]
      )

      const token =
        createCustomerToken(customer)

      return res.json({
        success: true,
        message:
          emailChanged
            ? 'Profile updated successfully. Your email needs verification.'
            : 'Profile updated successfully.',
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
// GET ALL SAVED CUSTOMER ADDRESSES
// ==================================================

router.get(
  '/me/addresses',
  customerAuth,
  async (req, res) => {
    try {
      const customerId =
        Number(req.customer?.customerId)

      if (
        !Number.isInteger(customerId)
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
            customer_id,
            label,
            full_name,
            phone,
            house_number,
            street,
            address_line2,
            landmark,
            city,
            state,
            pincode,
            is_default,
            created_at,
            updated_at
          FROM customer_addresses
          WHERE customer_id = $1
          ORDER BY
            is_default DESC,
            created_at DESC,
            id DESC
          `,
          [customerId]
        )

      const addresses =
        result.rows.map((address) => ({
          ...address,

          address:
            buildFullAddress({
              houseNumber:
                address.house_number,
              street:
                address.street,
              addressLine2:
                address.address_line2,
              city:
                address.city,
              state:
                address.state,
              pincode:
                address.pincode,
            }),
        }))

      return res.json({
        success: true,
        addresses,
      })
    } catch (error) {
      console.error(
        'Fetch customer addresses failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to fetch saved addresses.',
      })
    }
  }
)

// ==================================================
// ADD NEW CUSTOMER ADDRESS
// ==================================================

router.post(
  '/me/addresses',
  customerAuth,
  async (req, res) => {
    const client =
      await pool.connect()

    try {
      const customerId =
        Number(req.customer?.customerId)

      if (
        !Number.isInteger(customerId)
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      const address =
        cleanAddressInput(req.body)

      const validationError =
        validateAddress(address)

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
        })
      }

      await client.query('BEGIN')

      const countResult =
        await client.query(
          `
          SELECT COUNT(*)::int AS count
          FROM customer_addresses
          WHERE customer_id = $1
          `,
          [customerId]
        )

      const existingCount =
        countResult.rows[0].count

      // First address automatically
      // becomes default.
      const isDefault =
        existingCount === 0

      if (isDefault) {
        await client.query(
          `
          UPDATE customer_addresses
          SET is_default = FALSE
          WHERE customer_id = $1
          `,
          [customerId]
        )
      }

      const result =
        await client.query(
          `
          INSERT INTO customer_addresses (
            customer_id,
            label,
            full_name,
            phone,
            house_number,
            street,
            address_line2,
            landmark,
            city,
            state,
            pincode,
            is_default
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            NULLIF($5, ''),
            NULLIF($6, ''),
            NULLIF($7, ''),
            NULLIF($8, ''),
            $9,
            $10,
            $11,
            $12
          )
          RETURNING
            id,
            customer_id,
            label,
            full_name,
            phone,
            house_number,
            street,
            address_line2,
            landmark,
            city,
            state,
            pincode,
            is_default,
            created_at,
            updated_at
          `,
          [
            customerId,
            address.label,
            address.fullName,
            address.phone,
            address.houseNumber,
            address.street,
            address.addressLine2,
            address.landmark,
            address.city,
            address.state,
            address.pincode,
            isDefault,
          ]
        )

      await client.query('COMMIT')

      const savedAddress =
        result.rows[0]

      return res.status(201).json({
        success: true,
        message:
          'Address added successfully.',
        address: {
          ...savedAddress,
          address:
            buildFullAddress({
              houseNumber:
                savedAddress.house_number,
              street:
                savedAddress.street,
              addressLine2:
                savedAddress.address_line2,
              city:
                savedAddress.city,
              state:
                savedAddress.state,
              pincode:
                savedAddress.pincode,
            }),
        },
      })
    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Add customer address failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to add address.',
      })
    } finally {
      client.release()
    }
  }
)

// ==================================================
// UPDATE CUSTOMER ADDRESS BY ID
// ==================================================

router.put(
  '/me/addresses/:id',
  customerAuth,
  async (req, res) => {
    try {
      const customerId =
        Number(req.customer?.customerId)

      const addressId =
        Number(req.params.id)

      if (
        !Number.isInteger(customerId)
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      if (
        !Number.isInteger(addressId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid address ID.',
        })
      }

      const address =
        cleanAddressInput(req.body)

      const validationError =
        validateAddress(address)

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
        })
      }

      const result =
        await pool.query(
          `
          UPDATE customer_addresses
          SET
            label = $1,
            full_name = $2,
            phone = $3,
            house_number = NULLIF($4, ''),
            street = NULLIF($5, ''),
            address_line2 = NULLIF($6, ''),
            landmark = NULLIF($7, ''),
            city = $8,
            state = $9,
            pincode = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $11
          AND customer_id = $12

          RETURNING
            id,
            customer_id,
            label,
            full_name,
            phone,
            house_number,
            street,
            address_line2,
            landmark,
            city,
            state,
            pincode,
            is_default,
            created_at,
            updated_at
          `,
          [
            address.label,
            address.fullName,
            address.phone,
            address.houseNumber,
            address.street,
            address.addressLine2,
            address.landmark,
            address.city,
            address.state,
            address.pincode,
            addressId,
            customerId,
          ]
        )

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Address not found.',
        })
      }

      const updatedAddress =
        result.rows[0]

      return res.json({
        success: true,
        message:
          'Address updated successfully.',
        address: {
          ...updatedAddress,
          address:
            buildFullAddress({
              houseNumber:
                updatedAddress.house_number,
              street:
                updatedAddress.street,
              addressLine2:
                updatedAddress.address_line2,
              city:
                updatedAddress.city,
              state:
                updatedAddress.state,
              pincode:
                updatedAddress.pincode,
            }),
        },
      })
    } catch (error) {
      console.error(
        'Update customer address failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update address.',
      })
    }
  }
)

// ==================================================
// DELETE CUSTOMER ADDRESS
// ==================================================

router.delete(
  '/me/addresses/:id',
  customerAuth,
  async (req, res) => {
    const client =
      await pool.connect()

    try {
      const customerId =
        Number(req.customer?.customerId)

      const addressId =
        Number(req.params.id)

      if (
        !Number.isInteger(customerId)
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      if (
        !Number.isInteger(addressId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid address ID.',
        })
      }

      await client.query('BEGIN')

      const addressResult =
        await client.query(
          `
          SELECT
            id,
            is_default
          FROM customer_addresses
          WHERE id = $1
          AND customer_id = $2
          LIMIT 1
          `,
          [
            addressId,
            customerId,
          ]
        )

      if (
        addressResult.rows.length === 0
      ) {
        await client.query('ROLLBACK')

        return res.status(404).json({
          success: false,
          message:
            'Address not found.',
        })
      }

      const wasDefault =
        addressResult.rows[0]
          .is_default

      await client.query(
        `
        DELETE FROM customer_addresses
        WHERE id = $1
        AND customer_id = $2
        `,
        [
          addressId,
          customerId,
        ]
      )

      // If the deleted address was
      // default, automatically select
      // the newest remaining address.
      if (wasDefault) {
        await client.query(
          `
          UPDATE customer_addresses
          SET is_default = TRUE
          WHERE id = (
            SELECT id
            FROM customer_addresses
            WHERE customer_id = $1
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          )
          `,
          [customerId]
        )
      }

      await client.query('COMMIT')

      return res.json({
        success: true,
        message:
          'Address deleted successfully.',
      })
    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Delete customer address failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to delete address.',
      })
    } finally {
      client.release()
    }
  }
)

// ==================================================
// SET DEFAULT CUSTOMER ADDRESS
// ==================================================

router.put(
  '/me/addresses/:id/default',
  customerAuth,
  async (req, res) => {
    const client =
      await pool.connect()

    try {
      const customerId =
        Number(req.customer?.customerId)

      const addressId =
        Number(req.params.id)

      if (
        !Number.isInteger(customerId)
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      if (
        !Number.isInteger(addressId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid address ID.',
        })
      }

      await client.query('BEGIN')

      const addressResult =
        await client.query(
          `
          SELECT id
          FROM customer_addresses
          WHERE id = $1
          AND customer_id = $2
          LIMIT 1
          `,
          [
            addressId,
            customerId,
          ]
        )

      if (
        addressResult.rows.length === 0
      ) {
        await client.query('ROLLBACK')

        return res.status(404).json({
          success: false,
          message:
            'Address not found.',
        })
      }

      await client.query(
        `
        UPDATE customer_addresses
        SET is_default = FALSE
        WHERE customer_id = $1
        `,
        [customerId]
      )

      const result =
        await client.query(
          `
          UPDATE customer_addresses
          SET
            is_default = TRUE,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          AND customer_id = $2

          RETURNING
            id,
            customer_id,
            label,
            full_name,
            phone,
            house_number,
            street,
            address_line2,
            landmark,
            city,
            state,
            pincode,
            is_default,
            created_at,
            updated_at
          `,
          [
            addressId,
            customerId,
          ]
        )

      await client.query('COMMIT')

      const selectedAddress =
        result.rows[0]

      return res.json({
        success: true,
        message:
          'Default address updated successfully.',
        address: {
          ...selectedAddress,
          address:
            buildFullAddress({
              houseNumber:
                selectedAddress.house_number,
              street:
                selectedAddress.street,
              addressLine2:
                selectedAddress.address_line2,
              city:
                selectedAddress.city,
              state:
                selectedAddress.state,
              pincode:
                selectedAddress.pincode,
            }),
        },
      })
    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Set default address failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to select default address.',
      })
    } finally {
      client.release()
    }
  }
)

// ==================================================
// LEGACY / CURRENT SETTINGS ADDRESS ENDPOINT
// ==================================================
// This keeps the current CustomerDashboard working.
// It now creates/updates the customer's default
// address in customer_addresses instead of relying
// only on the old customers address columns.

router.put(
  '/me/address',
  customerAuth,
  async (req, res) => {
    const client =
      await pool.connect()

    try {
      const customerId =
        Number(req.customer?.customerId)

      if (
        !Number.isInteger(customerId)
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

      const customerResult =
        await client.query(
          `
          SELECT
            id,
            name,
            phone
          FROM customers
          WHERE id = $1
          LIMIT 1
          `,
          [customerId]
        )

      if (
        customerResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const customer =
        customerResult.rows[0]

      const fullAddress =
        typeof address === 'string' &&
        address.trim()
          ? address.trim()
          : buildFullAddress({
              houseNumber:
                cleanHouseNumber,
              street:
                cleanStreet,
              addressLine2:
                cleanAddressLine2,
              city:
                cleanCity,
              state:
                cleanState,
              pincode:
                cleanPincode,
            })

      await client.query('BEGIN')

      const defaultResult =
        await client.query(
          `
          SELECT id
          FROM customer_addresses
          WHERE customer_id = $1
          AND is_default = TRUE
          LIMIT 1
          `,
          [customerId]
        )

      if (
        defaultResult.rows.length > 0
      ) {
        const defaultAddressId =
          defaultResult.rows[0].id

        await client.query(
          `
          UPDATE customer_addresses
          SET
            label = $1,
            full_name = $2,
            phone = $3,
            house_number = $4,
            street = $5,
            address_line2 = NULLIF($6, ''),
            landmark = NULLIF($7, ''),
            city = $8,
            state = $9,
            pincode = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $11
          AND customer_id = $12
          `,
          [
            cleanAddressType,
            customer.name,
            customer.phone,
            cleanHouseNumber,
            cleanStreet,
            cleanAddressLine2,
            cleanLandmark,
            cleanCity,
            cleanState,
            cleanPincode,
            defaultAddressId,
            customerId,
          ]
        )
      } else {
        await client.query(
          `
          INSERT INTO customer_addresses (
            customer_id,
            label,
            full_name,
            phone,
            house_number,
            street,
            address_line2,
            landmark,
            city,
            state,
            pincode,
            is_default
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            NULLIF($7, ''),
            NULLIF($8, ''),
            $9,
            $10,
            $11,
            TRUE
          )
          `,
          [
            customerId,
            cleanAddressType,
            customer.name,
            customer.phone,
            cleanHouseNumber,
            cleanStreet,
            cleanAddressLine2,
            cleanLandmark,
            cleanCity,
            cleanState,
            cleanPincode,
          ]
        )
      }

      // Keep legacy customer address fields
      // synchronized for compatibility.
      const result =
        await client.query(
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
            email_verified,
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
            fullAddress,
            cleanLandmark,
            cleanHouseNumber,
            cleanStreet,
            cleanAddressLine2,
            cleanCity,
            cleanState,
            cleanPincode,
            cleanAddressType,
            customerId,
          ]
        )

      await client.query('COMMIT')

      const updatedCustomer =
        result.rows[0]

      const token =
        createCustomerToken(
          updatedCustomer
        )

      return res.json({
        success: true,
        message:
          'Delivery address saved successfully.',
        token,
        customer:
          updatedCustomer,
      })
    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Update customer address failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to save delivery address.',
      })
    } finally {
      client.release()
    }
  }
)

// ==================================================
// SEND EMAIL VERIFICATION OTP
// ==================================================

router.post(
  '/me/email/send',
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

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            email_verified
          FROM customers
          WHERE id = $1
          LIMIT 1
          `,
          [Number(customerId)]
        )

      if (
        customerResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const customer =
        customerResult.rows[0]

      if (!customer.email) {
        return res.status(400).json({
          success: false,
          message:
            'Please add an email address to your profile first.',
        })
      }

      if (customer.email_verified) {
        return res.status(400).json({
          success: false,
          message:
            'Your email address is already verified.',
        })
      }

      const cleanEmail =
        customer.email
          .trim()
          .toLowerCase()

      const cooldownKey =
        `email-verification:${Number(
          customerId
        )}`

      const now = Date.now()

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

      await pool.query(
        `
        DELETE FROM customer_otps
        WHERE customer_id = $1
        AND verified = FALSE
        `,
        [Number(customerId)]
      )

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
          Number(customerId),
          cleanEmail,
          otpHash,
          expiresAt,
        ]
      )

      const {
        data,
        error,
      } = await resend.emails.send({
        from:
          "Jaya's Kitchen <onboarding@resend.dev>",

        to: [cleanEmail],

        subject:
          "Verify your Jaya's Kitchen email",

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
                Hi ${customer.name || 'there'},
              </p>

              <p style="
                color: #374151;
                font-size: 15px;
              ">
                Use the following OTP to verify your email address:
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
                If you did not request email verification,
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

      if (error) {
        console.error(
          'Resend email verification error:',
          error
        )

        await pool.query(
          `
          DELETE FROM customer_otps
          WHERE customer_id = $1
          AND verified = FALSE
          `,
          [Number(customerId)]
        )

        return res.status(500).json({
          success: false,
          message:
            'Unable to send verification email. Please try again.',
        })
      }

      otpCooldowns.set(
        cooldownKey,
        Date.now()
      )

      console.log(
        `Email verification OTP sent successfully. Resend ID: ${
          data?.id || 'unknown'
        }`
      )

      return res.json({
        success: true,
        message:
          'Verification OTP sent successfully to your email.',
        expiresIn:
          OTP_EXPIRY_MINUTES * 60,
      })
    } catch (error) {
      console.error(
        'Send email verification OTP failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Unable to send email verification OTP.',
      })
    }
  }
)

// ==================================================
// VERIFY EMAIL
// ==================================================

router.post(
  '/me/email/verify',
  customerAuth,
  async (req, res) => {
    try {
      const customerId =
        req.customer?.customerId

      const {
        otp,
      } = req.body

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

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            email_verified
          FROM customers
          WHERE id = $1
          LIMIT 1
          `,
          [Number(customerId)]
        )

      if (
        customerResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const customer =
        customerResult.rows[0]

      if (!customer.email) {
        return res.status(400).json({
          success: false,
          message:
            'No email address is linked to your account.',
        })
      }

      if (customer.email_verified) {
        return res.json({
          success: true,
          message:
            'Your email address is already verified.',
          customer,
        })
      }

      const otpResult =
        await pool.query(
          `
          SELECT *
          FROM customer_otps
          WHERE customer_id = $1
          AND LOWER(email) = LOWER($2)
          AND verified = FALSE
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [
            Number(customerId),
            customer.email,
          ]
        )

      const otpRecord =
        otpResult.rows[0] || null

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message:
            'OTP not found or expired. Please request a new OTP.',
        })
      }

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

      await pool.query(
        `
        UPDATE customer_otps
        SET verified = TRUE
        WHERE id = $1
        `,
        [otpRecord.id]
      )

      const updatedCustomerResult =
        await pool.query(
          `
          UPDATE customers
          SET
            email_verified = TRUE,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1

          RETURNING
            id,
            name,
            phone,
            email,
            email_verified,
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
          [Number(customerId)]
        )

      if (
        updatedCustomerResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Customer account not found.',
        })
      }

      const updatedCustomer =
        updatedCustomerResult.rows[0]

      await pool.query(
        `
        DELETE FROM customer_otps
        WHERE id = $1
        `,
        [otpRecord.id]
      )

      otpCooldowns.delete(
        `email-verification:${Number(
          customerId
        )}`
      )

      const token =
        createCustomerToken(
          updatedCustomer
        )

      return res.json({
        success: true,
        message:
          'Email verified successfully.',
        token,
        customer:
          updatedCustomer,
      })
    } catch (error) {
      console.error(
        'Verify customer email failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Unable to verify email address.',
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

    if (
      isSignup &&
      method === 'email'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please create your account using mobile OTP. You can verify your email later from Profile Settings.',
      })
    }

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
        cleanEmail &&
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

      const mobileCustomerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            email_verified
          FROM customers
          WHERE phone = $1
          LIMIT 1
          `,
          [cleanPhone]
        )

      const mobileCustomer =
        mobileCustomerResult.rows[0] || null

      if (isSignup) {
        if (mobileCustomer) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this mobile number. Please login instead.',
          })
        }

        if (cleanEmail) {
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
      }

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

      const otp = generateOtp()

      console.log(
        `Generated mobile OTP for ${cleanPhone}`
      )

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
    // EMAIL LOGIN OTP
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

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            email_verified
          FROM customers
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [cleanEmail]
        )

      const customer =
        customerResult.rows[0] || null

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

      await pool.query(
        `
        DELETE FROM customer_otps
        WHERE LOWER(email) = $1
        AND verified = FALSE
        `,
        [cleanEmail]
      )

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

    if (
      isSignup &&
      method === 'email'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please create your account using mobile OTP. You can verify your email later from Profile Settings.',
      })
    }

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
        cleanEmail &&
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

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            email_verified,
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

      if (!isSignup) {
        if (!customer) {
          return res.status(404).json({
            success: false,
            message:
              'No account found with this mobile number. Please create an account first.',
          })
        }
      }

      if (isSignup) {
        if (customer) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this mobile number. Please login instead.',
          })
        }

        if (cleanEmail) {
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

        const result =
          await pool.query(
            `
            INSERT INTO customers (
              name,
              phone,
              email,
              email_verified
            )
            VALUES ($1, $2, NULLIF($3, ''), FALSE)

            RETURNING
              id,
              name,
              phone,
              email,
              email_verified,
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

      otpCooldowns.delete(
        `mobile:${cleanPhone}`
      )

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

      await pool.query(
        `
        UPDATE customer_otps
        SET verified = TRUE
        WHERE id = $1
        `,
        [otpRecord.id]
      )

      const customerResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            email,
            email_verified,
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

      if (!customer) {
        return res.status(404).json({
          success: false,
          message:
            'No account found with this email address. Please create an account first.',
        })
      }

      if (!customer.email_verified) {
        const verifiedCustomerResult =
          await pool.query(
            `
            UPDATE customers
            SET
              email_verified = TRUE,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1

            RETURNING
              id,
              name,
              phone,
              email,
              email_verified,
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
            [customer.id]
          )

        customer =
          verifiedCustomerResult.rows[0]
      }

      await pool.query(
        `
        DELETE FROM customer_otps
        WHERE id = $1
        `,
        [otpRecord.id]
      )

      otpCooldowns.delete(
        `email:${cleanEmail}`
      )

      const token =
        createCustomerToken(customer)

      return res.json({
        success: true,
        message:
          'Login successful.',
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