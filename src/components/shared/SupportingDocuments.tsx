import { useState } from 'react'
import {
  Archive,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  Paperclip,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WebApiPortalDocument } from '@/services/webApiForPortalService'

// ─── File type → icon + colour ────────────────────────────────────────────────

interface FileTypeStyle {
  Icon: React.ElementType
  color: string
  bg: string
}

function getFileTypeStyle(filetype: string | null): FileTypeStyle {
  const ft = (filetype ?? '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'heic'].includes(ft))
    return { Icon: Image, color: '#0EA5E9', bg: '#E0F2FE' }
  if (ft === 'pdf')
    return { Icon: FileText, color: '#EF4444', bg: '#FEE2E2' }
  if (['doc', 'docx'].includes(ft))
    return { Icon: FileText, color: '#2563EB', bg: '#DBEAFE' }
  if (['xls', 'xlsx', 'csv'].includes(ft))
    return { Icon: FileSpreadsheet, color: '#16A34A', bg: '#DCFCE7' }
  if (['ppt', 'pptx'].includes(ft))
    return { Icon: FileText, color: '#D97706', bg: '#FEF3C7' }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ft))
    return { Icon: Archive, color: '#7C3AED', bg: '#EDE9FE' }
  return { Icon: File, color: '#64748B', bg: '#F1F5F9' }
}

// Truncates the base name to maxBase chars, then appends "...ext" so the
// extension is always visible.  e.g. "ClarificationNeeded...png"
function formatDocName(fullname: string | null, maxBase = 16): string {
  const raw = fullname ?? 'Unknown file'
  const lastDot = raw.lastIndexOf('.')
  const base = lastDot > 0 ? raw.slice(0, lastDot) : raw
  const ext = lastDot > 0 ? raw.slice(lastDot) : ''   // includes the dot, e.g. ".png"

  if (base.length > maxBase) {
    return `${base.slice(0, maxBase)}...${ext}`
  }
  return `${base}${ext}`
}

// ─── Document card ─────────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: WebApiPortalDocument
  isClarificationFile: boolean
  isDeleting: boolean
  onDelete: () => void
}

function DocumentCard({ doc, isClarificationFile, isDeleting, onDelete }: DocumentCardProps) {
  const { Icon, color, bg } = getFileTypeStyle(doc.filetype)
  const ext = (doc.filetype ?? 'file').toUpperCase().slice(0, 5)
  const rawName = doc.fullname ?? doc.relativelocation ?? 'Unknown file'
  const displayName = formatDocName(rawName)
  const url = doc.absoluteurl

  const handleOpen = () => {
    if (url) window.open(url, '_blank', 'noreferrer')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') handleOpen() }}
      className={cn(
        'group relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-150',
        'hover:border-[#286CFF]/40 hover:shadow-md dark:bg-[#1E293B]',
        isClarificationFile
          ? 'border-amber-200 dark:border-amber-700/40'
          : 'border-[#E2E8F0] dark:border-white/10',
      )}
      title={rawName}
    >
      {/* Left — icon + extension badge */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: bg }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <span
          className="rounded px-1 py-0.5 text-[8px] font-bold leading-none"
          style={{ backgroundColor: bg, color }}
        >
          {ext}
        </span>
      </div>

      {/* Right — name + clarification badge */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-tight text-[#0F172A] dark:text-white">
          {displayName}
        </p>
        {isClarificationFile && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Paperclip className="h-2 w-2" />
            Clarification
          </span>
        )}
      </div>

      {/* Delete button — appears on hover */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100',
          isDeleting
            ? 'cursor-not-allowed bg-red-50 text-red-300'
            : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white',
        )}
        title={isDeleting ? 'Deleting…' : 'Delete file'}
      >
        {isDeleting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </button>
    </div>
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function DocSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#1E293B]">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-[#F1F5F9] dark:bg-white/10" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-2.5 w-3/4 animate-pulse rounded bg-[#F1F5F9] dark:bg-white/10" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-[#F1F5F9] dark:bg-white/10" />
      </div>
    </div>
  )
}

// ─── Public component ──────────────────────────────────────────────────────────

export interface SupportingDocumentsProps {
  docs: WebApiPortalDocument[]
  loading: boolean
  clarificationFileUrls: Set<string>
  onDelete: (doc: WebApiPortalDocument) => Promise<void>
}

export function SupportingDocuments({
  docs,
  loading,
  clarificationFileUrls,
  onDelete,
}: SupportingDocumentsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (doc: WebApiPortalDocument) => {
    if (deletingId) return
    setDeletingId(doc.sharepointdocumentid)
    try {
      await onDelete(doc)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <DocSkeleton key={i} />)}
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] py-8 text-center dark:border-white/10 dark:bg-white/5">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF]">
          <Paperclip className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-[#475569] dark:text-slate-200">No documents attached</p>
        <p className="mt-1 text-xs text-[#94A3B8]">Files uploaded to this budget will appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {docs.map((doc) => (
        <DocumentCard
          key={doc.sharepointdocumentid}
          doc={doc}
          isClarificationFile={Boolean(doc.absoluteurl && clarificationFileUrls.has(doc.absoluteurl))}
          isDeleting={deletingId === doc.sharepointdocumentid}
          onDelete={() => void handleDelete(doc)}
        />
      ))}
    </div>
  )
}
