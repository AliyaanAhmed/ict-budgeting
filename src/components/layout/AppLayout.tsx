import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useRole } from '@/context/RoleContext'
import { useCycle } from '@/context/CycleContext'
import { AppEmptyState } from './AppEmptyState'
import { AppLoadingState } from './AppLoadingState'
import { translatePage } from '@/lib/pageTranslator'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isRTL, setIsRTL] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const { activeRole, availableRoleOptions, hasAnyRole, rolesResolved, setActiveRoleOption } = useRole()
  const { cyclesResolved, hasCycles } = useCycle()
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
    const shouldBlurDuringTransition = isRTL
 
    if (isRTL) {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
      document.body.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = 'en'
      document.body.dir = 'ltr'
    }
 
    let cancelled = false
 
    setIsTranslating(shouldBlurDuringTransition)
 
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await translatePage(isRTL)
        } finally {
          if (!cancelled && shouldBlurDuringTransition) {
            window.setTimeout(() => {
              if (!cancelled) setIsTranslating(false)
            }, 120)
          } else if (!cancelled) {
            setIsTranslating(false)
          }
        }
      })()
    }, 50)
 
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isRTL])
 
  useEffect(() => {
    if (!isRTL) return
 
    let cancelled = false
    setIsTranslating(true)
 
    void (async () => {
      try {
        await translatePage(true)
      } finally {
        if (!cancelled) {
          window.setTimeout(() => {
            if (!cancelled) setIsTranslating(false)
          }, 120)
        }
      }
    })()
 
    return () => {
      cancelled = true
    }
  }, [location.pathname, isRTL])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  // When role changes, redirect to that role's landing page
  useEffect(() => {
    if (!hasAnyRole || !activeRole) return
    const rolePaths: Record<string, string> = {
      Respondent: '/respondent/dashboard',
      Reviewer: '/reviewer/dashboard',
      Approver: '/approver/dashboard',
      'ICT Admin': '/admin/assessment-cycles',
      'ICT - Strategy Team': '/strategy-team/dashboard',
      'ICT - SME Team': '/sme-team/dashboard',
    }
    const roleBasePaths: Record<string, string> = {
      Respondent: '/respondent',
      Reviewer: '/reviewer',
      Approver: '/approver',
      'ICT Admin': '/admin',
      'ICT - Strategy Team': '/strategy-team',
      'ICT - SME Team': '/sme-team',
    }
    const targetBase = roleBasePaths[activeRole]
    if (!location.pathname.startsWith(targetBase)) {
      navigate(rolePaths[activeRole])
    }
  }, [activeRole, hasAnyRole]) // eslint-disable-line react-hooks/exhaustive-deps

  const adminRoleOption = availableRoleOptions.find((option) => option.role === 'ICT Admin')

  if (!rolesResolved || !cyclesResolved) {
    return <AppLoadingState />
  }

  if (!hasAnyRole) {
    return (
      <AppEmptyState
        icon="role"
        title="No Role Access Found"
        description="Your account is not currently mapped to any ADGE role, DGE role, or ICT Admin access. The ICT Budgeting workspace cannot be opened until a role configuration is assigned."
        hint="Ask the ICT Budgeting administrator to map your user into the correct team, module configuration, or DGE review group."
      />
    )
  }

  if (hasAnyRole && !hasCycles) {
    return (
      <AppEmptyState
        icon="cycle"
        title={adminRoleOption ? 'No Cycle Found Yet' : 'No Active Cycle Available'}
        description={
          adminRoleOption
            ? 'No ICT budgeting cycle is currently available. You can switch into ICT Admin and create a new cycle to start the planning and review journey.'
            : 'No ICT budgeting cycle is currently available for your workspace. Until a cycle is created, dashboards, queues, and entity views cannot load.'
        }
        hint={
          adminRoleOption
            ? 'Switch to ICT Admin to create the next cycle and bring the workspace online for all ADGE and DGE roles.'
            : 'Please contact an ICT Admin user to create or activate an ICT budgeting cycle.'
        }
        primaryActionLabel={adminRoleOption ? 'Switch To ICT Admin' : undefined}
        onPrimaryAction={
          adminRoleOption
            ? () => {
                setActiveRoleOption(adminRoleOption.key)
                navigate('/admin/assessment-cycles')
              }
            : undefined
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar collapsed={sidebarCollapsed} isRTL={isRTL} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <Header
          sidebarWidth={sidebarWidth}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          isRTL={isRTL}
          onToggleRTL={() => setIsRTL(!isRTL)}
          isTranslating={isTranslating}
        />
      <main
        className="pt-16 transition-[padding-left,padding-right] duration-300 ease-in-out will-change-[padding-left,padding-right]"
        style={isRTL ? { paddingRight: sidebarWidth, paddingLeft: 0 } : { paddingLeft: sidebarWidth, paddingRight: 0 }}
      >
        <div
          className="relative p-6 animate-fadeIn transition-[filter,opacity] duration-200 ease-out"
          style={{
            filter: isTranslating ? 'blur(6px)' : 'blur(0px)',
            opacity: isTranslating ? 0.7 : 1,
            pointerEvents: isTranslating ? 'none' : 'auto',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
