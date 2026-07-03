import { useConfig } from '../context/ConfigContext'

export function useCategoryLabel(categoryId: string) {
  const { config } = useConfig()
  return config?.categories.find((c) => c.id === categoryId)?.label ?? categoryId
}

export function useStatusLabel(statusId: string) {
  const { config } = useConfig()
  return config?.statuses.find((s) => s.id === statusId)?.label ?? statusId
}
