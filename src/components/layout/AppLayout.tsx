import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useRole } from '@/context/RoleContext'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isRTL, setIsRTL] = useState(false)
  const { activeRole } = useRole()
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarWidth = sidebarCollapsed ? 72 : 248

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    if (isRTL) {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
  }, [isRTL])

  // When role changes, redirect to that role's dashboard
  useEffect(() => {
    const rolePaths: Record<string, string> = {
      Respondent: '/respondent/dashboard',
      Reviewer: '/reviewer/dashboard',
      Approver: '/approver/dashboard',
    }
    const targetBase = `/${activeRole.toLowerCase()}`
    if (!location.pathname.startsWith(targetBase)) {
      navigate(rolePaths[activeRole])
    }
  }, [activeRole]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header
        sidebarWidth={sidebarWidth}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        isRTL={isRTL}
        onToggleRTL={() => setIsRTL(!isRTL)}
      />
      <main
        className="pt-16 transition-[padding-left] duration-200 ease-out will-change-[padding-left]"
        style={{ paddingLeft: sidebarWidth }}
      >
        <div className="p-6 animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
