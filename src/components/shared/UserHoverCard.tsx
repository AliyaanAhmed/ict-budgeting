import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Building2, Check, Copy, Mail, Phone, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserHoverCardProps {
  name: string
  email?: string
  subtitle?: string
  entity?: string
  phone?: string
  imageUrl?: string
  role?: 'Respondent' | 'Reviewer' | 'Approver' | string
  children?: ReactNode
  className?: string
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

function getFallbackEmail(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '.')

  return `${cleaned || 'user'}@dge.gov.ae`
}

function getFallbackPhone(name: string) {
  const total = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const suffix = String(3000 + (total % 6000)).padStart(4, '0')
  return `+971 2 31${suffix}`
}

function getProfileImage(name: string) {
  return `https://i.pravatar.cc/120?u=${encodeURIComponent(name)}`
}

export function UserHoverCard({
  name,
  email,
  subtitle,
  entity,
  phone,
  imageUrl,
  role,
  children,
  className,
}: UserHoverCardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    originX: 'left' as 'left' | 'right',
    originY: 'top' as 'top' | 'bottom',
  })
  const closeTimer = useRef<number | undefined>(undefined)
  const workflow = workflowProfiles[role ?? name]
  const profileRole = role ?? workflow?.role ?? 'Respondent'
  const profileSubtitle = subtitle ?? workflow?.subtitle ?? 'Project Stakeholder'
  const profileEntity = entity ?? workflow?.entity ?? 'Department of Digital Government'
  const responsibility = workflow?.responsibility ?? 'Supports ICT budget planning workflow'
  const resolvedEmail = email ?? getFallbackEmail(name)
  const resolvedPhone = phone ?? getFallbackPhone(name)
  const resolvedImage = imageUrl ?? getProfileImage(name)
  const initials = getInitials(name)

  const openCard = (target: HTMLElement) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    const rect = target.getBoundingClientRect()
    const cardWidth = 320
    const cardHeight = 342
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

  const copyDetails = async () => {
    const details = [`Name: ${name}`, `Email: ${resolvedEmail}`, `Phone: ${resolvedPhone}`].join('\n')

    try {
      await navigator.clipboard.writeText(details)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = details
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
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
          'inline-flex cursor-default items-center gap-1 rounded-md text-xs font-medium text-[var(--primary)] outline-none transition-colors hover:text-[#043DFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2',
          className
        )}
      >
        {children ?? name}
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
              'fixed z-[100] w-[320px] overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.18)] animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#1E293B]',
              position.originY === 'bottom' && position.originX === 'right' && 'origin-bottom-right',
              position.originY === 'bottom' && position.originX === 'left' && 'origin-bottom-left',
              position.originY === 'top' && position.originX === 'right' && 'origin-top-right',
              position.originY === 'top' && position.originX === 'left' && 'origin-top-left'
            )}
          >
            <div className="bg-gradient-to-b from-[#F8FBFF] to-white p-4 dark:from-[#263449] dark:to-[#1E293B]">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 border-2 border-white shadow-[0_8px_22px_rgba(40,108,255,0.16)] ring-1 ring-[#B0DBFF]">
                  <AvatarImage src={resolvedImage} alt={name} className="object-cover" />
                  <AvatarFallback className="bg-[#E7F5FF] text-[#286CFF]">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[#0F172A] dark:text-white">{name}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-[#64748B] dark:text-slate-200">{profileSubtitle}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E7F5FF] px-2.5 py-1 text-xs font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#93C5FD]">
                      {profileRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 border-y border-[#EAF0F6] px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-3 text-sm text-[#475569] dark:text-slate-200">
                <Building2 className="h-4 w-4 shrink-0 text-[#286CFF]" />
                <span className="truncate">{profileEntity}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#475569] dark:text-slate-200">
                <Phone className="h-4 w-4 shrink-0 text-[#286CFF]" />
                <span className="truncate">{resolvedPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#475569] dark:text-slate-200">
                <Mail className="h-4 w-4 shrink-0 text-[#286CFF]" />
                <span className="truncate">{resolvedEmail}</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] px-3 py-2 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#286CFF]" />
                <span>{responsibility}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#64748B] transition-colors hover:bg-white hover:text-[#0F172A] dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={copyDetails}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors',
                  copied ? 'bg-[#4A9D5C] hover:bg-[#3C884D]' : 'bg-[#286CFF] hover:bg-[#043DFF]'
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Details'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
