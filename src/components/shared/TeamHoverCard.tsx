import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Building2, Mail, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SystemusersService } from '@/generated/services/SystemusersService'
import { TeammembershipsService } from '@/generated/services/TeammembershipsService'
import { TeamsService } from '@/generated/services/TeamsService'

interface TeamMemberDetails {
  systemUserId: string
  fullName: string
  email: string | null
}

interface TeamHoverDetails {
  teamName: string
  members: TeamMemberDetails[]
  hasMoreMembers: boolean
}

interface TeamHoverCardProps {
  name: string
  teamId?: string | null
  children?: ReactNode
  className?: string
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function TeamHoverCard({
  name,
  teamId,
  children,
  className,
}: TeamHoverCardProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<TeamHoverDetails>({
    teamName: name,
    members: [],
    hasMoreMembers: false,
  })
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    originX: 'left' as 'left' | 'right',
    originY: 'top' as 'top' | 'bottom',
  })
  const closeTimer = useRef<number | undefined>(undefined)
  const loadedTeamIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open || !teamId?.trim() || loadedTeamIdRef.current === teamId) {
      return
    }

    let cancelled = false

    const loadDetails = async () => {
      setLoading(true)

      try {
        const [teamResult, membershipsResult] = await Promise.all([
          TeamsService.getAll({
            select: ['teamid', 'name'],
            filter: `teamid eq ${teamId}`,
            top: 1,
          }),
          TeammembershipsService.getAll({
            select: ['teamid', 'systemuserid'],
            filter: `teamid eq ${teamId}`,
          }),
        ])

        if (cancelled) return

        const record = teamResult.data?.[0] ?? null
        const memberIds = Array.from(
          new Set(
            (membershipsResult.data ?? [])
              .map((member) => member.systemuserid?.trim())
              .filter((memberId): memberId is string => Boolean(memberId))
          )
        )

        const members = (
          await Promise.all(
            memberIds.map(async (memberId) => {
              try {
                const userResult = await SystemusersService.get(memberId, {
                  select: ['systemuserid', 'fullname', 'internalemailaddress'],
                })

                return {
                  systemUserId: userResult.data?.systemuserid?.trim() || memberId,
                  fullName: userResult.data?.fullname?.trim() || 'Unknown User',
                  email: userResult.data?.internalemailaddress?.trim() || null,
                }
              } catch {
                return {
                  systemUserId: memberId,
                  fullName: 'Unknown User',
                  email: null,
                }
              }
            })
          )
        ).sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }))

        loadedTeamIdRef.current = teamId
        setDetails({
          teamName: record?.name?.trim() || name,
          members,
          hasMoreMembers: false,
        })
      } catch (error) {
        console.error('[TeamHoverCard] Failed to load team hover details:', error)
        if (cancelled) return

        loadedTeamIdRef.current = teamId
        setDetails({
          teamName: name,
          members: [],
          hasMoreMembers: false,
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
  }, [name, open, teamId])

  const openCard = (target: HTMLElement) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    const rect = target.getBoundingClientRect()
    const cardWidth = 360
    const cardHeight = 336
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

  const membersLabel = loading
    ? 'Loading team members...'
    : details.members.length === 1
      ? '1 team member'
      : `${details.members.length} team members`

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
              'fixed z-[100] w-[360px] overflow-hidden rounded-3xl border border-[#DDEBFF] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#1E293B]',
              position.originY === 'bottom' && position.originX === 'right' && 'origin-bottom-right',
              position.originY === 'bottom' && position.originX === 'left' && 'origin-bottom-left',
              position.originY === 'top' && position.originX === 'right' && 'origin-top-right',
              position.originY === 'top' && position.originX === 'left' && 'origin-top-left'
            )}
          >
            <div className="border-b border-[#EAF0F6] bg-gradient-to-br from-[#F7FBFF] via-white to-[#EEF5FF] px-5 py-4 dark:border-white/10 dark:from-[#243248] dark:via-[#1E293B] dark:to-[#1C2B42]">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 rounded-2xl border-2 border-[#BFDBFF] bg-[linear-gradient(135deg,#F7FBFF_0%,#E7F5FF_100%)] p-0.5 ring-4 ring-white/80 dark:border-[#3B82F6]/30 dark:bg-[linear-gradient(135deg,#243248_0%,#1E293B_100%)] dark:ring-white/5">
                  <AvatarFallback className="rounded-[14px] bg-[#E7F5FF] text-base font-bold text-[#286CFF] dark:bg-[#1D4ED8]/15 dark:text-[#BFDBFE]">
                    {getInitials(details.teamName || name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[#0F172A] dark:text-white">
                        {details.teamName || name}
                      </p>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Workflow Team</p>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#DDEBFF] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#BFDBFE]">
                      <Users className="h-3.5 w-3.5" />
                      {loading ? '...' : details.members.length}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E3F0FF] bg-white/85 px-2.5 py-1 text-[11px] font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      <Building2 className="h-3.5 w-3.5 text-[#286CFF] dark:text-[#BFDBFE]" />
                      {membersLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                    {details.teamName || name} Team Members
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-14 animate-pulse rounded-2xl border border-[#EEF3F8] bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5"
                    />
                  ))}
                </div>
              ) : details.members.length > 0 ? (
                <div className="max-h-[228px] space-y-2 overflow-y-auto pr-1">
                  {details.members.map((member) => (
                    <div
                      key={member.systemUserId || `${member.fullName}-${member.email ?? ''}`}
                      className="rounded-2xl border border-[#EEF3F8] bg-[#F8FBFF] px-3.5 py-3 transition-colors hover:border-[#D8E6F8] hover:bg-[#F4FAFF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#286CFF] shadow-sm dark:bg-[#243248] dark:text-[#BFDBFE]">
                          <span className="text-xs font-bold">{getInitials(member.fullName)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                            {member.fullName}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-300">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                            <span className="truncate">{member.email || 'Email not available'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] px-4 py-5 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  No team members were returned for this team.
                </div>
              )}

              {details.hasMoreMembers ? (
                <p className="mt-3 text-[11px] text-[#94A3B8] dark:text-slate-400">
                  More users may exist for this team.
                </p>
              ) : null}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
