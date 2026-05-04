import type { RiskLevel, ProjectStatus, Project } from '@/data/db'

export type { Project, RiskLevel, ProjectStatus }

export interface ReviewQueueProject {
  id: string
  name: string
  entity: string
  status: 'To Review' | 'Reviewed' | 'Clarification Pending'
  riskLevel: RiskLevel
  hasMissingDocs: boolean
  requestedBudget: number
  capex: number
  opex: number
  glCodeCount: number
  submittedBy: string
  submittedDate: string
  updatedDate: string
  aiScore: number
  aiConfidence: number
  clarificationWith?: string
  clarificationOverdue?: number
}

export interface ApprovalQueueProject {
  id: string
  name: string
  entity: string
  budgetType: string
  budgetCategory: string
  requestedBudget: number
  riskLevel: RiskLevel
  aiConfidence: number
  summary: string
  glCodeCount: number
  reviewedBy: string
}

export interface ProjectLookups {
  strategicPriorities: string[]
  strategicClassifications: string[]
  workStreams: string[]
  budgetItemTypes: string[]
  technologyCompanies: string[]
  technologyProducts: string[]
  categories: string[]
  budgetTypes: string[]
}

export interface CreateProjectPayload {
  name: string
  strategicPriority: string
  classification: string
  category: string
  plannedStartDate: string
  plannedEndDate: string
  summary: string
  budgetType: 'New' | 'Enhancement' | 'Continuation' | 'Phase 2'
}

export interface ClarificationPayload {
  message: string
}

export interface RoleProjectFilters {
  search?: string
  status?: ProjectStatus[]
}
