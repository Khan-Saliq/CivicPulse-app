import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { AnimatedPage } from '../components/ui/AnimatedPage'
import { useAuth } from '../context/AuthContext'
import { fetchMe } from '../services/authService'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await login(email, password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    const me = await fetchMe()
    navigate(me?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <Layout>
      <AnimatedPage className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-slate-100">
          Welcome <span className="text-gradient">back</span>
        </h1>
        <p className="mt-1 text-slate-400">Sign in to report and track civic issues.</p>

        <form onSubmit={handleSubmit} className="glass-card mt-8 space-y-4 p-6">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-dark" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-cyan-400 hover:text-cyan-300">Register</Link>
        </p>
      </AnimatedPage>
    </Layout>
  )
}
