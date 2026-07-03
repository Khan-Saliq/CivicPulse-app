import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import Upload from '../models/Upload.js'
import Issue from '../models/Issue.js'
import User from '../models/User.js'
import ChatMessage from '../models/ChatMessage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const router = Router()

router.get('/', authRequired, async (req, res) => {
  try {
    const query = {}
    if (req.user.role !== 'admin' || req.query.mine === 'true') {
      query.uploaderId = req.user.id
    }
    const uploads = await Upload.find(query).sort({ createdAt: -1 }).lean()
    res.json(
      uploads.map((item) => ({
        ...item,
        id: item._id.toString(),
      }))
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/clear-all', authRequired, requireAdmin, async (_req, res) => {
  try {
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
    for (const file of files) {
      const filepath = path.join(uploadsDir, file)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
    }

    await Upload.deleteMany({})
    await Issue.deleteMany({})
    await ChatMessage.deleteMany({ issueId: { $exists: true, $ne: null } })
    await User.updateMany({}, { $set: { totalReports: 0, verifiedReports: 0 } })

    res.json({ message: 'Cleared all uploads, issues, and related database records.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/image', authRequired, async (req, res) => {
  try {
    const { imageBase64, filename, issueId } = req.body
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' })
    }

    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format. Send data URL base64.' })
    }

    const ext = match[1].split('/')[1] || 'jpg'
    const buffer = Buffer.from(match[2], 'base64')
    const name = `${Date.now()}-${filename || 'upload'}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, '')
    const filepath = path.join(uploadsDir, name)

    fs.writeFileSync(filepath, buffer)

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`
    const url = `${baseUrl}/uploads/${name}`

    await Upload.create({
      filename: name,
      url,
      uploaderId: req.user.id,
      uploaderName: req.user.name,
      issueId,
    })

    res.json({ url, type: 'image', filename: name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/media', authRequired, async (req, res) => {
  try {
    const { mediaBase64, filename, issueId, mediaType } = req.body
    if (!mediaBase64) {
      return res.status(400).json({ error: 'mediaBase64 required' })
    }

    const match = mediaBase64.match(/^data:([\w/+]+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ error: 'Invalid media format. Send data URL base64.' })
    }

    const mimeType = match[1]
    const isImage = mimeType.startsWith('image/')
    const isVideo = mimeType.startsWith('video/')

    if (!isImage && !isVideo) {
      return res.status(400).json({ error: 'Only image and video files are supported.' })
    }

    const ext = mimeType.split('/')[1] || (isVideo ? 'mp4' : 'jpg')
    const buffer = Buffer.from(match[2], 'base64')
    const name = `${Date.now()}-${filename || 'upload'}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, '')
    const filepath = path.join(uploadsDir, name)

    fs.writeFileSync(filepath, buffer)

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`
    const url = `${baseUrl}/uploads/${name}`

    await Upload.create({
      filename: name,
      url,
      uploaderId: req.user.id,
      uploaderName: req.user.name,
      issueId,
    })

    res.json({ url, type: isVideo ? 'video' : 'image', filename: name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
