import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Building2, Copy, Mail, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SystemusersService } from '@/generated/services/SystemusersService'

interface UserHoverCardProps {
  name: string
  userId?: string | null
  subtitle?: string
  entity?: string
  role?: 'Respondent' | 'Reviewer' | 'Approver' | string
  children?: ReactNode
  className?: string
}

interface HoverUserDetails {
  fullName: string | null
  email: string | null
}

const workflowProfiles: Record<string, { role: string; subtitle: string; entity: string; responsibility: string }> = {
  Respondent: {
    role: 'Respondent',
    subtitle: 'Project Owner',
    entity: 'Submitting Entity',
    responsibility: 'Creates, edits, and responds to clarification',
  },
  Reviewer: {
    role: 'Reviewer',
    subtitle: 'Budget Reviewer',
    entity: 'DGE Review Office',
    responsibility: 'Reviews project readiness and raises clarifications',
  },
  Approver: {
    role: 'Approver',
    subtitle: 'Final Approver',
    entity: 'DGE Approval Office',
    responsibility: 'Approves final projects for DGE submission',
  },
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function CopyButton({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  const [copied, setCopied] = useState(false)

  if (!value?.trim()) {
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = value
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={copied ? `${label} copied` : `Copy ${label}`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#D8E6F8] bg-white text-[#286CFF] transition-colors hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE] dark:hover:bg-white/10"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  )
}

export function UserHoverCard({
  name,
  userId,
  subtitle,
  entity,
  role,
  children,
  className,
}: UserHoverCardProps) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<HoverUserDetails>({ fullName: null, email: null })
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    originX: 'left' as 'left' | 'right',
    originY: 'top' as 'top' | 'bottom',
  })
  const closeTimer = useRef<number | undefined>(undefined)
  const loadedUserIdRef = useRef<string | null>(null)
  const workflow = workflowProfiles[role ?? name]
  const profileRole = role ?? workflow?.role ?? 'Project User'
  const profileSubtitle = subtitle ?? workflow?.subtitle ?? 'Project Stakeholder'
  const profileEntity = entity ?? workflow?.entity ?? 'Department of Digital Government'
  const responsibility = workflow?.responsibility ?? 'Supports ICT budget planning workflow'
  const initials = getInitials(name)
  const displayName = details.fullName?.trim() || name

  useEffect(() => {
    if (!open || !userId?.trim() || loadedUserIdRef.current === userId) {
      return
    }

    let cancelled = false

    const loadDetails = async () => {
      setLoading(true)
      console.log('[UserHoverCard] Loading system user details for hover:', userId)

      try {
        const result = await SystemusersService.get(userId, {
          select: ['systemuserid', 'fullname', 'internalemailaddress'],
        })

        console.log('[UserHoverCard] System user hover result:', result)

        if (cancelled) return

        loadedUserIdRef.current = userId
        setDetails({
          fullName: result.data?.fullname?.trim() || name,
          email: result.data?.internalemailaddress?.trim() || null,
        })
      } catch (error) {
        console.error('[UserHoverCard] Failed to load system user hover details:', error)
        if (cancelled) return

        loadedUserIdRef.current = userId
        setDetails({
          fullName: name,
          email: null,
        })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDetails()

    return () => {
      cancelled = true
    }
  }, [name, open, userId])

  const openCard = (target: HTMLElement) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    const rect = target.getBoundingClientRect()
    const cardWidth = 340
    const cardHeight = 238
    const viewportPadding = 16
    const opensLeft = rect.left + cardWidth > window.innerWidth - viewportPadding
    const opensUp = rect.bottom + cardHeight > window.innerHeight - viewportPadding
    const preferredLeft = opensLeft ? rect.right - cardWidth : rect.left
    const left = Math.min(Math.max(viewportPadding, preferredLeft), window.innerWidth - cardWidth - viewportPadding)
    const preferredTop = opensUp ? rect.top - cardHeight - 10 : rect.bottom + 10
    const top = Math.min(Math.max(viewportPadding, preferredTop), window.innerHeight - cardHeight - viewportPadding)
    setPosition({
      top,
      left,
      originX: opensLeft ? 'right' : 'left',
      originY: opensUp ? 'bottom' : 'top',
    })
    setOpen(true)
  }

  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  return (
    <>
      <span
        tabIndex={0}
        onMouseEnter={(event) => openCard(event.currentTarget)}
        onMouseLeave={scheduleClose}
        onFocus={(event) => openCard(event.currentTarget)}
        onBlur={scheduleClose}
        className={cn(
          'inline-flex max-w-full cursor-default items-center gap-1 rounded-md text-xs font-medium text-[var(--primary)] outline-none transition-colors hover:text-[#043DFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2',
          className
        )}
      >
        {children ?? <span className="truncate">{name}</span>}
      </span>

      {open &&
        createPortal(
          <div
            style={{ top: position.top, left: position.left }}
            onMouseEnter={() => {
              if (closeTimer.current) window.clearTimeout(closeTimer.current)
            }}
            onMouseLeave={scheduleClose}
            className={cn(
              'fixed z-[100] w-[340px] overflow-hidden rounded-3xl border border-[#DDEBFF] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#1E293B]',
              position.originY === 'bottom' && position.originX === 'right' && 'origin-bottom-right',
              position.originY === 'bottom' && position.originX === 'left' && 'origin-bottom-left',
              position.originY === 'top' && position.originX === 'right' && 'origin-top-right',
              position.originY === 'top' && position.originX === 'left' && 'origin-top-left'
            )}
          >
            <div className="border-b border-[#EAF0F6] bg-gradient-to-br from-[#F7FBFF] via-white to-[#EEF5FF] px-5 py-4 dark:border-white/10 dark:from-[#243248] dark:via-[#1E293B] dark:to-[#1C2B42]">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 border border-white/70 shadow-[0_10px_24px_rgba(40,108,255,0.16)]">
                  <AvatarFallback className="bg-[#E7F5FF] text-base font-bold text-[#286CFF]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[#0F172A] dark:text-white">{displayName}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-[#64748B] dark:text-slate-200">
                        {profileSubtitle}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E7F5FF] px-2.5 py-1 text-[11px] font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#93C5FD]">
                      {profileRole}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#DCE8F6] bg-white/90 px-3 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    <Building2 className="h-3.5 w-3.5 text-[#286CFF]" />
                    <span className="truncate">{profileEntity}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-2xl border border-[#E7EEF8] bg-[#FAFCFF] p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">Full Name</p>
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-5 text-[#0F172A] dark:text-white">{displayName}</p>
                  <CopyButton label="full name" value={displayName} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E7EEF8] bg-[#FAFCFF] p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#286CFF]" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">Email</p>
                </div>
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <p className="min-h-[20px] text-sm font-medium leading-5 text-[#0F172A] dark:text-white">
                    {loading ? 'Loading email...' : details.email || 'Email not available'}
                  </p>
                  <CopyButton label="email" value={details.email} />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-2.5 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#286CFF]" />
                <span>{responsibility}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
