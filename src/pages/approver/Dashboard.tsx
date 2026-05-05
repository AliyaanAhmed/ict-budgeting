import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, Users, Clock, CheckCircle, FileSearch, Sparkles, BarChart2, UserPen, ClipboardCheck, MessageSquareMore } from 'lucide-react'
import { projects, currentCycle, approvalQueueProjects } from '@/data/db'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useState } from 'react'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { dashboardPalette, dashboardStatusColors } from '@/lib/dashboardPalette'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { useToast } from '@/context/ToastContext'

const entityProgressData = [
  { stage: 'Drafted', count: 12, fill: dashboardPalette.chartSlate },
  { stage: 'With Reviewer', count: 9, fill: dashboardPalette.chartCyan },
  { stage: 'Reviewer Appr.', count: 13, fill: dashboardPalette.chartYellow },
  { stage: 'With Approver', count: 5, fill: dashboardPalette.chartOrange },
  { stage: 'Approved', count: 15, fill: dashboardPalette.chartBlue },
]

const clarifications = [
  { project: 'AI Analytics Platform', status: 'Pending', assignee: 'Sara Mahmoud', daysAgo: null },
  { project: 'Network Upgrade', status: '3 days overdue', assignee: 'Khaled Omar', daysAgo: 3, overdue: true },
  { project: 'Data Center Expansion', status: 'Responded', assignee: 'Khaled Omar', daysAgo: null },
]

export default function ApproverDashboard() {
  const [planningTab, setPlanningTab] = useState(true)
  const [attentionCollapsed, setAttentionCollapsed] = useState(false)
  const [clarificationProject, setClarificationProject] = useState<string | null>(null)
  const { showSuccessToast } = useToast()

  const totalBudget = [...projects, ...approvalQueueProjects].reduce((s, p) => s + ('requestedBudget' in p ? p.requestedBudget : 0), 0)

  const aiRiskTiles = [
    { label: 'High Risk', value: 2, color: dashboardPalette.aeRed, desc: 'Need immediate review' },
    { label: 'Missing Documents', value: 1, color: dashboardPalette.aeRed, desc: 'Blocking approval' },
    { label: 'Low Confidence', value: 5, color: dashboardPalette.camelYellow, desc: 'AI confidence <60%' },
    { label: 'Possible Duplicates', value: 3, color: dashboardPalette.techBlue, desc: 'Similar project detected' },
    { label: 'Budget Anomalies', value: 4, color: dashboardPalette.desertOrange, desc: 'Unusual spending patterns' },
    { label: 'Clarification Likely', value: 6, color: dashboardPalette.seaBlue, desc: 'May need clarification' },
  ]

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <nav className="text-xs text-[#475569] dark:text-slate-200 mb-2">Home › Approver Dashboard</nav>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Approver Workbench</h1>
          <p className="text-sm text-[#475569] dark:text-slate-200 mt-1">{currentCycle.name} • Final ADGE Approval</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[8px] border border-[#E2E8F0] dark:border-white/10 overflow-hidden">
            <button onClick={() => setPlanningTab(true)} className={cn('px-4 py-2 text-sm font-medium transition-colors', planningTab ? 'bg-[#286CFF] text-white' : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-slate-200')}>Planning</button>
            <button onClick={() => setPlanningTab(false)} className={cn('px-4 py-2 text-sm font-medium transition-colors', !planningTab ? 'bg-[#286CFF] text-white' : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-slate-200')}>Allocation</button>
          </div>
          <Button variant="outline" size="sm">Refresh</Button>
          <Button variant="ai" size="sm">
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Summary banner */}
      <div className="rounded-[12px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-4 flex items-center gap-3 flex-wrap shadow-sm">
        <BarChart2 className="h-5 w-5 text-[#286CFF] shrink-0" />
        <p className="text-sm text-[#475569] dark:text-slate-200">
          <span className="font-semibold text-[#0F172A] dark:text-white">54 projects</span> in cycle,{' '}
          <span className="font-semibold text-[#0F172A] dark:text-white">12</span> with Respondent,{' '}
          <span className="font-semibold text-[#0F172A] dark:text-white">9</span> with Reviewer,{' '}
          <span className="font-semibold text-amber-600">3 pending your approval</span>
        </p>
        <span className="ml-auto text-xs text-[#286CFF] font-medium">1 of 54 approved</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: 'With Respondent', value: '12', sub: 'Drafting', color: '#0F172A', iconBg: 'rgba(15, 23, 42, 0.10)', icon: <UserPen className="h-4 w-4" /> },
          { label: 'With Reviewer', value: '9', sub: 'In Review', color: '#0B32A4', iconBg: 'rgba(11, 50, 164, 0.10)', icon: <FileSearch className="h-4 w-4" /> },
          { label: 'Pending My Approval', value: '3', sub: 'Action needed', color: '#773610', iconBg: 'rgba(119, 54, 16, 0.10)', icon: <ClipboardCheck className="h-4 w-4" /> },
          { label: 'Clarification', value: '1', sub: 'Awaiting response', color: '#762518', iconBg: 'rgba(118, 37, 24, 0.10)', icon: <MessageSquareMore className="h-4 w-4" /> },
          { label: 'Approved', value: '1', sub: 'Completed', color: '#701A75', iconBg: 'rgba(112, 26, 117, 0.10)', icon: <CheckCircle className="h-4 w-4" /> },
          { label: 'Ready for DGE', value: '1', sub: '11 Blockers', color: '#0B32A4', iconBg: 'rgba(11, 50, 164, 0.10)', icon: <Users className="h-4 w-4" /> },
          { label: 'Total Requested', value: '', sub: 'All projects', isBudget: true },
        ].map((s, i) => (
          <div key={s.label} className="rounded-[12px] border p-4 shadow-sm animate-fadeInUp min-h-[120px] bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-white/10" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="grid h-full grid-rows-[32px_1fr_20px]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide leading-4 text-[#0F172A] dark:text-white">{s.label}</p>
                {!s.isBudget && s.icon ? (
                  <div
                    className="shrink-0 flex h-8 w-8 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: s.iconBg, color: s.color }}
                  >
                    {s.icon}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center">
                {s.isBudget ? (
                  <CurrencyAmount amount={totalBudget} full className="text-xl font-bold text-[#0F172A] dark:text-white" iconColor={dashboardPalette.techBlue} iconSize={18} />
                ) : (
                  <p className="text-xl font-bold leading-none text-[#0F172A] dark:text-white">{s.value}</p>
                )}
              </div>
              <div className="flex items-end">
                <p className="text-xs leading-4 font-medium text-[#334155] dark:text-slate-200">{s.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cannot Submit alert */}
      <div className="rounded-[12px] border border-red-200 dark:border-red-700/30 bg-red-50 dark:bg-red-900/10 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-white shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-700 dark:text-red-400">Cannot Submit to DGE</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
              9 with Reviewer &bull; 3 pending your approval &bull; 1 awaiting clarification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
              <Bell className="h-4 w-4" />
              Notify Reviewer
            </Button>
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
              <Bell className="h-4 w-4" />
              Notify Respondent
            </Button>
            <Button size="sm" disabled className="opacity-40 cursor-not-allowed">Submit to DGE</Button>
          </div>
        </div>
      </div>

      {/* Projects requiring approval */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects Requiring My Approval</CardTitle>
              <p className="text-sm text-[#475569] dark:text-slate-200 mt-1">Items pending your decision</p>
            </div>
            <button onClick={() => setAttentionCollapsed(!attentionCollapsed)} className="text-xs text-[#286CFF] hover:underline">
              {attentionCollapsed ? '+ Expand' : '- Collapse'}
            </button>
          </div>
        </CardHeader>
        {!attentionCollapsed && (
          <CardContent className="p-0">
            {projects.filter((p) => p.status === 'Submitted to Approver' || p.riskLevel === 'High').slice(0, 4).map((project) => (
              <div
                key={project.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 border-t border-[#F1F5F9] dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors flex-wrap',
                  project.riskLevel === 'High' && 'border-l-4 border-l-red-400'
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-white/10 font-bold font-mono text-sm text-[#0F172A] dark:text-white">
                  {project.aiScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm text-[#0F172A] dark:text-white">{project.name}</p>
                    <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">Pending Approval</span>
                    <RiskBadge risk={project.riskLevel} />
                    {project.documents.length === 0 && (
                      <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 text-xs font-medium">Missing Docs</span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569] dark:text-slate-200">
                    Submitted {project.submittedDate} · Updated {project.lastModified}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs text-[#475569] dark:text-slate-200 uppercase tracking-wide">Requested Budget</p>
                  <CurrencyAmount amount={project.requestedBudget} className="font-semibold text-[#0F172A] dark:text-white" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setClarificationProject(project.name)}>Clarification</Button>
                  <Button variant="outline" size="sm">Review</Button>
                  <Button size="sm" className="text-white" style={{ backgroundColor: dashboardStatusColors.approved }}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 border-t border-[#F1F5F9] dark:border-white/5">
              <Link to="/approver/approval-queue" className="text-sm text-[#286CFF] hover:underline font-medium">View Full Approval Queue ?</Link>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Entity Progress Snapshot</CardTitle>
            <p className="text-sm text-[#475569] dark:text-slate-200">ADGE pipeline at a glance</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={entityProgressData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${dashboardPalette.slateBorder}`, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clarification Monitor</CardTitle>
                <p className="text-sm text-[#475569] dark:text-slate-200">Tracking pending clarifications</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium">2 pending</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clarifications.map((c) => (
                <div key={c.project} className="flex items-center gap-3 rounded-[8px] border border-[#E2E8F0] dark:border-white/10 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{c.project}</p>
                    <p className="text-xs text-[#475569] dark:text-slate-200 mt-0.5">Pending with {c.assignee}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      c.overdue ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      c.status === 'Responded' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    )}>
                      {c.status}
                    </span>
                    <Bell className="h-4 w-4 text-[#94A3B8] dark:text-white cursor-pointer hover:text-[#286CFF]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Risk + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[var(--ai-accent)]" />
            <span className="font-semibold text-[var(--ai-accent)]">AI Risk & Priority Insights</span>
            <span className="ml-auto inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">Coming Soon</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {aiRiskTiles.map((tile) => (
              <div key={tile.label} className="relative rounded-[8px] border border-[var(--border)] bg-white dark:bg-[#1E293B] p-3 opacity-70">
                <p className="text-2xl font-bold font-mono mb-1" style={{ color: tile.color }}>{tile.value}</p>
                <p className="text-xs font-medium text-[#0F172A] dark:text-white">{tile.label}</p>
                <p className="text-xs text-[#475569] dark:text-slate-200">{tile.desc}</p>
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">??</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Approval Queue', badge: 3, href: '/approver/approval-queue', color: 'text-amber-600' },
              { label: 'Submission Readiness', href: '/approver/approval-queue', color: 'text-[#286CFF]' },
              { label: 'Notify Reviewer', href: '/approver/dashboard', color: 'text-[#475569]' },
              { label: 'Notify Respondent', href: '/approver/dashboard', color: 'text-[#475569]' },
              { label: 'High Risk Items', badge: 2, href: '/approver/approval-queue', color: 'text-red-600' },
            ].map((item) => (
              <Link key={item.label} to={item.href}
                className="flex items-center justify-between rounded-[8px] border border-[#E2E8F0] dark:border-white/10 px-4 py-3 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                <span className={cn('text-sm font-medium', item.color)}>{item.label}</span>
                {'badge' in item && item.badge != null && (
                  <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-[#F1F5F9] dark:bg-white/10 text-xs font-bold text-[#0F172A] dark:text-white px-2">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <ClarificationModal
        open={Boolean(clarificationProject)}
        onOpenChange={(open) => {
          if (!open) setClarificationProject(null)
        }}
        projectName={clarificationProject || ''}
        onSubmit={() => {
          showSuccessToast('Clarification raised', 'The reviewer/respondent has been notified and the request is now awaiting response.')
          setClarificationProject(null)
        }}
      />
    </div>
  )
}


