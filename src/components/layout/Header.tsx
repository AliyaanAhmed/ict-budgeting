import { useState } from 'react'
import { Bell, Sun, Moon, ChevronDown, CalendarDays, ShieldCheck, Check, UserCircle2, ClipboardCheck, ShieldAlert, Building, Crown, Workflow, BriefcaseBusiness } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import type { Role } from '@/data/db'
import { notifications } from '@/data/db'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface HeaderProps {
  sidebarWidth: number
  isDark: boolean
  onToggleDark: () => void
  isRTL: boolean
  onToggleRTL: () => void
}

export function Header({ sidebarWidth, isDark, onToggleDark, isRTL, onToggleRTL }: HeaderProps) {
  const { activeRole, setActiveRole } = useRole()
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const roleMeta: Record<Role, { sub: string; icon: React.ElementType }> = {
    Respondent: { sub: 'Submit budget items', icon: UserCircle2 },
    Reviewer: { sub: 'Review submissions', icon: ClipboardCheck },
    Approver: { sub: 'Approve for DGE', icon: ShieldAlert },
  }

  const roles: Role[] = ['Respondent', 'Reviewer', 'Approver']

  return (
    <header
      className="fixed top-0 right-0 z-20 flex h-16 items-center bg-[var(--surface)] border-b border-[var(--border)] px-3 sm:px-5 gap-3 transition-[left] duration-200"
      style={{ left: sidebarWidth }}
    >
      <div className="hidden lg:flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 min-w-0">
        <ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" />
        <span className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase whitespace-nowrap">FY2026 Governance Cycle</span>
        <span className="text-[var(--border-strong)]">|</span>
        <CalendarDays className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">Synced 30 Apr 2026</span>
      </div>

      <div className="hidden sm:flex lg:hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5">
        <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
        <span className="text-xs font-semibold text-[var(--muted-foreground)]">FY2026</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onToggleRTL}
          className="hidden sm:flex h-8 items-center gap-0 rounded-full border border-[var(--border)] overflow-hidden text-xs font-medium"
        >
          <span className={cn('px-3 py-1.5 transition-colors', !isRTL ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]')}>EN</span>
          <span className={cn('px-3 py-1.5 transition-colors', isRTL ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]')}>AR</span>
        </button>

        <button
          onClick={onToggleDark}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--destructive)] text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="font-semibold text-sm text-[var(--foreground)]">Notifications</p>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={cn('px-4 py-3 border-b border-[var(--muted)] hover:bg-[var(--muted)] cursor-pointer', !n.read && 'bg-[var(--primary-subtle)]')}>
                  <p className="text-sm font-medium text-[var(--foreground)]">{n.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 sm:px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-semibold">
              MH
            </div>
            <span className="text-sm font-medium text-[var(--foreground)] hidden md:inline">Mahmood</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px] p-2 rounded-2xl">
            <div className="rounded-xl bg-[var(--muted)] p-3 mb-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white font-semibold">MH</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">Mahmood Al Rashidi</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">Digital Governance Unit</p>
                </div>
              </div>
            </div>
            <DropdownMenuLabel className="px-2">Switch Role</DropdownMenuLabel>
            {roles.map((role) => {
              const RoleIcon = roleMeta[role].icon
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    'rounded-xl p-3 mb-1 items-start',
                    activeRole === role && 'bg-[var(--primary-light)] text-[var(--primary)]'
                  )}
                >
                  <div className="h-8 w-8 rounded-lg bg-white/70 border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                    <RoleIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{role}</p>
                    <p className="text-xs text-[var(--muted-foreground)] leading-tight mt-1">{roleMeta[role].sub}</p>
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
