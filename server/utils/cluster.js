import Issue from '../models/Issue.js'
import { calculatePriorityScore } from './priority.js'

export async function assignCluster(issue) {
  const nearby = await Issue.find({
    _id: { $ne: issue._id },
    status: { $ne: 'resolved' },
    category: issue.category,
    geoLocation: {
      $near: {
        $geometry: issue.geoLocation,
        $maxDistance: 500,
      },
    },
  }).limit(1)

  if (nearby.length > 0 && nearby[0].clusterId) {
    issue.clusterId = nearby[0].clusterId
  } else if (nearby.length > 0) {
    const clusterId = `cluster-${nearby[0]._id}`
    nearby[0].clusterId = clusterId
    await nearby[0].save()
    issue.clusterId = clusterId
  } else {
    issue.clusterId = `cluster-${issue._id}`
  }
}

export async function getClusters(filter = {}) {
  const issues = await Issue.find(filter)
  const clusters = new Map()

  for (const issue of issues) {
    const key = issue.clusterId || issue._id.toString()
    if (!clusters.has(key)) clusters.set(key, [])
    clusters.get(key).push(issue)
  }

  return [...clusters.entries()].map(([id, items]) => ({
    id,
    area: items[0].location.address,
    issueCount: items.length,
    totalReports: items.reduce((s, i) => s + i.reportCount, 0),
    maxPriority: Math.max(...items.map((i) => i.priorityScore)),
    categories: [...new Set(items.map((i) => i.category))],
  }))
}

export function recalculatePriority(issue) {
  issue.priorityScore = calculatePriorityScore({
    ...issue.toObject(),
    clusterDensity: issue.reportCount * 1.5,
  })
}
