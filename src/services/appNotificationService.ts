import { Dga_app_notificationsesService } from '@/generated/services/Dga_app_notificationsesService'
import type {
  Dga_app_notificationsesBase,
  Dga_app_notificationsesstatuscode,
} from '@/generated/models/Dga_app_notificationsesModel'
import {
  SESSION_CURRENT_ROLE_KEY,
} from '@/context/RoleContext'
import {
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
  type ModuleConfigTeamIds,
} from '@/services/userContextService'

export type NotificationRole = 'Respondent' | 'Reviewer' | 'Approver'

export interface AppNotificationItem {
  id: string
  notificationId: string
  text: string
  recipientTeamId: string | null
  recipientTeamName: string | null
  statuscode: number | null
  statusLabel: string | null
  createdOn: string | null
}

const NOTIFICATION_STATUS_OPEN: Dga_app_notificationsesstatuscode = 1
const NOTIFICATION_STATUS_CLOSED: Dga_app_notificationsesstatuscode = 576610001

function getStoredModuleConfigTeamIds(): ModuleConfigTeamIds | null {
  const raw = sessionStorage.getItem(SESSION_MODULE_CONFIG_TEAM_IDS_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as ModuleConfigTeamIds
  } catch {
    return null
  }
}

function normalizeStoredRole(roleLabel: string | null): NotificationRole | null {
  const value = roleLabel?.trim().toLowerCase() ?? ''
  if (value.includes('review')) return 'Reviewer'
  if (value.includes('approv')) return 'Approver'
  if (value.includes('respond')) return 'Respondent'
  return null
}

function getCurrentNotificationRole(): NotificationRole | null {
  return normalizeStoredRole(sessionStorage.getItem(SESSION_CURRENT_ROLE_KEY))
}

function getTargetTeamId(role: NotificationRole): string | null {
  const teamIds = getStoredModuleConfigTeamIds()
  if (role === 'Respondent') return teamIds?.respondentTeamId?.trim() || null
  if (role === 'Reviewer') return teamIds?.reviewerTeamId?.trim() || null
  return teamIds?.approverTeamId?.trim() || null
}

function getFormattedAnnotation(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function generateNotificationId() {
  return `N-${Date.now()}`
}

function mapNotificationRecord(
  record: Awaited<ReturnType<typeof Dga_app_notificationsesService.getAll>>['data'][number]
): AppNotificationItem {
  return {
    id: record.dga_app_notificationsid,
    notificationId: record.dga_notification_id?.trim() || record.dga_app_notificationsid,
    text: record.dga_notification_text?.trim() || '',
    recipientTeamId: record._dga_notification_recipient_team_value ?? null,
    recipientTeamName:
      getFormattedAnnotation(
        record,
        '_dga_notification_recipient_team_value@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.dga_notification_recipient_teamname ??
      null,
    statuscode: record.statuscode ?? null,
    statusLabel:
      getFormattedAnnotation(record, 'statuscode@OData.Community.Display.V1.FormattedValue') ??
      record.statuscodename ??
      null,
    createdOn: record.createdon ?? null,
  }
}

export async function createNotificationForRole(role: NotificationRole, text: string) {
  const teamId = getTargetTeamId(role)
  if (!teamId) {
    console.warn('[AppNotificationService] Skipping notification create because team id is missing:', {
      role,
      text,
    })
    return null
  }

  const payload = {
    dga_notification_id: generateNotificationId(),
    'dga_notification_recipient_team@odata.bind': `/teams(${teamId})`,
    dga_notification_text: text,
    statuscode: NOTIFICATION_STATUS_OPEN,
  } as Partial<Omit<Dga_app_notificationsesBase, 'dga_app_notificationsid'>> as Omit<
    Dga_app_notificationsesBase,
    'dga_app_notificationsid'
  >

  console.log('[AppNotificationService] Creating notification:', { role, teamId, payload })

  const result = await Dga_app_notificationsesService.create(payload)
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to create notification.')
  }

  console.log('[AppNotificationService] Notification created:', result.data)
  return result.data?.dga_app_notificationsid ?? null
}

export async function getOpenNotificationsForCurrentRole() {
  const role = getCurrentNotificationRole()
  if (!role) return []

  const teamId = getTargetTeamId(role)
  if (!teamId) {
    console.warn('[AppNotificationService] No team id found for current role notifications:', role)
    return []
  }

  const result = await Dga_app_notificationsesService.getAll({
    select: [
      'dga_app_notificationsid',
      'dga_notification_id',
      '_dga_notification_recipient_team_value',
      'dga_notification_text',
      'statuscode',
      'createdon',
    ],
    filter: `_dga_notification_recipient_team_value eq ${teamId} and statuscode eq ${NOTIFICATION_STATUS_OPEN}`,
    orderBy: ['createdon desc'],
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to retrieve notifications.')
  }

  return (result.data ?? []).map(mapNotificationRecord)
}

export async function markNotificationAsRead(notificationId: string) {
  const payload = {
    statuscode: NOTIFICATION_STATUS_CLOSED,
  } as Partial<Omit<Dga_app_notificationsesBase, 'dga_app_notificationsid'>>

  const result = await Dga_app_notificationsesService.update(notificationId, payload)
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to mark notification as read.')
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  await Promise.all(notificationIds.map((notificationId) => markNotificationAsRead(notificationId)))
}
