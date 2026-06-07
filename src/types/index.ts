export type UserRole = 'citizen' | 'admin'

export type IssueCategory =
  | 'road_damage'
  | 'waste'
  | 'water'
  | 'electricity'
  | 'sanitation'

export type IssueStatus = 'reported' | 'in_progress' | 'resolved'

export type ValidationResult = 'valid' | 'suspicious' | 'manipulated' | 'pending'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  trustScore: number
  verifiedReports: number
  totalReports: number
  password: string
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
  createdAt: string
  updatedAt: string
  votes: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  validationResult?: ValidationResult
}

export interface PriorityWeights {
  severity: number
  reportCount: number
  timeDelay: number
  clusterDensity: number
  trustScore: number
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  road_damage: 'Road Damage',
  waste: 'Waste Management',
  water: 'Water Supply',
  electricity: 'Electricity',
  sanitation: 'Sanitation',
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  reported: 'Reported',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}
