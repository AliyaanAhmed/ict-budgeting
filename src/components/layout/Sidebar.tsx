import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  ClipboardList,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole } from '@/context/RoleContext'
import { projects } from '@/data/db'
import appLogo from '@/assets/app-logo-v3.png?inline'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isRTL: boolean
}

export function Sidebar({ collapsed, onToggle, isRTL }: SidebarProps) {
  const { activeRole } = useRole()
  const location = useLocation()

  const pendingReview = projects.filter((p) => p.status === 'Submitted to Reviewer').length
  const pendingApproval = projects.filter((p) => p.status === 'Submitted to Approver').length

  const navItems = {
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
    ],
  }

  const items = navItems[activeRole] ?? []
  const activeHref = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))?.href

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
        className={cn(
          'flex items-center h-16 border-b border-[var(--border)] shrink-0 w-full transition-colors hover:bg-[var(--muted)]',
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
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
              MR
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">Mahmood Al Rashidi</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  activeRole === 'Respondent' && 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
                  activeRole === 'Reviewer' && 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
                  activeRole === 'Approver' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                )}
              >
                {activeRole}
              </span>
            </div>
          </div>
        </div>
      )}

    </aside>
  )
}




