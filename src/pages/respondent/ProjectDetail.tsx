import { useLocation, useParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Edit,
  FileCheck2,
  FileText,
  FolderKanban,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  WalletCards,
  Zap,
} from 'lucide-react'
import { projects } from '@/data/db'
import { StatusBadge, RiskBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { cn } from '@/lib/utils'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
      <p className="mb-1 text-xs font-semibold text-[#64748B] dark:text-slate-200">{label}</p>
      <p className="text-sm font-medium text-[#0F172A] dark:text-white">{value || '-'}</p>
    </div>
  )
}

function SectionIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#BFD8FF] bg-[#EFF6FF] text-[var(--primary)] dark:border-white/10 dark:bg-white/5">
      <Icon className="h-6 w-6" />
    </div>
  )
}

function DetailSection({
  title,
  description,
  icon,
  children,
  action,
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <SectionIcon icon={icon} />
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">{title}</h3>
            {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function AiCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white p-4 shadow-md dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-lg shadow-blue-200 dark:shadow-none">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300">AI-assisted review signal</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function AiSignal({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'amber' }) {
  const toneClass = {
    blue: 'bg-[#E7F5FF] text-[#286CFF] border-[#B0DBFF]',
    green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30',
  }[tone]

  return (
    <div className={cn('rounded-xl border px-3 py-3', toneClass)}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { pathname } = useLocation()
  const project = projects.find((p) => p.id === id) ?? projects[0]

  const isReviewerView = pathname.includes('/reviewer/')
  const isApproverView = pathname.includes('/approver/')
  const isGovernanceView = isReviewerView || isApproverView
  const isDraftOrNeedsWork = project.status === 'Draft' || project.status === 'Needs Work'
  const backHref = isReviewerView ? '/reviewer/review-queue' : isApproverView ? '/approver/approval-queue' : '/respondent/projects'
  const homeHref = isReviewerView ? '/reviewer/dashboard' : isApproverView ? '/approver/dashboard' : '/respondent/dashboard'
  const queueLabel = isReviewerView ? 'Review Queue' : isApproverView ? 'Approval Queue' : 'My Projects'
  const pageTitle = isGovernanceView ? 'Review Budget Submission' : project.name
  const confidence = project.aiScore || 84
  const documentStatus = project.documents.length > 0 ? 'Complete' : 'Missing'

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[#64748B] dark:text-slate-200">
          <Link to={homeHref} className="hover:text-[#286CFF]">Home</Link>
          <span>/</span>
          <Link to={backHref} className="hover:text-[#286CFF]">{queueLabel}</Link>
          <span>/</span>
          <span className="text-[#0F172A] dark:text-white">{project.name}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link to={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] transition-colors hover:text-[#286CFF] dark:text-slate-200">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">{pageTitle}</h1>
              <StatusBadge status={project.status} />
              <RiskBadge risk={project.riskLevel} />
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475569] dark:text-slate-200">{project.name}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
              <p className="text-xs font-semibold text-[#64748B]">AI Confidence</p>
              <p className="text-lg font-bold text-[#286CFF]">{confidence}%</p>
            </div>
            <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
              <p className="text-xs font-semibold text-[#64748B]">Documents</p>
              <p className={cn('text-lg font-bold', documentStatus === 'Complete' ? 'text-green-600' : 'text-amber-600')}>{documentStatus}</p>
            </div>
            <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
              <p className="text-xs font-semibold text-[#64748B]">Budget</p>
              <CurrencyAmount amount={project.requestedBudget} className="justify-center text-lg font-bold text-[#0F172A] dark:text-white" iconSize={15} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-[#DDEBFF] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#286CFF]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
            {isGovernanceView ? 'Reviewer workspace ready' : 'Project submission appears complete and well-documented.'}
          </p>
          <p className="text-xs text-[#64748B] dark:text-slate-200">
            AI detected {project.clarifications.length === 0 ? 'no open clarification issues' : `${project.clarifications.length} clarification item(s)`} and estimates {confidence}% review confidence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <DetailSection title="Budget Item Details" description="Core submission information and strategic alignment." icon={ClipboardCheck}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Initiative / Budget Item Name" value={project.name} />
              <Field label="Strategic Priority" value={project.strategicPriority} />
              <Field label="Strategic Classification" value={project.classification} />
              <Field label="Work Stream / Program" value={project.workStream} />
              <Field label="ICT Budget Item Type" value={project.budgetType} />
              <Field label="Technology (Company)" value={project.technology.company} />
              <Field label="Technology (Product)" value={project.technology.product} />
              <Field label="Category" value={project.category} />
            </div>
          </DetailSection>

          <DetailSection title="Budget Item Timelines" description="Planned delivery window for review and governance assessment." icon={CalendarDays}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Planned Start Date" value={project.plannedStartDate} />
              <Field label="Planned End Date" value={project.plannedEndDate} />
            </div>
          </DetailSection>

          <DetailSection title="Project Summary" description="Business need, expected outcomes, beneficiaries, and delivery approach." icon={FileText}>
            <p className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] p-4 text-sm leading-7 text-[#0F172A] dark:border-white/10 dark:bg-white/5 dark:text-white">{project.summary}</p>
          </DetailSection>

          <DetailSection
            title="Budget Type & Amounts"
            description="Account-level spend breakdown for review validation."
            icon={WalletCards}
            action={
              <div className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-end dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Total Requested Budget</p>
                <CurrencyAmount amount={project.requestedBudget} full className="text-xl font-bold text-[#286CFF]" iconSize={18} />
              </div>
            }
          >
            <div className="mb-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                {project.budgetType}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#DDEBFF] bg-white dark:border-white/10 dark:bg-[#0F172A]/20">
              <table className="w-full text-sm">
                <thead className="hidden bg-[#F8FAFC] md:table-header-group dark:bg-white/5">
                  <tr>
                    {['Account Name', 'Classification', 'EBS Fusion Code', 'Budget Requested', 'AI Check'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold text-[#64748B] dark:text-slate-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {project.budgetItems.map((item) => (
                    <tr key={item.id} className="block border-t border-[#F1F5F9] p-4 dark:border-white/5 md:table-row md:p-0">
                      <td className="block py-2 font-medium text-[#0F172A] dark:text-white md:table-cell md:px-4 md:py-3">{item.accountName}</td>
                      <td className="block py-2 md:table-cell md:px-4 md:py-3">
                        <div className="text-xs text-[#475569] dark:text-slate-200">{item.l1} / {item.l2} / {item.l3}</div>
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', item.classification === 'CapEx' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400')}>
                          {item.classification}
                        </span>
                      </td>
                      <td className="block py-2 text-xs font-mono text-[#475569] dark:text-slate-200 md:table-cell md:px-4 md:py-3">{item.glCode} / {item.ebsFusionCode}</td>
                      <td className="block py-2 font-semibold text-[#0F172A] dark:text-white md:table-cell md:px-4 md:py-3">
                        <CurrencyAmount amount={item.budgetRequested} full className="font-semibold text-[#0F172A] dark:text-white" />
                      </td>
                      <td className="block py-2 md:table-cell md:px-4 md:py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aligned
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailSection>

          <DetailSection title="Supporting Documents" description="Evidence attached to support budget, procurement, and delivery assumptions." icon={FileCheck2}>
            {project.documents.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-700/30 dark:bg-amber-900/10 dark:text-amber-300">
                No documents uploaded. Supporting documents are required before submission.
              </div>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
                    <FileText className="h-5 w-5 shrink-0 text-[#286CFF]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{doc.name}</p>
                      <p className="text-xs text-[#475569] dark:text-slate-200">{doc.size} / Uploaded {doc.uploadedDate}</p>
                    </div>
                    <button className="text-[#475569] transition-colors hover:text-[#286CFF]">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {project.clarifications.length > 0 && (
            <DetailSection title="Clarifications" description="Open and resolved clarification history for this project." icon={MessageSquare}>
              <div className="space-y-4">
                {project.clarifications.map((c) => (
                  <div key={c.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/30 dark:bg-amber-900/10">
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">From {c.raisedBy}</span>
                      <span className={cn('ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300')}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#0F172A] dark:text-white">{c.message}</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">{c.date}</p>
                    {c.response && (
                      <div className="mt-3 rounded-lg border border-green-200 bg-white p-3 dark:border-green-700/30 dark:bg-white/5">
                        <p className="mb-1 text-xs font-semibold text-green-700 dark:text-green-300">Response</p>
                        <p className="text-sm text-[#0F172A] dark:text-white">{c.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {isGovernanceView ? (
            <>
              <AiCard title="AI Review Insights">
                <div className="grid grid-cols-2 gap-3">
                  <AiSignal label="Confidence" value={`${confidence}%`} />
                  <AiSignal label="Risk" value={project.riskLevel} tone={project.riskLevel === 'High' ? 'amber' : 'green'} />
                  <AiSignal label="Documents" value={documentStatus} tone={documentStatus === 'Complete' ? 'green' : 'amber'} />
                  <AiSignal label="Budget Fit" value="Aligned" tone="green" />
                </div>
                <div className="mt-4 rounded-xl border border-[#B0DBFF] bg-white/85 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Summary</p>
                  <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-slate-200">
                    Scope, timeline, and budget structure are generally aligned. Review document evidence and validate line-item assumptions before forwarding.
                  </p>
                </div>
              </AiCard>

              <AiCard title="AI Review Checklist">
                <div className="space-y-2">
                  {[
                    { label: 'Strategic alignment detected', icon: CheckCircle2, ok: true },
                    { label: 'Budget split requires reviewer confirmation', icon: AlertTriangle, ok: false },
                    { label: 'Supporting documents scanned', icon: FileCheck2, ok: project.documents.length > 0 },
                    { label: 'Duplicate-scope risk appears low', icon: CheckCircle2, ok: true },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#DDEBFF] bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <Icon className={cn('h-4 w-4', item.ok ? 'text-green-600' : 'text-amber-600')} />
                        <span className="text-xs font-medium text-[#475569] dark:text-slate-200">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </AiCard>

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <SectionIcon icon={Bot} />
                    <div>
                      <p className="font-semibold text-[#0F172A] dark:text-white">Recommended Actions</p>
                      <p className="text-xs text-[#64748B] dark:text-slate-200">Reviewer decision controls</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full justify-start gap-2 bg-green-600 text-white hover:bg-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Reviewed
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Raise Clarification
                    </Button>
                    <Button className="w-full justify-start gap-2">
                      <Send className="h-4 w-4" />
                      Submit to Approver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-3 p-4">
                  <p className="font-semibold text-[#0F172A] dark:text-white">Submission Details</p>
                  <Field label="Submitted By" value={project.submittedBy} />
                  <Field label="Submitted Date" value={project.submittedDate} />
                  <Field label="Last Modified" value={project.lastModified} />
                </CardContent>
              </Card>

              <AiCard title="AI Review Insights">
                <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">
                  AI will analyze this project for completeness, budget alignment, strategic fit, and risk signals once configured.
                </p>
              </AiCard>

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-2 p-4">
                  <p className="font-semibold text-[#0F172A] dark:text-white">Quick Actions</p>
                  {isDraftOrNeedsWork ? (
                    <>
                      <Button variant="outline" className="w-full justify-start gap-2"><Edit className="h-4 w-4" />Edit Project</Button>
                      <Button className="w-full justify-start gap-2"><Send className="h-4 w-4" />Submit to Reviewer</Button>
                      <Button variant="destructive" className="w-full justify-start gap-2"><Trash2 className="h-4 w-4" />Delete Project</Button>
                    </>
                  ) : (
                    <p className="text-sm text-[#475569] dark:text-slate-200">Project is currently in the governance workflow.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
