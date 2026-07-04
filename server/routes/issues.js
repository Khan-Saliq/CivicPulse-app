import { Router } from 'express'
import Issue from '../models/Issue.js'
import User from '../models/User.js'
import UserNotification from '../models/UserNotification.js'
import { calculatePriorityScore } from '../utils/priority.js'
import { formatIssue } from '../utils/format.js'
import { authRequired, requireAdmin, requireAnyAdmin, authOptional } from '../middleware/auth.js'
import { assignCluster, getClusters, recalculatePriority } from '../utils/cluster.js'
import { applyTrustUpdate } from '../utils/trust.js'
import { runMorphDetection } from '../utils/morphDetection.js'
import {
  CATEGORY_DEPARTMENTS,
  FIELD_TEAMS,
  HIGH_PRIORITY_THRESHOLD,
  DUPLICATE_RADIUS_METERS,
} from '../config/constants.js'
import ExcelJS from 'exceljs'

const router = Router()

function buildQuery(params) {
  const query = {}
  if (params.status && params.status !== 'all') query.status = params.status
  if (params.category && params.category !== 'all') query.category = params.category
  if (params.excludeResolved === 'true') query.status = { $ne: 'resolved' }
  if (params.validation) query.validationResult = params.validation
  
  // Date filtering
  if (params.startDate || params.endDate) {
    query.createdAt = {}
    if (params.startDate) {
      query.createdAt.$gte = new Date(params.startDate)
    }
    if (params.endDate) {
      // End of the selected day
      const end = new Date(params.endDate)
      end.setHours(23, 59, 59, 999)
      query.createdAt.$lte = end
    }
  }
  
  // Specific day/month/year filtering
  if (params.day) {
    query.$expr = { $eq: [{ $dayOfMonth: '$createdAt' }, parseInt(params.day)] }
  }
  if (params.month) {
    query.$expr = { $eq: [{ $month: '$createdAt' }, parseInt(params.month)] }
  }
  if (params.year) {
    query.$expr = { $eq: [{ $year: '$createdAt' }, parseInt(params.year)] }
  }
  
  return query
}

function pickTeam() {
  return FIELD_TEAMS[Math.floor(Math.random() * FIELD_TEAMS.length)]
}

async function notifyIssueParticipants(issue, title, message, type) {
  const recipientIds = new Set(
    [issue.reporterId?.toString(), ...(issue.voterIds || []).map((id) => id.toString())].filter(Boolean)
  )

  for (const userId of recipientIds) {
    await UserNotification.create({
      userId,
      issueId: issue._id,
      type,
      title,
      message,
    })
  }
}

router.get('/', authOptional, async (req, res) => {
  try {
    const query = buildQuery(req.query)
    if (req.user?.role === 'department_admin') {
      query.responsibleDepartment = req.user.department
    }

    let sort = { priorityScore: -1 }
    if (req.query.sort === 'date') sort = { createdAt: -1 }

    let q = Issue.find(query).sort(sort)
    if (req.query.limit) q = q.limit(parseInt(req.query.limit, 10))

    const issues = await q
    res.json(issues.map(formatIssue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/stats', authOptional, async (req, res) => {
  try {
    const statsFilter = {}
    if (req.user?.role === 'department_admin') {
      statsFilter.responsibleDepartment = req.user.department
    } else if (req.query.department && req.query.department !== 'all') {
      statsFilter.responsibleDepartment = req.query.department
    }

    const issues = await Issue.find(statsFilter)
    res.json({
      total: issues.length,
      reported: issues.filter((i) => i.status === 'reported').length,
      inProgress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
      highPriority: issues.filter((i) => i.priorityScore >= HIGH_PRIORITY_THRESHOLD).length,
      pendingValidation: issues.filter((i) => i.validationResult === 'pending').length,
      manipulated: issues.filter((i) => i.validationResult === 'manipulated').length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/clusters', authOptional, async (req, res) => {
  try {
    const query = buildQuery(req.query)
    const clusters = await getClusters(query)
    res.json(clusters.sort((a, b) => b.totalReports - a.totalReports))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/nearby', authOptional, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)
    const radiusKm = parseFloat(req.query.radius) || 5
    const excludeResolved = req.query.excludeResolved !== 'false'

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng required' })
    }

    const filter = {
      geoLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }
    if (excludeResolved) filter.status = { $ne: 'resolved' }

    const issues = await Issue.find(filter).sort({ priorityScore: -1 })
    res.json(issues.map(formatIssue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/priority/top', authOptional, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)
    const limit = parseInt(req.query.limit || '3', 10)
    const radiusKm = parseFloat(req.query.radius) || 25

    let issues
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      issues = await Issue.find({
        status: { $ne: 'resolved' },
        geoLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      }).limit(limit)
    } else {
      issues = await Issue.find({ status: { $ne: 'resolved' } })
        .sort({ priorityScore: -1 })
        .limit(limit)
    }

    res.json(issues.map(formatIssue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/reporter/:reporterId/stats', authRequired, async (req, res) => {
  try {
    const issues = await Issue.find({ reporterId: req.params.reporterId })
    res.json({
      total: issues.length,
      reported: issues.filter((i) => i.status === 'reported').length,
      inProgress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/reporter/:reporterId', authRequired, async (req, res) => {
  try {
    const issues = await Issue.find({ reporterId: req.params.reporterId }).sort({ createdAt: -1 })
    res.json(issues.map(formatIssue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/duplicates', authOptional, async (req, res) => {
  try {
    const { title, lat, lng } = req.query
    if (!title || !lat || !lng) {
      return res.status(400).json({ error: 'title, lat, lng required' })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)

    const nearby = await Issue.find({
      status: { $ne: 'resolved' },
      geoLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: DUPLICATE_RADIUS_METERS,
        },
      },
    })

    const matches = nearby.filter((issue) =>
      keywords.some((k) => issue.title.toLowerCase().includes(k))
    )

    res.json(matches.map(formatIssue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', authOptional, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })
    res.json(formatIssue(issue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const { title, description, category, severity, location, imageUrl, mergeWithId, area } = req.body

    if (!title || !description || !category || !severity || !location) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate location shape
    const latNum = Number(location.lat)
    const lngNum = Number(location.lng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return res.status(400).json({ error: 'location.lat and location.lng must be numbers' })
    }
    if (!location.address || typeof location.address !== 'string') {
      return res.status(400).json({ error: 'location.address is required' })
    }

    // Validate severity
    const sev = Number(severity)
    if (Number.isNaN(sev) || sev < 1 || sev > 5) {
      return res.status(400).json({ error: 'severity must be a number between 1 and 5' })
    }

    // Validate category is in enum
    const validCategories = [
      'potholes_and_road_damage',
      'traffic_signal_malfunction',
      'non_functional_streetlights',
      'water_leakage',
      'garbage_overflow',
      'drainage_blockage',
      'public_toilet_issue',
      'tree_trimming',
      'building_safety',
      'streetlight_failure',
      'other',
    ]
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`,
      })
    }

    const reporter = await User.findById(req.user.id)
    if (!reporter) return res.status(404).json({ error: 'User not found' })

    const parsedLocation = {
      lat: latNum,
      lng: lngNum,
      address: location.address.trim(),
    }

    if (mergeWithId) {
      const existing = await Issue.findById(mergeWithId)
      if (existing) {
        const alreadyVoted = existing.voterIds?.some((id) => id.toString() === req.user.id)
        if (!alreadyVoted) {
          existing.reportCount += 1
          existing.votes += 1
          existing.voterIds = existing.voterIds || []
          existing.voterIds.push(reporter._id)
        }
        recalculatePriority(existing)
        await existing.save()
        return res.status(200).json(formatIssue(existing))
      }
    }

    console.log('Creating issue payload:', { title, description, category, severity, location, imageUrl, mergeWithId })
    const issue = new Issue({
      title,
      description,
      category,
      responsibleDepartment: CATEGORY_DEPARTMENTS[category] || 'General Municipal Services',
      severity: sev,
      location: parsedLocation,
      geoLocation: { type: 'Point', coordinates: [parsedLocation.lng, parsedLocation.lat] },
      area: area || 'Unknown Area',
      imageUrl,
      reporterId: reporter._id,
      reporterName: reporter.name,
      reporterTrustScore: reporter.trustScore,
      reportCount: 1,
      validationResult: 'pending',
      votes: 1,
      voterIds: [reporter._id],
    })

    recalculatePriority(issue)
    await assignCluster(issue)
    await issue.save()

    reporter.totalReports += 1
    await reporter.save()

    res.status(201).json(formatIssue(issue))
  } catch (err) {
    console.error('Error creating issue:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

router.post('/:id/vote', authRequired, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })
    if (issue.status === 'resolved') {
      return res.status(400).json({ error: 'Cannot vote on resolved issues' })
    }

    const alreadyVoted = issue.voterIds?.some((id) => id.toString() === req.user.id)
    if (alreadyVoted) {
      return res.status(409).json({ error: 'Already voted on this issue' })
    }

    issue.votes += 1
    issue.reportCount += 1
    issue.voterIds = issue.voterIds || []
    issue.voterIds.push(req.user.id)
    recalculatePriority(issue)
    await issue.save()

    res.json(formatIssue(issue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/validate', authRequired, requireAnyAdmin, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })
    if (req.user.role === 'department_admin' && issue.responsibleDepartment !== req.user.department) {
      return res.status(403).json({ error: 'Access denied to validate this issue' })
    }

    const { result: manualResult } = req.body
    const { result, confidence } = manualResult
      ? { result: manualResult, confidence: 90 }
      : runMorphDetection(issue)

    const reporter = await User.findById(issue.reporterId)
    if (reporter) {
      await applyTrustUpdate(reporter, result)
      issue.reporterTrustScore = reporter.trustScore
    }

    issue.validationResult = result
    issue.timeline = issue.timeline || []
    issue.timeline.push({
      action: 'Validation performed',
      performedBy: req.user.name,
      details: `Validated as ${result}`,
    })
    issue.lastActionAt = new Date()
    recalculatePriority(issue)
    await issue.save()

    await notifyIssueParticipants(
      issue,
      `Issue ${result === 'valid' ? 'Accepted' : 'Rejected'}: ${issue.title}`,
      `The issue "${issue.title}" was ${result === 'valid' ? 'accepted' : 'rejected'} by an administrator. Validation result: ${result}.`,
      'validation_update'
    )

    res.json({ issue: formatIssue(issue), result, confidence, user: reporter ? { id: reporter._id, trustScore: reporter.trustScore } : null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/status', authRequired, requireAnyAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })
    if (req.user.role === 'department_admin' && issue.responsibleDepartment !== req.user.department) {
      return res.status(403).json({ error: 'Access denied to update this issue' })
    }

    issue.status = status
    
    // Ensure responsibleDepartment is set for old issues
    if (!issue.responsibleDepartment) {
      issue.responsibleDepartment = CATEGORY_DEPARTMENTS[issue.category] || 'General Municipal Services'
    }
    
    issue.timeline = issue.timeline || []
    issue.timeline.push({
      action: 'Status updated',
      performedBy: req.user.name,
      details: `Status changed to ${status}`,
    })
    issue.lastActionAt = new Date()
    if (status === 'in_progress') {
      issue.assignedTo = pickTeam()
    }
    await issue.save()

    await notifyIssueParticipants(
      issue,
      `Issue ${status === 'in_progress' ? 'In Progress' : status === 'resolved' ? 'Resolved' : 'Updated'}: ${issue.title}`,
      `The issue "${issue.title}" is now ${status.replace('_', ' ')}.`,
      'status_update'
    )

    res.json(formatIssue(issue))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/export', authRequired, requireAnyAdmin, async (req, res) => {
  try {
    const { filters } = req.body
    const query = buildQuery(filters || {})
    
    // Apply department filter for department admins
    if (req.user.role === 'department_admin') {
      query.responsibleDepartment = req.user.department
    }
    
    const issues = await Issue.find(query).sort({ createdAt: -1 }).lean()
    
    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'CivicPulse'
    workbook.created = new Date()
    
    const worksheet = workbook.addWorksheet('Issues Report', {
      properties: { tabColor: { argb: '00B4D8' } }
    })
    
    // Add title row
    worksheet.mergeCells('A1:K1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'CivicPulse - Issues Report'
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '00B4D8' }
    }
    titleCell.alignment = { horizontal: 'center' }
    worksheet.getRow(1).height = 30
    
    // Add filters info
    worksheet.mergeCells('A2:K2')
    const filterCell = worksheet.getCell('A2')
    const filterText = []
    if (filters?.category) filterText.push(`Category: ${filters.category}`)
    if (filters?.startDate) filterText.push(`From: ${filters.startDate}`)
    if (filters?.endDate) filterText.push(`To: ${filters.endDate}`)
    if (filters?.status) filterText.push(`Status: ${filters.status}`)
    filterCell.value = filterText.length > 0 ? `Filters: ${filterText.join(' | ')}` : 'All Issues'
    filterCell.font = { size: 10, italic: true }
    filterCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E3F2FD' }
    }
    
    // Add headers
    const headers = [
      'Issue ID',
      'Title',
      'Category',
      'Status',
      'Priority',
      'Severity',
      'Location',
      'Reporter',
      'Trust Score',
      'Validation',
      'Created Date'
    ]
    
    const headerRow = worksheet.addRow(headers)
    headerRow.height = 25
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0284C7' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    // Add data rows
    issues.forEach((issue) => {
      const row = worksheet.addRow([
        issue._id.toString().slice(-6),
        issue.title,
        issue.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        issue.status.replace('_', ' ').toUpperCase(),
        issue.priorityScore || 0,
        issue.severity,
        issue.location?.address || 'N/A',
        issue.reporterName,
        issue.reporterTrustScore || 50,
        (issue.validationResult || 'pending').toUpperCase(),
        new Date(issue.createdAt).toLocaleString()
      ])
      
      // Style data rows
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.alignment = { vertical: 'middle', wrapText: true }
        
        // Color code status
        if (colNumber === 4) {
          const status = cell.value
          if (status === 'RESOLVED') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6F6D5' } }
            cell.font = { color: { argb: '22543D' } }
          } else if (status === 'IN PROGRESS') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEFCBF' } }
            cell.font = { color: { argb: '744210' } }
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7D7' } }
            cell.font = { color: { argb: '742A2A' } }
          }
        }
        
        // Color code validation
        if (colNumber === 10) {
          const validation = cell.value
          if (validation === 'VALID') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6F6D5' } }
          } else if (validation === 'MANIPULATED') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7D7' } }
          }
        }
      })
      
      // Alternate row colors
      if (issues.indexOf(issue) % 2 === 0) {
        row.eachCell((cell) => {
          if (!cell.fill || cell.fill.pattern !== 'solid') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFC' } }
          }
        })
      }
    })
    
    // Set column widths
    worksheet.columns = [
      { width: 10 },  // ID
      { width: 30 },  // Title
      { width: 25 },  // Category
      { width: 15 },  // Status
      { width: 10 },  // Priority
      { width: 10 },  // Severity
      { width: 35 },  // Location
      { width: 20 },  // Reporter
      { width: 12 },  // Trust Score
      { width: 15 },  // Validation
      { width: 20 }   // Created Date
    ]
    
    // Add summary at the end
    const summaryRow = issues.length + 4
    worksheet.mergeCells(`A${summaryRow}:K${summaryRow}`)
    const summaryCell = worksheet.getCell(`A${summaryRow}`)
    summaryCell.value = `Total Issues: ${issues.length} | Generated: ${new Date().toLocaleString()}`
    summaryCell.font = { bold: true, size: 11 }
    summaryCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E3F2FD' }
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="issues-report-${Date.now()}.xlsx"`)
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('Export error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
