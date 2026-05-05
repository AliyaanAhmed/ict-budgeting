import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, FileText, MessageSquare, Clock, Edit, Trash2, Send } from 'lucide-react'
import { projects } from '@/data/db'
import { StatusBadge, RiskBadge } from '@/components/shared/StatusBadge'
import { AiPlaceholderCard } from '@/components/shared/AiPlaceholderCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#475569] dark:text-slate-200 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-[#0F172A] dark:text-white">{value || '—'}</p>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const project = projects.find((p) => p.id === id) ?? projects[0]

  const isDraftOrNeedsWork = project.status === 'Draft' || project.status === 'Needs Work'

  return (
    <div className="max-w-[1200px] space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#475569] dark:text-slate-200">
        <Link to="/respondent/dashboard" className="hover:text-[#286CFF]">Home</Link>
        {' › '}
        <Link to="/respondent/projects" className="hover:text-[#286CFF]">My Projects</Link>
        {' › '}
        <span className="text-[#0F172A] dark:text-white">{project.name}</span>
      </nav>

      {/* Title */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link to="/respondent/projects" className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#286CFF] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">{project.name}</h1>
            <StatusBadge status={project.status} />
            <RiskBadge risk={project.riskLevel} />
          </div>
        </div>
      </div>

      {/* AI Summary banner */}
      <div className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Ready for Review</span>
        </div>
        <span className="text-[#94A3B8]">·</span>
        <span className="text-sm text-[#475569] dark:text-slate-200">{project.aiScore}% Confidence</span>
        <span className="text-[#94A3B8]">·</span>
        <span className="text-sm text-[#475569] dark:text-slate-200">
          {project.clarifications.length === 0 ? '0 Issues Found' : `${project.clarifications.length} issue(s)`}
        </span>
        <span className="ml-auto text-xs text-[#475569] dark:text-slate-200">Project submission appears complete and well-documented.</span>
      </div>

      {/* Two-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Budget Item Details */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Initiative / Budget Item Name" value={project.name} />
                <Field label="Strategic Priority" value={project.strategicPriority} />
                <Field label="Strategic Classification" value={project.classification} />
                <Field label="Work Stream / Program" value={project.workStream} />
                <Field label="ICT Budget Item Type" value={project.budgetType} />
                <Field label="Technology (Company)" value={project.technology.company} />
                <Field label="Technology (Product)" value={project.technology.product} />
                <Field label="Category" value={project.category} />
              </div>
            </CardContent>
          </Card>

          {/* Timelines */}
          <Card>
            <CardHeader><CardTitle>Budget Item Timelines</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Planned Start Date" value={project.plannedStartDate} />
                <Field label="Planned End Date" value={project.plannedEndDate} />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Summary</CardTitle>
                <span className="text-xs text-[#286CFF] font-medium cursor-pointer hover:underline">✏ Clear & Detail</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#0F172A] dark:text-white leading-relaxed">{project.summary}</p>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Budget Type & Amounts</CardTitle>
                <div className="text-end">
                  <p className="text-xs text-[#475569] dark:text-slate-200">Total Requested Budget</p>
                  <CurrencyAmount amount={project.requestedBudget} full className="text-xl font-bold text-[#286CFF]" iconSize={18} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5 pb-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 text-xs font-medium">
                  {project.budgetType}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] dark:bg-white/5">
                  <tr>
                    {['Account Name', 'Classification', 'EBS Fusion Code', 'Budget Requested', 'AI'].map((h) => (
                      <th key={h} className="whitespace-nowrap text-start py-2.5 px-5 text-xs font-semibold text-[#475569] dark:text-slate-200 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {project.budgetItems.map((item) => (
                    <tr key={item.id} className="border-t border-[#F1F5F9] dark:border-white/5">
                      <td className="py-3 px-5 font-medium text-[#0F172A] dark:text-white">{item.accountName}</td>
                      <td className="py-3 px-5">
                        <div className="text-xs text-[#475569] dark:text-slate-200">
                          {item.l1} / {item.l2} / {item.l3}
                        </div>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          item.classification === 'CapEx' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        )}>
                          {item.classification}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-xs font-mono text-[#475569] dark:text-slate-200">
                        {item.glCode} / {item.ebsFusionCode}
                      </td>
                      <td className="py-3 px-5 font-semibold text-[#0F172A] dark:text-white">
                        <CurrencyAmount amount={item.budgetRequested} full className="font-semibold text-[#0F172A] dark:text-white" />
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600">
                          <span className="text-xs">✓</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5">
                    <td className="py-3 px-5 font-semibold text-[#0F172A] dark:text-white">Total</td>
                    <td className="py-3 px-5" />
                    <td className="py-3 px-5" />
                    <td className="py-3 px-5 font-bold text-[#286CFF]">
                      <CurrencyAmount amount={project.requestedBudget} full className="font-bold text-[#286CFF]" />
                    </td>
                    <td className="py-3 px-5" />
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Supporting Documents</CardTitle>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  project.documents.length > 0
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                )}>
                  {project.documents.length > 0 ? `Documents Complete • ${project.documents.length} files` : 'Documents Missing'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {project.documents.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No documents uploaded. Supporting documents are required before submission.</p>
              ) : (
                <div className="space-y-2">
                  {project.documents.map((doc) => (
                    <div key={doc.name} className="flex items-center gap-3 rounded-[8px] border border-[#E2E8F0] dark:border-white/10 p-3">
                      <FileText className="h-5 w-5 text-[#286CFF] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-[#475569] dark:text-slate-200">{doc.size} · Uploaded {doc.uploadedDate}</p>
                      </div>
                      <button className="text-[#475569] hover:text-[#286CFF] transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clarifications */}
          {project.clarifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Clarifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.clarifications.map((c) => (
                    <div key={c.id} className="relative pl-4 border-l-2 border-amber-400">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">From {c.raisedBy}</span>
                        <span className={cn(
                          'ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          c.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        )}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#0F172A] dark:text-white">{c.message}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">{c.date}</p>
                      {c.response && (
                        <div className="mt-3 pl-3 border-l border-green-300">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Response</p>
                          <p className="text-sm text-[#0F172A] dark:text-white">{c.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Submission Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Submitted By" value={project.submittedBy} />
              <Field label="Submitted Date" value={project.submittedDate} />
              <Field label="Last Modified" value={project.lastModified} />
            </CardContent>
          </Card>

          <AiPlaceholderCard
            title="AI Review Insights"
            description="AI will analyze this project for completeness, budget alignment, strategic fit, and risk signals once configured."
          />

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isDraftOrNeedsWork && (
                <>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Project
                  </Button>
                  <Button variant="default" className="w-full justify-start gap-2">
                    <Send className="h-4 w-4" />
                    Submit to Reviewer
                  </Button>
                  <Button variant="destructive" className="w-full justify-start gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Project
                  </Button>
                </>
              )}
              {!isDraftOrNeedsWork && (
                <p className="text-sm text-[#475569] dark:text-slate-200">
                  {project.status === 'Submitted to Reviewer' && 'Project is pending Reviewer action.'}
                  {project.status === 'Submitted to Approver' && 'Project is pending Approver action.'}
                  {project.status === 'Clarification Required' && 'Please respond to the clarification request.'}
                  {project.status === 'Approved' && 'Project has been approved.'}
                </p>
              )}
              {project.status === 'Clarification Required' && (
                <Button variant="default" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Respond to Clarification
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

