import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Camera, MapPin, X, Loader } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'
import { useIssues } from '../../context/IssueContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import { findDuplicateCandidates } from '../../services/issueService'
import { uploadImage } from '../../services/uploadService'
import type { Issue, IssueCategory } from '../../types'

export function ReportIssue() {
  const { user } = useAuth()
  const { config } = useConfig()
  const { createIssue } = useIssues()
  const geo = useGeolocation()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IssueCategory>('potholes_and_road_damage')
  const [severity, setSeverity] = useState(3)
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mergeWithId, setMergeWithId] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<Issue[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [locationRefreshing, setLocationRefreshing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (geo.lat != null && geo.lng != null) {
      setLat(geo.lat)
      setLng(geo.lng)
      if (!address) setAddress(`${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`)
    }
  }, [geo.lat, geo.lng])

  useEffect(() => {
    if (config?.categories.length && !config.categories.find((c) => c.id === category)) {
      setCategory(config.categories[0].id as IssueCategory)
    }
  }, [config])

  const checkDuplicates = async () => {
    if (title.length > 5 && lat != null && lng != null) {
      try {
        setDuplicates(await findDuplicateCandidates(title, lat, lng))
      } catch {
        setDuplicates([])
      }
    }
  }

  const validateForm = () => {
    setFormError(null)
    const validCategories = (config?.categories ?? []).map((c) => c.id)
    if (!validCategories.length) {
      // fallback to known categories in case config hasn't loaded yet
      validCategories.push(
        'potholes_and_road_damage',
        'traffic_signal_malfunction',
        'non_functional_streetlights',
        'water_leakage',
        'garbage_overflow',
        'drainage_blockage',
        'public_toilet_issue',
        'tree_trimming',
        'building_safety',
        'other'
      )
    }

    if (!title || title.trim().length < 5) return 'Title must be at least 5 characters.'
    if (!description || description.trim().length < 10) return 'Description must be at least 10 characters.'
    if (!validCategories.includes(category)) return `Invalid category selected.`
    if (!Number.isFinite(lat as number) || !Number.isFinite(lng as number)) return 'Latitude and longitude must be valid numbers.'
    if (!address || !address.trim()) return 'Address is required.'
    if (typeof severity !== 'number' || severity < 1 || severity > 5) return 'Severity must be between 1 and 5.'
    return null
  }

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLocationRefreshing(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        setLocationRefreshing(false)
      },
      (err) => {
        alert(`Failed to get location: ${err.message}`)
        setLocationRefreshing(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const triggerImageInput = () => {
    // Check if device has camera (mobile/tablet)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // On mobile, trigger file input with camera
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.setAttribute('capture', 'environment')
      input.onchange = (e) => {
        const event = e as unknown as React.ChangeEvent<HTMLInputElement>
        handleImage(event)
      }
      input.click()
    } else {
      // On desktop, show file picker
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const event = e as unknown as React.ChangeEvent<HTMLInputElement>
        handleImage(event)
      }
      input.click()
    }
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      setCameraError((err as Error).message || 'Unable to access camera. Check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setImageFile(file)
        setImagePreview(canvasRef.current?.toDataURL('image/jpeg') || '')
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const clientValidation = validateForm()
    if (clientValidation) {
      setFormError(clientValidation)
      return
    }

    setSubmitting(true)
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        const base64 = await fileToBase64(imageFile)
        imageUrl = await uploadImage(base64, imageFile.name)
      }

      const payload = {
        title,
        description,
        category,
        severity,
        location: { lat: Number(lat), lng: Number(lng), address: address.trim() },
        imageUrl,
        mergeWithId: mergeWithId || undefined,
      }
      console.log('Submitting issue payload:', payload)
      await createIssue(payload)

      setSubmitted(true)
      setTimeout(() => navigate('/my-issues'), 1500)
    } catch {
      alert('Failed to submit issue. Ensure the API server is running.')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = config?.categories ?? []

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Report an <span className="text-gradient">Issue</span>
        </h1>
        <p className="mt-1 text-slate-400">Submit with location and image proof. We&apos;ll check for duplicates.</p>

        {geo.loading && <p className="mt-2 text-sm text-slate-500">📍 Detecting your location...</p>}
        {geo.error && <p className="mt-2 text-sm text-amber-400">⚠️ Location unavailable — enter coordinates manually or use the refresh button.</p>}
        {!geo.loading && !geo.error && lat != null && lng != null && (
          <p className="mt-2 text-sm text-emerald-400">✅ Location auto-filled from your current position</p>
        )}

        {submitted && (
          <div className="animate-scale-in mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
            Issue submitted successfully! Redirecting...
          </div>
        )}

        {formError && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-rose-200">
            <strong>Form error:</strong> {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="glass-card space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} onBlur={checkDuplicates} className="input-dark" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">Description</label>
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="input-dark resize-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)} className="input-dark">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Severity: <span className="text-cyan-400">{severity}</span></label>
                <input type="range" min={1} max={5} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full accent-cyan-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-violet-400" /> Location
                </span>
                <button
                  type="button"
                  onClick={refreshLocation}
                  disabled={locationRefreshing}
                  className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition flex items-center gap-1"
                  title="Refresh your current location"
                >
                  {locationRefreshing ? (
                    <>
                      <Loader className="h-3 w-3 animate-spin" /> Detecting...
                    </>
                  ) : (
                    <>📍 Refresh</>
                  )}
                </button>
              </label>
              <input required value={address} onChange={(e) => setAddress(e.target.value)} className="input-dark mb-2" placeholder="Street address or area name" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.0001" required value={lat ?? ''} onChange={(e) => setLat(Number(e.target.value))} className="input-dark text-sm" placeholder="Latitude" />
                <input type="number" step="0.0001" required value={lng ?? ''} onChange={(e) => setLng(Number(e.target.value))} className="input-dark text-sm" placeholder="Longitude" />
              </div>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-400">
                <Camera className="h-4 w-4 text-cyan-400" /> Image Proof
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={triggerImageInput}
                    className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/15"
                  >
                    📷 Take Photo
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="flex-1 text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-cyan-300"
                  />
                </div>
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-32 animate-scale-in rounded-xl object-cover ring-2 ring-cyan-500/30" />}
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <button type="submit" disabled={submitting || lat == null || lng == null} className="btn-primary w-full py-3 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>

          <div className="space-y-4">
            {duplicates.length > 0 && (
              <div className="animate-scale-in rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Possible Duplicates Found</h3>
                </div>
                <div className="mt-3 space-y-2">
                  {duplicates.map((d) => (
                    <label key={d.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-500/20 bg-white/5 p-3">
                      <input type="radio" name="merge" checked={mergeWithId === d.id} onChange={() => setMergeWithId(d.id)} className="mt-1 accent-amber-500" />
                      <div>
                        <p className="font-medium text-slate-100">{d.title}</p>
                        <p className="text-xs text-slate-500">{d.reportCount} reports · Priority {d.priorityScore}</p>
                      </div>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
                    <input type="radio" name="merge" checked={mergeWithId === null} onChange={() => setMergeWithId(null)} className="accent-cyan-500" />
                    This is a new issue
                  </label>
                </div>
              </div>
            )}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100">Priority scoring</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your trust score is <span className="text-cyan-400">{user?.trustScore}%</span>. Priority is calculated server-side when you submit.
              </p>
            </div>
          </div>
        </form>
      </AnimatedPage>
    </Layout>
  )
}
