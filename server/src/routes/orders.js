import express from 'express'
import crypto from 'crypto'
import pool from '../config/db.js'
import razorpay from '../config/razorpay.js'
import adminAuth from '../middleware/adminAuth.js'
import customerAuth from '../middleware/customerAuth.js'

const router = express.Router()

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const DELIVERY_CHARGE = 30
const CURRENCY = 'INR'

// Protect all admin routes
router.use('/admin', adminAuth)

// --------------------------------------------------
// HELPER: VERIFY RAZORPAY SIGNATURE
// --------------------------------------------------

function verifyRazorpaySignature(
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) {
  const secret =
    process.env.RAZORPAY_KEY_SECRET

  if (
    !secret ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    return false
  }

  const generatedSignature =
    crypto
      .createHmac(
        'sha256',
        secret
      )
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest('hex')

  if (
    generatedSignature.length !==
    razorpaySignature.length
  ) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(
      generatedSignature
    ),
    Buffer.from(
      razorpaySignature
    )
  )
}

// --------------------------------------------------
// HELPER: VERIFY RAZORPAY WEBHOOK SIGNATURE
// --------------------------------------------------

function verifyRazorpayWebhookSignature(
  rawBody,
  webhookSignature
) {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET

  if (
    !secret ||
    !rawBody ||
    !webhookSignature
  ) {
    return false
  }

  const generatedSignature =
    crypto
      .createHmac(
        'sha256',
        secret
      )
      .update(rawBody)
      .digest('hex')

  if (
    generatedSignature.length !==
    webhookSignature.length
  ) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(
      generatedSignature
    ),
    Buffer.from(
      webhookSignature
    )
  )
}

// --------------------------------------------------
// HELPER: CALCULATE CART FROM DATABASE
// --------------------------------------------------

async function calculateCart(
  client,
  items,
  deliveryType
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      'Cart cannot be empty'
    )
  }

  if (
    deliveryType !== 'delivery' &&
    deliveryType !== 'pickup'
  ) {
    throw new Error(
      'Valid delivery type is required'
    )
  }

  const menuItemIds = items.map(
    (item) =>
      Number(
        item.menuItemId ?? item.id
      )
  )

  if (
    menuItemIds.some(
      (id) =>
        !Number.isInteger(id) ||
        id <= 0
    )
  ) {
    throw new Error(
      'Invalid menu item in cart'
    )
  }

  const uniqueMenuItemIds = [
    ...new Set(menuItemIds),
  ]

  const menuResult =
    await client.query(
      `
      SELECT
        id,
        name,
        price,
        is_available
      FROM menu_items
      WHERE id = ANY($1::int[])
      `,
      [uniqueMenuItemIds]
    )

  if (
    menuResult.rows.length !==
    uniqueMenuItemIds.length
  ) {
    throw new Error(
      'One or more menu items are no longer available'
    )
  }

  const menuMap = new Map(
    menuResult.rows.map(
      (item) => [
        item.id,
        item,
      ]
    )
  )

  const verifiedItems = []

  let calculatedSubtotal = 0

  for (const item of items) {
    const menuItemId =
      Number(
        item.menuItemId ?? item.id
      )

    const menuItem =
      menuMap.get(menuItemId)

    if (!menuItem) {
      throw new Error(
        'Menu item not found'
      )
    }

    if (!menuItem.is_available) {
      throw new Error(
        `${menuItem.name} is currently unavailable`
      )
    }

    const quantity =
      Number(item.quantity)

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        `Invalid quantity for ${menuItem.name}`
      )
    }

    if (quantity > 100) {
      throw new Error(
        `Maximum quantity for ${menuItem.name} is 100`
      )
    }

    const price =
      Number(menuItem.price)

    const itemSubtotal =
      price * quantity

    calculatedSubtotal +=
      itemSubtotal

    verifiedItems.push({
      menuItemId,
      name: menuItem.name,
      price,
      quantity,
      subtotal: itemSubtotal,
    })
  }

  const calculatedDeliveryCharge =
    deliveryType === 'delivery'
      ? DELIVERY_CHARGE
      : 0

  const calculatedTotal =
    calculatedSubtotal +
    calculatedDeliveryCharge

  return {
    verifiedItems,
    calculatedSubtotal,
    calculatedDeliveryCharge,
    calculatedTotal,
    expectedAmount:
      Math.round(
        calculatedTotal * 100
      ),
  }
}

// --------------------------------------------------
// GET AVAILABLE MENU ITEMS
// --------------------------------------------------

router.get(
  '/menu',
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            name,
            description,
            price,
            category,
            image,
            is_popular,
            is_available
          FROM menu_items
          WHERE is_available = TRUE
          ORDER BY id ASC
        `)

      res.json({
        success: true,
        menuItems:
          result.rows,
      })
    } catch (error) {
      console.error(
        'Menu fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch menu',
      })
    }
  }
)

// ==================================================
// CUSTOMER ORDERS
// ==================================================

// GET logged-in customer's orders
router.get(
  '/my-orders',
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
            o.id,
            o.delivery_type,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.subtotal,
            o.delivery_charge,
            o.total,
            o.created_at,
            o.updated_at,

            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', oi.id,
                  'name', oi.item_name,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'subtotal', oi.subtotal
                )
                ORDER BY oi.id
              )
              FILTER (
                WHERE oi.id IS NOT NULL
              ),
              '[]'
            ) AS items

          FROM orders o

          LEFT JOIN order_items oi
            ON oi.order_id =
              o.id

          WHERE o.customer_id = $1

          GROUP BY
            o.id

          ORDER BY
            o.created_at DESC
          `,
          [Number(customerId)]
        )

      const orders =
        result.rows.map(
          (order) => ({
            id:
              order.id,

            deliveryType:
              order.delivery_type,

            paymentMethod:
              order.payment_method,

            paymentStatus:
              order.payment_status,

            orderStatus:
              order.order_status,

            subtotal:
              Number(
                order.subtotal
              ),

            deliveryCharge:
              Number(
                order.delivery_charge
              ),

            total:
              Number(
                order.total
              ),

            createdAt:
              order.created_at,

            updatedAt:
              order.updated_at,

            items:
              order.items.map(
                (item) => ({
                  id:
                    item.id,

                  name:
                    item.name,

                  price:
                    Number(
                      item.price
                    ),

                  quantity:
                    item.quantity,

                  subtotal:
                    Number(
                      item.subtotal
                    ),
                })
              ),
          })
        )

      res.json({
        success: true,
        orders,
      })
    } catch (error) {
      console.error(
        'Authenticated customer orders fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch your orders',
      })
    }
  }
)

// GET customer's orders by phone number
router.get(
  '/my-orders/:phone',
  async (req, res) => {
    try {
      const phone = String(
        req.params.phone || ''
      ).trim()

      if (
        !/^[0-9]{10}$/.test(phone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please provide a valid 10-digit mobile number',
        })
      }

      const result =
        await pool.query(
          `
          SELECT
            o.id,
            o.delivery_type,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.subtotal,
            o.delivery_charge,
            o.total,
            o.created_at,
            o.updated_at,

            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', oi.id,
                  'name', oi.item_name,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'subtotal', oi.subtotal
                )
                ORDER BY oi.id
              )
              FILTER (
                WHERE oi.id IS NOT NULL
              ),
              '[]'
            ) AS items

          FROM orders o

          INNER JOIN customers c
            ON c.id =
              o.customer_id

          LEFT JOIN order_items oi
            ON oi.order_id =
              o.id

          WHERE c.phone = $1

          GROUP BY
            o.id

          ORDER BY
            o.created_at DESC
          `,
          [phone]
        )

      const orders =
        result.rows.map(
          (order) => ({
            id:
              order.id,

            deliveryType:
              order.delivery_type,

            paymentMethod:
              order.payment_method,

            paymentStatus:
              order.payment_status,

            orderStatus:
              order.order_status,

            subtotal:
              Number(
                order.subtotal
              ),

            deliveryCharge:
              Number(
                order.delivery_charge
              ),

            total:
              Number(
                order.total
              ),

            createdAt:
              order.created_at,

            updatedAt:
              order.updated_at,

            items:
              order.items.map(
                (item) => ({
                  id:
                    item.id,

                  name:
                    item.name,

                  price:
                    Number(
                      item.price
                    ),

                  quantity:
                    item.quantity,

                  subtotal:
                    Number(
                      item.subtotal
                    ),
                })
              ),
          })
        )

      res.json({
        success: true,
        orders,
      })
    } catch (error) {
      console.error(
        'Customer orders fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch customer orders',
      })
    }
  }
)

// ==================================================
// ADMIN MENU
// ==================================================

// GET all menu items
router.get(
  '/admin/menu',
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            name,
            description,
            price,
            category,
            image_url,
            is_popular,
            is_available,
            created_at,
            updated_at
          FROM menu_items
          ORDER BY id ASC
        `)

      res.json({
        success: true,
        menuItems:
          result.rows,
      })
    } catch (error) {
      console.error(
        'Admin menu fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch menu',
      })
    }
  }
)

// ADD menu item
router.post(
  '/admin/menu',
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        category,
        imageUrl,
        isPopular,
        isAvailable,
      } = req.body

      if (
        !name ||
        !price ||
        !category
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name, price and category are required',
        })
      }

      const numericPrice =
        Number(price)

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Price must be a valid positive number',
        })
      }

      const result =
        await pool.query(
          `
          INSERT INTO menu_items (
            name,
            description,
            price,
            category,
            image_url,
            is_popular,
            is_available
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING
            id,
            name,
            description,
            price,
            category,
            image_url,
            is_popular,
            is_available,
            created_at,
            updated_at
          `,
          [
            name.trim(),
            description || '',
            numericPrice,
            category.trim(),
            imageUrl || null,
            Boolean(isPopular),
            isAvailable !== false,
          ]
        )

      res.status(201).json({
        success: true,
        message:
          'Menu item added successfully',
        menuItem:
          result.rows[0],
      })
    } catch (error) {
      console.error(
        'Menu item creation failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to add menu item',
      })
    }
  }
)

// UPDATE menu item
router.patch(
  '/admin/menu/:id',
  async (req, res) => {
    try {
      const { id } =
        req.params

      const {
        name,
        description,
        price,
        category,
        imageUrl,
        isPopular,
        isAvailable,
      } = req.body

      if (
        !name ||
        !price ||
        !category
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name, price and category are required',
        })
      }

      const numericPrice =
        Number(price)

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Price must be a valid positive number',
        })
      }

      const result =
        await pool.query(
          `
          UPDATE menu_items
          SET
            name = $1,
            description = $2,
            price = $3,
            category = $4,
            image_url = $5,
            is_popular = $6,
            is_available = $7,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $8
          RETURNING
            id,
            name,
            description,
            price,
            category,
            image_url,
            is_popular,
            is_available,
            created_at,
            updated_at
          `,
          [
            name.trim(),
            description || '',
            numericPrice,
            category.trim(),
            imageUrl || null,
            Boolean(isPopular),
            isAvailable !== false,
            id,
          ]
        )

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Menu item not found',
        })
      }

      res.json({
        success: true,
        message:
          'Menu item updated successfully',
        menuItem:
          result.rows[0],
      })
    } catch (error) {
      console.error(
        'Menu item update failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to update menu item',
      })
    }
  }
)

// DELETE menu item
router.delete(
  '/admin/menu/:id',
  async (req, res) => {
    try {
      const { id } =
        req.params

      const result =
        await pool.query(
          `
          DELETE FROM menu_items
          WHERE id = $1
          RETURNING id, name
          `,
          [id]
        )

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Menu item not found',
        })
      }

      res.json({
        success: true,
        message:
          'Menu item deleted successfully',
        menuItem:
          result.rows[0],
      })
    } catch (error) {
      console.error(
        'Menu item deletion failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to delete menu item',
      })
    }
  }
)

// ==================================================
// RAZORPAY CREATE ORDER
// ==================================================

router.post(
  '/payment/create-order',
  customerAuth,
  async (req, res) => {
    try {
      const {
        items,
        deliveryType,
      } = req.body

      if (
        !process.env
          .RAZORPAY_KEY_ID ||
        !process.env
          .RAZORPAY_KEY_SECRET
      ) {
        console.error(
          'Razorpay credentials are not configured'
        )

        return res.status(500).json({
          success: false,
          message:
            'Online payment is currently unavailable',
        })
      }

      const calculated =
        await calculateCart(
          pool,
          items,
          deliveryType
        )

      const {
        calculatedTotal,
        expectedAmount,
      } = calculated

      if (
        !Number.isInteger(
          expectedAmount
        ) ||
        expectedAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order amount',
        })
      }

      const receipt =
        `jk_${Date.now()}_${crypto
          .randomBytes(4)
          .toString('hex')}`

      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            expectedAmount,
          currency:
            CURRENCY,
          receipt,
        })

      if (
        !razorpayOrder ||
        !razorpayOrder.id
      ) {
        throw new Error(
          'Razorpay did not return a valid order'
        )
      }

      if (
        Number(
          razorpayOrder.amount
        ) !== expectedAmount ||
        razorpayOrder.currency !==
          CURRENCY
      ) {
        throw new Error(
          'Razorpay returned an unexpected order amount'
        )
      }

      res.status(201).json({
        success: true,
        message:
          'Razorpay order created successfully',

        order: {
          id:
            razorpayOrder.id,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,

          keyId:
            process.env
              .RAZORPAY_KEY_ID,

          calculatedTotal,
        },
      })
    } catch (error) {
      console.error(
        'Razorpay order creation failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to create Razorpay payment order',
      })
    }
  }
)

// ==================================================
// RAZORPAY PAYMENT VERIFICATION
// ==================================================

router.post(
  '/payment/verify',
  customerAuth,
  async (req, res) => {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment verification details are required',
        })
      }

      const isSignatureValid =
        verifyRazorpaySignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        )

      if (
        !isSignatureValid
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment verification failed',
        })
      }

      const razorpayOrder =
        await razorpay.orders.fetch(
          razorpayOrderId
        )

      const razorpayPayment =
        await razorpay.payments.fetch(
          razorpayPaymentId
        )

      if (
        !razorpayOrder ||
        !razorpayPayment
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Razorpay payment details could not be found',
        })
      }

      if (
        razorpayPayment.order_id !==
        razorpayOrderId
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment does not belong to this Razorpay order',
        })
      }

      if (
        razorpayOrder.status !==
          'created' &&
        razorpayOrder.status !==
          'paid'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Razorpay order status',
        })
      }

      if (
        razorpayOrder.currency !==
          CURRENCY ||
        razorpayPayment.currency !==
          CURRENCY
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid payment currency',
        })
      }

      if (
        razorpayPayment.status !==
        'captured'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment has not been captured',
        })
      }

      if (
        Number(
          razorpayOrder.amount
        ) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Razorpay order amount',
        })
      }

      if (
        Number(
          razorpayPayment.amount
        ) !==
        Number(
          razorpayOrder.amount
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment amount does not match Razorpay order amount',
        })
      }

      const existingOrder =
        await pool.query(
          `
          SELECT
            id,
            payment_status,
            order_status
          FROM orders
          WHERE razorpay_payment_id =
            $1
          LIMIT 1
          `,
          [razorpayPaymentId]
        )

      if (
        existingOrder.rows.length >
        0
      ) {
        return res.json({
          success: true,
          message:
            'Payment has already been processed',

          alreadyProcessed:
            true,

          payment: {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          },

          orderId:
            existingOrder
              .rows[0].id,
        })
      }

      res.json({
        success: true,

        message:
          'Payment verified successfully',

        alreadyProcessed:
          false,

        payment: {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,

          amount:
            Number(
              razorpayPayment.amount
            ),

          currency:
            razorpayPayment.currency,

          status:
            razorpayPayment.status,
        },
      })
    } catch (error) {
      console.error(
        'Razorpay payment verification failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to verify payment',
      })
    }
  }
)

// ==================================================
// RAZORPAY WEBHOOK
// ==================================================

router.post(
  '/payment/webhook',
  async (req, res) => {
    try {
      if (
        !process.env
          .RAZORPAY_WEBHOOK_SECRET
      ) {
        console.error(
          'Razorpay webhook secret is not configured'
        )

        return res.status(500).json({
          success: false,
          message:
            'Webhook is not configured',
        })
      }

      const webhookSignature =
        req.headers[
          'x-razorpay-signature'
        ]

      if (
        !webhookSignature
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Webhook signature is required',
        })
      }

      const rawBody =
        Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(
              JSON.stringify(
                req.body
              )
            )

      const isValid =
        verifyRazorpayWebhookSignature(
          rawBody,
          webhookSignature
        )

      if (!isValid) {
        console.error(
          'Invalid Razorpay webhook signature'
        )

        return res.status(400).json({
          success: false,
          message:
            'Invalid webhook signature',
        })
      }

      let payload

      try {
        payload =
          JSON.parse(
            rawBody.toString(
              'utf8'
            )
          )
      } catch (error) {
        console.error(
          'Invalid Razorpay webhook JSON:',
          error
        )

        return res.status(400).json({
          success: false,
          message:
            'Invalid webhook payload',
        })
      }

      const event =
        payload?.event

      console.log(
        `Razorpay webhook received: ${
          event || 'unknown'
        }`
      )

      if (
        event ===
        'payment.captured'
      ) {
        const payment =
          payload?.payload
            ?.payment?.entity

        if (
          !payment ||
          !payment.id
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Payment data missing from webhook',
          })
        }

        const paymentId =
          payment.id

        const existingOrder =
          await pool.query(
            `
            SELECT
              id,
              payment_status,
              razorpay_order_id,
              razorpay_payment_id
            FROM orders
            WHERE razorpay_payment_id =
              $1
            LIMIT 1
            `,
            [paymentId]
          )

        if (
          existingOrder.rows.length >
          0
        ) {
          console.log(
            `Razorpay webhook already processed for payment ${paymentId}`
          )

          return res.status(200).json({
            success: true,
            message:
              'Webhook already processed',
          })
        }

        console.log(
          `Payment ${paymentId} captured by Razorpay, but no local order exists yet`
        )

        return res.status(200).json({
          success: true,
          message:
            'Payment webhook received',
        })
      }

      return res.status(200).json({
        success: true,
        message:
          'Webhook received',
      })
    } catch (error) {
      console.error(
        'Razorpay webhook processing failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Webhook processing failed',
      })
    }
  }
)

// ==================================================
// ADMIN DASHBOARD
// ==================================================

router.get(
  '/admin/dashboard',
  async (req, res) => {
    try {
      const [
        todayStatsResult,
        totalStatsResult,
        statusResult,
        menuStatsResult,
        recentOrdersResult,
      ] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*)::INTEGER
              AS today_orders,

            COALESCE(
              SUM(total),
              0
            ) AS today_revenue

          FROM orders

          WHERE created_at >=
            CURRENT_DATE

            AND created_at <
              CURRENT_DATE +
              INTERVAL '1 day'
        `),

        pool.query(`
          SELECT
            COUNT(*)::INTEGER
              AS total_orders,

            COALESCE(
              SUM(total),
              0
            ) AS total_revenue

          FROM orders
        `),

        pool.query(`
          SELECT
            order_status,
            COUNT(*)::INTEGER
              AS count

          FROM orders

          GROUP BY
            order_status
        `),

        pool.query(`
          SELECT
            COUNT(*)::INTEGER
              AS total_menu_items,

            COUNT(*) FILTER (
              WHERE is_available =
                TRUE
            )::INTEGER
              AS available_menu_items

          FROM menu_items
        `),

        pool.query(`
          SELECT
            o.id,
            o.total,
            o.order_status,
            o.payment_status,
            o.created_at,

            c.name
              AS customer_name,

            c.phone
              AS customer_phone

          FROM orders o

          LEFT JOIN customers c
            ON c.id =
              o.customer_id

          ORDER BY
            o.created_at DESC

          LIMIT 5
        `),
      ])

      const todayStats =
        todayStatsResult
          .rows[0]

      const totalStats =
        totalStatsResult
          .rows[0]

      const menuStats =
        menuStatsResult
          .rows[0]

      const statusCounts = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        out_for_delivery: 0,
        completed: 0,
        cancelled: 0,
      }

      statusResult.rows.forEach(
        (row) => {
          statusCounts[
            row.order_status
          ] = row.count
        }
      )

      const customerCountResult =
        await pool.query(`
          SELECT
            COUNT(*)::INTEGER
              AS total_customers
          FROM customers
        `)

      const recentOrders =
        recentOrdersResult.rows.map(
          (order) => ({
            id: order.id,

            customerName:
              order.customer_name ||
              'Unknown Customer',

            customerPhone:
              order.customer_phone,

            total:
              Number(
                order.total
              ),

            orderStatus:
              order.order_status,

            paymentStatus:
              order.payment_status,

            createdAt:
              order.created_at,
          })
        )

      res.json({
        success: true,

        dashboard: {
          todayOrders:
            todayStats
              .today_orders,

          todayRevenue:
            Number(
              todayStats
                .today_revenue
            ),

          totalOrders:
            totalStats
              .total_orders,

          totalRevenue:
            Number(
              totalStats
                .total_revenue
            ),

          totalCustomers:
            customerCountResult
              .rows[0]
              .total_customers,

          totalMenuItems:
            menuStats
              .total_menu_items,

          availableMenuItems:
            menuStats
              .available_menu_items,

          orderStatuses:
            statusCounts,

          recentOrders,
        },
      })
    } catch (error) {
      console.error(
        'Admin dashboard fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch dashboard data',
      })
    }
  }
)

// ==================================================
// ADMIN CUSTOMERS
// ==================================================

router.get(
  '/admin/customers',
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            c.id,
            c.name,
            c.phone,
            c.updated_at,

            COUNT(o.id)::INTEGER
              AS order_count,

            COALESCE(
              SUM(o.total),
              0
            ) AS total_spent,

            MAX(o.created_at)
              AS last_order_at

          FROM customers c

          LEFT JOIN orders o
            ON o.customer_id =
              c.id

          GROUP BY
            c.id,
            c.name,
            c.phone,
            c.updated_at

          ORDER BY
            last_order_at
              DESC NULLS LAST,
            c.id DESC
        `)

      const customers =
        result.rows.map(
          (customer) => ({
            id:
              customer.id,

            name:
              customer.name,

            phone:
              customer.phone,

            orderCount:
              customer.order_count,

            totalSpent:
              Number(
                customer.total_spent
              ),

            lastOrderAt:
              customer.last_order_at,

            updatedAt:
              customer.updated_at,
          })
        )

      res.json({
        success: true,
        customers,
      })
    } catch (error) {
      console.error(
        'Admin customers fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch customers',
      })
    }
  }
)

// ==================================================
// ADMIN ALL ORDERS
// ==================================================

router.get(
  '/admin/all',
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            o.id,
            o.delivery_type,
            o.address,
            o.landmark,
            o.instructions,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.subtotal,
            o.delivery_charge,
            o.total,
            o.created_at,
            o.updated_at,
            o.razorpay_order_id,
            o.razorpay_payment_id,

            c.id AS customer_id,
            c.name AS customer_name,
            c.phone AS customer_phone,

            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', oi.id,
                  'menuItemId',
                    oi.menu_item_id,
                  'name', oi.item_name,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'subtotal', oi.subtotal
                )
                ORDER BY oi.id
              )
              FILTER (
                WHERE oi.id IS NOT NULL
              ),
              '[]'
            ) AS items

          FROM orders o

          LEFT JOIN customers c
            ON c.id =
              o.customer_id

          LEFT JOIN order_items oi
            ON oi.order_id =
              o.id

          GROUP BY
            o.id,
            c.id,
            c.name,
            c.phone

          ORDER BY
            o.created_at DESC
        `)

      const orders =
        result.rows.map(
          (order) => ({
            id: order.id,

            customer: {
              id:
                order.customer_id,

              name:
                order.customer_name,

              phone:
                order.customer_phone,
            },

            deliveryType:
              order.delivery_type,

            address:
              order.address,

            landmark:
              order.landmark,

            instructions:
              order.instructions,

            paymentMethod:
              order.payment_method,

            paymentStatus:
              order.payment_status,

            orderStatus:
              order.order_status,

            subtotal:
              Number(
                order.subtotal
              ),

            deliveryCharge:
              Number(
                order.delivery_charge
              ),

            total:
              Number(
                order.total
              ),

            razorpayOrderId:
              order.razorpay_order_id,

            razorpayPaymentId:
              order.razorpay_payment_id,

            createdAt:
              order.created_at,

            updatedAt:
              order.updated_at,

            items:
              order.items.map(
                (item) => ({
                  id:
                    item.id,

                  menuItemId:
                    item.menuItemId,

                  name:
                    item.name,

                  price:
                    Number(
                      item.price
                    ),

                  quantity:
                    item.quantity,

                  subtotal:
                    Number(
                      item.subtotal
                    ),
                })
              ),
          })
        )

      res.json({
        success: true,
        orders,
      })
    } catch (error) {
      console.error(
        'Admin orders fetch failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to fetch orders',
      })
    }
  }
)

// ==================================================
// UPDATE ORDER STATUS
// ==================================================

router.patch(
  '/admin/:id/status',
  async (req, res) => {
    try {
      const { id } =
        req.params

      const { status } =
        req.body

      const allowedStatuses = [
        'pending',
        'confirmed',
        'preparing',
        'out_for_delivery',
        'completed',
        'cancelled',
      ]

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order status',
        })
      }

      const result =
        await pool.query(
          `
          UPDATE orders
          SET
            order_status = $1,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING
            id,
            order_status,
            updated_at
          `,
          [status, id]
        )

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found',
        })
      }

      res.json({
        success: true,
        message:
          'Order status updated successfully',

        order: {
          id:
            result.rows[0].id,

          orderStatus:
            result.rows[0]
              .order_status,

          updatedAt:
            result.rows[0]
              .updated_at,
        },
      })
    } catch (error) {
      console.error(
        'Order status update failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to update order status',
      })
    }
  }
)

// ==================================================
// CREATE CASH / FINAL ORDER
// ==================================================

// Customer must be logged in to place an order
router.post(
  '/',
  customerAuth,
  async (req, res) => {
    const client =
      await pool.connect()

    try {
      const {
        customer,
        items,
        deliveryType,
        address,
        landmark,
        instructions,
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body

      // ------------------------------------------------
      // AUTHENTICATED CUSTOMER
      // ------------------------------------------------

      const authenticatedCustomerId =
        Number(
          req.customer?.customerId
        )

      if (
        !Number.isInteger(
          authenticatedCustomerId
        ) ||
        authenticatedCustomerId <= 0
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid customer authentication.',
        })
      }

      // ------------------------------------------------
      // FETCH CUSTOMER FROM DATABASE
      // ------------------------------------------------

      const authenticatedCustomerResult =
        await client.query(
          `
          SELECT
            id,
            name,
            phone,
            email
          FROM customers
          WHERE id = $1
          LIMIT 1
          `,
          [authenticatedCustomerId]
        )

      if (
        authenticatedCustomerResult
          .rows.length === 0
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Customer account could not be found.',
        })
      }

      const authenticatedCustomer =
        authenticatedCustomerResult
          .rows[0]

      // ------------------------------------------------
      // CUSTOMER DETAILS
      // ------------------------------------------------

      const customerName =
        String(
          authenticatedCustomer.name ||
            ''
        ).trim()

      const customerPhone =
        String(
          authenticatedCustomer.phone ||
            ''
        ).trim()

      if (
        customerName.length < 2 ||
        customerName.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Your customer account has an invalid name.',
        })
      }

      if (
        !/^[0-9]{10}$/.test(
          customerPhone
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Your customer account does not have a valid 10-digit mobile number.',
        })
      }

      // ------------------------------------------------
      // BASIC ORDER VALIDATION
      // ------------------------------------------------

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Cart cannot be empty',
        })
      }

      if (
        items.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Too many items in cart',
        })
      }

      if (
        deliveryType !==
          'delivery' &&
        deliveryType !==
          'pickup'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Valid delivery type is required',
        })
      }

      if (
        paymentMethod !==
          'cash' &&
        paymentMethod !==
          'online'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid payment method',
        })
      }

      if (
        deliveryType ===
          'delivery' &&
        !address
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Delivery address is required',
        })
      }

      // ------------------------------------------------
      // SERVER-SIDE CART CALCULATION
      // ------------------------------------------------

      const calculated =
        await calculateCart(
          client,
          items,
          deliveryType
        )

      const {
        verifiedItems,
        calculatedSubtotal,
        calculatedDeliveryCharge,
        calculatedTotal,
        expectedAmount,
      } = calculated

      // ------------------------------------------------
      // ONLINE PAYMENT VERIFICATION
      // ------------------------------------------------

      if (
        paymentMethod ===
        'online'
      ) {
        if (
          !razorpayOrderId ||
          !razorpayPaymentId ||
          !razorpaySignature
        ) {
          return res.status(400).json({
            success: false,
            message:
              'A verified online payment is required',
          })
        }

        const isSignatureValid =
          verifyRazorpaySignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
          )

        if (
          !isSignatureValid
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid Razorpay payment signature',
          })
        }

        const existingOrder =
          await client.query(
            `
            SELECT
              id,
              payment_status,
              order_status
            FROM orders
            WHERE razorpay_payment_id =
              $1
            LIMIT 1
            `,
            [razorpayPaymentId]
          )

        if (
          existingOrder.rows
            .length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'This payment has already been used for an order',
            orderId:
              existingOrder
                .rows[0].id,
          })
        }

        const razorpayOrder =
          await razorpay.orders.fetch(
            razorpayOrderId
          )

        const razorpayPayment =
          await razorpay.payments.fetch(
            razorpayPaymentId
          )

        if (
          !razorpayOrder ||
          !razorpayPayment
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Razorpay payment details could not be verified',
          })
        }

        if (
          razorpayPayment.order_id !==
          razorpayOrderId
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Payment does not belong to this Razorpay order',
          })
        }

        if (
          razorpayOrder.status !==
            'created' &&
          razorpayOrder.status !==
            'paid'
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid Razorpay order status',
          })
        }

        if (
          razorpayOrder.currency !==
            CURRENCY ||
          razorpayPayment.currency !==
            CURRENCY
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid Razorpay payment currency',
          })
        }

        if (
          razorpayPayment.status !==
          'captured'
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Razorpay payment has not been captured',
          })
        }

        if (
          Number(
            razorpayOrder.amount
          ) !== expectedAmount
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Razorpay order amount does not match the order total',
          })
        }

        if (
          Number(
            razorpayPayment.amount
          ) !== expectedAmount
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Razorpay payment amount does not match the order total',
          })
        }
      }

      // ------------------------------------------------
      // PAYMENT STATUS
      // ------------------------------------------------

      const finalPaymentStatus =
        paymentMethod ===
        'online'
          ? 'paid'
          : 'pending'

      // ------------------------------------------------
      // DATABASE TRANSACTION
      // ------------------------------------------------

      await client.query(
        'BEGIN'
      )

      // ------------------------------------------------
      // CUSTOMER
      // ------------------------------------------------

      // IMPORTANT:
      // Use the customer identified by JWT.
      // Do NOT create/update a customer using
      // a phone number supplied by the frontend.

      const customerResult =
        await client.query(
          `
          SELECT
            id,
            name,
            phone
          FROM customers
          WHERE id = $1
          FOR UPDATE
          `,
          [authenticatedCustomerId]
        )

      if (
        customerResult.rows.length ===
        0
      ) {
        await client.query(
          'ROLLBACK'
        )

        return res.status(404).json({
          success: false,
          message:
            'Customer account could not be found.',
        })
      }

      const customerRecord =
        customerResult.rows[0]

      // ------------------------------------------------
      // ORDER
      // ------------------------------------------------

      const orderResult =
        await client.query(
          `
          INSERT INTO orders (
            customer_id,
            delivery_type,
            address,
            landmark,
            instructions,
            payment_method,
            payment_status,
            order_status,
            subtotal,
            delivery_charge,
            total,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'pending',
            $8,
            $9,
            $10,
            $11,
            $12,
            $13
          )

          RETURNING
            id,
            customer_id,
            delivery_type,
            address,
            landmark,
            instructions,
            payment_method,
            payment_status,
            order_status,
            subtotal,
            delivery_charge,
            total,
            razorpay_order_id,
            razorpay_payment_id,
            created_at,
            updated_at
          `,
          [
            customerRecord.id,

            deliveryType,

            deliveryType ===
            'delivery'
              ? String(
                  address
                ).trim()
              : null,

            deliveryType ===
            'delivery'
              ? landmark
                ? String(
                    landmark
                  ).trim()
                : null
              : null,

            instructions
              ? String(
                  instructions
                ).trim()
              : null,

            paymentMethod,

            finalPaymentStatus,

            calculatedSubtotal,

            calculatedDeliveryCharge,

            calculatedTotal,

            paymentMethod ===
            'online'
              ? razorpayOrderId
              : null,

            paymentMethod ===
            'online'
              ? razorpayPaymentId
              : null,

            paymentMethod ===
            'online'
              ? razorpaySignature
              : null,
          ]
        )

      const orderRecord =
        orderResult.rows[0]

      // ------------------------------------------------
      // ORDER ITEMS
      // ------------------------------------------------

      const insertedItems = []

      for (
        const item of
          verifiedItems
      ) {
        const itemResult =
          await client.query(
            `
            INSERT INTO order_items (
              order_id,
              menu_item_id,
              item_name,
              price,
              quantity,
              subtotal
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )

            RETURNING
              id,
              menu_item_id,
              item_name,
              price,
              quantity,
              subtotal
            `,
            [
              orderRecord.id,
              item.menuItemId,
              item.name,
              item.price,
              item.quantity,
              item.subtotal,
            ]
          )

        insertedItems.push(
          itemResult.rows[0]
        )
      }

      await client.query(
        'COMMIT'
      )

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      res.status(201).json({
        success: true,

        message:
          'Order placed successfully',

        order: {
          id:
            orderRecord.id,

          customer: {
            id:
              customerRecord.id,

            name:
              customerRecord.name,

            phone:
              customerRecord.phone,
          },

          deliveryType:
            orderRecord
              .delivery_type,

          address:
            orderRecord.address,

          landmark:
            orderRecord.landmark,

          instructions:
            orderRecord
              .instructions,

          paymentMethod:
            orderRecord
              .payment_method,

          paymentStatus:
            orderRecord
              .payment_status,

          orderStatus:
            orderRecord
              .order_status,

          subtotal:
            Number(
              orderRecord.subtotal
            ),

          deliveryCharge:
            Number(
              orderRecord
                .delivery_charge
            ),

          total:
            Number(
              orderRecord.total
            ),

          razorpayOrderId:
            orderRecord
              .razorpay_order_id,

          razorpayPaymentId:
            orderRecord
              .razorpay_payment_id,

          createdAt:
            orderRecord
              .created_at,

          updatedAt:
            orderRecord
              .updated_at,

          items:
            insertedItems.map(
              (item) => ({
                id:
                  item.id,

                menuItemId:
                  item.menu_item_id,

                name:
                  item.item_name,

                price:
                  Number(
                    item.price
                  ),

                quantity:
                  item.quantity,

                subtotal:
                  Number(
                    item.subtotal
                  ),
              })
            ),
        },
      })
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK'
        )
      } catch (
        rollbackError
      ) {
        console.error(
          'Transaction rollback failed:',
          rollbackError
        )
      }

      console.error(
        'Order creation failed:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'Failed to place order',
      })
    } finally {
      client.release()
    }
  }
)

export default router