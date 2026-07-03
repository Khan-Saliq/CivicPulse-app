import { TRUST_DELTAS } from '../config/constants.js'

export function getTrustDelta(validationResult) {
  return TRUST_DELTAS[validationResult] ?? 0
}

export async function applyTrustUpdate(user, validationResult) {
  const delta = getTrustDelta(validationResult)
  if (!delta) return user

  user.trustScore = Math.max(0, Math.min(100, user.trustScore + delta))
  if (delta > 0) user.verifiedReports += 1
  user.totalReports = Math.max(user.totalReports, user.verifiedReports)
  await user.save()
  return user
}
