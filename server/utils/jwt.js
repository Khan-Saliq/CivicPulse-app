import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'civicpulse-dev-secret-change-in-production'

export function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}
