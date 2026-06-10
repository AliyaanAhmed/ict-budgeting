export type StrategyProject = {
  id: string
  name: string
  entity: string
  strategicPriority: string
  classification: string
  smeTeam: string
  statuscode: string
  progress: number
  risk: 'High' | 'Medium' | 'Low'
  budget: number
  updatedOn: string
  aiSignal: string
}

export type EntityProgress = {
  name: string
  code: string
  owner: string
  currentStage: 'Planning' | 'DGE Review' | 'Allocation' | 'Utilization'
  totalProjects: number
  strategicAligned: number
  smeRouted: number
  qcReady: number
  completion: number
  trend: 'Up' | 'Stable' | 'Down'
  insight: string
  budget: number
  stageBreakdown: {
    planning: number
    dgeReview: number
    allocation: number
    utilization: number
  }
  aiInsights: string[]
}

export type SmePriorityTrack = {
  priority: string
  ownerTeam: string
  status: 'On Track' | 'Attention' | 'Backlog'
  projects: number
  routed: number
  completed: number
  awaitingSME: number
  averageConfidence: number
  nextAction: string
}

export type QualityCheckItem = {
  id: string
  name: string
  entity: string
  statuscode: string
  classification: string
  priority: string
  severity: 'Critical' | 'Warning' | 'Info'
  confidence: number
  qaOutcome: string
  adjustment: string
}

export const strategyStats = [
  { label: 'Projects in cycle', value: '48', note: 'Across all entities', accent: '#286CFF', icon: ClipboardList },
  { label: 'Aligned priorities', value: '31', note: 'Ready for SME routing', accent: '#14B8A6', icon: Sparkles },
  { label: 'SME queues active', value: '7', note: 'One per strategic priority', accent: '#9333EA', icon: Users },
  { label: 'Quality check items', value: '12', note: 'Awaiting governance review', accent: '#F97316', icon: BrainCircuit },
] as const

export const strategyWorkflowCards = [
  {
    title: 'Strategic Alignment',
    value: 18,
    badge: 'Bulk updates ready',
    href: '/strategy-team/strategic-alignment',
    accent: '#286CFF',
    description: 'Review submitted projects, update strategic mapping, and route projects to SMEs.',
  },
  {
    title: 'Entity Tracker',
    value: 7,
    badge: 'Entities live',
    href: '/strategy-team/entity-tracker',
    accent: '#14B8A6',
    description: 'Track portfolio progress across all entities and their governance readiness.',
  },
  {
    title: 'SME Tracker',
    value: 7,
    badge: 'Priority teams',
    href: '/strategy-team/sme-tracker',
    accent: '#9333EA',
    description: 'See each strategic priority and the SME team handling it right now.',
  },
  {
    title: 'Quality Check',
    value: 12,
    badge: 'QC actions',
    href: '/strategy-team/quality-check',
    accent: '#F97316',
    description: 'Check alignment quality, evidence strength, and recommendation confidence.',
  },
] as const

export const strategyProjects: StrategyProject[] = [
  {
    id: 'ST-001',
    name: 'GovGPT Expansion for Public Services',
    entity: 'Crown Prince Court',
    strategicPriority: 'Artificial Intelligence',
    classification: 'Use Case Development',
    smeTeam: 'AI & Digital Services SME',
    statuscode: 'Under Strategy Review',
    progress: 72,
    risk: 'Medium',
    budget: 3_500_000,
    updatedOn: '04 Jun 2026',
    aiSignal: 'Potential strategic overlap with whole-of-government AI platforms.',
  },
  {
    id: 'ST-002',
    name: 'Unified Citizen Journey Design',
    entity: 'Abu Dhabi Global Market',
    strategicPriority: 'Digital Experience',
    classification: 'Service Design',
    smeTeam: 'CX & Design SME',
    statuscode: 'Awaiting SME Review',
    progress: 61,
    risk: 'Low',
    budget: 1_900_000,
    updatedOn: '03 Jun 2026',
    aiSignal: 'Strong evidence and clear journey ownership.',
  },
  {
    id: 'ST-003',
    name: 'Data Exchange Governance Hub',
    entity: 'Department of Finance',
    strategicPriority: 'Data & Analytics',
    classification: 'Integration Enablement',
    smeTeam: 'Data & Integration SME',
    statuscode: 'QC Needed',
    progress: 88,
    risk: 'High',
    budget: 4_250_000,
    updatedOn: '02 Jun 2026',
    aiSignal: 'Budget and scope need tighter traceability before SME routing.',
  },
  {
    id: 'ST-004',
    name: 'Cloud Shared Services Roadmap',
    entity: 'Department of Government Enablement',
    strategicPriority: 'Digital Infrastructure',
    classification: 'Cloud & Hosting',
    smeTeam: 'Platform SME',
    statuscode: 'Strategic Alignment Review',
    progress: 56,
    risk: 'Medium',
    budget: 2_800_000,
    updatedOn: '01 Jun 2026',
    aiSignal: 'Should be consolidated with existing shared cloud initiatives.',
  },
  {
    id: 'ST-005',
    name: 'Cyber Resilience Program',
    entity: 'Abu Dhabi Judicial Department',
    strategicPriority: 'Digital Security',
    classification: 'Security & Compliance',
    smeTeam: 'Security SME',
    statuscode: 'Under SME Review',
    progress: 79,
    risk: 'High',
    budget: 5_100_000,
    updatedOn: '31 May 2026',
    aiSignal: 'Strong demand, but policy alignment and control mapping are incomplete.',
  },
]

export const entityProgressRows: EntityProgress[] = [
  {
    name: 'Crown Prince Court',
    code: 'CPC',
    owner: 'Strategic governance',
    currentStage: 'Planning',
    totalProjects: 8,
    strategicAligned: 6,
    smeRouted: 5,
    qcReady: 3,
    completion: 63,
    trend: 'Up',
    insight: 'Two AI-related projects need policy alignment before SME routing.',
    budget: 8_950_000,
    stageBreakdown: {
      planning: 3,
      dgeReview: 2,
      allocation: 2,
      utilization: 1,
    },
    aiInsights: [
      'Planning queue remains the largest workload, but three items are ready to advance.',
      'AI and governance overlap should be closed before the next handoff.',
      'Entity shows stable review momentum with low utilization exposure.',
    ],
  },
  {
    name: 'Abu Dhabi Global Market',
    code: 'ADGM',
    owner: 'Entity transformation',
    currentStage: 'Planning',
    totalProjects: 6,
    strategicAligned: 5,
    smeRouted: 4,
    qcReady: 4,
    completion: 78,
    trend: 'Up',
    insight: 'Strong submission quality and good balance across strategic priorities.',
    budget: 4_320_000,
    stageBreakdown: {
      planning: 2,
      dgeReview: 2,
      allocation: 1,
      utilization: 1,
    },
    aiInsights: [
      'Entity quality is strong and most items already have clear strategic mapping.',
      'One allocation item needs final DGE confirmation before closure.',
      'Review flow is healthy and ready for faster downstream routing.',
    ],
  },
  {
    name: 'Department of Finance',
    code: 'DOF',
    owner: 'Portfolio operations',
    currentStage: 'DGE Review',
    totalProjects: 7,
    strategicAligned: 5,
    smeRouted: 4,
    qcReady: 2,
    completion: 58,
    trend: 'Stable',
    insight: 'Large integration workstream needs quicker SME turnaround.',
    budget: 11_450_000,
    stageBreakdown: {
      planning: 1,
      dgeReview: 3,
      allocation: 2,
      utilization: 1,
    },
    aiInsights: [
      'DGE review is the dominant stage for this entity right now.',
      'Multiple integration items are moving, but SME turnaround is slowing closure.',
      'Allocation items still need stronger evidence before downstream review.',
    ],
  },
  {
    name: 'Department of Education',
    code: 'ADE',
    owner: 'Digital learning',
    currentStage: 'Allocation',
    totalProjects: 5,
    strategicAligned: 4,
    smeRouted: 3,
    qcReady: 3,
    completion: 74,
    trend: 'Down',
    insight: 'Clarification loops are delaying one major priority item.',
    budget: 3_780_000,
    stageBreakdown: {
      planning: 0,
      dgeReview: 1,
      allocation: 2,
      utilization: 2,
    },
    aiInsights: [
      'Allocation stage has become the primary focus for this entity.',
      'One major item is still cycling through clarifications.',
      'Utilization readiness is good for the already approved items.',
    ],
  },
]

export const smeTracks: SmePriorityTrack[] = [
  {
    priority: 'Artificial Intelligence',
    ownerTeam: 'AI & Digital Services SME',
    status: 'Attention',
    projects: 7,
    routed: 5,
    completed: 3,
    awaitingSME: 2,
    averageConfidence: 82,
    nextAction: 'Resolve overlap with central AI platforms and confirm recommended priority.',
  },
  {
    priority: 'Digital Infrastructure',
    ownerTeam: 'Platform SME',
    status: 'On Track',
    projects: 8,
    routed: 6,
    completed: 5,
    awaitingSME: 1,
    averageConfidence: 90,
    nextAction: 'Confirm cloud scope boundaries and route only truly strategic expansions.',
  },
  {
    priority: 'Digital Security',
    ownerTeam: 'Security SME',
    status: 'Backlog',
    projects: 6,
    routed: 4,
    completed: 2,
    awaitingSME: 2,
    averageConfidence: 77,
    nextAction: 'Check control mapping and evidence completeness for high-risk items.',
  },
  {
    priority: 'Data & Analytics',
    ownerTeam: 'Data & Integration SME',
    status: 'On Track',
    projects: 5,
    routed: 4,
    completed: 4,
    awaitingSME: 0,
    averageConfidence: 86,
    nextAction: 'Close remaining integration clarifications and finalize recommendation notes.',
  },
  {
    priority: 'Digital Experience',
    ownerTeam: 'CX & Design SME',
    status: 'Attention',
    projects: 4,
    routed: 3,
    completed: 2,
    awaitingSME: 1,
    averageConfidence: 81,
    nextAction: 'Review journey evidence and check service design scope completeness.',
  },
]

export const qualityCheckItems: QualityCheckItem[] = [
  {
    id: 'QC-001',
    name: 'GovGPT Expansion for Public Services',
    entity: 'Crown Prince Court',
    statuscode: 'Awaiting QC',
    classification: 'Use Case Development',
    priority: 'Artificial Intelligence',
    severity: 'Critical',
    confidence: 78,
    qaOutcome: 'Needs clarification before routing to SME.',
    adjustment: 'Strengthen AI platform boundary and central services references.',
  },
  {
    id: 'QC-002',
    name: 'Cloud Shared Services Roadmap',
    entity: 'Department of Government Enablement',
    statuscode: 'Awaiting QC',
    classification: 'Cloud & Hosting',
    priority: 'Digital Infrastructure',
    severity: 'Warning',
    confidence: 84,
    qaOutcome: 'Mostly sound, but consolidation evidence is thin.',
    adjustment: 'Add stronger evidence for shared-service reuse and cost avoidance.',
  },
  {
    id: 'QC-003',
    name: 'Unified Citizen Journey Design',
    entity: 'Abu Dhabi Global Market',
    statuscode: 'QC Passed',
    classification: 'Service Design',
    priority: 'Digital Experience',
    severity: 'Info',
    confidence: 91,
    qaOutcome: 'Clear scope and strong alignment notes.',
    adjustment: 'No major changes required.',
  },
  {
    id: 'QC-004',
    name: 'Cyber Resilience Program',
    entity: 'Abu Dhabi Judicial Department',
    statuscode: 'Awaiting SME Review',
    classification: 'Security & Compliance',
    priority: 'Digital Security',
    severity: 'Critical',
    confidence: 73,
    qaOutcome: 'Evidence is solid but policy mapping is incomplete.',
    adjustment: 'Add control mapping and clarify governance dependencies.',
  },
]
import { BrainCircuit, ClipboardList, Sparkles, Users } from 'lucide-react'
