import { Router } from 'express'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import { getCitizenChatResponse, getAdminChatResponse } from '../utils/chat.js'
import { runMorphDetection, formatMorphMessage } from '../utils/morphDetection.js'
import { applyTrustUpdate } from '../utils/trust.js'
import { recalculatePriority } from '../utils/cluster.js'
import Issue from '../models/Issue.js'
import User from '../models/User.js'
import ChatMessage from '../models/ChatMessage.js'
import { formatIssue } from '../utils/format.js'
import { CHAT_GREETINGS } from '../config/constants.js'

const router = Router()

router.get('/greeting/:role', authRequired, (req, res) => {
  const role = req.params.role === 'admin' ? 'admin' : 'citizen'
  res.json({ greeting: CHAT_GREETINGS[role] })
})

router.get('/messages', authRequired, async (req, res) => {
  try {
    const query = {}
    if (req.user.role !== 'admin' || req.query.mine === 'true') {
      query.userId = req.user.id
    }
    const messages = await ChatMessage.find(query).sort({ createdAt: -1 }).lean()
    res.json(
      messages.map((item) => ({
        ...item,
        id: item._id.toString(),
        timestamp: item.createdAt ? item.createdAt.toISOString() : item.updatedAt ? item.updatedAt.toISOString() : '',
      }))
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/citizen', authRequired, async (req, res) => {
  try {
    const { message, sessionId } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message required' })
    }

    const content = await getCitizenChatResponse(message, req.user.id, req.user.name)

    await ChatMessage.create({
      userId: req.user.id,
      userName: req.user.name,
      role: 'citizen',
      message,
      response: content,
    })

    res.json({ content, sessionId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/admin', authRequired, requireAdmin, async (req, res) => {
  try {
    const { message, issueId } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message required' })
    }

    const response = await getAdminChatResponse(message, issueId)

    if (response.validate && response.issueId) {
      const issue = await Issue.findById(response.issueId)
      if (!issue) return res.status(404).json({ error: 'Issue not found' })

      const { result, confidence } = runMorphDetection(issue)
      const reporter = await User.findById(issue.reporterId)
      if (reporter) {
        await applyTrustUpdate(reporter, result)
        issue.reporterTrustScore = reporter.trustScore
      }

      issue.validationResult = result
      recalculatePriority(issue)
      await issue.save()

      await ChatMessage.create({
        userId: req.user.id,
        userName: req.user.name,
        role: 'admin',
        issueId: response.issueId,
        message,
        response: formatMorphMessage(issue, result, confidence),
      })

      return res.json({
        content: formatMorphMessage(issue, result, confidence),
        validationResult: result,
        issue: formatIssue(issue),
      })
    }

    await ChatMessage.create({
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      issueId,
      message,
      response: response.content,
    })

    res.json({ content: response.content })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/admin/validate-media', authRequired, requireAdmin, async (req, res) => {
  try {
    console.log('=== VALIDATE MEDIA REQUEST ===')
    console.log('Request body keys:', Object.keys(req.body))
    console.log('Request body type:', typeof req.body)
    console.log('Content-Type:', req.headers['content-type'])
    console.log('Content-Length:', req.headers['content-length'])
    
    const { mediaBase64, issueId, mediaType } = req.body

    console.log('Validate media request:', { 
      hasMediaBase64: !!mediaBase64, 
      mediaBase64Length: mediaBase64?.length, 
      mediaBase64Type: typeof mediaBase64,
      issueId, 
      mediaType 
    })

    if (!mediaBase64) {
      console.error('mediaBase64 is missing or empty')
      return res.status(400).json({ error: 'mediaBase64 required' })
    }

    // Validate mediaBase64 format
    if (typeof mediaBase64 !== 'string') {
      console.error('mediaBase64 is not a string')
      return res.status(400).json({ error: 'mediaBase64 must be a string' })
    }

    if (mediaBase64.length > 50 * 1024 * 1024) {
      console.error('mediaBase64 too large:', mediaBase64.length)
      return res.status(400).json({ error: 'Media file too large (max 50MB)' })
    }

    const { detectAIGeneration, detectVideoManipulation, formatMediaValidationMessage } = await import('../utils/morphDetection.js')

    let detectionResult

    if (mediaType === 'video') {
      detectionResult = detectVideoManipulation(mediaBase64)
    } else {
      detectionResult = await detectAIGeneration(mediaBase64)
    }

    const validationMessage = formatMediaValidationMessage(mediaBase64, mediaType, detectionResult)

    // If issueId is provided, update the issue
    if (issueId) {
      const issue = await Issue.findById(issueId)
      if (!issue) return res.status(404).json({ error: 'Issue not found' })

      await ChatMessage.create({
        userId: req.user.id,
        userName: req.user.name,
        role: 'admin',
        issueId,
        message: `Validate ${mediaType}`,
        response: validationMessage,
      })

      // Update issue based on detection - use isManipulated from both types
      const isProblematic = detectionResult.isManipulated
      if (isProblematic) {
        issue.validationResult = 'manipulated'
        const reporter = await User.findById(issue.reporterId)
        if (reporter) {
          reporter.trustScore = Math.max(0, reporter.trustScore - 20)
          await reporter.save()
          issue.reporterTrustScore = reporter.trustScore
        }
        const { recalculatePriority } = await import('../utils/cluster.js')
        recalculatePriority(issue)
      } else {
        issue.validationResult = 'valid'
        const reporter = await User.findById(issue.reporterId)
        if (reporter) {
          reporter.trustScore = Math.min(100, reporter.trustScore + 15)
          await reporter.save()
          issue.reporterTrustScore = reporter.trustScore
        }
      }

      await issue.save()

      res.json({
        content: validationMessage,
        validationResult: isProblematic ? 'manipulated' : 'valid',
        detectionResult,
        manipulationType: detectionResult.manipulationType,
        confidence: detectionResult.confidence,
        issue: { id: issue._id.toString(), title: issue.title, validationResult: issue.validationResult },
      })
    } else {
      // Standalone validation without an issue
      await ChatMessage.create({
        userId: req.user.id,
        userName: req.user.name,
        role: 'admin',
        message: `Validate standalone ${mediaType}`,
        response: validationMessage,
      })

      res.json({
        content: validationMessage,
        validationResult: detectionResult.isManipulated ? 'manipulated' : 'valid',
        detectionResult,
        manipulationType: detectionResult.manipulationType,
        confidence: detectionResult.confidence,
      })
    }
  } catch (err) {
    console.error('Validate media error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
