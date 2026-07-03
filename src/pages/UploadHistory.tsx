import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { AnimatedPage } from '../components/ui/AnimatedPage'
import { getUploadHistory } from '../services/uploadService'
import { useAuth } from '../context/AuthContext'
import type { Upload } from '../types'

export function UploadHistory() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchHistory = async () => {
      try {
        const all = user.role === 'admin'
        const history = await getUploadHistory(all)
        setUploads(history)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [user])

  return (
    <Layout>
      <AnimatedPage>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Upload History</h1>
            <p className="text-slate-400">
              {user?.role === 'admin'
                ? 'All uploads by users.'
                : 'Your uploaded evidence and linked issue references.'}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? (
          <p className="text-slate-400">Loading upload history...</p>
        ) : uploads.length === 0 ? (
          <p className="text-slate-400">No uploads found yet.</p>
        ) : (
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="glass-card p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Uploaded by {upload.uploaderName}</p>
                    <p className="text-lg font-semibold text-slate-100">{upload.filename}</p>
                    <p className="text-sm text-slate-500">{new Date(upload.createdAt).toLocaleString()}</p>
                    {upload.issueId && <p className="mt-2 text-sm text-cyan-300">Linked issue: {upload.issueId}</p>}
                  </div>
                  <a
                    href={upload.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost rounded-xl px-4 py-2 text-sm"
                  >
                    View upload
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  )
}
