import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { formatUser } from '../utils/format.js'
import { signToken } from '../utils/jwt.js'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import { DEFAULT_TRUST_SCORE } from '../config/constants.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user)
    res.json({ user: formatUser(user), token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields required' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'citizen',
      trustScore: DEFAULT_TRUST_SCORE,
    })

    const token = signToken(user)
    res.status(201).json({ user: formatUser(user), token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user })
})

router.post('/promote', authRequired, requireAdmin, async (req, res) => {
  try {
    const { email, role, department } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const promoteRole = role === 'department_admin' ? 'department_admin' : 'admin'
    user.role = promoteRole
    user.department = promoteRole === 'department_admin' ? department || null : null

    if (promoteRole === 'department_admin' && !user.department) {
      return res.status(400).json({ error: 'Department is required for department admin' })
    }

    await user.save()

    res.json({ user: formatUser(user) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/logout', authRequired, (_req, res) => {
  res.json({ message: 'Logged out' })
})

export default router
