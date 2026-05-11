import { useState } from 'react'
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
import { notifications } from '@/data/db'
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
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export function Header({
  sidebarWidth,
  isDark,
  onToggleDark,
  isRTL,
  onToggleRTL,
  isTranslating,
}: HeaderProps) {
  const { activeRole, setActiveRole, availableRoles } = useRole()
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  // Resolve display name from stored user context (falls back to placeholder)
  const storedUser = getStoredUserContext()
  const displayName = storedUser?.fullName || 'Mahmood Al Rashidi'
  const displayShort = displayName.split(' ')[0] || 'Mahmood'
  const initials = getInitials(displayName) || 'MH'

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
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
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
            <div className="absolute right-0 top-10 w-80 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="font-semibold text-sm text-[var(--foreground)]">Notifications</p>
              </div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 border-b border-[var(--muted)] hover:bg-[var(--muted)] cursor-pointer transition-colors',
                    !n.read && 'bg-[#EAF2FF] dark:bg-[#286CFF]/15'
                  )}
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">{n.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile + role switcher */}
        <DropdownMenu>
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
            {availableRoles.length > 1 && (
              <DropdownMenuLabel className="px-2">Switch Role</DropdownMenuLabel>
            )}
            {availableRoles.length === 1 && (
              <DropdownMenuLabel className="px-2">Current Role</DropdownMenuLabel>
            )}

            {availableRoles.map(role => {
              const RoleIcon = roleMeta[role].icon
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    'rounded-xl p-3 mb-1 items-start',
                    activeRole === role &&
                      'bg-[var(--primary-light)] text-[var(--primary)] dark:bg-[#286CFF]/25 dark:text-white'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg bg-white/70 border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5',
                      activeRole === role &&
                        'dark:bg-[#286CFF]/30 dark:border-[#4F98FF]/50 dark:text-white'
                    )}
                  >
                    <RoleIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{role}</p>
                    <p
                      className={cn(
                        'text-xs text-[var(--muted-foreground)] leading-tight mt-1',
                        activeRole === role && 'dark:text-slate-100'
                      )}
                    >
                      {roleMeta[role].sub}
                    </p>
                  </div>
                  {activeRole === role && <Check className="ml-auto h-4 w-4 mt-1" />}
                </DropdownMenuItem>
              )
            })}

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
