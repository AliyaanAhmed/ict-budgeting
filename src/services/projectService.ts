import { projectsApi } from '@/services/projectsApiProvider'
import type {
  Project,
  ProjectStatus,
  ReviewQueueProject,
  ApprovalQueueProject,
  RoleProjectFilters,
  CreateProjectPayload,
  ClarificationPayload,
  ProjectLookups,
} from '@/domain/types'

export const projectService = {
  getRespondentProjects(filters?: RoleProjectFilters): Promise<Project[]> {
    return projectsApi.getRespondentProjects(filters)
  },

  getReviewerProjects(filters?: RoleProjectFilters): Promise<Project[]> {
    return projectsApi.getReviewerProjects(filters)
  },

  getApproverProjects(filters?: RoleProjectFilters): Promise<Project[]> {
    return projectsApi.getApproverProjects(filters)
  },

  getProjectById(projectId: string): Promise<Project | null> {
    return projectsApi.getProjectById(projectId)
  },

  getReviewQueue(): Promise<ReviewQueueProject[]> {
    return projectsApi.getReviewQueue()
  },

  getApprovalQueue(): Promise<ApprovalQueueProject[]> {
    return projectsApi.getApprovalQueue()
  },

  getLookups(): Promise<ProjectLookups> {
    return projectsApi.getProjectLookups()
  },

  createProject(payload: CreateProjectPayload): Promise<Project> {
    return projectsApi.createProject(payload)
  },

  submitToReviewer(projectId: string): Promise<void> {
    return projectsApi.submitToReviewer(projectId)
  },

  reviewerCompleteReview(projectId: string): Promise<void> {
    return projectsApi.reviewerCompleteReview(projectId)
  },

  reviewerApprove(projectId: string): Promise<void> {
    return projectsApi.reviewerApprove(projectId)
  },

  reviewerRaiseClarification(projectId: string, payload: ClarificationPayload): Promise<void> {
    return projectsApi.reviewerRaiseClarification(projectId, payload)
  },

  approverApprove(projectId: string): Promise<void> {
    return projectsApi.approverApprove(projectId)
  },

  approverRaiseClarification(projectId: string, payload: ClarificationPayload): Promise<void> {
    return projectsApi.approverRaiseClarification(projectId, payload)
  },

  // Shared list logic for Respondent + Reviewer project screens.
  buildRoleStatusFilter(role: 'respondent' | 'reviewer' | 'approver', tab: string): ProjectStatus[] | undefined {
    if (role === 'respondent') {
      if (tab === 'needs-work') return ['Draft']
      if (tab === 'clarification') return ['Clarification Required']
      if (tab === 'submitted-reviewer') return ['Submitted to Reviewer']
      return undefined
    }

    if (role === 'reviewer') {
      if (tab === 'pending-review') return ['Submitted to Reviewer']
      if (tab === 'review-completed') return ['Reviewer Review Completed']
      if (tab === 'clarification') return ['Clarification Required']
      if (tab === 'submitted-approver') return ['Submitted to Approver']
      return undefined
    }

    if (tab === 'pending-approval') return ['Submitted to Approver']
    if (tab === 'clarification') return ['Clarification Required']
    if (tab === 'approved') return ['Approved']
    return undefined
  },
}
