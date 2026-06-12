import type { RiskLevel, ProjectStatus, Project } from '@/data/db'

export type { Project, RiskLevel, ProjectStatus }

export interface ReviewQueueProject {
  id: string
  ictBudgetId: string
  name: string
  entity: string
  status: 'To Review' | 'Reviewed' | 'Clarification Pending' | 'Submitted to Approver'
  statusCode?: number | null
  statusForAdgeLabel?: string
  isActionable?: boolean
  riskLevel: RiskLevel | null
  hasMissingDocs: boolean
  requestedBudget: number
  capex: number
  opex: number
  glCodeCount: number
  submittedBy: string
  submittedDate: string
  submittedDateRaw: string
  updatedDate: string
  aiScore: number
  aiConfidence: number
  clarificationWith?: string
  clarificationOverdue?: number
  budgetType: string
}

export interface ApprovalQueueProject {
  id: string
  ictBudgetId: string
  name: string
  entity: string
  status: 'Pending' | 'Approved' | 'Clarification Pending' | 'Submitted to DGE'
  statusCode?: number | null
  statusForAdgeLabel?: string
  budgetType: string
  budgetCategory: string
  requestedBudget: number
  riskLevel: RiskLevel | null
  aiConfidence: number
  summary: string
  glCodeCount: number
  reviewedBy: string
  submittedDate: string
  submittedDateRaw: string
  updatedDate?: string
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
  files?: File[]
}

export interface RoleProjectFilters {
  search?: string
  status?: ProjectStatus[]
}
