import { useState } from 'react'
import { Archive, CheckCircle2, ChevronDown, ChevronUp, ChevronsUp, File, FileSpreadsheet, FileText, Image, Lock, LockKeyhole, MessageCircle, Paperclip, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentIconPicker } from '@/components/shared/AttachmentIconPicker'
import { cn } from '@/lib/utils'
import type { Clarification, ClarificationReply } from '@/data/db'
import type { WebApiPortalDocument } from '@/services/webApiForPortalService'

interface ClarificationThreadProps {
  clarifications: Clarification[]
  currentRole: 'Respondent' | 'Reviewer' | 'Approver'
  isEditMode: boolean
  onReply: (clarificationId: string, message: string, files?: File[]) => void
  onClose: (clarificationId: string) => void
  sharepointDocs?: WebApiPortalDocument[]
}

const PAGE_SIZE = 3

const ROLE_STYLE = {
  Reviewer: {
    headerBg: 'bg-[#EFF6FF] dark:bg-[#0D1E35]',
    badge: 'bg-[#DBEAFE] text-[#1D4ED8] dark:bg-blue-900/40 dark:text-blue-300',
    avatarBg: 'bg-[#286CFF]',
    bubble: 'border border-[#BFD8FF] bg-white text-[#0F172A] dark:border-[#286CFF]/25 dark:bg-[#0D1E35] dark:text-white',
  },
  Approver: {
    headerBg: 'bg-[#F5F3FF] dark:bg-[#130F26]',
    badge: 'bg-[#EDE9FE] text-[#5B21B6] dark:bg-violet-900/40 dark:text-violet-300',
    avatarBg: 'bg-[#7C3AED]',
    bubble: 'border border-[#C4B5FD] bg-white text-[#0F172A] dark:border-violet-700/25 dark:bg-[#130F26] dark:text-white',
  },
  Respondent: {
    headerBg: 'bg-[#F0FDF4] dark:bg-[#052E16]',
    badge: 'bg-[#DCFCE7] text-[#166534] dark:bg-emerald-900/40 dark:text-emerald-300',
    avatarBg: 'bg-[#059669]',
    bubble: 'border border-[#A7F3D0] bg-white text-[#0F172A] dark:border-emerald-700/25 dark:bg-[#052E16] dark:text-white',
  },
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatDisplayDate(value: string | undefined) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toSortTime(value: string | undefined) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getFileUrls(value: string | undefined) {
  return (value ?? '')
    .split(/[,\n]/)
    .map((url) => url.trim())
    .filter(Boolean)
}

function getFileIconForType(filetype: string | null): { Icon: React.ElementType; color: string; bg: string } {
  const ft = (filetype ?? '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'heic'].includes(ft)) return { Icon: Image, color: '#0EA5E9', bg: '#E0F2FE' }
  if (ft === 'pdf') return { Icon: FileText, color: '#EF4444', bg: '#FEE2E2' }
  if (['doc', 'docx'].includes(ft)) return { Icon: FileText, color: '#2563EB', bg: '#DBEAFE' }
  if (['xls', 'xlsx', 'csv'].includes(ft)) return { Icon: FileSpreadsheet, color: '#16A34A', bg: '#DCFCE7' }
  if (['ppt', 'pptx'].includes(ft)) return { Icon: FileText, color: '#D97706', bg: '#FEF3C7' }
  if (['zip', 'rar', '7z'].includes(ft)) return { Icon: Archive, color: '#7C3AED', bg: '#EDE9FE' }
  return { Icon: File, color: '#64748B', bg: '#F1F5F9' }
}

function getFilenameFromUrl(url: string): string {
  try {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1] || url)
  } catch {
    return url
  }
}

function FileChip({ url, docs }: { url: string; docs: WebApiPortalDocument[] }) {
  const matchedDoc = docs.find((d) => d.absoluteurl === url)
  const filetype = matchedDoc?.filetype ?? url.split('.').pop() ?? null
  const name = matchedDoc?.fullname ?? getFilenameFromUrl(url)
  const { Icon, color, bg } = getFileIconForType(filetype)
  const ext = (filetype ?? 'file').toUpperCase().slice(0, 4)

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-[140px] items-center gap-1.5 rounded-xl border border-[#DDEBFF] bg-white px-2 py-1.5 shadow-sm transition-all hover:border-[#286CFF]/50 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]"
      title={name}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded" style={{ backgroundColor: bg }}>
        <Icon className="h-3 w-3" style={{ color }} />
      </div>
      <span className="rounded px-1 py-0.5 text-[8px] font-bold" style={{ backgroundColor: bg, color }}>
        {ext}
      </span>
      <span className="truncate text-[10px] font-medium text-[#0F172A] dark:text-white">{name}</span>
    </a>
  )
}

function ReplyBubble({ reply, sharepointDocs }: { reply: ClarificationReply; sharepointDocs: WebApiPortalDocument[] }) {
  const style = ROLE_STYLE[reply.fromRole]
  const fileUrls = getFileUrls(reply.fileUrl)

  return (
    <div className="flex gap-2.5">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white', style.avatarBg)}>
        {initials(reply.fromName)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-[#0F172A] dark:text-white">{reply.fromName}</span>
          <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-medium', style.badge)}>
            {reply.fromRoleLabel ?? reply.fromRole}
          </span>
          <span className="text-[#94A3B8]">{formatDisplayDate(reply.date)}</span>
        </div>
        <div className={cn('rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-[1.6] shadow-sm', style.bubble)}>
          {reply.message}
        </div>
        {fileUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {fileUrls.map((url, index) => (
              <FileChip key={`${url}-${index}`} url={url} docs={sharepointDocs} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClarificationCard({
  clarification,
  index,
  currentRole,
  isEditMode,
  isExpanded,
  onToggle,
  onReply,
  onClose,
  sharepointDocs,
}: {
  clarification: Clarification
  index: number
  currentRole: 'Respondent' | 'Reviewer' | 'Approver'
  isEditMode: boolean
  isExpanded: boolean
  onToggle: () => void
  onReply: (msg: string, files?: File[]) => void
  onClose: () => void
  sharepointDocs: WebApiPortalDocument[]
}) {
  const [replyText, setReplyText] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [isReplying, setIsReplying] = useState(false)

  const style = ROLE_STYLE[clarification.raisedBy]
  const isOpen = clarification.status === 'Open'
  const isRaiser = currentRole === clarification.raisedBy
  const canReply = isOpen
  const canClose = isOpen && isRaiser
  const replyCount = clarification.replies.length
  const clarificationFileUrls = getFileUrls(clarification.fileUrl)
  const autoExpandedNewClarification = isOpen && replyCount === 0
  const effectiveExpanded = isExpanded || autoExpandedNewClarification
  const sortedReplies = [...clarification.replies].sort((left, right) => toSortTime(right.date) - toSortTime(left.date))

  const handleSend = () => {
    const msg = replyText.trim()
    if (!msg) return
    onReply(msg, replyFiles)
    setReplyText('')
    setReplyFiles([])
    setIsReplying(false)
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white transition-all duration-200 dark:bg-[#1E293B]',
        isOpen ? 'border-[#DDEBFF] dark:border-white/10' : 'border-[#E2E8F0] dark:border-white/5',
      )}
    >
      <div className={cn('px-4 py-3', style.headerBg)}>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/60 text-[10px] font-bold text-[#475569] dark:bg-white/10 dark:text-slate-300">
            {index + 1}
          </span>

          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', style.avatarBg)}>
            {initials(clarification.raisedByName)}
          </div>

          <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[#0F172A] dark:text-white sm:inline">
            {clarification.raisedByName}
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', style.badge)}>
            {clarification.raisedByLabel ?? clarification.raisedBy}
          </span>
          <span className="text-xs text-[#94A3B8]">{formatDisplayDate(clarification.date)}</span>
          {clarification.dueDate && (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#475569] dark:bg-white/10 dark:text-slate-300">
              Due {formatDisplayDate(clarification.dueDate)}
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {replyCount > 0 && (
              <span className="hidden items-center gap-1 text-[11px] font-medium text-[#64748B] dark:text-slate-400 sm:flex">
                <MessageCircle className="h-3 w-3" />
                {replyCount}
              </span>
            )}
            {canClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose() }}
                title="Mark this clarification as resolved and close the thread"
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 transition-colors hover:border-orange-400 hover:bg-orange-100 hover:text-orange-700 dark:border-orange-700/30 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:border-orange-600/50 dark:hover:bg-orange-900/30"
              >
                <LockKeyhole className="h-3 w-3" />
                Close thread
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'w-full px-4 py-3 text-left',
          !autoExpandedNewClarification && 'transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/[0.03]'
        )}
      >
        <p className={cn('text-sm leading-[1.65] text-[#0F172A] dark:text-white', !effectiveExpanded && 'line-clamp-2')}>
          {clarification.message}
        </p>
        {clarificationFileUrls.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {clarificationFileUrls.map((url, fileIndex) => (
              <FileChip key={`${url}-${fileIndex}`} url={url} docs={sharepointDocs} />
            ))}
          </span>
        )}
        {!autoExpandedNewClarification && <button onClick={onToggle} className="mt-2 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#286CFF] dark:text-[#4F98FF]">
            {effectiveExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                {replyCount > 0 ? `View thread · ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'View full message'}
              </>
            )}
          </span>
          {!effectiveExpanded && !isOpen && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
              <Lock className="h-3 w-3" />
              Closed
            </span>
          )}
        </button>}
      </div>

      {effectiveExpanded && (
        <div style={{ animation: 'fadeInUp 0.18s ease-out' }}>
          {replyCount > 0 && (
            <div className="space-y-3 border-t border-[#F1F5F9] px-4 py-3.5 dark:border-white/5">
              {sortedReplies.map((reply) => (
                <ReplyBubble key={reply.id} reply={reply} sharepointDocs={sharepointDocs} />
              ))}
            </div>
          )}

          {!isOpen && (
            <div className="flex items-center gap-2 border-t border-[#F1F5F9] px-4 py-2.5 dark:border-white/5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="text-xs text-[#94A3B8]">
                Closed {clarification.closedAt ? `on ${formatDisplayDate(clarification.closedAt)}` : ''} · no further replies accepted.
              </p>
            </div>
          )}

          {canReply && (
            <div className="border-t border-[#F1F5F9] px-4 pb-4 pt-3 dark:border-white/5">
              {!isReplying ? (
                <button
                  onClick={() => setIsReplying(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] px-3 py-2 text-xs font-semibold text-[#286CFF] transition-all hover:border-[#286CFF] hover:bg-[#EFF6FF] dark:border-white/10 dark:bg-white/5 dark:text-[#4F98FF]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {currentRole === 'Respondent' ? 'Write Response' : 'Add Reply'}
                </button>
              ) : (
                <div className="space-y-2" style={{ animation: 'fadeInUp 0.15s ease-out' }}>
                  <Textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
                    placeholder={currentRole === 'Respondent' ? 'Write your response...' : 'Add a follow-up comment...'}
                    className="resize-none rounded-xl border-[#D9E6F7] bg-white text-sm focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#0F172A]/30"
                    autoFocus
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <AttachmentIconPicker files={replyFiles} onChange={setReplyFiles} maxSizeMB={20} />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSend}
                      disabled={!replyText.trim()}
                      className="h-9 gap-1.5 rounded-xl text-white disabled:opacity-50"
                      style={{ backgroundColor: '#286CFF' }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {currentRole === 'Respondent' ? 'Submit Response' : 'Send Reply'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsReplying(false); setReplyText(''); setReplyFiles([]) }}
                      className="h-9 rounded-xl text-[#64748B]"
                    >
                      Cancel
                    </Button>
                    <span className="hidden text-[10px] text-[#94A3B8] sm:block">Ctrl/Cmd + Enter to send</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ClarificationThread({
  clarifications,
  currentRole,
  isEditMode,
  onReply,
  onClose,
  sharepointDocs = [],
}: ClarificationThreadProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const openList = [...clarifications]
    .filter((clarification) => clarification.status === 'Open')
    .sort((left, right) => toSortTime(right.date) - toSortTime(left.date))
  const closedList = [...clarifications]
    .filter((clarification) => clarification.status === 'Closed')
    .sort((left, right) => toSortTime(right.closedAt ?? right.date) - toSortTime(left.closedAt ?? left.date))

  const items = activeTab === 'open' ? openList : closedList
  const visible = items.slice(0, visibleCount)
  const remaining = Math.max(0, items.length - visibleCount)

  const switchTab = (tab: 'open' | 'closed') => {
    setActiveTab(tab)
    setVisibleCount(PAGE_SIZE)
    setExpandedIds(new Set())
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
        {([
          { key: 'open' as const, label: 'Open', count: openList.length, dot: true },
          { key: 'closed' as const, label: 'Closed', count: closedList.length, dot: false },
        ]).map(({ key, label, count, dot }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150',
                active
                  ? key === 'open'
                    ? 'bg-[#ECFDF5] text-[#047857] shadow-sm ring-1 ring-[#A7F3D0] dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700/30'
                    : 'bg-[#FFF7ED] text-[#C2410C] shadow-sm ring-1 ring-[#FED7AA] dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-700/30'
                  : key === 'open'
                    ? 'bg-white text-[#047857] hover:bg-[#ECFDF5] dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-emerald-900/15'
                    : 'bg-white text-[#C2410C] hover:bg-[#FFF7ED] dark:bg-white/5 dark:text-orange-300 dark:hover:bg-orange-900/15',
              )}
            >
              {dot ? (
                <span className={cn('h-2 w-2 rounded-full', active ? 'bg-[#10B981]' : 'bg-[#6EE7B7]')} />
              ) : (
                <Lock className={cn('h-3.5 w-3.5', active ? 'text-[#C2410C]' : 'text-[#F97316]')} />
              )}
              {label}
              <span
                className={cn(
                  'min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-xs font-bold transition-colors',
                  active
                    ? key === 'open'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : key === 'open'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] py-8 text-center dark:border-white/10 dark:bg-white/5">
          {activeTab === 'open' ? (
            <>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#475569] dark:text-slate-200">No open clarifications</p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {currentRole === 'Respondent'
                  ? 'No pending clarifications from Reviewer or Approver.'
                  : 'Use Raise Clarification in the actions panel to start a thread.'}
              </p>
            </>
          ) : (
            <>
              <Lock className="mb-2 h-8 w-8 text-[#CBD5E1]" />
              <p className="text-sm font-semibold text-[#475569] dark:text-slate-200">No closed clarifications</p>
              <p className="mt-1 text-xs text-[#94A3B8]">Resolved threads will appear here once closed.</p>
            </>
          )}
        </div>
      )}

      {expandedIds.size > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setExpandedIds(new Set())}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
            Collapse all
          </button>
        </div>
      )}

      {visible.length > 0 && (
        <div className="space-y-2.5">
          {visible.map((clarification, index) => (
            <ClarificationCard
              key={clarification.id}
              clarification={clarification}
              index={index}
              currentRole={currentRole}
              isEditMode={isEditMode}
              isExpanded={expandedIds.has(clarification.id)}
              onToggle={() => toggleExpand(clarification.id)}
              onReply={(message, files) => onReply(clarification.id, message, files)}
              onClose={() => onClose(clarification.id)}
              sharepointDocs={sharepointDocs}
            />
          ))}
        </div>
      )}

      {remaining > 0 && (
        <button
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#DDEBFF] bg-transparent py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:text-[#286CFF] dark:border-white/10 dark:text-slate-400 dark:hover:border-white/20 dark:hover:bg-white/5"
        >
          <ChevronDown className="h-4 w-4" />
          Show {Math.min(remaining, PAGE_SIZE)} more {activeTab === 'open' ? 'open' : 'closed'} clarification{Math.min(remaining, PAGE_SIZE) !== 1 ? 's' : ''}
        </button>
      )}

      {items.length > PAGE_SIZE && (
        <p className="text-center text-xs text-[#94A3B8]">
          Showing {Math.min(visibleCount, items.length)} of {items.length} · {activeTab === 'open' ? 'open' : 'closed'}
        </p>
      )}
    </div>
  )
}
