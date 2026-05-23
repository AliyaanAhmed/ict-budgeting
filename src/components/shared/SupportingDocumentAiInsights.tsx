import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupportingDocumentEvaluationSummary } from '@/services/aiSupportingDocumentEvaluationService'

export interface SupportingDocumentAiInsightItem {
  id: string
  file: {
    name: string
    size?: number | null
  }
  status: 'queued' | 'analyzing' | 'complete' | 'error'
  parsedSummary: SupportingDocumentEvaluationSummary | null
  rawSummary?: string
  error?: string | null
}

interface SupportingDocumentAiInsightsProps {
  items: SupportingDocumentAiInsightItem[]
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateText(value: string | undefined, maxLength: number) {
  const text = value?.trim() ?? ''
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}...`
}

function getEvidenceTone(score?: number) {
  if ((score ?? 0) >= 80) {
    return 'border-[#CFE9D9] bg-[#EEF9F1] text-[#16794B] dark:border-[#16794B]/30 dark:bg-[#123123]'
  }
  if ((score ?? 0) >= 60) {
    return 'border-[#FADDA8] bg-[#FFF7E8] text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A280A]'
  }
  return 'border-[#F5C2C7] bg-[#FFF1F3] text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118]'
}

function InsightSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">{title}</p>
      </div>
      {children}
    </div>
  )
}

function AnalyzingState({ fileName }: { fileName: string }) {
  return (
    <div className="relative overflow-hidden rounded-[26px]">
      <div className="pointer-events-none absolute -left-12 top-5 h-32 w-32 rounded-full bg-[#A855F7]/12 blur-3xl animate-[pulse_4.6s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[-2.5rem] top-[-1.5rem] h-36 w-36 rounded-full bg-[#E879F9]/12 blur-3xl animate-[pulse_5.2s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-[-2rem] left-1/3 h-28 w-28 rounded-full bg-[#C084FC]/12 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-y-0 left-[-30%] w-[34%] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(168,85,247,0.16),rgba(255,255,255,0))] blur-2xl animate-[pulse_2.4s_ease-in-out_infinite]" />

      <div className="relative overflow-hidden rounded-[26px] border border-[#E9D5FF]/45 bg-[radial-gradient(circle_at_top_left,#FDF7FF_0%,#F6EDFF_36%,#FFFFFF_75%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,#34124B_0%,#241735_38%,#1E293B_78%)]">
        <div className="pointer-events-none absolute inset-0 rounded-[26px]">
          <div className="absolute inset-0 rounded-[26px] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(168,85,247,0)_0deg,rgba(168,85,247,0)_52deg,rgba(168,85,247,0.18)_72deg,rgba(168,85,247,0.82)_92deg,rgba(232,121,249,0.92)_118deg,rgba(216,180,254,0.88)_144deg,rgba(168,85,247,0.16)_166deg,rgba(168,85,247,0)_196deg,rgba(168,85,247,0)_360deg)] opacity-95 [filter:blur(0.6px)] animate-[spin_8.5s_linear_infinite]" />
          <div className="absolute inset-[2.5px] rounded-[23px] bg-[radial-gradient(circle_at_top_left,#FDF7FF_0%,#F6EDFF_36%,#FFFFFF_75%)] dark:bg-[radial-gradient(circle_at_top_left,#34124B_0%,#241735_38%,#1E293B_78%)]" />
          <div className="absolute inset-[2px] rounded-[24px] border border-white/35 dark:border-white/6" />
        </div>

        <div className="relative px-4 py-5 sm:px-5">
          <div className="pointer-events-none absolute inset-0 opacity-[0.1] dark:opacity-[0.14]">
            <Bot className="absolute left-6 top-8 h-20 w-20 text-[#A855F7] animate-[pulse_4.8s_ease-in-out_infinite]" />
            <Sparkles className="absolute right-8 top-10 h-14 w-14 text-[#E879F9] animate-[pulse_3.8s_ease-in-out_infinite]" />
            <FileText className="absolute right-20 bottom-8 h-16 w-16 text-[#C084FC] animate-[pulse_5.4s_ease-in-out_infinite]" />
            <Layers className="absolute left-1/3 bottom-6 h-12 w-12 text-[#D8B4FE] animate-[pulse_4.2s_ease-in-out_infinite]" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-[linear-gradient(90deg,rgba(168,85,247,0.09),rgba(168,85,247,0))]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#A855F7] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
                <Bot className="h-3.5 w-3.5 animate-pulse" />
                AI Analysis Running
              </div>
              <p className="truncate text-base font-semibold text-[#0F172A] dark:text-white">{fileName}</p>
              <p className="mt-1 max-w-2xl text-sm text-[#64748B] dark:text-slate-300">
                {fileName
                  ? 'Uploading the document, then extracting budget evidence and mapping project fields with confidence signals.'
                  : 'Uploading the document and preparing AI analysis.'}
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 rounded-2xl border border-[#F0D9FF] bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A855F7] text-white shadow-[0_10px_24px_rgba(168,85,247,0.24)]">
                  <div className="absolute inset-0 animate-ping rounded-2xl bg-[#A855F7]/20" />
                  <Sparkles className="relative h-5 w-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Generating structured insights</p>
                  <p className="text-xs text-[#64748B] dark:text-slate-300">The AI is preparing a readable document summary.</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'Uploading the document to SharePoint',
                  'Detecting document profile and purpose',
                  'Building a compact reviewer summary',
                ].map((label, index) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                      {index < 2 ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: `${1 + index * 0.2}s` }} />
                      ) : (
                        <Bot className="h-3.5 w-3.5 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-[#F1E3FF] dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#A855F7,#E879F9)]"
                          style={{
                            width: `${62 + index * 12}%`,
                            animation: 'pulse 1.8s ease-in-out infinite',
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#475569] dark:text-slate-200">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InsightContent({ item }: { item: SupportingDocumentAiInsightItem }) {
  const summary = item.parsedSummary
  const profile = summary?.document_profile
  const fileSummary = summary?.file_summary
  const evidence = summary?.evidence_assessment
  const reviewFlags = summary?.review_flags ?? []

  if (item.status === 'analyzing' || item.status === 'queued') {
    return <AnalyzingState fileName={item.file.name} />
  }

  if (item.status === 'error') {
    return (
      <div className="rounded-2xl border border-[#F5C2C7] bg-[#FFF1F3] p-4 dark:border-[#B42318]/30 dark:bg-[#3B1118]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEE4E2] text-[#B42318] dark:bg-[#B42318]/20 dark:text-[#FCA5A5]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#B42318] dark:text-[#FCA5A5]">AI analysis could not be completed</p>
            <p className="mt-1 text-sm text-[#7A271A] dark:text-[#FECACA]">{item.error ?? 'The document response could not be parsed.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-2xl border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-[#A855F7]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{fileSummary?.short_summary ?? 'Document analysis completed.'}</p>
              <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-slate-200">{evidence?.reason ?? profile?.document_purpose ?? 'The AI extracted structured document insights for review.'}</p>
            </div>
          </div>
        </div>

        <div className={cn('rounded-2xl border p-4', getEvidenceTone(evidence?.evidence_score))}>
          <p className="text-xs font-semibold opacity-80">Evidence Score</p>
          <p className="mt-2 text-3xl font-bold">{evidence?.evidence_score ?? '-'}</p>
          <p className="mt-1 text-sm font-semibold">{evidence?.evidence_quality ?? 'Pending review'}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <InsightSection title="Document Profile" icon={Building2}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Type</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{profile?.document_type ?? '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Date</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{profile?.document_date ?? '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Vendor / Issuer</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{profile?.issuer_or_vendor ?? '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Recipient / Entity</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{profile?.recipient_or_entity ?? '-'}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Purpose</p>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{profile?.document_purpose ?? '-'}</p>
          </div>
        </InsightSection>

        <InsightSection title="File Summary" icon={FileText}>
          {fileSummary?.short_summary && (
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Short Summary</p>
              <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{fileSummary.short_summary}</p>
            </div>
          )}
          <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">{fileSummary?.detailed_summary ?? fileSummary?.short_summary ?? '-'}</p>
        </InsightSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <InsightSection title="Evidence Assessment" icon={ShieldCheck}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Supports Project</p>
              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{evidence?.supports_project ?? '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Quality</p>
              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{evidence?.evidence_quality ?? '-'}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Recommended Action</p>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{evidence?.recommended_user_action ?? evidence?.reason ?? '-'}</p>
          </div>
        </InsightSection>

        <InsightSection title="Review Flags" icon={AlertTriangle}>
          {reviewFlags.length > 0 ? (
            <div className="space-y-2">
              {reviewFlags.map((flag, index) => (
                <div key={`${flag.flag}-${index}`} className="rounded-xl border border-[#F5E1B5] bg-[#FFF8EC] px-3 py-2.5 dark:border-[#B45309]/20 dark:bg-[#38260D]">
                  <p className="text-sm font-semibold text-[#92400E] dark:text-[#FCD34D]">
                    {flag.flag ?? 'Review item'}
                    {flag.severity ? ` • ${flag.severity}` : ''}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7C5A13] dark:text-[#FDE68A]">{flag.reason ?? '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">No review flags were detected for this document.</p>
            </div>
          )}
        </InsightSection>
      </div>
    </div>
  )
}

export function SupportingDocumentAiInsights({ items }: SupportingDocumentAiInsightsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const previousItemsRef = useRef<SupportingDocumentAiInsightItem[]>(items)

  const orderedItems = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const leftActive = left.item.status === 'queued' || left.item.status === 'analyzing'
        const rightActive = right.item.status === 'queued' || right.item.status === 'analyzing'

        if (leftActive !== rightActive) {
          return leftActive ? -1 : 1
        }

        if (leftActive && rightActive) {
          return right.index - left.index
        }

        return left.index - right.index
      })
      .map(({ item }) => item)
  }, [items])

  useEffect(() => {
    const previousItems = previousItemsRef.current
    const previousActiveIds = new Set(
      previousItems
        .filter((item) => item.status === 'queued' || item.status === 'analyzing')
        .map((item) => item.id)
    )
    const currentActiveItem = orderedItems.find(
      (item) => item.status === 'queued' || item.status === 'analyzing'
    )
    const newestActiveItem = orderedItems.find(
      (item) =>
        (item.status === 'queued' || item.status === 'analyzing') &&
        !previousActiveIds.has(item.id)
    )

    if (newestActiveItem) {
      setExpandedId(newestActiveItem.id)
    } else if (previousItems.length === 0 && currentActiveItem) {
      setExpandedId(currentActiveItem.id)
    }

    if (expandedId) {
      const previousExpanded = previousItems.find((item) => item.id === expandedId)
      const currentExpanded = items.find((item) => item.id === expandedId)
      const wasActive =
        previousExpanded?.status === 'queued' || previousExpanded?.status === 'analyzing'
      const isNowComplete = currentExpanded?.status === 'complete'

      if (wasActive && isNowComplete) {
        setExpandedId(null)
      }
    }

    previousItemsRef.current = items
  }, [expandedId, items, orderedItems])

  useEffect(() => {
    if (items.length === 0) {
      setExpandedId(null)
      return
    }

    if (expandedId === null) {
      return
    }

    const stillExists = items.some((item) => item.id === expandedId)
    if (!stillExists) {
      setExpandedId(orderedItems[0]?.id ?? null)
    }
  }, [expandedId, items, orderedItems])

  if (items.length === 0) {
    return null
  }

  const completedCount = items.filter((item) => item.status === 'complete').length
  const analyzingCount = items.filter((item) => item.status === 'analyzing' || item.status === 'queued').length

  return (
    <div className="mt-5 rounded-[28px] border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] via-white to-white p-4 dark:border-white/10 dark:from-[#2A123D] dark:via-[#231735] dark:to-[#1E293B] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 shrink-0 text-[#A855F7]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#0F172A] dark:text-white">AI Document Analyzer</h4>
            <p className="text-sm text-[#64748B] dark:text-slate-300">Each uploaded file is reviewed separately and surfaced as a compact evidence summary.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#E9D5FF] bg-white px-3 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
            {items.length} file{items.length === 1 ? '' : 's'}
          </span>
          <span className="rounded-full border border-[#CFE9D9] bg-[#EEF9F1] px-3 py-1 text-xs font-semibold text-[#16794B] dark:border-[#16794B]/30 dark:bg-[#123123] dark:text-[#86EFAC]">
            {completedCount} analyzed
          </span>
          {analyzingCount > 0 && (
            <span className="rounded-full border border-[#E9D5FF] bg-white px-3 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
              {analyzingCount} in progress
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {orderedItems.map((item) => {
          const isActive = item.status === 'queued' || item.status === 'analyzing'
          const expanded = expandedId === item.id || isActive
          const evidenceScore = item.parsedSummary?.evidence_assessment?.evidence_score
          const collapsedHeadings = [
            item.parsedSummary?.document_profile ? 'Document Profile' : null,
            item.parsedSummary?.file_summary ? 'File Summary' : null,
            item.parsedSummary?.evidence_assessment ? 'Evidence Assessment' : null,
            item.parsedSummary?.review_flags?.length ? 'Review Flags' : null,
          ].filter(Boolean) as string[]

          return (
            <div key={item.id} className="overflow-hidden rounded-[24px] border border-[#F0D9FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
              <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/5">
                <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                  {item.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : item.status === 'error' ? (
                    <AlertTriangle className="h-5 w-5 text-[#B42318] dark:text-[#FCA5A5]" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-[#0F172A] dark:text-white">{item.file.name}</p>
                    {typeof item.file.size === 'number' && item.file.size > 0 && (
                      <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#64748B] dark:bg-white/10 dark:text-slate-300">
                        {formatFileSize(item.file.size)}
                      </span>
                    )}
                  </div>
                  {item.status === 'complete' ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B] dark:text-slate-300">
                      {truncateText(item.parsedSummary?.file_summary?.short_summary, 180) || item.parsedSummary?.document_profile?.document_type || 'Analysis complete'}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                      {item.status === 'error' ? 'Analysis failed' : 'AI is extracting structured evidence'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {typeof evidenceScore === 'number' && item.status === 'complete' && (
                    <span className="hidden rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-bold text-[#A855F7] sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                      {evidenceScore} score
                    </span>
                  )}
                  {item.status === 'complete' && (
                    <button
                      type="button"
                      onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                      className="inline-flex items-center rounded-full border border-[#E9D5FF] bg-white px-3 py-1.5 text-xs font-semibold text-[#A855F7] transition-colors hover:bg-[#FAF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF] dark:hover:bg-white/10"
                    >
                      {expanded ? 'View Collapsed' : 'View Detail'}
                    </button>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="border-t border-[#E9D5FF] px-4 py-4 dark:border-white/10">
                  <InsightContent item={item} />
                </div>
              )}

              {!isActive && !expanded && item.status === 'complete' && (
                <div className="border-t border-[#E9D5FF] px-4 py-3 dark:border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {collapsedHeadings.map((heading) => (
                      <span
                        key={heading}
                        className="rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]"
                      >
                        {heading}
                      </span>
                    ))}
                    {typeof evidenceScore === 'number' && (
                      <span className="rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        Evidence {evidenceScore}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#64748B] dark:text-slate-300">
                    View detail to review the profile, summary, evidence assessment, and review flags.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
