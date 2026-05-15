import type { ProjectsApi } from '@/api/projectsApi'
import type {
  Project,
  CreateProjectPayload,
  ClarificationPayload,
  RoleProjectFilters,
  ProjectLookups,
  ReviewQueueProject,
  ApprovalQueueProject,
} from '@/domain/types'
import { projects, reviewQueueProjects, approvalQueueProjects } from '@/data/db'

function applyFilters(items: Project[], filters?: RoleProjectFilters) {
  if (!filters) return items

  return items.filter((item) => {
    const matchesSearch = !filters.search
      || item.name.toLowerCase().includes(filters.search.toLowerCase())
      || item.id.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = !filters.status?.length || filters.status.includes(item.status)

    return matchesSearch && matchesStatus
  })
}

const lookups: ProjectLookups = {
  strategicPriorities: ['Government Services Excellence', 'Economic Diversification', 'Smart City Initiatives', 'Sustainability & Environment', 'Digital Infrastructure'],
  strategicClassifications: ['Cloud & Hosting', 'AI & Automation', 'Security & Compliance', 'Enterprise Systems', 'Analytics'],
  workStreams: ['Digital Transformation', 'Smart Government', 'Data Governance', 'Infrastructure Modernization'],
  budgetItemTypes: ['New', 'Enhancement', 'Continuation', 'Phase 2'],
  technologyCompanies: ['Microsoft', 'Google', 'Amazon', 'Oracle', 'Cisco'],
  technologyProducts: ['Azure', 'Google Cloud', 'AWS', 'Oracle Fusion', 'Prisma'],
  categories: ['Data Management', 'Citizen Services', 'Cybersecurity', 'Enterprise Applications', 'Infrastructure'],
  budgetTypes: ['CapEx', 'OpEx', 'Mixed'],
}

const noop = async () => {}

export const mockProjectsApi: ProjectsApi = {
  async getRespondentProjects(filters?: RoleProjectFilters) {
    return applyFilters(projects, filters)
  },

  async getReviewerProjects(filters?: RoleProjectFilters) {
    return applyFilters(projects, filters)
  },

  async getApproverProjects(filters?: RoleProjectFilters) {
    return applyFilters(projects, filters)
  },

  async getProjectById(projectId: string) {
    return projects.find((p) => p.id === projectId) ?? null
  },

  async getReviewQueue() {
    return reviewQueueProjects as ReviewQueueProject[]
  },

  async getApprovalQueue() {
    return approvalQueueProjects as ApprovalQueueProject[]
  },

  async getProjectLookups() {
    return lookups
  },

  async createProject(payload: CreateProjectPayload) {
    const fallback = projects[0]
    return {
      ...fallback,
      id: `BI-${String(projects.length + 1).padStart(3, '0')}`,
      name: payload.name,
      strategicPriority: payload.strategicPriority,
      classification: payload.classification,
      category: payload.category,
      plannedStartDate: payload.plannedStartDate,
      plannedEndDate: payload.plannedEndDate,
      summary: payload.summary,
      budgetType: payload.budgetType,
      status: 'Draft',
      pendingWith: 'Respondent',
    }
  },

  submitToReviewer: noop,
  reviewerCompleteReview: noop,
  reviewerApprove: noop,
  reviewerRaiseClarification: async (_projectId: string, _payload: ClarificationPayload) => noop(),
  approverApprove: noop,
  approverRaiseClarification: async (_projectId: string, _payload: ClarificationPayload) => noop(),
  approverSubmitToDge: async (_projectIds: string[]) => noop(),
}
