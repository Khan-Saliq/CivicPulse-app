export type UserRole = 'citizen' | 'admin' | 'department_admin'

export type IssueCategory =
  | 'potholes_and_road_damage'
  | 'traffic_signal_malfunction'
  | 'non_functional_streetlights'
  | 'water_leakage'
  | 'garbage_overflow'
  | 'drainage_blockage'
  | 'public_toilet_issue'
  | 'tree_trimming'
  | 'building_safety'
  | 'streetlight_failure'
  | 'other'

export type IssueStatus = 'reported' | 'in_progress' | 'resolved'

export type ValidationResult = 'valid' | 'suspicious' | 'manipulated' | 'pending'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string | null
  trustScore: number
  verifiedReports: number
  totalReports: number
}

export interface Location {
  lat: number
  lng: number
  address: string
}

export interface Issue {
  id: string
  title: string
  description: string
  category: IssueCategory
  severity: number
  status: IssueStatus
  location: Location
  imageUrl?: string
  reporterId: string
  reporterName: string
  reporterTrustScore: number
  reportCount: number
  clusterId?: string
  priorityScore: number
  validationResult: ValidationResult
  assignedTo?: string
  responsibleDepartment: string
  createdAt: string
  updatedAt: string
  votes: number
  timeline?: Array<{
    action: string
    timestamp: string
    performedBy?: string
    details?: string
  }>
  lastActionAt?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  issueId?: string
  validationResult?: ValidationResult
}

export interface ChatHistoryItem {
  id: string
  role: 'citizen' | 'admin'
  message: string
  response: string
  timestamp: string
  issueId?: string
  validationResult?: ValidationResult
}

export interface Upload {
  id: string
  filename: string
  url: string
  uploaderId: string
  uploaderName: string
  issueId?: string
  createdAt: string
}

export interface AdminNotification {
  id: string
  adminId: string
  issueId: string
  type: 'inactive_30days' | 'scheduled_deletion'
  title: string
  message: string
  read: boolean
  createdAt: string
  issue?: {
    title: string
    status: IssueStatus
  }
}

export interface UserNotification {
  id: string
  userId: string
  issueId: string
  type: 'status_update' | 'validation_update'
  title: string
  message: string
  read: boolean
  createdAt: string
  issue?: {
    title: string
    status: IssueStatus
  }
}

export interface PriorityWeights {
  severity: number
  reportCount: number
  timeDelay: number
  clusterDensity: number
  trustScore: number
}
