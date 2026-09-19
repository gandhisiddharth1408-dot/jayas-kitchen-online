import express from 'express'
import crypto from 'crypto'
import pool from '../config/db.js'
import razorpay from '../config/razorpay.js'

const router = express.Router()

// GET available menu items for customer website
router.get('/menu', async (req, res) => {
  try {
    const result = await pool.query(`
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
      menuItems: result.rows,
    })
  } catch (error) {
    console.error('Menu fetch failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
    })
  }
})

// GET all menu items for admin
router.get('/admin/menu', async (req, res) => {
  try {
    const result = await pool.query(`
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
      menuItems: result.rows,
    })
  } catch (error) {
    console.error('Admin menu fetch failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
    })
  }
})

// ADD menu item
router.post('/admin/menu', async (req, res) => {
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

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price and category are required',
      })
    }

    const result = await pool.query(
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
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        name,
        description || '',
        price,
        category,
        imageUrl || null,
        Boolean(isPopular),
        isAvailable !== false,
      ]
    )

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      menuItem: result.rows[0],
    })
  } catch (error) {
    console.error('Menu item creation failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to add menu item',
    })
  }
})

// UPDATE menu item
router.patch('/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      description,
      price,
      category,
      imageUrl,
      isPopular,
      isAvailable,
    } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price and category are required',
      })
    }

    const result = await pool.query(
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
        updated_at = CURRENT_TIMESTAMP
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
        name,
        description || '',
        price,
        category,
        imageUrl || null,
        Boolean(isPopular),
        isAvailable !== false,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      })
    }

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem: result.rows[0],
    })
  } catch (error) {
    console.error('Menu item update failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
    })
  }
})

// DELETE menu item
router.delete('/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      DELETE FROM menu_items
      WHERE id = $1
      RETURNING id, name
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      })
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
      menuItem: result.rows[0],
    })
  } catch (error) {
    console.error('Menu item deletion failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
    })
  }
})

// CREATE RAZORPAY PAYMENT ORDER
router.post('/payment/create-order', async (req, res) => {
  try {
    const {
      items,
      deliveryType,
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty',
      })
    }

    if (
      deliveryType !== 'delivery' &&
      deliveryType !== 'pickup'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid delivery type is required',
      })
    }

    // Get real menu prices from PostgreSQL
    const menuItemIds = items.map(
      (item) => Number(item.menuItemId ?? item.id)
    )

    if (
      menuItemIds.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item in cart',
      })
    }

    const menuResult = await pool.query(
      `
      SELECT
        id,
        name,
        price,
        is_available
      FROM menu_items
      WHERE id = ANY($1::int[])
      `,
      [menuItemIds]
    )

    if (
      menuResult.rows.length !== menuItemIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          'One or more menu items are no longer available',
      })
    }

    const menuMap = new Map(
      menuResult.rows.map((item) => [
        item.id,
        item,
      ])
    )

    let subtotal = 0

    for (const item of items) {
      const menuItemId = Number(
        item.menuItemId ?? item.id
      )

      const menuItem = menuMap.get(menuItemId)

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: 'Menu item not found',
        })
      }

      if (!menuItem.is_available) {
        return res.status(400).json({
          success: false,
          message:
            `${menuItem.name} is currently unavailable`,
        })
      }

      const quantity = Number(item.quantity)

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid quantity for ${menuItem.name}`,
        })
      }

      subtotal +=
        Number(menuItem.price) * quantity
    }

    // Delivery charge is controlled by the server.
    const deliveryCharge =
      deliveryType === 'delivery' ? 30 : 0

    const total =
      subtotal + deliveryCharge

    const amountInPaise = Math.round(
      total * 100
    )

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `jk_${Date.now()}`,
      })

    res.status(201).json({
      success: true,
      message:
        'Razorpay order created successfully',

      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
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
})

// VERIFY RAZORPAY PAYMENT
router.post('/payment/verify', async (req, res) => {
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
        message: 'Payment verification details are required',
      })
    }

    const generatedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest('hex')

    const isSignatureValid =
      generatedSignature.length ===
        razorpaySignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpaySignature)
      )

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      })
    }

    // Fetch payment directly from Razorpay
    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpayPaymentId
      )

    if (
      razorpayPayment.order_id !==
        razorpayOrderId ||
      razorpayPayment.currency !== 'INR' ||
      razorpayPayment.status !== 'captured'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay payment could not be verified',
      })
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
    })
  } catch (error) {
    console.error(
      'Razorpay payment verification failed:',
      error
    )

    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    })
  }
})

// GET dashboard statistics for admin
router.get('/admin/dashboard', async (req, res) => {
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
          COUNT(*)::INTEGER AS today_orders,

          COALESCE(
            SUM(total),
            0
          ) AS today_revenue

        FROM orders

        WHERE created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day'
      `),

      pool.query(`
        SELECT
          COUNT(*)::INTEGER AS total_orders,

          COALESCE(
            SUM(total),
            0
          ) AS total_revenue

        FROM orders
      `),

      pool.query(`
        SELECT
          order_status,
          COUNT(*)::INTEGER AS count

        FROM orders

        GROUP BY order_status
      `),

      pool.query(`
        SELECT
          COUNT(*)::INTEGER AS total_menu_items,

          COUNT(*) FILTER (
            WHERE is_available = TRUE
          )::INTEGER AS available_menu_items

        FROM menu_items
      `),

      pool.query(`
        SELECT
          o.id,
          o.total,
          o.order_status,
          o.payment_status,
          o.created_at,

          c.name AS customer_name,
          c.phone AS customer_phone

        FROM orders o

        LEFT JOIN customers c
          ON c.id = o.customer_id

        ORDER BY o.created_at DESC

        LIMIT 5
      `),
    ])

    const todayStats = todayStatsResult.rows[0]
    const totalStats = totalStatsResult.rows[0]
    const menuStats = menuStatsResult.rows[0]

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      completed: 0,
      cancelled: 0,
    }

    statusResult.rows.forEach((row) => {
      statusCounts[row.order_status] = row.count
    })

    const customerCountResult = await pool.query(`
      SELECT COUNT(*)::INTEGER AS total_customers
      FROM customers
    `)

    const recentOrders = recentOrdersResult.rows.map(
      (order) => ({
        id: order.id,
        customerName:
          order.customer_name || 'Unknown Customer',
        customerPhone: order.customer_phone,
        total: Number(order.total),
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
      })
    )

    res.json({
      success: true,

      dashboard: {
        todayOrders: todayStats.today_orders,
        todayRevenue: Number(
          todayStats.today_revenue
        ),

        totalOrders: totalStats.total_orders,
        totalRevenue: Number(
          totalStats.total_revenue
        ),

        totalCustomers:
          customerCountResult.rows[0]
            .total_customers,

        totalMenuItems:
          menuStats.total_menu_items,

        availableMenuItems:
          menuStats.available_menu_items,

        orderStatuses: statusCounts,

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
      message: 'Failed to fetch dashboard data',
    })
  }
})

// GET all customers for admin
router.get('/admin/customers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.phone,
        c.updated_at,

        COUNT(o.id)::INTEGER AS order_count,

        COALESCE(
          SUM(o.total),
          0
        ) AS total_spent,

        MAX(o.created_at) AS last_order_at

      FROM customers c

      LEFT JOIN orders o
        ON o.customer_id = c.id

      GROUP BY
        c.id,
        c.name,
        c.phone,
        c.updated_at

      ORDER BY
        last_order_at DESC NULLS LAST,
        c.id DESC
    `)

    const customers = result.rows.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      orderCount: customer.order_count,
      totalSpent: Number(customer.total_spent),
      lastOrderAt: customer.last_order_at,
      updatedAt: customer.updated_at,
    }))

    res.json({
      success: true,
      customers,
    })
  } catch (error) {
    console.error('Admin customers fetch failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
    })
  }
})

// GET all orders for admin
router.get('/admin/all', async (req, res) => {
  try {
    const result = await pool.query(`
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
              'menuItemId', oi.menu_item_id,
              'name', oi.item_name,
              'price', oi.price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal
            )
            ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items

      FROM orders o

      LEFT JOIN customers c
        ON c.id = o.customer_id

      LEFT JOIN order_items oi
        ON oi.order_id = o.id

      GROUP BY
        o.id,
        c.id,
        c.name,
        c.phone

      ORDER BY o.created_at DESC
    `)

    const orders = result.rows.map((order) => ({
      id: order.id,

      customer: {
        id: order.customer_id,
        name: order.customer_name,
        phone: order.customer_phone,
      },

      deliveryType: order.delivery_type,
      address: order.address,
      landmark: order.landmark,
      instructions: order.instructions,

      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,

      orderStatus: order.order_status,

      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      total: Number(order.total),

      razorpayOrderId: order.razorpay_order_id,
      razorpayPaymentId: order.razorpay_payment_id,

      createdAt: order.created_at,
      updatedAt: order.updated_at,

      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    }))

    res.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error('Admin orders fetch failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    })
  }
})

// UPDATE order status
router.patch('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowedStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'completed',
      'cancelled',
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      })
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET
        order_status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        order_status,
        updated_at
      `,
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: result.rows[0].id,
        orderStatus: result.rows[0].order_status,
        updatedAt: result.rows[0].updated_at,
      },
    })
  } catch (error) {
    console.error('Order status update failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    })
  }
})

// CREATE order
router.post('/', async (req, res) => {
  const client = await pool.connect()

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

    if (
      !customer ||
      !customer.name ||
      !customer.phone
    ) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required',
      })
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty',
      })
    }

    if (!deliveryType) {
      return res.status(400).json({
        success: false,
        message: 'Delivery type is required',
      })
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      })
    }

    if (
      deliveryType === 'delivery' &&
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      })
    }

    // --------------------------------------------------
    // CALCULATE PRICES FROM DATABASE
    // --------------------------------------------------

    const menuItemIds = items.map(
      (item) => Number(item.menuItemId ?? item.id)
    )

    if (
      menuItemIds.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item in cart',
      })
    }

    const menuResult = await client.query(
      `
      SELECT
        id,
        name,
        price,
        is_available
      FROM menu_items
      WHERE id = ANY($1::int[])
      `,
      [menuItemIds]
    )

    if (
      menuResult.rows.length !==
      menuItemIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          'One or more menu items are no longer available',
      })
    }

    const menuMap = new Map(
      menuResult.rows.map((item) => [
        item.id,
        item,
      ])
    )

    const verifiedItems = []
    let calculatedSubtotal = 0

    for (const item of items) {
      const menuItemId = Number(
        item.menuItemId ?? item.id
      )

      const menuItem = menuMap.get(menuItemId)

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: 'Menu item not found',
        })
      }

      const quantity = Number(item.quantity)

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid quantity for ${menuItem.name}`,
        })
      }

      if (!menuItem.is_available) {
        return res.status(400).json({
          success: false,
          message:
            `${menuItem.name} is currently unavailable`,
        })
      }

      const price = Number(menuItem.price)

      const itemSubtotal =
        price * quantity

      calculatedSubtotal += itemSubtotal

      verifiedItems.push({
        menuItemId,
        name: menuItem.name,
        price,
        quantity,
        subtotal: itemSubtotal,
      })
    }

    // Delivery charge is controlled by the server.
    const calculatedDeliveryCharge =
      deliveryType === 'delivery' ? 30 : 0

    const calculatedTotal =
      calculatedSubtotal +
      calculatedDeliveryCharge

    // --------------------------------------------------
    // VERIFY ONLINE PAYMENT
    // --------------------------------------------------

    if (paymentMethod === 'online') {
      if (
        paymentStatus !== 'paid' ||
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

      // Verify Razorpay signature again on the server
      const generatedSignature = crypto
        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest('hex')

      const isSignatureValid =
        generatedSignature.length ===
          razorpaySignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(generatedSignature),
          Buffer.from(razorpaySignature)
        )

      if (!isSignatureValid) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Razorpay payment signature',
        })
      }

      // Fetch Razorpay order directly
      const razorpayOrder =
        await razorpay.orders.fetch(
          razorpayOrderId
        )

      // Fetch Razorpay payment directly
      const razorpayPayment =
        await razorpay.payments.fetch(
          razorpayPaymentId
        )

      // Compare Razorpay amount against
      // the server-calculated order total
      const expectedAmount = Math.round(
        calculatedTotal * 100
      )

      if (
        razorpayOrder.id !== razorpayOrderId ||
        razorpayPayment.order_id !==
          razorpayOrderId ||
        Number(razorpayOrder.amount) !==
          expectedAmount ||
        Number(razorpayPayment.amount) !==
          expectedAmount ||
        razorpayOrder.currency !== 'INR' ||
        razorpayPayment.currency !== 'INR' ||
        razorpayPayment.status !== 'captured'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Razorpay payment details could not be verified',
        })
      }
    }

    const finalPaymentStatus =
      paymentMethod === 'online'
        ? 'paid'
        : 'pending'

    await client.query('BEGIN')

    // --------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------

    const customerResult = await client.query(
      `
      INSERT INTO customers (
        name,
        phone,
        updated_at
      )
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (phone)
      DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, phone
      `,
      [
        customer.name,
        customer.phone,
      ]
    )

    const customerRecord =
      customerResult.rows[0]

    // --------------------------------------------------
    // ORDER
    // --------------------------------------------------

    const orderResult = await client.query(
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
        deliveryType === 'delivery'
          ? address
          : null,
        deliveryType === 'delivery'
          ? landmark || null
          : null,
        instructions || null,
        paymentMethod,
        finalPaymentStatus,
        calculatedSubtotal,
        calculatedDeliveryCharge,
        calculatedTotal,
        paymentMethod === 'online'
          ? razorpayOrderId
          : null,
        paymentMethod === 'online'
          ? razorpayPaymentId
          : null,
        paymentMethod === 'online'
          ? razorpaySignature
          : null,
      ]
    )

    const orderRecord = orderResult.rows[0]

    // --------------------------------------------------
    // ORDER ITEMS
    // --------------------------------------------------

    const insertedItems = []

    for (const item of verifiedItems) {
      const itemResult = await client.query(
        `
        INSERT INTO order_items (
          order_id,
          menu_item_id,
          item_name,
          price,
          quantity,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6)
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

    await client.query('COMMIT')

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',

      order: {
        id: orderRecord.id,

        customer: {
          id: customerRecord.id,
          name: customerRecord.name,
          phone: customerRecord.phone,
        },

        deliveryType:
          orderRecord.delivery_type,

        address: orderRecord.address,
        landmark: orderRecord.landmark,
        instructions:
          orderRecord.instructions,

        paymentMethod:
          orderRecord.payment_method,

        paymentStatus:
          orderRecord.payment_status,

        orderStatus:
          orderRecord.order_status,

        subtotal:
          Number(orderRecord.subtotal),

        deliveryCharge:
          Number(orderRecord.delivery_charge),

        total:
          Number(orderRecord.total),

        razorpayOrderId:
          orderRecord.razorpay_order_id,

        razorpayPaymentId:
          orderRecord.razorpay_payment_id,

        createdAt:
          orderRecord.created_at,

        updatedAt:
          orderRecord.updated_at,

        items: insertedItems.map(
          (item) => ({
            id: item.id,
            menuItemId:
              item.menu_item_id,
            name: item.item_name,
            price: Number(item.price),
            quantity: item.quantity,
            subtotal:
              Number(item.subtotal),
          })
        ),
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')

    console.error(
      'Order creation failed:',
      error
    )

    res.status(500).json({
      success: false,
      message: 'Failed to place order',
    })
  } finally {
    client.release()
  }
})

export default router