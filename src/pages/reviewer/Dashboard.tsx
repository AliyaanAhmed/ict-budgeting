import { Link } from 'react-router-dom'
import { ClipboardList, Eye, AlertTriangle, FileX, AlertCircle, CheckCircle, Clock, TrendingUp, Calendar, BarChart2 } from 'lucide-react'
import { projects, currentCycle, reviewQueueProjects } from '@/data/db'
import { StatCard } from '@/components/shared/StatCard'
import { AiPlaceholderCard } from '@/components/shared/AiPlaceholderCard'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { NewVsRecurringDonut } from '@/components/charts/CapexOpexDonut'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { formatAED } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ReviewerDashboard() {
  const toReview = reviewQueueProjects.filter((p) => p.status === 'To Review').length
  const reviewed = reviewQueueProjects.filter((p) => p.status === 'Reviewed').length
  const clarificationPending = reviewQueueProjects.filter((p) => p.status === 'Clarification Pending').length
  const avgReadiness = Math.round(reviewQueueProjects.reduce((s, p) => s + p.aiConfidence, 0) / reviewQueueProjects.length)
  const missingDocs = reviewQueueProjects.filter((p) => p.hasMissingDocs).length

  const highPriority = reviewQueueProjects
    .filter((p) => p.riskLevel === 'High' || p.hasMissingDocs)
    .slice(0, 4)

  const riskSignals = [
    { label: 'High Risk', value: 5, color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" />, desc: 'Require attention' },
    { label: 'Low Confidence', value: 7, color: 'text-amber-600', icon: <AlertCircle className="h-4 w-4" />, desc: '3 items <60%' },
    { label: 'Duplicates', value: 3, color: 'text-purple-600', icon: <FileX className="h-4 w-4" />, desc: 'Similar detected' },
    { label: 'Missing Docs', value: 4, color: 'text-red-600', icon: <FileX className="h-4 w-4" />, desc: 'Blocked' },
    { label: 'Budget Anomaly', value: 5, color: 'text-orange-600', icon: <TrendingUp className="h-4 w-4" />, desc: 'Unusual patterns' },
    { label: 'Incomplete', value: 8, color: 'text-slate-600', icon: <Clock className="h-4 w-4" />, desc: 'Missing items' },
  ]

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Review Dashboard</h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">{currentCycle.name} • Review Period</p>
        </div>
        <Button asChild>
          <Link to="/reviewer/review-queue">
            Open Review Queue →
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="To Review" value={toReview} variant="amber" icon={<ClipboardList className="h-5 w-5" />} subtitle="Pending your review" style={{ animationDelay: '0ms' }} />
        <StatCard label="Reviewed" value={reviewed} variant="green" icon={<CheckCircle className="h-5 w-5" />} subtitle="Ready to submit" style={{ animationDelay: '50ms' }} />
        <StatCard label="Clarification Pending" value={clarificationPending} variant="amber" icon={<Clock className="h-5 w-5" />} subtitle="Awaiting response" style={{ animationDelay: '100ms' }} />
        <StatCard label="Avg Readiness" value={`${avgReadiness}%`} variant="blue" icon={<BarChart2 className="h-5 w-5" />} style={{ animationDelay: '150ms' }} />
        <StatCard label="Missing Docs" value={missingDocs} variant="red" icon={<FileX className="h-5 w-5" />} subtitle="Blocked" style={{ animationDelay: '200ms' }} />
      </div>

      {/* Deadline banner */}
      <div className="rounded-[12px] border border-[#286CFF]/20 bg-[#E7F5FF] dark:bg-blue-900/10 dark:border-blue-700/30 p-4 flex items-center gap-4 flex-wrap">
        <Calendar className="h-5 w-5 text-[#286CFF] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#286CFF]">Submission Deadline: {currentCycle.daysRemaining} days — Submit to Approver by {currentCycle.submissionDeadline}</p>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">All reviewed projects must reach Approver before the deadline</p>
        </div>
        <div className="ml-auto flex items-center gap-3 min-w-[200px]">
          <Progress value={currentCycle.completionPercentage} className="flex-1 h-2" />
          <span className="text-xs font-mono font-medium text-[#286CFF]">{currentCycle.completionPercentage}%</span>
        </div>
      </div>

      {/* AI Banner */}
      <AiPlaceholderCard
        title="AI Portfolio Summary"
        description="AI-powered insights will surface high-risk items, low-confidence submissions, and portfolio-wide anomalies to guide your review priorities."
      />

      {/* Projects Requiring Attention */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects Requiring Attention</CardTitle>
              <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">High priority items that need your review</p>
            </div>
            <button className="text-xs text-[#286CFF] font-medium hover:underline">+ Collapse</button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {highPriority.map((proj) => (
            <div
              key={proj.id}
              className={cn(
                'flex items-center gap-4 px-5 py-4 border-t border-[#F1F5F9] dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors',
                proj.riskLevel === 'High' && 'border-l-4 border-l-red-400'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-white/10 font-bold font-mono text-sm text-[#0F172A] dark:text-white">
                {proj.aiConfidence}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#0F172A] dark:text-white truncate">{proj.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RiskBadge risk={proj.riskLevel} />
                  {proj.hasMissingDocs && (
                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
                      Missing Docs
                    </span>
                  )}
                  <span className="text-xs text-[#475569] dark:text-slate-400">{proj.submittedDate}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-semibold text-sm text-[#0F172A] dark:text-white">{formatAED(proj.requestedBudget)}</p>
              </div>
              <Button size="sm" asChild>
                <Link to={`/reviewer/review-queue/${proj.id}`}>Review</Link>
              </Button>
            </div>
          ))}
          <div className="px-5 py-3 border-t border-[#F1F5F9] dark:border-white/5">
            <Link to="/reviewer/review-queue" className="text-sm text-[#286CFF] hover:underline font-medium">
              View All Projects →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
            <p className="text-sm text-[#475569] dark:text-slate-400">Distribution of requested budget</p>
          </CardHeader>
          <CardContent>
            <BudgetByCategory />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New vs Recurring Projects</CardTitle>
            <p className="text-sm text-[#475569] dark:text-slate-400">Project type distribution</p>
          </CardHeader>
          <CardContent>
            <NewVsRecurringDonut />
          </CardContent>
        </Card>
      </div>

      {/* Risk & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Risk & Quality Signals</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {riskSignals.map((s) => (
                <div key={s.label} className="rounded-[10px] border border-[#E2E8F0] dark:border-white/10 p-3">
                  <div className={cn('flex items-center gap-1.5 mb-1', s.color)}>
                    {s.icon}
                    <span className="text-2xl font-bold font-mono">{s.value}</span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A] dark:text-white">{s.label}</p>
                  <p className="text-xs text-[#475569] dark:text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Review Queue', badge: toReview, href: '/reviewer/review-queue', color: 'text-[#286CFF]' },
              { label: 'High Risk Items', badge: 5, href: '/reviewer/review-queue', color: 'text-red-600' },
              { label: 'Missing Documents', badge: missingDocs, href: '/reviewer/review-queue', color: 'text-red-500' },
            ].map((item) => (
              <Link key={item.label} to={item.href}
                className="flex items-center justify-between rounded-[8px] border border-[#E2E8F0] dark:border-white/10 px-4 py-3 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                <span className={cn('text-sm font-medium', item.color)}>{item.label}</span>
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-[#F1F5F9] dark:bg-white/10 text-xs font-bold text-[#0F172A] dark:text-white px-2">
                  {item.badge}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
