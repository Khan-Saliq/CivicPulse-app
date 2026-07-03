import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { useConfig } from '../../context/ConfigContext'
import { useAuth } from '../../context/AuthContext'
import { getAllIssues, exportIssues } from '../../services/issueService'
import type { Issue, IssueStatus, IssueCategory } from '../../types'
import { Download, Filter, Calendar } from 'lucide-react'

export function AdminIssues() {
  const { config } = useConfig()
  const { user } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [exporting, setExporting] = useState(false)

  const departments = useMemo(
    () => Array.from(new Set((config?.categories ?? []).map((category) => category.department ?? '').filter(Boolean))),
    [config]
  )

  useEffect(() => {
    if (user?.role === 'department_admin') {
      setSelectedDepartment(user.department || 'all')
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter !== 'all') params.status = statusFilter
    if (categoryFilter !== 'all') params.category = categoryFilter
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (filterMonth) params.month = filterMonth
    if (filterYear) params.year = filterYear
    if (sortBy === 'date') params.sort = 'date'
    if (user?.role === 'department_admin') {
      params.department = user.department || 'all'
    } else if (selectedDepartment !== 'all') {
      params.department = selectedDepartment
    }
    getAllIssues(params)
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter, categoryFilter, startDate, endDate, filterMonth, filterYear, sortBy, selectedDepartment, user])

  const handleExport = async () => {
    setExporting(true)
    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        month: filterMonth || undefined,
        year: filterYear || undefined,
      }
      const blob = await exportIssues(filters)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `issues-report-${Date.now()}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export issues')
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setCategoryFilter('all')
    setStartDate('')
    setEndDate('')
    setFilterMonth('')
    setFilterYear('')
  }

  const hasActiveFilters = categoryFilter !== 'all' || startDate || endDate || filterMonth || filterYear

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Issue <span className="text-gradient">Management</span>
        </h1>
        <p className="mt-1 text-slate-400">Review, assign, and update civic issues by priority.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'all')} className="input-dark w-auto text-sm">
            <option value="all">All Statuses</option>
            {(config?.statuses ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'priority' | 'date')} className="input-dark w-auto text-sm">
            <option value="priority">Sort by Priority</option>
            <option value="date">Sort by Date</option>
          </select>
          
          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
              hasActiveFilters || showFilters
                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-violet-500/30'
            }`}
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-xs text-white">
                {[categoryFilter !== 'all', startDate, endDate, filterMonth, filterYear].filter(Boolean).length}
              </span>
            )}
          </button>
          
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || issues.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          
          {user?.role === 'admin' && (
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="input-dark w-auto text-sm">
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}
          {user?.role === 'department_admin' && (
            <span className="rounded-full bg-white/5 px-3 py-2 text-sm text-cyan-200">
              Department: {user.department || 'Unknown'}
            </span>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Calendar className="h-4 w-4 text-cyan-400" />
                Filter Issues
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {/* Category Filter */}
              <div>
                <label className="mb-1 block text-xs text-slate-400">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as IssueCategory | 'all')}
                  className="input-dark w-full text-sm"
                >
                  <option value="all">All Categories</option>
                  {(config?.categories ?? []).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Start Date */}
              <div>
                <label className="mb-1 block text-xs text-slate-400">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-dark w-full text-sm"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="mb-1 block text-xs text-slate-400">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-dark w-full text-sm"
                />
              </div>
              
              {/* Month Filter */}
              <div>
                <label className="mb-1 block text-xs text-slate-400">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="input-dark w-full text-sm"
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              
              {/* Year Filter */}
              <div>
                <label className="mb-1 block text-xs text-slate-400">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="input-dark w-full text-sm"
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-slate-400">Loading issues...</p>
        ) : (
          <div className="mt-6 space-y-4">
            {issues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} adminLink delay={i * 50} />
            ))}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  )
}
