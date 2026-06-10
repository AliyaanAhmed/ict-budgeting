import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  Check,
  UserCircle2,
  ClipboardCheck,
  ShieldAlert,
  BriefcaseBusiness,
  Settings2,
} from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import type { Role } from '@/data/db'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CycleSwitcher } from './CycleSwitcher'
import { getStoredUserContext } from '@/services/userContextService'
import {
  getOpenNotificationsForCurrentRole,
  markNotificationAsRead,
  markNotificationsAsRead,
  type AppNotificationItem,
} from '@/services/appNotificationService'

interface HeaderProps {
  sidebarWidth: number
  isDark: boolean
  onToggleDark: () => void
  isRTL: boolean
  onToggleRTL: () => void
  isTranslating: boolean
}

const roleMeta: Record<Role, { sub: string; icon: React.ElementType }> = {
  Respondent: { sub: 'Submit budget items', icon: UserCircle2 },
  Reviewer: { sub: 'Review submissions', icon: ClipboardCheck },
  Approver: { sub: 'Approve for DGE', icon: ShieldAlert },
  'ICT Admin': { sub: 'Manage assessment cycles', icon: Settings2 },
  'ICT - Strategy Team': { sub: 'Strategic alignment and governance', icon: ShieldCheck },
  'ICT - SME Team': { sub: 'Domain review and recommendation', icon: ClipboardCheck },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function formatNotificationTime(createdOn: string | null) {
  if (!createdOn) return ''

  const created = new Date(createdOn)
  if (Number.isNaN(created.getTime())) return createdOn

  const diffMs = Date.now() - created.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return created.toLocaleString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function Header({
  sidebarWidth,
  isDark,
  onToggleDark,
  isRTL,
  onToggleRTL,
  isTranslating,
}: HeaderProps) {
  const {
    activeRole,
    activeRoleOptionKey,
    setActiveRole,
    setActiveRoleOption,
    availableRoles,
    availableRoleOptions,
  } = useRole()
  const [notifOpen, setNotifOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [closingNotificationIds, setClosingNotificationIds] = useState<string[]>([])
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const unreadCount = notifications.filter((n) => !closingNotificationIds.includes(n.id)).length
  const notificationContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Resolve display name from stored user context (falls back to placeholder)
  const storedUser = getStoredUserContext()
  const displayName = storedUser?.fullName || 'Mahmood Al Rashidi'
  const displayShort = displayName.split(' ')[0] || 'Mahmood'
  const initials = getInitials(displayName) || 'MH'

  useEffect(() => {
    let cancelled = false

    const loadNotifications = async () => {
      setNotificationsLoading(true)
      setNotificationError(null)

      try {
        const nextNotifications = await getOpenNotificationsForCurrentRole()
        if (cancelled) return
        setNotifications(nextNotifications)
      } catch (error) {
        if (cancelled) return
        setNotifications([])
        setNotificationError(
          error instanceof Error ? error.message : 'Unable to load notifications.'
        )
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      cancelled = true
    }
  }, [activeRole])

  useEffect(() => {
    if (!notifOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (notificationContainerRef.current?.contains(target)) return
      setNotifOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [notifOpen])

  const handleMarkAsRead = async (notificationId: string) => {
    setClosingNotificationIds((current) =>
      current.includes(notificationId) ? current : [...current, notificationId]
    )

    try {
      await markNotificationAsRead(notificationId)
      window.setTimeout(() => {
        setNotifications((current) => current.filter((item) => item.id !== notificationId))
        setClosingNotificationIds((current) => current.filter((id) => id !== notificationId))
      }, 180)
    } catch (error) {
      setClosingNotificationIds((current) => current.filter((id) => id !== notificationId))
      setNotificationError(
        error instanceof Error ? error.message : 'Unable to mark notification as read.'
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    const openNotificationIds = notifications.map((item) => item.id)
    if (openNotificationIds.length === 0) return

    setMarkingAllRead(true)
    setClosingNotificationIds(openNotificationIds)

    try {
      await markNotificationsAsRead(openNotificationIds)
      window.setTimeout(() => {
        setNotifications([])
        setClosingNotificationIds([])
        setMarkingAllRead(false)
      }, 180)
    } catch (error) {
      setClosingNotificationIds([])
      setMarkingAllRead(false)
      setNotificationError(
        error instanceof Error ? error.message : 'Unable to mark all notifications as read.'
      )
    }
  }

  return (
    <header
      className="fixed top-0 z-20 flex h-16 items-center bg-[var(--surface)] border-b border-[var(--border)] px-3 sm:px-5 gap-3 transition-[left,right] duration-300 ease-in-out will-change-[left,right]"
      style={isRTL ? { right: sidebarWidth, left: 0 } : { left: sidebarWidth, right: 0 }}
    >
      {/* Dynamic cycle switcher */}
      <CycleSwitcher />

      <div className={cn('flex items-center gap-2', isRTL ? 'mr-auto' : 'ml-auto')}>
        {/* EN / AR toggle */}
        <button
          onClick={onToggleRTL}
          data-no-translate="true"
          disabled={isTranslating}
          className={cn(
            'hidden sm:flex h-8 items-stretch gap-0 rounded-full border border-[var(--border)] overflow-hidden p-0 text-xs font-medium transition-opacity',
            isTranslating && 'opacity-60 cursor-wait'
          )}
        >
          <span
            className={cn(
              'flex h-full items-center px-3 transition-colors',
              !isRTL
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
            )}
          >
            EN
          </span>
          <span
            className={cn(
              'flex h-full items-center px-3 transition-colors',
              isRTL
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
            )}
          >
            AR
          </span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div ref={notificationContainerRef} className="relative">
          <button
            onClick={() => {
              setNotifOpen((current) => !current)
              setRoleMenuOpen(false)
            }}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--destructive)] text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 z-50 w-[360px] overflow-hidden rounded-[22px] border border-[#DDEBFF] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#1E293B]">
              <div className="border-b border-[#DDEBFF] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-[#0F172A]/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-sm">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--foreground)]">Notifications</p>
                      <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-300">
                        {unreadCount > 0 ? `${unreadCount} open item${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAllRead || notifications.length === 0}
                    className="inline-flex items-center rounded-full border border-[#B0DBFF] bg-white px-3 py-1.5 text-xs font-semibold text-[#286CFF] shadow-sm transition-colors hover:bg-[#E7F5FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                  >
                    {markingAllRead ? 'Marking...' : 'Mark All as Read'}
                  </button>
                </div>
              </div>
              <div className="max-h-[282px] overflow-y-auto bg-[#F8FBFF] p-3 dark:bg-[#0F172A]/20">
                {notificationsLoading && (
                  <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-6 text-sm text-[var(--muted-foreground)] shadow-sm dark:border-white/10 dark:bg-white/5">
                    Loading notifications...
                  </div>
                )}
                {!notificationsLoading && notificationError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-[var(--destructive)] dark:border-red-700/30 dark:bg-red-900/20">
                    {notificationError}
                  </div>
                )}
                {!notificationsLoading && !notificationError && notifications.length === 0 && (
                  <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-6 text-sm text-[var(--muted-foreground)] shadow-sm dark:border-white/10 dark:bg-white/5">
                    No open notifications.
                  </div>
                )}
                {!notificationsLoading &&
                  !notificationError &&
                  notifications.map((notification) => {
                    const isClosing = closingNotificationIds.includes(notification.id)

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'mb-3 rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B0DBFF] hover:shadow-[0_14px_30px_rgba(40,108,255,0.12)] dark:border-white/10 dark:bg-white/5',
                          isClosing && 'opacity-0 scale-[0.98]'
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex rounded-full border border-[#B0DBFF] bg-[#E7F5FF] px-2.5 py-1 text-[11px] font-semibold text-[#286CFF] dark:border-[#4F98FF]/30 dark:bg-[#286CFF]/15 dark:text-slate-100">
                                {notification.notificationId}
                              </span>
                              <span className="truncate text-[11px] font-medium text-[#94A3B8]">
                                {formatNotificationTime(notification.createdOn)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleMarkAsRead(notification.id)}
                              disabled={isClosing}
                              className="shrink-0 rounded-full border border-[#B0DBFF] bg-white px-3 py-1.5 text-xs font-semibold text-[#286CFF] shadow-sm transition-colors hover:bg-[#E7F5FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                            >
                              Mark as Read
                            </button>
                          </div>
                          <p className="text-sm font-medium leading-6 text-[var(--foreground)]">
                            {notification.text}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Profile + role switcher */}
        <DropdownMenu
          open={roleMenuOpen}
          onOpenChange={(open) => {
            setRoleMenuOpen(open)
            if (open) {
              setNotifOpen(false)
            }
          }}
        >
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 sm:px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-semibold">
              {initials}
            </div>
            <span className="text-sm font-medium text-[var(--foreground)] hidden md:inline">
              {displayShort}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[280px] p-2 rounded-2xl">
            {/* User card */}
            <div className="rounded-xl bg-[var(--muted)] p-3 mb-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white font-semibold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {storedUser?.businessUnitName || 'Digital Governance Unit'}
                  </p>
                </div>
              </div>
            </div>

            {/* Role switcher — only shows roles available from the user's teams */}
            {availableRoleOptions.length > 1 && (
              <DropdownMenuLabel className="px-2">Switch Role</DropdownMenuLabel>
            )}
            {availableRoleOptions.length === 1 && (
              <DropdownMenuLabel className="px-2">Current Role</DropdownMenuLabel>
            )}

            <div className="max-h-[320px] overflow-y-auto pr-1">
            {availableRoleOptions.map((option) => {
              const role = option.role
              const RoleIcon = roleMeta[role].icon
              const isActive =
                option.role === 'ICT - SME Team'
                  ? activeRole === option.role && activeRoleOptionKey === option.key
                  : activeRole === role

              return (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() => {
                    if (option.role === 'ICT - SME Team' || option.role === 'ICT - Strategy Team' || option.role === 'ICT Admin') {
                      setActiveRoleOption(option.key)
                    } else {
                      setActiveRole(role)
                    }
                    setRoleMenuOpen(false)

                    if (option.role === 'ICT - SME Team') {
                      navigate('/sme-team/dashboard')
                    }
                  }}
                  className={cn(
                    'rounded-xl p-3 mb-1 items-start',
                    isActive &&
                      'bg-[var(--primary-light)] text-[var(--primary)] dark:bg-[#286CFF]/25 dark:text-white'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg bg-white/70 border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5',
                      isActive &&
                        'dark:bg-[#286CFF]/30 dark:border-[#4F98FF]/50 dark:text-white'
                    )}
                  >
                    <RoleIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{option.label}</p>
                    <p
                      className={cn(
                        'text-xs text-[var(--muted-foreground)] leading-tight mt-1',
                        isActive && 'dark:text-slate-100'
                      )}
                    >
                      {option.subtitle || roleMeta[role].sub}
                    </p>
                  </div>
                  {isActive && <Check className="ml-auto h-4 w-4 mt-1" />}
                </DropdownMenuItem>
              )
            })}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl py-2.5">
              <BriefcaseBusiness className="h-4 w-4" />
              Manage Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
