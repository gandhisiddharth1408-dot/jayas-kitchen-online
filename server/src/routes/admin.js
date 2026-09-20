import express from 'express'
import jwt from 'jsonwebtoken'
import adminAuth from '../middleware/adminAuth.js'

const router = express.Router()

// Admin login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    const adminUsername =
      process.env.ADMIN_USERNAME

    const adminPassword =
      process.env.ADMIN_PASSWORD

    const jwtSecret =
      process.env.JWT_SECRET

    if (
      !adminUsername ||
      !adminPassword ||
      !jwtSecret
    ) {
      console.error(
        'Admin authentication environment variables are not configured'
      )

      return res.status(500).json({
        success: false,
        message:
          'Admin authentication is not configured',
      })
    }

    if (
      username !== adminUsername ||
      password !== adminPassword
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      })
    }

    const token = jwt.sign(
      {
        role: 'admin',
        username: adminUsername,
      },
      jwtSecret,
      {
        expiresIn: '8h',
      }
    )

    return res.json({
      success: true,
      message: 'Admin login successful',
      token,
    })
  } catch (error) {
    console.error(
      'Admin login error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Admin login failed',
    })
  }
})

// Verify admin authentication token
router.get(
  '/verify',
  adminAuth,
  (req, res) => {
    return res.json({
      success: true,
      message: 'Admin authentication is valid',
      admin: {
        username: req.admin.username,
        role: req.admin.role,
      },
    })
  }
)

export default router