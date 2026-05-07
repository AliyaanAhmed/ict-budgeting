export const currentCycle = {
  id: 'CY-2026',
  name: 'ICT Budget Planning 2026',
  year: 2026,
  stage: 'Planning',
  submissionDeadline: '2026-05-15',
  daysRemaining: 15,
  completionPercentage: 62,
}

export const currentUser = {
  id: 'U-001',
  name: 'Mahmood Al Rashidi',
  initials: 'MR',
  entity: 'Department of Digital Government',
  roles: ['Respondent', 'Reviewer', 'Approver'] as Role[],
  activeRole: 'Respondent' as Role,
}

export type Role = 'Respondent' | 'Reviewer' | 'Approver'

export type ProjectStatus =
  | 'Draft'
  | 'Submitted to Reviewer'
  | 'Clarification Required'
  | 'Submitted to Approver'
  | 'Approved'
  | 'Needs Work'

export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface BudgetItem {
  id: string
  accountName: string
  l1: string
  l2: string
  l3: string
  glCode: string
  ebsFusionCode: string
  classification: 'CapEx' | 'OpEx'
  budgetRequested: number
}

export interface ClarificationReply {
  id: string
  fromRole: 'Respondent' | 'Reviewer' | 'Approver'
  fromName: string
  message: string
  date: string
}

export interface Clarification {
  id: string
  raisedBy: 'Reviewer' | 'Approver'
  raisedByName: string
  raisedTo: string
  message: string
  status: 'Open' | 'Closed'
  date: string
  closedAt?: string
  replies: ClarificationReply[]
}

export interface ProjectDocument {
  name: string
  size: string
  uploadedDate: string
}

export interface Project {
  id: string
  ictBudgetId?: string
  name: string
  strategicPriority: string
  classification: string
  category: string
  requestedBudget: number
  budgetItems: BudgetItem[]
  status: ProjectStatus
  approvalStatus: string
  pendingWith: 'Respondent' | 'Reviewer' | 'Approver' | null
  submittedBy: string
  submittedDate: string
  lastModified: string
  plannedStartDate: string
  plannedEndDate: string
  workStream: string
  budgetType: 'New' | 'Enhancement' | 'Continuation' | 'Phase 2'
  technology: { company: string; product: string }
  summary: string
  documents: ProjectDocument[]
  clarifications: Clarification[]
  aiScore: number
  riskLevel: RiskLevel
  capex: number
  opex: number
}

export const projects: Project[] = [
  {
    id: 'BI-001',
    ictBudgetId: '250b0713-e249-f111-bec6-7ced8d57c0d1',
    name: 'Enterprise Data Platform Upgrade',
    strategicPriority: 'Digital Infrastructure',
    classification: 'Cloud & Hosting',
    category: 'Data Management',
    requestedBudget: 2_400_000,
    budgetItems: [
      {
        id: 'BI-001-1',
        accountName: 'Infrastructure',
        l1: 'Technology',
        l2: 'Infrastructure',
        l3: 'Cloud Services',
        glCode: '6110.001',
        ebsFusionCode: 'FC-INF-001',
        classification: 'CapEx',
        budgetRequested: 1_600_000,
      },
      {
        id: 'BI-001-2',
        accountName: 'Implementation Support',
        l1: 'Services',
        l2: 'Professional',
        l3: 'Implementation',
        glCode: '6200.002',
        ebsFusionCode: 'FC-INP-001',
        classification: 'OpEx',
        budgetRequested: 800_000,
      },
    ],
    status: 'Submitted to Reviewer',
    approvalStatus: 'Submitted to Reviewer',
    pendingWith: 'Reviewer',
    submittedBy: 'Ahmed Al Mazrouei',
    submittedDate: '2026-04-10',
    lastModified: '2026-04-10',
    plannedStartDate: '2026-07-01',
    plannedEndDate: '2027-03-31',
    workStream: 'Digital Transformation',
    budgetType: 'Enhancement',
    technology: { company: 'Microsoft', product: 'Azure' },
    summary:
      'Upgrade the enterprise data platform to support advanced analytics and real-time data processing. Current infrastructure reaching capacity limits requiring modernization to support government digital services.',
    documents: [
      { name: 'Enterprise_Data_Platform_Proposal.pdf', size: '2.1 MB', uploadedDate: 'Apr 10, 2026' },
      { name: 'Technical_Specifications.docx', size: '890 KB', uploadedDate: 'Apr 10, 2026' },
    ],
    clarifications: [],
    aiScore: 94,
    riskLevel: 'Low',
    capex: 1_600_000,
    opex: 800_000,
  },
  {
    id: 'BI-002',
    name: 'AI Citizen Services Portal',
    strategicPriority: 'Smart Government',
    classification: 'AI & Automation',
    category: 'Citizen Services',
    requestedBudget: 1_800_000,
    budgetItems: [
      {
        id: 'BI-002-1',
        accountName: 'Software Development',
        l1: 'Technology',
        l2: 'Software',
        l3: 'Development',
        glCode: '6120.003',
        ebsFusionCode: 'FC-SW-001',
        classification: 'CapEx',
        budgetRequested: 1_200_000,
      },
      {
        id: 'BI-002-2',
        accountName: 'AI Platform Licensing',
        l1: 'Technology',
        l2: 'Software',
        l3: 'Licensing',
        glCode: '6120.004',
        ebsFusionCode: 'FC-SW-002',
        classification: 'OpEx',
        budgetRequested: 600_000,
      },
    ],
    status: 'Submitted to Reviewer',
    approvalStatus: 'Submitted to Reviewer',
    pendingWith: 'Reviewer',
    submittedBy: 'Fatima Al Nuaimi',
    submittedDate: '2026-04-13',
    lastModified: '2026-04-13',
    plannedStartDate: '2026-06-01',
    plannedEndDate: '2027-05-31',
    workStream: 'Smart Government',
    budgetType: 'New',
    technology: { company: 'Google', product: 'Vertex AI' },
    summary:
      'Build an AI-powered citizen services portal that enables residents to interact with government services using natural language. The portal will handle inquiries, applications, and status tracking across multiple government departments.',
    documents: [
      { name: 'AI_Portal_Business_Case.pdf', size: '3.2 MB', uploadedDate: 'Apr 13, 2026' },
      { name: 'Vendor_Proposal.pdf', size: '1.5 MB', uploadedDate: 'Apr 13, 2026' },
    ],
    clarifications: [],
    aiScore: 88,
    riskLevel: 'Medium',
    capex: 1_200_000,
    opex: 600_000,
  },
  {
    id: 'BI-003',
    name: 'Cybersecurity Framework Enhancement',
    strategicPriority: 'Digital Security',
    classification: 'Security & Compliance',
    category: 'Cybersecurity',
    requestedBudget: 950_000,
    budgetItems: [
      {
        id: 'BI-003-1',
        accountName: 'Security Tools & Licenses',
        l1: 'Technology',
        l2: 'Security',
        l3: 'Tools',
        glCode: '6130.001',
        ebsFusionCode: 'FC-SEC-001',
        classification: 'CapEx',
        budgetRequested: 600_000,
      },
      {
        id: 'BI-003-2',
        accountName: 'Managed Security Services',
        l1: 'Services',
        l2: 'Security',
        l3: 'Managed',
        glCode: '6130.002',
        ebsFusionCode: 'FC-SEC-002',
        classification: 'OpEx',
        budgetRequested: 350_000,
      },
    ],
    status: 'Submitted to Reviewer',
    approvalStatus: 'Submitted to Reviewer',
    pendingWith: 'Reviewer',
    submittedBy: 'Hassan Al Blooshi',
    submittedDate: '2026-04-08',
    lastModified: '2026-04-08',
    plannedStartDate: '2026-05-15',
    plannedEndDate: '2026-12-31',
    workStream: 'Digital Security',
    budgetType: 'Enhancement',
    technology: { company: 'Palo Alto Networks', product: 'Prisma' },
    summary:
      'Enhance the existing cybersecurity framework to address new threat vectors and comply with UAE Cybersecurity Authority guidelines. Includes implementation of zero-trust architecture and advanced threat detection capabilities.',
    documents: [
      { name: 'Cybersecurity_Enhancement_Plan.pdf', size: '1.8 MB', uploadedDate: 'Apr 8, 2026' },
      { name: 'Compliance_Requirements.docx', size: '450 KB', uploadedDate: 'Apr 8, 2026' },
      { name: 'Cost_Breakdown.xlsx', size: '280 KB', uploadedDate: 'Apr 8, 2026' },
    ],
    clarifications: [],
    aiScore: 91,
    riskLevel: 'Low',
    capex: 600_000,
    opex: 350_000,
  },
  {
    id: 'BI-004',
    name: 'ERP Integration Programme',
    strategicPriority: 'Operational Excellence',
    classification: 'Enterprise Systems',
    category: 'Enterprise Applications',
    requestedBudget: 3_200_000,
    budgetItems: [
      {
        id: 'BI-004-1',
        accountName: 'ERP Licensing',
        l1: 'Technology',
        l2: 'Software',
        l3: 'ERP',
        glCode: '6140.001',
        ebsFusionCode: 'FC-ERP-001',
        classification: 'CapEx',
        budgetRequested: 2_000_000,
      },
      {
        id: 'BI-004-2',
        accountName: 'Implementation & Consulting',
        l1: 'Services',
        l2: 'Professional',
        l3: 'ERP',
        glCode: '6200.005',
        ebsFusionCode: 'FC-ERP-002',
        classification: 'OpEx',
        budgetRequested: 1_200_000,
      },
    ],
    status: 'Submitted to Approver',
    approvalStatus: 'Submitted to Approver',
    pendingWith: 'Approver',
    submittedBy: 'Maryam Al Suwaidi',
    submittedDate: '2026-04-05',
    lastModified: '2026-04-18',
    plannedStartDate: '2026-08-01',
    plannedEndDate: '2028-01-31',
    workStream: 'Operational Excellence',
    budgetType: 'New',
    technology: { company: 'Oracle', product: 'Oracle Fusion' },
    summary:
      'Comprehensive ERP integration programme to unify financial, HR, and procurement systems across the department. Replace multiple legacy systems with a single Oracle Fusion platform for improved efficiency and reporting.',
    documents: [
      { name: 'ERP_Integration_RFP.pdf', size: '4.1 MB', uploadedDate: 'Apr 5, 2026' },
      { name: 'Vendor_Evaluation.xlsx', size: '1.2 MB', uploadedDate: 'Apr 5, 2026' },
    ],
    clarifications: [
      {
        id: 'CLR-001',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Aisha Al Hashmi',
        raisedTo: 'Respondent',
        message:
          'Please provide a detailed implementation timeline for the ERP migration, including data migration plan and parallel run period.',
        status: 'Open' as const,
        date: '2026-04-18',
        replies: [
          {
            id: 'CLR-001-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Maryam Al Suwaidi',
            message: 'Thank you for raising this. We have prepared a phased implementation plan spanning 4 months with a 6-week parallel run period. I will upload the detailed Gantt chart and vendor readiness confirmation by Friday.',
            date: '2026-04-20',
          },
          {
            id: 'CLR-001-R2',
            fromRole: 'Reviewer' as const,
            fromName: 'Aisha Al Hashmi',
            message: 'Thank you for the update. Please also include the rollback contingency plan in case of data migration issues, and confirm if the vendor has completed similar government migrations.',
            date: '2026-04-21',
          },
        ],
      },
      {
        id: 'CLR-001-B',
        raisedBy: 'Approver' as const,
        raisedByName: 'Fatima Al Nuaimi',
        raisedTo: 'Respondent',
        message: 'The ERP licensing cost of AED 2M for Oracle Fusion appears higher than the government framework pricing. Has the vendor provided an official government pricing schedule to justify this amount?',
        status: 'Open' as const,
        date: '2026-04-19',
        replies: [
          {
            id: 'CLR-001-B-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Maryam Al Suwaidi',
            message: 'The vendor has applied GITEX government special pricing which is 18% below their standard commercial rate. We hold the official Oracle government pricing schedule and will attach it to the submission today.',
            date: '2026-04-21',
          },
          {
            id: 'CLR-001-B-R2',
            fromRole: 'Approver' as const,
            fromName: 'Fatima Al Nuaimi',
            message: 'Confirmed. Please attach the Oracle government pricing letter as a supporting document so it is part of the official submission record.',
            date: '2026-04-22',
          },
        ],
      },
      {
        id: 'CLR-001-C',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Aisha Al Hashmi',
        raisedTo: 'Respondent',
        message: 'The integration scope mentions HR, Finance, and Procurement. Are there any additional legacy systems not listed that will require integration or data migration as part of this programme?',
        status: 'Open' as const,
        date: '2026-04-22',
        replies: [],
      },
    ],
    aiScore: 76,
    riskLevel: 'Medium',
    capex: 2_000_000,
    opex: 1_200_000,
  },
  {
    id: 'BI-005',
    name: 'Mobile Workforce Solution',
    strategicPriority: 'Digital Transformation',
    classification: 'Mobile & Apps',
    category: 'Workforce Productivity',
    requestedBudget: 1_200_000,
    budgetItems: [
      {
        id: 'BI-005-1',
        accountName: 'App Development',
        l1: 'Technology',
        l2: 'Software',
        l3: 'Mobile',
        glCode: '6120.010',
        ebsFusionCode: 'FC-MOB-001',
        classification: 'CapEx',
        budgetRequested: 800_000,
      },
      {
        id: 'BI-005-2',
        accountName: 'Device Management',
        l1: 'Technology',
        l2: 'Hardware',
        l3: 'Devices',
        glCode: '6110.010',
        ebsFusionCode: 'FC-MOB-002',
        classification: 'OpEx',
        budgetRequested: 400_000,
      },
    ],
    status: 'Clarification Required',
    approvalStatus: 'Clarification Required',
    pendingWith: 'Respondent',
    submittedBy: 'Noura Al Kaabi',
    submittedDate: '2026-04-02',
    lastModified: '2026-04-22',
    plannedStartDate: '2026-06-15',
    plannedEndDate: '2026-12-15',
    workStream: 'Digital Transformation',
    budgetType: 'New',
    technology: { company: 'Microsoft', product: 'Intune' },
    summary:
      'Deploy a mobile workforce solution enabling field staff to access government systems, submit reports, and collaborate remotely. Includes MDM solution and custom mobile application development.',
    documents: [{ name: 'Mobile_Solution_Proposal.pdf', size: '2.3 MB', uploadedDate: 'Apr 2, 2026' }],
    clarifications: [
      {
        id: 'CLR-002',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Mohammed Al-Farsi',
        raisedTo: 'Respondent',
        message:
          'The budget for device management seems high at AED 400,000. Please provide a full breakdown of device count, model specifications, and unit costs. Also clarify whether these devices are to be procured new or if any are already owned by the department.',
        status: 'Open' as const,
        date: '2026-04-22',
        replies: [
          {
            id: 'CLR-002-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Noura Al Kaabi',
            message: 'Thank you for the query. The AED 400,000 covers 120 ruggedised Samsung Galaxy Tab A9+ tablets at AED 1,800 each (AED 216,000), Microsoft Intune MDM licensing for 2 years at AED 95,000, protective cases and peripherals at AED 42,000, and initial configuration and staging services at AED 47,000. All devices are new procurements — the department currently has no field-grade tablets in inventory.',
            date: '2026-04-24',
          },
          {
            id: 'CLR-002-R2',
            fromRole: 'Reviewer' as const,
            fromName: 'Mohammed Al-Farsi',
            message: 'Thank you for the breakdown. Can you confirm whether the Samsung Galaxy Tab A9+ has been approved on the Government Device Register, and whether an existing government framework agreement covers the procurement to avoid a standalone tender?',
            date: '2026-04-25',
          },
          {
            id: 'CLR-002-R3',
            fromRole: 'Respondent' as const,
            fromName: 'Noura Al Kaabi',
            message: 'Confirmed — the Samsung Galaxy Tab A9+ is on the Government Device Register (GDR-2025-114). We will use the Whole of Government ICT Hardware Framework (WGICTF-2024) for procurement, which eliminates the need for a standalone tender and allows direct award to the approved supplier. I will attach the framework reference and GDR certificate to the submission.',
            date: '2026-04-26',
          },
        ],
      },
      {
        id: 'CLR-002-B',
        raisedBy: 'Approver' as const,
        raisedByName: 'Fatima Al Nuaimi',
        raisedTo: 'Respondent',
        message: 'The AED 800,000 for custom mobile app development is substantial. Has a build-vs-buy analysis been conducted? Several GovTech solutions already offer configurable field workforce apps. Please justify the decision to develop a fully custom application rather than adopting an existing platform.',
        status: 'Open' as const,
        date: '2026-04-23',
        replies: [
          {
            id: 'CLR-002-B-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Noura Al Kaabi',
            message: 'A formal build-vs-buy analysis was completed in March 2026 covering five commercial platforms including ServiceNow Field Service, Salesforce Mobile, and two GovTech solutions. None of the evaluated platforms support the deep integration required with our legacy HRMS (Oracle 11g) and the real-time geofencing mandate for field compliance tracking. The custom build was selected on this basis and the full analysis report is available for review.',
            date: '2026-04-25',
          },
          {
            id: 'CLR-002-B-R2',
            fromRole: 'Approver' as const,
            fromName: 'Fatima Al Nuaimi',
            message: 'Understood. Please attach the build-vs-buy analysis report as a mandatory supporting document. Also confirm the development vendor is on the approved government ICT supplier list and that the contract will be subject to a source code escrow arrangement.',
            date: '2026-04-27',
          },
          {
            id: 'CLR-002-B-R3',
            fromRole: 'Respondent' as const,
            fromName: 'Noura Al Kaabi',
            message: 'The selected vendor, Techbridge LLC, is on the Government ICT Supplier Register (GISR-DEV-0094). We will include a source code escrow clause in the contract and have already obtained indicative escrow pricing from Iron Mountain. I will attach the build-vs-buy report, supplier registration certificate, and escrow arrangement summary today.',
            date: '2026-04-28',
          },
        ],
      },
      {
        id: 'CLR-002-C',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Sara Al Mahmoud',
        raisedTo: 'Respondent',
        message: 'The submission does not address data residency and information classification for data accessed via the mobile app. Field staff will handle Confidential and Restricted government data on personal or shared devices. Please confirm the data classification levels involved and how the solution meets UAE PDPL and National Information Assurance Policy requirements.',
        status: 'Open' as const,
        date: '2026-04-27',
        replies: [
          {
            id: 'CLR-002-C-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Noura Al Kaabi',
            message: 'The mobile app will handle data classified as Internal and Confidential under the National Information Assurance Policy. All data in transit is encrypted using TLS 1.3, and at-rest encryption is enforced on device via Intune conditional access policies. The solution has been assessed against the UAE PDPL data residency requirement — all data will be stored and processed within UAE data centres only, with no cross-border transfers. A full NIAP compliance checklist is being finalised with our Information Security team and will be attached within 48 hours.',
            date: '2026-04-29',
          },
        ],
      },
      {
        id: 'CLR-002-D',
        raisedBy: 'Approver' as const,
        raisedByName: 'Hassan Al Blooshi',
        raisedTo: 'Respondent',
        message: 'Please confirm whether the Microsoft Intune licensing will be purchased through the existing government EA (Enterprise Agreement) with Microsoft, or as a standalone subscription. The EA typically provides a 30–35% discount over commercial pricing and I want to ensure the budget reflects the correct rate.',
        status: 'Closed' as const,
        date: '2026-04-24',
        closedAt: '2026-04-29',
        replies: [
          {
            id: 'CLR-002-D-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Noura Al Kaabi',
            message: 'Confirmed — Intune licensing will be added to the existing Government Microsoft EA managed by the Digital Government Authority. The quoted AED 95,000 already reflects EA-tier government pricing, which is 32% below commercial list price. I have confirmed this with the DGA licensing desk and will attach their written confirmation as supporting evidence.',
            date: '2026-04-26',
          },
        ],
      },
    ],
    aiScore: 52,
    riskLevel: 'High',
    capex: 800_000,
    opex: 400_000,
  },
  {
    id: 'BI-006',
    name: 'Data Analytics Hub',
    strategicPriority: 'Data & Analytics',
    classification: 'BI & Reporting',
    category: 'Analytics',
    requestedBudget: 890_000,
    budgetItems: [
      {
        id: 'BI-006-1',
        accountName: 'Analytics Platform',
        l1: 'Technology',
        l2: 'Software',
        l3: 'Analytics',
        glCode: '6120.020',
        ebsFusionCode: 'FC-ANA-001',
        classification: 'CapEx',
        budgetRequested: 540_000,
      },
      {
        id: 'BI-006-2',
        accountName: 'Data Engineering Services',
        l1: 'Services',
        l2: 'Professional',
        l3: 'Analytics',
        glCode: '6200.020',
        ebsFusionCode: 'FC-ANA-002',
        classification: 'OpEx',
        budgetRequested: 350_000,
      },
    ],
    status: 'Approved',
    approvalStatus: 'Approved',
    pendingWith: null,
    submittedBy: 'Saeed Al Qubaisi',
    submittedDate: '2026-03-20',
    lastModified: '2026-04-10',
    plannedStartDate: '2026-05-01',
    plannedEndDate: '2026-10-31',
    workStream: 'Data Governance',
    budgetType: 'New',
    technology: { company: 'Microsoft', product: 'Power BI' },
    summary:
      'Establish a central Data Analytics Hub for the department, providing self-service BI capabilities, data visualization dashboards, and automated reporting for management decision-making.',
    documents: [
      { name: 'Analytics_Hub_Proposal.pdf', size: '1.9 MB', uploadedDate: 'Mar 20, 2026' },
      { name: 'BI_Requirements.docx', size: '680 KB', uploadedDate: 'Mar 20, 2026' },
      { name: 'Budget_Breakdown.xlsx', size: '320 KB', uploadedDate: 'Mar 20, 2026' },
    ],
    clarifications: [],
    aiScore: 89,
    riskLevel: 'Low',
    capex: 540_000,
    opex: 350_000,
  },
  {
    id: 'BI-007',
    name: 'Network Modernization',
    strategicPriority: 'Digital Infrastructure',
    classification: 'Network & Connectivity',
    category: 'Infrastructure',
    requestedBudget: 2_100_000,
    budgetItems: [
      {
        id: 'BI-007-1',
        accountName: 'Network Equipment',
        l1: 'Technology',
        l2: 'Hardware',
        l3: 'Networking',
        glCode: '6110.030',
        ebsFusionCode: 'FC-NET-001',
        classification: 'CapEx',
        budgetRequested: 1_500_000,
      },
      {
        id: 'BI-007-2',
        accountName: 'WAN Connectivity',
        l1: 'Technology',
        l2: 'Connectivity',
        l3: 'WAN',
        glCode: '6150.001',
        ebsFusionCode: 'FC-NET-002',
        classification: 'OpEx',
        budgetRequested: 600_000,
      },
    ],
    status: 'Needs Work',
    approvalStatus: 'Needs Work',
    pendingWith: 'Respondent',
    submittedBy: 'Abdulla Al Romaithi',
    submittedDate: '2026-04-01',
    lastModified: '2026-04-20',
    plannedStartDate: '2026-07-01',
    plannedEndDate: '2027-06-30',
    workStream: 'Infrastructure Modernization',
    budgetType: 'Enhancement',
    technology: { company: 'Cisco', product: 'Catalyst' },
    summary:
      'Modernize the department network infrastructure to support increased bandwidth demands, improved security posture, and SD-WAN capabilities across all office locations.',
    documents: [{ name: 'Network_Assessment.pdf', size: '1.4 MB', uploadedDate: 'Apr 1, 2026' }],
    clarifications: [
      {
        id: 'CLR-003',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Sara Al Mahmoud',
        raisedTo: 'Respondent',
        message:
          'Project summary lacks specific deliverables and success metrics. Please provide detailed scope and expected outcomes.',
        status: 'Open' as const,
        date: '2026-04-20',
        replies: [],
      },
      {
        id: 'CLR-003-B',
        raisedBy: 'Approver' as const,
        raisedByName: 'Hassan Al Blooshi',
        raisedTo: 'Respondent',
        message:
          'The WAN connectivity costs appear higher than benchmark for similar scope projects. Please provide competitive quotations from at least two vendors to justify the pricing.',
        status: 'Open' as const,
        date: '2026-04-21',
        replies: [
          {
            id: 'CLR-003-B-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Abdulla Al Romaithi',
            message: 'We have obtained quotes from Etisalat and du. The Etisalat quote was 12% lower for equivalent bandwidth capacity. We will upload both quotations along with a technical comparison today.',
            date: '2026-04-23',
          },
        ],
      },
      {
        id: 'CLR-003-C',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Sara Al Mahmoud',
        raisedTo: 'Respondent',
        message: 'Please confirm whether existing network equipment will be decommissioned or repurposed after the upgrade. This impacts the total cost of ownership and asset disposal plan.',
        status: 'Open' as const,
        date: '2026-04-22',
        replies: [
          {
            id: 'CLR-003-C-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Abdulla Al Romaithi',
            message: 'The existing Cisco 3800 series switches will be repurposed for our DR site rather than decommissioned. The newer Catalyst 9000 series will serve as the primary production network, saving approximately AED 280,000 in decommissioning and disposal costs.',
            date: '2026-04-25',
          },
          {
            id: 'CLR-003-C-R2',
            fromRole: 'Reviewer' as const,
            fromName: 'Sara Al Mahmoud',
            message: 'Good clarification. Please also confirm the DR site capacity requirements and whether the repurposed equipment fully meets those specifications before we sign off.',
            date: '2026-04-26',
          },
        ],
      },
      {
        id: 'CLR-003-D',
        raisedBy: 'Approver' as const,
        raisedByName: 'Hassan Al Blooshi',
        raisedTo: 'Respondent',
        message: 'The project timeline of 12 months appears aggressive for a full network overhaul across multiple sites. Please provide a risk-adjusted timeline with buffer periods clearly identified.',
        status: 'Closed' as const,
        date: '2026-04-22',
        closedAt: '2026-04-28',
        replies: [
          {
            id: 'CLR-003-D-R1',
            fromRole: 'Respondent' as const,
            fromName: 'Abdulla Al Romaithi',
            message: 'We have revised the timeline to 14 months with 2 buffer months built into the schedule. The phased rollout covers 4 office sites per quarter starting Q3 2026, with a dedicated 6-week stabilisation window at the end.',
            date: '2026-04-24',
          },
        ],
      },
      {
        id: 'CLR-003-E',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Mohammed Al-Farsi',
        raisedTo: 'Respondent',
        message: 'Please clarify the SD-WAN vendor selection process. Will this go through a formal RFP given the contract value exceeds the direct award threshold under the Procurement Policy?',
        status: 'Open' as const,
        date: '2026-04-28',
        replies: [],
      },
    ],
    aiScore: 71,
    riskLevel: 'Medium',
    capex: 1_500_000,
    opex: 600_000,
  },
  {
    id: 'BI-008',
    name: 'Cloud Migration Phase 2',
    strategicPriority: 'Digital Infrastructure',
    classification: 'Cloud & Hosting',
    category: 'Infrastructure',
    requestedBudget: 1_750_000,
    budgetItems: [
      {
        id: 'BI-008-1',
        accountName: 'Cloud Migration Services',
        l1: 'Services',
        l2: 'Professional',
        l3: 'Migration',
        glCode: '6200.030',
        ebsFusionCode: 'FC-CLD-001',
        classification: 'CapEx',
        budgetRequested: 1_200_000,
      },
      {
        id: 'BI-008-2',
        accountName: 'Cloud Run Costs',
        l1: 'Technology',
        l2: 'Infrastructure',
        l3: 'Cloud',
        glCode: '6110.040',
        ebsFusionCode: 'FC-CLD-002',
        classification: 'OpEx',
        budgetRequested: 550_000,
      },
    ],
    status: 'Needs Work',
    approvalStatus: 'Needs Work',
    pendingWith: 'Respondent',
    submittedBy: 'Mariam Al Zaabi',
    submittedDate: '2026-04-12',
    lastModified: '2026-04-19',
    plannedStartDate: '2026-09-01',
    plannedEndDate: '2027-08-31',
    workStream: 'Digital Transformation',
    budgetType: 'Phase 2',
    technology: { company: 'Amazon', product: 'AWS' },
    summary:
      'Second phase of cloud migration programme covering remaining on-premises workloads. Targeting 40 additional applications for lift-and-shift or re-platforming to AWS cloud environment.',
    documents: [],
    clarifications: [
      {
        id: 'CLR-004',
        raisedBy: 'Reviewer' as const,
        raisedByName: 'Khalid Al-Mansoori',
        raisedTo: 'Respondent',
        message:
          'Missing documents: Please upload vendor quotation and technical migration assessment. Current submission is incomplete without these supporting documents.',
        status: 'Open' as const,
        date: '2026-04-19',
        replies: [],
      },
    ],
    aiScore: 45,
    riskLevel: 'High',
    capex: 1_200_000,
    opex: 550_000,
  },
]

export const budgetByCategory = [
  { name: 'Digital Infrastructure', value: 4_250_000 },
  { name: 'Smart Government', value: 1_800_000 },
  { name: 'Digital Security', value: 950_000 },
  { name: 'Operational Excellence', value: 3_200_000 },
  { name: 'Digital Transformation', value: 2_950_000 },
  { name: 'Data & Analytics', value: 890_000 },
]

export const reviewQueueProjects = [
  {
    id: 'RQ-020',
    name: 'Cloud Infrastructure Modernization',
    entity: 'Department of Digital Government',
    status: 'To Review',
    riskLevel: 'High' as RiskLevel,
    hasMissingDocs: true,
    requestedBudget: 5_200_000,
    capex: 4_420_000,
    opex: 780_000,
    glCodeCount: 3,
    submittedBy: 'Ahmed Al Rashid',
    submittedDate: '2026-03-18',
    updatedDate: '2026-04-24',
    aiScore: 87,
    aiConfidence: 87,
  },
  {
    id: 'RQ-021',
    name: 'Cybersecurity Enhancement Program',
    entity: 'Ministry of Interior',
    status: 'To Review',
    riskLevel: 'High' as RiskLevel,
    hasMissingDocs: false,
    requestedBudget: 3_800_000,
    capex: 570_000,
    opex: 3_230_000,
    glCodeCount: 4,
    submittedBy: 'Sara Al Mahmoud',
    submittedDate: '2026-03-17',
    updatedDate: '2026-04-24',
    aiScore: 58,
    aiConfidence: 58,
  },
  {
    id: 'RQ-022',
    name: 'Smart Government Services Portal',
    entity: 'Department of Economic Development',
    status: 'To Review',
    riskLevel: 'Medium' as RiskLevel,
    hasMissingDocs: false,
    requestedBudget: 7_500_000,
    capex: 3_750_000,
    opex: 3_750_000,
    glCodeCount: 5,
    submittedBy: 'Mohammed Al-Farsi',
    submittedDate: '2026-03-16',
    updatedDate: '2026-04-30',
    aiScore: 82,
    aiConfidence: 82,
  },
  {
    id: 'RQ-023',
    name: 'Data Analytics Platform',
    entity: 'Department of Statistics',
    status: 'Reviewed',
    riskLevel: 'Low' as RiskLevel,
    hasMissingDocs: true,
    requestedBudget: 2_100_000,
    capex: 1_785_000,
    opex: 315_000,
    glCodeCount: 2,
    submittedBy: 'Fatima Al-Nuaimi',
    submittedDate: '2026-02-15',
    updatedDate: '2026-04-29',
    aiScore: 95,
    aiConfidence: 95,
  },
  {
    id: 'RQ-024',
    name: 'Network Infrastructure Upgrade',
    entity: 'Telecom Regulatory Authority',
    status: 'Clarification Pending',
    riskLevel: 'Low' as RiskLevel,
    hasMissingDocs: false,
    requestedBudget: 1_850_000,
    capex: 1_572_500,
    opex: 277_500,
    glCodeCount: 3,
    submittedBy: 'Khalid Al-Mansoori',
    submittedDate: '2026-02-14',
    updatedDate: '2026-04-23',
    aiScore: 89,
    aiConfidence: 89,
    clarificationWith: 'Khalid Al-Mansoori',
    clarificationOverdue: 3,
  },
  {
    id: 'RQ-025',
    name: 'AI-Powered Customer Service',
    entity: 'Department of Municipality',
    status: 'To Review',
    riskLevel: 'Medium' as RiskLevel,
    hasMissingDocs: false,
    requestedBudget: 980_000,
    capex: 147_000,
    opex: 833_000,
    glCodeCount: 2,
    submittedBy: 'Noura Al-Shamsi',
    submittedDate: '2026-02-13',
    updatedDate: '2026-04-27',
    aiScore: 73,
    aiConfidence: 73,
  },
]

export const approvalQueueProjects = [
  {
    id: 'BI-020',
    name: 'Electronic Health Records System',
    entity: 'Department of Health',
    budgetType: 'New',
    budgetCategory: 'Mixed',
    requestedBudget: 12_500_000,
    riskLevel: 'High' as RiskLevel,
    aiConfidence: 91,
    summary: 'Unified electronic health records system for all Abu Dhabi healthcare facilities.',
    glCodeCount: 6,
    reviewedBy: 'Reviewer',
  },
  {
    id: 'BI-021',
    name: 'Smart Classroom Initiative',
    entity: 'Department of Education',
    budgetType: 'New',
    budgetCategory: 'CapEx',
    requestedBudget: 8_900_000,
    riskLevel: 'Medium' as RiskLevel,
    aiConfidence: 88,
    summary: 'Equip 500 classrooms with smart boards, tablets, and learning management systems.',
    glCodeCount: 4,
    reviewedBy: 'Reviewer',
  },
]

export const notifications = [
  {
    id: 'N-001',
    title: 'Cloud Migration Phase 2',
    message: 'Clarification responded by Mariam Al Zaabi',
    time: '2h ago',
    read: false,
  },
  {
    id: 'N-002',
    title: 'ERP Integration Programme',
    message: 'Returned for clarification by Reviewer',
    time: '5h ago',
    read: false,
  },
  {
    id: 'N-003',
    title: 'Submission deadline in 15 days',
    message: 'Please submit all projects to Approver by 15 May 2026',
    time: '1d ago',
    read: true,
  },
]
