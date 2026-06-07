import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Camera, MapPin } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { useAuth } from '../../context/AuthContext'
import { useIssues } from '../../context/IssueContext'
import { findDuplicateCandidates } from '../../services/issueService'
import { CATEGORY_LABELS, type IssueCategory } from '../../types'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as IssueCategory[]

export function ReportIssue() {
  const { user } = useAuth()
  const { createIssue } = useIssues()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IssueCategory>('road_damage')
  const [severity, setSeverity] = useState(3)
  const [address, setAddress] = useState('MG Road, Connaught Place, Delhi')
  const [lat, setLat] = useState(28.6139)
  const [lng, setLng] = useState(77.209)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mergeWithId, setMergeWithId] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<ReturnType<typeof findDuplicateCandidates>>([])
  const [submitted, setSubmitted] = useState(false)

  const checkDuplicates = () => {
    if (title.length > 5) {
      setDuplicates(findDuplicateCandidates(title, lat, lng))
    }
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    createIssue({
      title,
      description,
      category,
      severity,
      location: { lat, lng, address },
      imageUrl: imagePreview || undefined,
      reporterId: user.id,
      reporterName: user.name,
      reporterTrustScore: user.trustScore,
      mergeWithId: mergeWithId || undefined,
    })

    setSubmitted(true)
    setTimeout(() => navigate('/my-issues'), 1500)
  }

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Report an <span className="text-gradient">Issue</span>
        </h1>
        <p className="mt-1 text-slate-400">Submit with location and image proof. We&apos;ll check for duplicates.</p>

        {submitted && (
          <div className="animate-scale-in mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
            Issue submitted successfully! Priority score calculated. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="glass-card space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={checkDuplicates}
                className="input-dark"
                placeholder="e.g. Large pothole on main road"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-dark resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="input-dark"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Severity: <span className="text-cyan-400">{severity}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-400">
                <MapPin className="h-4 w-4 text-violet-400" /> Location
              </label>
              <input required value={address} onChange={(e) => setAddress(e.target.value)} className="input-dark mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="input-dark text-sm"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="input-dark text-sm"
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-400">
                <Camera className="h-4 w-4 text-cyan-400" /> Image Proof
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-cyan-300"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-2 h-32 animate-scale-in rounded-xl object-cover ring-2 ring-cyan-500/30"
                />
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              Submit Issue
            </button>
          </div>

          <div className="space-y-4">
            {duplicates.length > 0 && (
              <div className="animate-scale-in rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Possible Duplicates Found</h3>
                </div>
                <p className="mt-2 text-sm text-amber-200/70">
                  Similar issues exist nearby. Vote on an existing issue instead of creating a duplicate.
                </p>
                <div className="mt-3 space-y-2">
                  {duplicates.map((d) => (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-500/20 bg-white/5 p-3 transition hover:border-amber-500/40"
                    >
                      <input
                        type="radio"
                        name="merge"
                        checked={mergeWithId === d.id}
                        onChange={() => setMergeWithId(d.id)}
                        className="mt-1 accent-amber-500"
                      />
                      <div>
                        <p className="font-medium text-slate-100">{d.title}</p>
                        <p className="text-xs text-slate-500">
                          {d.reportCount} reports · Priority {d.priorityScore}
                        </p>
                      </div>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
                    <input
                      type="radio"
                      name="merge"
                      checked={mergeWithId === null}
                      onChange={() => setMergeWithId(null)}
                      className="accent-cyan-500"
                    />
                    This is a new issue (not a duplicate)
                  </label>
                </div>
              </div>
            )}

            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100">How priority works</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your issue will be scored based on severity, report count, time delay, cluster density,
                and your trust score (<span className="text-cyan-400">{user?.trustScore}%</span>).
              </p>
            </div>
          </div>
        </form>
      </AnimatedPage>
    </Layout>
  )
}
