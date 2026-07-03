export function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || null,
    trustScore: user.trustScore,
    verifiedReports: user.verifiedReports,
    totalReports: user.totalReports,
  }
}

export function formatIssue(issue) {
  return {
    id: issue._id.toString(),
    title: issue.title,
    description: issue.description,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    location: issue.location,
    imageUrl: issue.imageUrl,
    reporterId: issue.reporterId?.toString?.() ?? issue.reporterId,
    reporterName: issue.reporterName,
    reporterTrustScore: issue.reporterTrustScore,
    reportCount: issue.reportCount,
    clusterId: issue.clusterId,
    priorityScore: issue.priorityScore,
    validationResult: issue.validationResult,
    assignedTo: issue.assignedTo,
    responsibleDepartment: issue.responsibleDepartment,
    createdAt: issue.createdAt?.toISOString?.() ?? issue.createdAt,
    updatedAt: issue.updatedAt?.toISOString?.() ?? issue.updatedAt,
    votes: issue.votes,
  }
}
