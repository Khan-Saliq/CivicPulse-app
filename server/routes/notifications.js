import { Router } from 'express'
import { authRequired, requireAnyAdmin } from '../middleware/auth.js'
import Notification from '../models/Notification.js'

const router = Router()

router.get('/', authRequired, requireAnyAdmin, async (req, res) => {
  try {
    let notifications = await Notification.find({ adminId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('issueId', 'title status responsibleDepartment')
      .lean()

    if (req.user.role === 'department_admin') {
      notifications = notifications.filter(
        (item) => item.issueId?.responsibleDepartment === req.user.department
      )
    }

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

router.patch('/:id/read', authRequired, requireAnyAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    if (notification.adminId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to modify this notification' })
    }

    notification.read = true
    await notification.save()

    res.json({
      ...notification.toObject(),
      id: notification._id.toString(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authRequired, requireAnyAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    if (notification.adminId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to delete this notification' })
    }

    await notification.remove()
    res.json({ message: 'Notification deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
