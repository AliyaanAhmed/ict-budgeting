import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, ChevronsUp, Lock, LockKeyhole, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Clarification, ClarificationReply } from '@/data/db'

interface ClarificationThreadProps {
  clarifications: Clarification[]
  currentRole: 'Respondent' | 'Reviewer' | 'Approver'
  isEditMode: boolean
  onReply: (clarificationId: string, message: string) => void
  onClose: (clarificationId: string) => void
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

function ReplyBubble({ reply }: { reply: ClarificationReply }) {
  const style = ROLE_STYLE[reply.fromRole]

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
}: {
  clarification: Clarification
  index: number
  currentRole: 'Respondent' | 'Reviewer' | 'Approver'
  isEditMode: boolean
  isExpanded: boolean
  onToggle: () => void
  onReply: (msg: string) => void
  onClose: () => void
}) {
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const style = ROLE_STYLE[clarification.raisedBy]
  const isOpen = clarification.status === 'Open'
  const isRaiser = currentRole === clarification.raisedBy
  const canReply = isOpen
  const canClose = isOpen && isRaiser
  const replyCount = clarification.replies.length

  const handleSend = () => {
    const msg = replyText.trim()
    if (!msg) return
    onReply(msg)
    setReplyText('')
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

      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/[0.03]"
      >
        <p className={cn('text-sm leading-[1.65] text-[#0F172A] dark:text-white', !isExpanded && 'line-clamp-2')}>
          {clarification.message}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#286CFF] dark:text-[#4F98FF]">
            {isExpanded ? (
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
          {!isExpanded && !isOpen && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
              <Lock className="h-3 w-3" />
              Closed
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div style={{ animation: 'fadeInUp 0.18s ease-out' }}>
          {replyCount > 0 && (
            <div className="space-y-3 border-t border-[#F1F5F9] px-4 py-3.5 dark:border-white/5">
              {clarification.replies.map((reply) => (
                <ReplyBubble key={reply.id} reply={reply} />
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
                  <div className="flex items-center gap-2">
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
                      onClick={() => { setIsReplying(false); setReplyText('') }}
                      className="h-9 rounded-xl text-[#64748B]"
                    >
                      Cancel
                    </Button>
                    <span className="ml-auto hidden text-[10px] text-[#94A3B8] sm:block">Ctrl/Cmd + Enter to send</span>
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
}: ClarificationThreadProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const openList = [...clarifications]
    .filter((clarification) => clarification.status === 'Open')
    .sort((left, right) => right.date.localeCompare(left.date))
  const closedList = [...clarifications]
    .filter((clarification) => clarification.status === 'Closed')
    .sort((left, right) => (right.closedAt ?? right.date).localeCompare(left.closedAt ?? left.date))

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
              onReply={(message) => onReply(clarification.id, message)}
              onClose={() => onClose(clarification.id)}
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
