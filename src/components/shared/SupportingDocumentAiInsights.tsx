import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
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

function toDisplayText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter(Boolean).join(', ')
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.text_template === 'string') return record.text_template.trim()
    if (typeof record.text === 'string') return record.text.trim()
    if (typeof record.value === 'string') return record.value.trim()
  }
  return ''
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateText(value: unknown, maxLength: number) {
  const text = toDisplayText(value)
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

function getFileTypeIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.trim().toLowerCase() ?? ''

  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'heic'].includes(extension)) {
    return { Icon: FileImage, color: '#0EA5E9', bg: '#E0F2FE', label: 'IMG' }
  }
  if (extension === 'pdf') {
    return { Icon: FileText, color: '#DC2626', bg: '#FEE2E2', label: 'PDF' }
  }
  if (['doc', 'docx', 'txt'].includes(extension)) {
    return { Icon: FileText, color: '#2563EB', bg: '#DBEAFE', label: 'DOC' }
  }
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return { Icon: FileSpreadsheet, color: '#16A34A', bg: '#DCFCE7', label: 'XLS' }
  }

  return { Icon: File, color: '#64748B', bg: '#F1F5F9', label: extension.toUpperCase().slice(0, 3) || 'FILE' }
}

function EvidenceRadial({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(100, score))
  const circumference = 2 * Math.PI * 16
  const strokeOffset = circumference - (normalized / 100) * circumference
  const strokeColor = normalized >= 80 ? '#22C55E' : normalized >= 60 ? '#F59E0B' : '#EF4444'
  const tint = normalized >= 80 ? '#EEF9F1' : normalized >= 60 ? '#FFF7E8' : '#FFF1F3'

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full border"
      style={{ borderColor: `${strokeColor}33`, backgroundColor: tint }}
      aria-label={`Evidence score ${normalized}`}
    >
      <div className="relative h-10 w-10">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="4" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: strokeColor }}>
          {normalized}
        </div>
      </div>
    </div>
  )
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
  const { Icon, color, bg, label } = getFileTypeIcon(fileName)

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#E9D5FF]/60 bg-[radial-gradient(circle_at_top_left,#FDF7FF_0%,#F8F2FF_40%,#FFFFFF_82%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,#34124B_0%,#241735_42%,#1E293B_82%)]">
      <div className="pointer-events-none absolute inset-0 rounded-[22px]">
        <div className="absolute inset-0 rounded-[22px] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(168,85,247,0)_0deg,rgba(168,85,247,0)_48deg,rgba(168,85,247,0.14)_68deg,rgba(168,85,247,0.88)_92deg,rgba(232,121,249,0.95)_118deg,rgba(216,180,254,0.85)_145deg,rgba(168,85,247,0.16)_172deg,rgba(168,85,247,0)_198deg,rgba(168,85,247,0)_360deg)] opacity-95 [filter:blur(0.4px)] animate-[spin_9s_linear_infinite]" />
        <div className="absolute inset-[1.5px] rounded-[20px] bg-[radial-gradient(circle_at_top_left,#FDF7FF_0%,#F8F2FF_40%,#FFFFFF_82%)] dark:bg-[radial-gradient(circle_at_top_left,#34124B_0%,#241735_42%,#1E293B_82%)]" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-[linear-gradient(90deg,rgba(168,85,247,0.08),rgba(168,85,247,0))]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-44 bg-[linear-gradient(270deg,rgba(168,85,247,0.08),rgba(168,85,247,0))]" />
      <div className="relative flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: bg }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI Analyzing
            </div>
            <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{fileName}</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-[#F0D9FF] bg-white/80 px-3 py-2 text-xs font-medium text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF] sm:flex">
          <Bot className="h-3.5 w-3.5 animate-pulse" />
          Preparing insights
        </div>
        <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 opacity-[0.12] sm:block dark:opacity-[0.16]">
          <div className="relative h-16 w-24">
            <Sparkles className="absolute right-1 top-0 h-5 w-5 text-[#A855F7] animate-[pulse_4.2s_ease-in-out_infinite]" />
            <Bot className="absolute right-10 top-5 h-7 w-7 text-[#C084FC] animate-[pulse_5s_ease-in-out_infinite]" />
            <FileText className="absolute right-0 bottom-0 h-6 w-6 text-[#E879F9] animate-[pulse_4.6s_ease-in-out_infinite]" />
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
  const shortSummary = toDisplayText(fileSummary?.short_summary)
  const detailedSummary = toDisplayText(fileSummary?.detailed_summary)
  const evidenceReason = toDisplayText(evidence?.reason)
  const documentPurpose = toDisplayText(profile?.document_purpose)

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
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{shortSummary || 'Document analysis completed.'}</p>
              <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-slate-200">{evidenceReason || documentPurpose || 'The AI extracted structured document insights for review.'}</p>
            </div>
          </div>
        </div>

        <div className={cn('rounded-2xl border p-4', getEvidenceTone(evidence?.evidence_score))}>
          <p className="text-xs font-semibold opacity-80">Evidence Score</p>
          <p className="mt-2 text-3xl font-bold">{evidence?.evidence_score ?? '-'}</p>
          <p className="mt-1 text-sm font-semibold">{toDisplayText(evidence?.evidence_quality) || 'Pending review'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <InsightSection title="Document Profile" icon={Sparkles}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Type</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{toDisplayText(profile?.document_type) || '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Date</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{toDisplayText(profile?.document_date) || '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Vendor / Issuer</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{toDisplayText(profile?.issuer_or_vendor) || '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Recipient / Entity</p>
              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{toDisplayText(profile?.recipient_or_entity) || '-'}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Purpose</p>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{documentPurpose || '-'}</p>
          </div>
        </InsightSection>

        <InsightSection title="File Summary" icon={Sparkles}>
          {shortSummary && (
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Short Summary</p>
              <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{shortSummary}</p>
            </div>
          )}
          <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">{detailedSummary || shortSummary || '-'}</p>
        </InsightSection>
      </div>

      <div className="space-y-4">
        <InsightSection title="Evidence Assessment" icon={Sparkles}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Supports Project</p>
              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{toDisplayText(evidence?.supports_project) || '-'}</p>
            </div>
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Quality</p>
              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{toDisplayText(evidence?.evidence_quality) || '-'}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Recommended Action</p>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{toDisplayText(evidence?.recommended_user_action) || toDisplayText(evidence?.reason) || '-'}</p>
          </div>
        </InsightSection>

        <InsightSection title="Review Flags" icon={Sparkles}>
          {reviewFlags.length > 0 ? (
            <div className="space-y-2">
              {reviewFlags.map((flag, index) => (
                <div key={`${flag.flag}-${index}`} className="rounded-xl border border-[#F5E1B5] bg-[#FFF8EC] px-3 py-2.5 dark:border-[#B45309]/20 dark:bg-[#38260D]">
                  <p className="text-sm font-semibold text-[#92400E] dark:text-[#FCD34D]">
                    {toDisplayText(flag.flag) || 'Review item'}
                    {toDisplayText(flag.severity) ? ` • ${toDisplayText(flag.severity)}` : ''}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7C5A13] dark:text-[#FDE68A]">{toDisplayText(flag.reason) || '-'}</p>
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
          <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Document Analyzer</p>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">
              Each uploaded file is reviewed separately and surfaced as a compact evidence summary.
            </p>
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
          const { Icon, color, bg, label } = getFileTypeIcon(item.file.name)

          if (isActive) {
            return (
              <div key={item.id} className="overflow-hidden rounded-[24px] border border-[#F0D9FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
                <InsightContent item={item} />
              </div>
            )
          }

          return (
            <div key={item.id} className="overflow-hidden rounded-[24px] border border-[#F0D9FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
              <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/5">
                <div
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                  {item.status === 'complete' ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#0F172A]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    </span>
                  ) : item.status === 'error' ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#0F172A]">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#B42318] dark:text-[#FCA5A5]" />
                    </span>
                  ) : (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#0F172A]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A855F7] dark:text-[#E9D5FF]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-[#0F172A] dark:text-white">{item.file.name}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold leading-none"
                      style={{ backgroundColor: bg, color }}
                    >
                      {label}
                    </span>
                    {typeof item.file.size === 'number' && item.file.size > 0 && (
                      <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#64748B] dark:bg-white/10 dark:text-slate-300">
                        {formatFileSize(item.file.size)}
                      </span>
                    )}
                  </div>
                  {item.status === 'complete' ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B] dark:text-slate-300">
                      {truncateText(item.parsedSummary?.file_summary?.short_summary, 180) || toDisplayText(item.parsedSummary?.document_profile?.document_type) || 'Analysis complete'}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                      {item.status === 'error' ? 'Analysis failed' : 'AI is extracting structured evidence'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {typeof evidenceScore === 'number' && item.status === 'complete' && (
                    <EvidenceRadial score={evidenceScore} />
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
