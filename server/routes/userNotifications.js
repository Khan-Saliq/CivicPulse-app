import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import UserNotification from '../models/UserNotification.js'

const router = Router()

router.get('/', authRequired, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('issueId', 'title status')
      .lean()

    res.json(
      notifications.map((item) => ({
        ...item,
        id: item._id.toString(),
      }))
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/read', authRequired, async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    ).lean()

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ ...notification, id: notification._id.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authRequired, async (req, res) => {
  try {
    await UserNotification.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    res.json({ message: 'Notification deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
