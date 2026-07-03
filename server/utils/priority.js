import { PRIORITY_WEIGHTS } from '../config/constants.js'

export function calculatePriorityScore(issue, weights = PRIORITY_WEIGHTS) {
  const createdAt = issue.createdAt || new Date()
  const hoursSinceReport = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  const timeDelay = Math.min(hoursSinceReport / 24, 10)
  const clusterDensity = issue.clusterDensity ?? Math.min((issue.reportCount || 1) * 2, 10)

  let trustContribution = (issue.reporterTrustScore || 50) / 10
  if (issue.validationResult === 'manipulated') trustContribution *= 0.3
  if (issue.validationResult === 'suspicious') trustContribution *= 0.6

  const score =
    weights.severity * issue.severity +
    weights.reportCount * Math.min(issue.reportCount || 1, 10) +
    weights.timeDelay * timeDelay +
    weights.clusterDensity * clusterDensity +
    weights.trustScore * trustContribution

  return Math.round(score * 10) / 10
}
