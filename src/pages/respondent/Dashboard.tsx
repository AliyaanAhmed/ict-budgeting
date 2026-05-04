import { Link } from 'react-router-dom'
import { Plus, Calendar, TrendingUp, FolderOpen, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import { projects, currentCycle } from '@/data/db'
import { StatCard } from '@/components/shared/StatCard'
import { ProjectTable } from '@/components/shared/ProjectTable'
import { AiPlaceholderCard } from '@/components/shared/AiPlaceholderCard'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { CapexOpexDonut } from '@/components/charts/CapexOpexDonut'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { dashboardStatusColors } from '@/lib/dashboardPalette'

export default function RespondentDashboard() {
  const total = projects.length
  const submittedToReviewer = projects.filter((p) => p.status === 'Submitted to Reviewer').length
  const clarificationRequired = projects.filter((p) => p.status === 'Clarification Required').length
  const needsWork = projects.filter((p) => p.status === 'Needs Work' || p.status === 'Draft').length
  const approved = projects.filter((p) => p.status === 'Approved').length
  const submittedToApprover = projects.filter((p) => p.status === 'Submitted to Approver').length
  const totalBudget = projects.reduce((s, p) => s + p.requestedBudget, 0)

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">My Dashboard</h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
            Track and manage your budget submissions
          </p>
          <p className="text-xs text-[#286CFF] font-medium mt-1">
            {currentCycle.name} • Planning Stage
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/respondent/projects/new">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Total Projects" value={total} icon={<FolderOpen className="h-5 w-5" />} style={{ animationDelay: '0ms' }} />
        <StatCard label="Submitted to Reviewer" value={submittedToReviewer} variant="blue" icon={<TrendingUp className="h-5 w-5" />} style={{ animationDelay: '50ms' }} />
        <StatCard label="Clarification Required" value={clarificationRequired} variant="amber" icon={<AlertCircle className="h-5 w-5" />} style={{ animationDelay: '100ms' }} />
        <StatCard label="Needs Work / Draft" value={needsWork} variant="red" icon={<Clock className="h-5 w-5" />} style={{ animationDelay: '150ms' }} />
        <StatCard label="Approved" value={approved} variant="green" icon={<CheckCircle className="h-5 w-5" />} style={{ animationDelay: '200ms' }} />
      </div>

      {/* Project Pipeline */}
      <div className="rounded-[12px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Project Pipeline</p>
          <p className="text-xs text-[#475569] dark:text-slate-400">{total} projects total</p>
        </div>
        <div className="flex rounded-full overflow-hidden h-2.5 gap-[2px]">
          {approved > 0 && <div className="transition-all" style={{ flex: approved, backgroundColor: dashboardStatusColors.approved }} />}
          {submittedToReviewer > 0 && <div className="transition-all" style={{ flex: submittedToReviewer, backgroundColor: dashboardStatusColors.withReviewer }} />}
          {submittedToApprover > 0 && <div className="transition-all" style={{ flex: submittedToApprover, backgroundColor: dashboardStatusColors.withApprover }} />}
          {clarificationRequired > 0 && <div className="transition-all" style={{ flex: clarificationRequired, backgroundColor: dashboardStatusColors.clarification }} />}
          {needsWork > 0 && <div className="transition-all" style={{ flex: needsWork, backgroundColor: dashboardStatusColors.needsWork }} />}
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dashboardStatusColors.approved }} />Approved ({approved})</span>
          <span className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dashboardStatusColors.withReviewer }} />With Reviewer ({submittedToReviewer})</span>
          <span className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dashboardStatusColors.withApprover }} />With Approver ({submittedToApprover})</span>
          <span className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dashboardStatusColors.clarification }} />Clarification ({clarificationRequired})</span>
          <span className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dashboardStatusColors.needsWork }} />Needs Work ({needsWork})</span>
        </div>
      </div>

      {/* Deadline Banner */}
      <div className="rounded-[12px] border border-[#286CFF]/20 bg-[#E7F5FF] dark:bg-blue-900/10 dark:border-blue-700/30 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[#286CFF] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#286CFF]">
                Submission Deadline: {currentCycle.daysRemaining} days remaining
              </p>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Submit to Approver by {currentCycle.submissionDeadline}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 min-w-[200px]">
            <Progress value={currentCycle.completionPercentage} className="flex-1 h-2" />
            <span className="text-xs font-medium text-[#286CFF]">{currentCycle.completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* AI Portfolio Summary */}
      <AiPlaceholderCard
        title="AI Portfolio Analysis"
        description="AI-powered insights will analyze your portfolio for risk signals, budget anomalies, duplicate submissions, and strategic alignment gaps once configured."
      />

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Projects</CardTitle>
              <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">Recent budget submissions</p>
            </div>
           <div className="flex items-center gap-1">
              <p className="text-xs text-[#475569] dark:text-slate-400">Total:</p>
              <CurrencyAmount amount={totalBudget} className="font-semibold text-[#0F172A] dark:text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectTable projects={projects.slice(0, 5)} />
          <div className="px-5 py-3 border-t border-[#F1F5F9] dark:border-white/5">
            <Link to="/respondent/projects" className="text-sm text-[#286CFF] hover:underline font-medium">
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
            <CardTitle>CapEx vs OpEx Split</CardTitle>
            <p className="text-sm text-[#475569] dark:text-slate-400">Budget type distribution</p>
          </CardHeader>
          <CardContent>
            <CapexOpexDonut />
          </CardContent>
        </Card>
      </div>

      {/* Footer stat */}
      <div className="flex items-center gap-4 text-sm text-[#475569] dark:text-slate-400 pb-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          {approved} Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          {submittedToReviewer + projects.filter(p => p.status === 'Submitted to Approver').length} Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          {needsWork + clarificationRequired} Needs Attention
        </span>
      </div>
    </div>
  )
}
