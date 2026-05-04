import type { ProjectsApi } from '@/api/projectsApi'
import type {
  Project,
  ReviewQueueProject,
  ApprovalQueueProject,
  CreateProjectPayload,
  ClarificationPayload,
  ProjectLookups,
  RoleProjectFilters,
} from '@/domain/types'

async function notImplemented<T>(method: string): Promise<T> {
  throw new Error(`Dataverse API not implemented yet: ${method}`)
}

export const dataverseProjectsApi: ProjectsApi = {
  getRespondentProjects: (_filters?: RoleProjectFilters) => notImplemented<Project[]>('getRespondentProjects'),
  getReviewerProjects: (_filters?: RoleProjectFilters) => notImplemented<Project[]>('getReviewerProjects'),
  getProjectById: (_projectId: string) => notImplemented<Project | null>('getProjectById'),

  getReviewQueue: () => notImplemented<ReviewQueueProject[]>('getReviewQueue'),
  getApprovalQueue: () => notImplemented<ApprovalQueueProject[]>('getApprovalQueue'),

  getProjectLookups: () => notImplemented<ProjectLookups>('getProjectLookups'),
  createProject: (_payload: CreateProjectPayload) => notImplemented<Project>('createProject'),

  submitToReviewer: (_projectId: string) => notImplemented<void>('submitToReviewer'),
  reviewerApprove: (_projectId: string) => notImplemented<void>('reviewerApprove'),
  reviewerRaiseClarification: (_projectId: string, _payload: ClarificationPayload) => notImplemented<void>('reviewerRaiseClarification'),
  approverApprove: (_projectId: string) => notImplemented<void>('approverApprove'),
  approverRaiseClarification: (_projectId: string, _payload: ClarificationPayload) => notImplemented<void>('approverRaiseClarification'),
}
