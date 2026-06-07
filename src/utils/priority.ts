import type { Issue, PriorityWeights } from '../types'

export const DEFAULT_WEIGHTS: PriorityWeights = {
  severity: 0.3,
  reportCount: 0.2,
  timeDelay: 0.15,
  clusterDensity: 0.2,
  trustScore: 0.15,
}

export function calculatePriorityScore(
  issue: Pick<
    Issue,
    | 'severity'
    | 'reportCount'
    | 'reporterTrustScore'
    | 'createdAt'
    | 'validationResult'
  > & { clusterDensity?: number },
  weights: PriorityWeights = DEFAULT_WEIGHTS
): number {
  const hoursSinceReport =
    (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60)
  const timeDelay = Math.min(hoursSinceReport / 24, 10)

  const clusterDensity = issue.clusterDensity ?? Math.min(issue.reportCount * 2, 10)

  let trustContribution = issue.reporterTrustScore / 10
  if (issue.validationResult === 'manipulated') trustContribution *= 0.3
  if (issue.validationResult === 'suspicious') trustContribution *= 0.6

  const score =
    weights.severity * issue.severity +
    weights.reportCount * Math.min(issue.reportCount, 10) +
    weights.timeDelay * timeDelay +
    weights.clusterDensity * clusterDensity +
    weights.trustScore * trustContribution

  return Math.round(score * 10) / 10
}
