import { apiFetch } from './api'
import type { AdminNotification, UserNotification } from '../types'

export async function getUserNotifications(): Promise<UserNotification[]> {
  return apiFetch<UserNotification[]>('/user-notifications')
}

export async function markUserNotificationRead(id: string): Promise<UserNotification> {
  return apiFetch<UserNotification>(`/user-notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export async function deleteUserNotification(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/user-notifications/${id}`, {
    method: 'DELETE',
  })
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  return apiFetch<AdminNotification[]>('/notifications')
}

export async function markAdminNotificationRead(id: string): Promise<AdminNotification> {
  return apiFetch<AdminNotification>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export async function deleteAdminNotification(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/notifications/${id}`, {
    method: 'DELETE',
  })
}
