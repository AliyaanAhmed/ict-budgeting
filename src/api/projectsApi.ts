import type {
  Project,
  ReviewQueueProject,
  ApprovalQueueProject,
  ProjectLookups,
  CreateProjectPayload,
  ClarificationPayload,
  RoleProjectFilters,
} from '@/domain/types'

export interface ProjectsApi {
  getRespondentProjects(filters?: RoleProjectFilters): Promise<Project[]>
  getReviewerProjects(filters?: RoleProjectFilters): Promise<Project[]>
  getProjectById(projectId: string): Promise<Project | null>

  getReviewQueue(): Promise<ReviewQueueProject[]>
  getApprovalQueue(): Promise<ApprovalQueueProject[]>

  getProjectLookups(): Promise<ProjectLookups>
  createProject(payload: CreateProjectPayload): Promise<Project>

  submitToReviewer(projectId: string): Promise<void>
  reviewerApprove(projectId: string): Promise<void>
  reviewerRaiseClarification(projectId: string, payload: ClarificationPayload): Promise<void>
  approverApprove(projectId: string): Promise<void>
  approverRaiseClarification(projectId: string, payload: ClarificationPayload): Promise<void>
}
