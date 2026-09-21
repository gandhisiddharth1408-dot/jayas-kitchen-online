import jwt from 'jsonwebtoken'

const customerAuth = (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.customer = decoded

    next()
  } catch (error) {
    console.error(
      'Customer authentication error:',
      error
    )

    return res.status(401).json({
      success: false,
      message:
        'Your session has expired. Please login again.',
    })
  }
}

export default customerAuth