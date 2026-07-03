import cron from 'node-cron'
import Issue from '../models/Issue.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'

const INACTIVE_DAYS_THRESHOLD = 30
const DELETION_DAYS_THRESHOLD = 32

export function initializeCleanupJobs() {
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Running issue cleanup job...')
      await checkInactiveIssues()
      await deleteExpiredIssues()
      await deleteResolvedOrRejected()
    } catch (err) {
      console.error('Cleanup job error:', err)
    }
  })
}

async function checkInactiveIssues() {
  const thirtyDaysAgo = new Date(Date.now() - INACTIVE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000)

  const inactiveIssues = await Issue.find({
    status: { $ne: 'resolved' },
    lastActionAt: { $lt: thirtyDaysAgo },
    inactiveNotificationSent: false,
  })

  const admins = await User.find({ role: { $in: ['admin', 'department_admin'] } })

  for (const issue of inactiveIssues) {
    for (const admin of admins) {
      if (admin.role === 'department_admin' && admin.department !== issue.responsibleDepartment) {
        continue
      }
      await Notification.create({
        adminId: admin._id,
        issueId: issue._id,
        type: 'inactive_30days',
        title: `Issue Inactive: ${issue.title}`,
        message: `Issue #${issue._id} has been inactive for ${INACTIVE_DAYS_THRESHOLD} days. Please take action or mark as resolved to prevent automatic deletion.`,
      })
    }

    await Issue.findByIdAndUpdate(issue._id, { inactiveNotificationSent: true })
    console.log(`Notification sent for inactive issue: ${issue._id}`)
  }
}

async function deleteExpiredIssues() {
  const thirtyTwoDaysAgo = new Date(Date.now() - DELETION_DAYS_THRESHOLD * 24 * 60 * 60 * 1000)

  const expiredIssues = await Issue.find({
    status: { $ne: 'resolved' },
    lastActionAt: { $lt: thirtyTwoDaysAgo },
    inactiveNotificationSent: true,
  })

  const admins = await User.find({ role: { $in: ['admin', 'department_admin'] } })

  for (const issue of expiredIssues) {
    for (const admin of admins) {
      if (admin.role === 'department_admin' && admin.department !== issue.responsibleDepartment) {
        continue
      }
      await Notification.create({
        adminId: admin._id,
        issueId: issue._id,
        type: 'scheduled_deletion',
        title: `Issue Deleted: ${issue.title}`,
        message: `Issue #${issue._id} was automatically deleted due to prolonged inactivity (${DELETION_DAYS_THRESHOLD} days).`,
      })
    }

    await Issue.findByIdAndDelete(issue._id)
    console.log(`Deleted expired issue: ${issue._id}`)
  }
}

async function deleteResolvedOrRejected() {
  const RESOLVED_RETENTION_DAYS = 30
  const cutoff = new Date(Date.now() - RESOLVED_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  const toDelete = await Issue.find({
    $or: [
      { status: 'resolved' },
      { validationResult: 'manipulated' },
    ],
    lastActionAt: { $lt: cutoff },
  })

  if (!toDelete.length) return

  const admins = await User.find({ role: { $in: ['admin', 'department_admin'] } })

  for (const issue of toDelete) {
    for (const admin of admins) {
      if (admin.role === 'department_admin' && admin.department !== issue.responsibleDepartment) {
        continue
      }
      await Notification.create({
        adminId: admin._id,
        issueId: issue._id,
        type: 'scheduled_deletion',
        title: `Issue Removed: ${issue.title}`,
        message: `Issue #${issue._id} was removed after ${RESOLVED_RETENTION_DAYS} days since resolution/rejection.`,
      })
    }

    await Issue.findByIdAndDelete(issue._id)
    console.log(`Deleted resolved/rejected issue: ${issue._id}`)
  }
}
