import { apiFetch } from './api'
import type { Upload } from '../types'

export async function uploadImage(imageBase64: string, filename?: string): Promise<string> {
  console.log('Uploading image to backend...')
  const { url } = await apiFetch<{ url: string }>('/uploads/image', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, filename }),
  })
  console.log('Upload successful, URL:', url)
  return url
}

export async function getUploadHistory(all = false): Promise<Upload[]> {
  const query = all ? '?all=true' : '?mine=true'
  return apiFetch<Upload[]>(`/uploads${query}`)
}

export async function clearAllUploadsAndIssues(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/uploads/clear-all', {
    method: 'DELETE',
  })
}
