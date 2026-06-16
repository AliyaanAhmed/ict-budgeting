import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  ClipboardList,
  CheckCircle,
  ChevronsLeft,
  ChevronsRight,
  RefreshCcw,
  ScanSearch,
  Table2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole } from '@/context/RoleContext'
import { useQueueCounts } from '@/context/QueueCountsContext'
import { getStoredUserContext } from '@/services/userContextService'
import appLogo from '@/assets/app-logo-v3.png?inline'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isRTL: boolean
}

export function Sidebar({ collapsed, onToggle, isRTL }: SidebarProps) {
  const { activeRole } = useRole()
  const storedUser = getStoredUserContext()
  const displayName = storedUser?.fullName || 'Mahmood Al Rashidi'
  const initials = getInitials(displayName) || 'MR'
  const location = useLocation()
  const { reviewCount, approvalCount, refreshReviewCount, refreshApprovalCount } = useQueueCounts()

  const pendingReview = reviewCount ?? 0
  const pendingApproval = approvalCount ?? 0

  useEffect(() => {
    if (activeRole === 'Reviewer' && reviewCount === null && !location.pathname.startsWith('/reviewer/review-queue')) {
      void refreshReviewCount()
    }

    if (activeRole === 'Approver' && approvalCount === null && !location.pathname.startsWith('/approver/approval-queue')) {
      void refreshApprovalCount()
    }
  }, [
    activeRole,
    approvalCount,
    location.pathname,
    refreshApprovalCount,
    refreshReviewCount,
    reviewCount,
  ])

  const navItems: Record<string, { label: string; icon: React.ElementType; href: string; badge?: number; matchPaths?: string[] }[]> = {
    Respondent: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/respondent/dashboard' },
      { label: 'My Projects', icon: FolderOpen, href: '/respondent/projects' },
      { label: 'New Project', icon: PlusCircle, href: '/respondent/projects/new' },
    ],
    Reviewer: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/reviewer/dashboard' },
      { label: 'Review Queue', icon: ClipboardList, href: '/reviewer/review-queue', badge: pendingReview },
      { label: 'Projects', icon: FolderOpen, href: '/reviewer/projects' },
    ],
    Approver: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/approver/dashboard' },
      { label: 'Approval Queue', icon: CheckCircle, href: '/approver/approval-queue', badge: pendingApproval },
      { label: 'Projects', icon: FolderOpen, href: '/approver/projects' },
    ],
    'ICT Admin': [
      { label: 'Assessment Cycle', icon: RefreshCcw, href: '/admin/assessment-cycles', matchPaths: ['/admin'] },
    ],
    'ICT - Strategy Team': [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/strategy-team/dashboard' },
      { label: 'Projects', icon: FolderOpen, href: '/strategy-team/projects' },
      { label: 'Strategic Alignment', icon: ScanSearch, href: '/strategy-team/strategic-alignment' },
      { label: 'Entity Tracker', icon: Table2, href: '/strategy-team/entity-tracker' },
      { label: 'SME Tracker', icon: Users, href: '/strategy-team/sme-tracker' },
      { label: 'Quality Check', icon: ShieldCheck, href: '/strategy-team/quality-check' },
    ],
    'ICT - Strategy Director': [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/strategy-director/dashboard' },
      { label: 'Projects', icon: FolderOpen, href: '/strategy-director/projects' },
      { label: 'Director Review Queue', icon: ShieldAlert, href: '/strategy-director/reviewer-queue' },
      { label: 'Entity Tracker', icon: Table2, href: '/strategy-director/entity-tracker' },
    ],
    'ICT - SME Team': [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/sme-team/dashboard' },
      { label: 'Projects', icon: FolderOpen, href: '/sme-team/projects' },
      { label: 'SME Review Queue', icon: ClipboardList, href: '/sme-team/reviews' },
    ],
  }

  const items = activeRole ? navItems[activeRole] ?? [] : []
  const activeHref = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => {
      if (location.pathname === item.href || location.pathname.startsWith(item.href + '/')) return true
      if (item.matchPaths) return item.matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
      return false
    })?.href
  const ToggleIcon = collapsed
    ? isRTL
      ? ChevronsLeft
      : ChevronsRight
    : isRTL
      ? ChevronsRight
      : ChevronsLeft
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <aside
      className={cn(
        'fixed top-0 bottom-0 z-30 flex flex-col bg-[var(--surface)] border-[var(--border)] transition-[width,left,right] duration-300 ease-in-out will-change-[width,left,right]',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      {/* Logo */}
      <button
        onClick={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={cn(
          'flex h-16 w-full shrink-0 items-center border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]',
          collapsed ? 'justify-center px-4' : 'px-5 gap-3'
        )}
        style={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-white">
          <img
            src={appLogo}
            alt="Department of Government Enablement logo"
            className="h-8 w-8 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--foreground)] leading-tight truncate">ICT Budgeting</p>
            <p className="text-xs text-[var(--muted-foreground)] leading-tight truncate">Department of Government Enablement</p>
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={cn(
          'absolute top-1/2 z-40 flex h-9 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-[#DDEBFF] bg-white/85 text-[#286CFF]/70 shadow-sm backdrop-blur-sm transition-all hover:w-6 hover:border-[#B0DBFF] hover:bg-[#E7F5FF] hover:text-[#286CFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#1E293B]/85 dark:text-[#93C5FD] dark:hover:bg-[#286CFF]/15',
          isRTL ? '-left-2.5' : '-right-2.5'
        )}
      >
        <ToggleIcon className="h-3.5 w-3.5" />
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" style={{ marginTop: "1.5rem" }}>
        {items.map((item) => {
          const isActive = activeHref === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[8px] px-3 py-2.5 mb-1 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-[#286CFF] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && 'badge' in item && item.badge != null && (item.badge as number) > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-[var(--primary)] text-white text-xs font-bold px-1">
                  {item.badge as number}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{displayName}</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  activeRole === 'Respondent' && 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
                  activeRole === 'Reviewer' && 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
                  activeRole === 'Approver' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                  activeRole === 'ICT Admin' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                  activeRole === 'ICT - Strategy Team' && 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
                  activeRole === 'ICT - Strategy Director' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                  activeRole === 'ICT - SME Team' && 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                )}
              >
                {activeRole ?? 'No role assigned'}
              </span>
            </div>
          </div>
        </div>
      )}

    </aside>
  )
}



