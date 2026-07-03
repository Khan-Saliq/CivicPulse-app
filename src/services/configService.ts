import { apiFetch } from './api'

export interface AppConfig {
  categories: { id: string; label: string; department: string }[]
  statuses: { id: string; label: string }[]
  chatSuggestions: { citizen: string[]; admin: string[] }
  chatGreetings: { citizen: string; admin: string }
  fieldTeams: string[]
  highPriorityThreshold: number
}

export async function getAppConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>('/config')
}
