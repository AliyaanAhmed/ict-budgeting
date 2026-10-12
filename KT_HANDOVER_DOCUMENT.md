# ICT Budgeting 2026 - KT Handover Document

This document is a practical handover for the ICT Budgeting app. It is written for a software engineer who needs to understand the app quickly, support users, debug issues, and continue enhancements while the main developer is away.

## 1. What This App Does

The app manages the ICT budgeting lifecycle across ADGE entities and DGE governance teams.

At a high level, ADGE users create and review ICT budget requests, then submit them to DGE. DGE Strategy Team, SME Team, and Strategy Director review the projects through strategic alignment, SME review, quality check, final director review, allocation, and utilization.

The app is role-based. Most pages reuse the same Dataverse data, but show different actions depending on the active role and current project/instance status.

## 2. Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS utility classes
- Radix UI primitives
- Lucide React icons
- Recharts for charts
- Microsoft Power Apps data client: `@microsoft/power-apps/data`
- Dataverse generated services under `src/generated`

Common commands:

```bash
npm install
npm run dev
npm run build
```

The production validation command is:

```bash
npm run build
```

## 3. Important Folder Map

Main app routing:

- `src/App.tsx`

Layout:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/CycleSwitcher.tsx`

Shared UI:

- `src/components/ui/*`
- `src/components/shared/*`

Role pages:

- `src/pages/respondent/*`
- `src/pages/reviewer/*`
- `src/pages/approver/*`
- `src/pages/strategy-team/*`
- `src/pages/sme-team/*`
- `src/pages/strategy-director/*`
- `src/pages/dge-projects/Projects.tsx`
- `src/pages/admin/*`

Business/data services:

- `src/services/projectService.ts`
- `src/services/dgePortfolioService.ts`
- `src/services/dgeWorkflowService.ts`
- `src/services/clarificationService.ts`
- `src/services/webApiForPortalService.ts`
- `src/services/documentAiSummaryStoreService.ts`
- `src/services/instanceService.ts`
- `src/services/ictBudgetDraftService.ts`
- `src/services/fileUploadService.ts`
- `src/services/fileRetrievalService.ts`
- `src/services/fileDeleteService.ts`
- `src/services/recordShareService.ts`

Generated Dataverse services/models:

- `src/generated/services/*`
- `src/generated/models/*`

## 4. Role Structure

The role context decides what role is active and which routes/sidebar items are shown.

Key file:

- `src/context/RoleContext.tsx`

Sidebar navigation per role:

- `src/components/layout/Sidebar.tsx`

Supported roles include:

- Respondent
- Reviewer
- Approver
- ICT - Strategy Team
- ICT - SME Team
- ICT - Strategy Director
- ICT Admin

## 5. Routing Overview

Routes are defined in:

- `src/App.tsx`

Important route groups:

Respondent:

- `/respondent/dashboard`
- `/respondent/projects`
- `/respondent/projects/new`
- `/respondent/projects/:id`

Reviewer:

- `/reviewer/dashboard`
- `/reviewer/review-queue`
- `/reviewer/projects`

Approver:

- `/approver/dashboard`
- `/approver/approval-queue`
- `/approver/projects`

Strategy Team:

- `/strategy-team/dashboard`
- `/strategy-team/projects`
- `/strategy-team/strategic-alignment`
- `/strategy-team/entity-tracker`
- `/strategy-team/sme-tracker`
- `/strategy-team/quality-check`
- `/strategy-team/clarification-monitor`

SME Team:

- `/sme-team/dashboard`
- `/sme-team/projects`
- `/sme-team/reviews`

Strategy Director:

- `/strategy-director/dashboard`
- `/strategy-director/projects`
- `/strategy-director/reviewer-queue`
- `/strategy-director/entity-tracker`
- `/strategy-director/sme-tracker`
- `/strategy-director/quality-check-tracker`

Admin:

- `/admin/assessment-cycles`
- `/admin/cycles/:id`

## 6. Core Workflow Statuses

The main status constants are in:

- `src/services/dgePortfolioService.ts`

Budget statuses:

```ts
DGE_BUDGET_STATUS = {
  draft: 1,
  inactive: 2,
  underReviewerReview: 776140001,
  underApproverReview: 776140002,
  approvedByApprover: 776140003,
  underStrategicAlignmentReview: 776140004,
  underSmeReview: 776140005,
  strategicPriorityChangeUnderReview: 776140006,
  underQualityCheck: 776140007,
  underFinalReview: 776140008,
  reviewCompleted: 776140009,
  clarificationPending: 776140010,
  allocationInProgress: 776140011,
  allocationInReview: 776140012,
  allocationCompleted: 776140013,
  utilizationInProgress: 776140014,
  utilizationCompleted: 776140015,
  reviewerReviewCompleted: 576610001,
}
```

Instance statuses:

```ts
DGE_INSTANCE_STATUS = {
  published: 776140001,
  planning: 776140002,
  underDgeReview: 776140003,
  reviewCompletedByDge: 776140004,
  allocation: 776140005,
  utilization: 776140006,
}
```

When debugging page counts, filters, or dashboard cards, first check which `statuscode` the page is filtering on.

## 7. Main Business Flow

### ADGE Planning Flow

1. Respondent creates an ICT budget/project.
2. Respondent submits it to Reviewer.
3. Reviewer reviews and either completes review or requests clarification.
4. Approver performs final ADGE approval.
5. Approver submits approved projects to DGE.

Important pages:

- `src/pages/respondent/NewProject.tsx`
- `src/pages/respondent/ProjectDetail.tsx`
- `src/pages/reviewer/ReviewQueue.tsx`
- `src/pages/approver/ApprovalQueue.tsx`
- `src/pages/approver/Dashboard.tsx`

### DGE Review Flow

1. Strategy Team receives project under Strategic Alignment Review.
2. Strategy Team can update strategic priority/classification.
3. Strategy Team sends project to SME Team.
4. SME Team reviews and can either route forward, request strategic priority change, or raise clarification to ADGE.
5. Strategy Team performs Quality Check.
6. Strategy Team routes to Strategy Director.
7. Strategy Director completes final review.
8. DGE review completion leads toward publication/allocation.

Important pages:

- `src/pages/strategy-team/StrategicAlignment.tsx`
- `src/pages/strategy-team/SMETracker.tsx`
- `src/pages/strategy-team/QualityCheck.tsx`
- `src/pages/sme-team/Reviews.tsx`
- `src/pages/strategy-director/ReviewerQueue.tsx`

### Allocation Flow

Allocation starts after DGE review/publication. The app has phase-aware cards and filters for allocation in ADGE roles and DGE project views.

Important statuses:

- `allocationInProgress`
- `allocationInReview`
- `allocationCompleted`

### Utilization Flow

Utilization starts after allocation completion. The app shows utilization cards for relevant roles and tracks:

- `utilizationInProgress`
- `utilizationCompleted`

## 8. Strategic Alignment Page

File:

- `src/pages/strategy-team/StrategicAlignment.tsx`

Purpose:

- Strategy Team reviews projects submitted to DGE.
- They compare actual strategic priority/classification against AI suggestions.
- They can update strategic priority/classification inline.
- They can send selected projects to SME.
- They can handle strategic priority change requests.

Current tabs:

- Strategic Alignment Review
- Strategic Priority Change
- Sent to SMEs
- Reviewed by SMEs

Default filters above the table:

- Entity
- Strategic Priority
- AI Filter
- Search

AI alignment behavior:

- `Strategic Priority` and `Strategic Priority Classification` cells are color-coded.
- Mismatch uses maroon/red.
- AI aligned uses green.
- Suggested columns keep their own AI styling.

Important behavior:

- Priority and classification are dependent.
- If priority changes, classification must be cleared and reselected.
- Backend update should happen only when both priority and classification are selected.

## 9. SME Team Dashboard

File:

- `src/pages/sme-team/Dashboard.tsx`

Purpose:

- Shows the SME team's current workload.
- Displays assigned reviews, clarification required, clarification raised, priority mismatch, and review guidance.

Recently added behavior:

- `Clarification Raised to Entities` component appears only when entity-facing clarifications exist.
- It shows up to 4 clarification items.
- View All goes to SME Review Queue with clarification-raised filter.
- When this component exists, `AI Review Guidance` spans full width.
- When this component does not exist, dashboard components remain two per row.

AI Review Guidance:

- Uses `getProjectAiReviewFlags` from `documentAiSummaryStoreService`.
- Shows AI flag names and counts.
- High severity uses red/maroon styling.
- Medium severity uses amber styling.

## 10. Strategy Director Screens

Folder:

- `src/pages/strategy-director`

Current screens:

- Dashboard
- Projects
- Director Review Queue
- Entity Tracker
- SME Tracker
- Strategy Quality Check Tracker

New pages:

- `src/pages/strategy-director/SMETracker.tsx`
- `src/pages/strategy-director/QualityCheckTracker.tsx`

Routes:

- `/strategy-director/sme-tracker`
- `/strategy-director/quality-check-tracker`

Purpose:

- Director gets oversight-level visibility, not operational edit-heavy screens.
- SME Tracker summarizes SME team progress.
- Quality Check Tracker summarizes Strategy Team quality-check workload and Director handoff.

## 11. Clarification Concept

Clarification can happen across three broad directions:

1. DGE internal
2. DGE to ADGE
3. ADGE to ADGE

Clarification service:

- `src/services/clarificationService.ts`

Shared UI:

- `src/components/shared/ClarificationThread.tsx`
- `src/components/shared/ClarificationModal.tsx`

Common clarification status:

- Budget `statuscode` becomes `DGE_BUDGET_STATUS.clarificationPending`.

Important distinction:

- `statusForAdge` tells whether ADGE sees it as clarification pending.
- If `statusForAdge === ICT_BUDGET_STATUS.clarificationPending`, it usually means the clarification is waiting on ADGE/entity.
- If not, it may be a DGE-internal clarification or a clarification required from SME/Strategy side.

Examples:

- SME raises clarification to ADGE from SME Review.
- Strategy Team raises clarification to SME internally.
- Strategy Director raises clarification back to Strategy Team or SME.
- ADGE roles can have reviewer/approver/respondent clarifications during planning.

## 12. Documents / SharePoint Retrieval

Main file:

- `src/services/webApiForPortalService.ts`

Document retrieval function:

```ts
retrieveSharePointDocumentsByBudget(budgetId)
```

It builds FetchXML for `sharepointdocument` and filters by `dga_ict_budgetid`.

The custom API operation is:

```ts
dga_WebApiForPortal
```

Data source key:

```ts
dga_webapiforportal
```

Payload sent for document retrieval:

```ts
{
  actionName: 'retrievemultiple',
  isAdmin: true,
  userId: '',
  fetchXml,
}
```

The response is expected as:

```ts
{
  retrieveResponse: WebApiPortalDocument[]
}
```

The app logs the request and response heavily in this service. If documents are not showing, open the browser console first and search for:

- `[WebApiForPortalService]`

## 13. Technology Product Association

Also in:

- `src/services/webApiForPortalService.ts`

Functions:

```ts
associateTechnologyProduct(ictBudgetId, productId)
disassociateTechnologyProduct(ictBudgetId, productId)
```

These call the same custom API:

```ts
dga_WebApiForPortal
```

Payload:

```ts
{
  actionName: 'associate' | 'disassociate',
  isAdmin: true,
  userId: '',
  targetTableName: 'dga_technology',
  relatedTableName: 'dga_ict_budget',
  targetId: productId,
  relatedId: ictBudgetId,
  relationship: 'dga_ict_budget_technology_product',
}
```

So yes, association/disassociation is handled through the custom API, not a direct normal fetch.

## 14. AI Features

Important services:

- `src/services/aiPromptService.ts`
- `src/services/aiStrategicSuggestionService.ts`
- `src/services/aiBudgetConsiderationsService.ts`
- `src/services/aiSupportingDocumentEvaluationService.ts`
- `src/services/ictBudgetAiOverviewService.ts`
- `src/services/documentAiSummaryStoreService.ts`

AI review flags:

- Stored on budget as `dga_ai_flags`.
- Mapped to user-friendly labels in `documentAiSummaryStoreService.ts`.
- Use `getProjectAiReviewFlags(aiReviewFlags)` to display flags consistently.

Known flag labels include:

- Evidence Risk
- DGE Budget Consideration Risk
- Strategic Alignment Risk
- Budget Accuracy Risk
- Similar Project in Same Cycle
- Similar Project in Previous Cycles
- Clarification Required

Do not manually hardcode flag names on new pages if you can reuse `getProjectAiReviewFlags`.

## 15. Dashboard Budget Lenses

Budget lens logic is centralized in:

- `src/hooks/useDashboardBudgetCharts.ts`

The dashboard changes its budget lens based on instance status:

- Planning / DGE review: requested or recommended
- Allocation: allocated
- Utilization: utilized

Useful helpers:

- `getDashboardBudgetMetricForInstanceStatus`
- `getDashboardBudgetMetricsForInstanceStatus`
- `getProjectBudgetAmount`
- `getMetricAmountsFromProjects`

If a dashboard amount looks wrong, check which instance status is active first.

## 16. Data Loading Pattern

Most role pages follow this pattern:

```ts
const { selectedCycle } = useCycle()
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  if (!selectedCycle?.id) return
  // load data for selected cycle
}, [selectedCycle?.id])
```

Common data source for DGE-side pages:

```ts
getDgePortfolioData(selectedCycle.id)
```

Important: if cycle switching shows wrong data, check that the page effect depends on `selectedCycle?.id` and that filtering is using instance/cycle correctly.

## 17. Toast / Processing UX

Toast provider:

- `src/context/ToastContext.tsx`

Common pattern:

```ts
await runActionToast(
  async () => {
    // backend action
  },
  {
    processingTitle: '...',
    processingDescription: '...',
    successTitle: '...',
    successDescription: '...',
    errorTitle: '...',
    minDurationMs: 1400,
  }
)
```

Use this pattern for long-running Dataverse actions so users see processing and success/error feedback.

## 18. Design System Notes

The app mostly uses:

- Primary blue: `#286CFF`
- Primary hover blue: `#0C65F5`
- Soft blue background: `#EEF5FF`
- Card border: `#D9E6F5`
- Light section background: `#F8FBFF`
- Text dark: `#0F172A`
- Muted text: `#64748B`
- AI violet: `#A855F7`
- Warning amber/orange: `#F97316`, `#D97706`
- Success green/teal: `#10B981`, `#0F9D8A`
- Risk maroon/red: `#9F1239`, `#EF4444`

Shared DGE page shell:

- `src/pages/strategy-team/StrategyTeamShell.tsx`

Reusable components:

- `StrategyPageShell`
- `StrategySectionCard`
- `StrategyMetricCard`
- `StrategyPill`
- `StrategyProgressBar`
- `StrategyDashboardEmptyState`

For DGE/SME/Director pages, prefer these components so styling stays consistent.

## 19. Common Debugging Checklist

If a page shows wrong records:

1. Check selected cycle.
2. Check active role.
3. Check `statuscode` filters.
4. Check instance status if the page is phase-aware.
5. Check whether the page uses `getDgePortfolioData`, `useRoleProjects`, or a direct generated service.
6. Check if local UI overrides are being applied after an action.

If action succeeds but UI does not update:

1. Confirm backend service call succeeds.
2. Check if `refreshData()` is called.
3. Check if local state overrides are stale.
4. Check browser console logs.

If files/documents do not show:

1. Check `retrieveSharePointDocumentsByBudget`.
2. Confirm budget id is real Dataverse GUID, not display ref id.
3. Check custom API response shape.
4. Check browser console logs for `[WebApiForPortalService]`.

If AI flags do not show:

1. Check `dga_ai_flags` exists on the budget record.
2. Check `getProjectAiReviewFlags`.
3. Confirm the generated model enum values match Dataverse option values.

## 20. Things To Be Careful With

- Do not change status codes casually. Many pages depend on exact numeric values.
- Do not hardcode AI flag labels if the shared helper already exists.
- When changing strategic priority inline, classification must be reset because classifications depend on selected priority.
- Be careful with role-specific visibility. The same project detail page is reused across many roles.
- Avoid deleting generated service/model files manually.
- After workflow actions, always refresh data or update local state carefully.
- Be careful when pushing to GitHub. Exclude local files like Windows shortcuts.

## 21. Recent Work To Know About

Recent areas changed:

- Strategy Team dashboard redesign.
- Strategy Team Strategic Alignment filters and inline color-coded AI alignment.
- Strategy Team Clarification Monitor page.
- SME Team dashboard clarification and AI flag components.
- Strategy Team SME Tracker classification chips and zero-progress fix.
- Director General SME Tracker page.
- Director General Quality Check Tracker page.
- Phase-aware project filters for Strategy Team projects.
- Allocation/utilization dashboard cards across ADGE roles.

## 22. Suggested Starting Point For A New Engineer

If you are picking this up fresh, start in this order:

1. Run `npm install`.
2. Run `npm run build`.
3. Open `src/App.tsx` to understand route structure.
4. Open `src/components/layout/Sidebar.tsx` to understand role navigation.
5. Open `src/services/dgePortfolioService.ts` to understand statuses and DGE portfolio records.
6. Open `src/pages/respondent/ProjectDetail.tsx` to understand the shared project detail workflow.
7. Open `src/pages/strategy-team/StrategicAlignment.tsx` to understand DGE review operations.
8. Open `src/services/webApiForPortalService.ts` for custom API document retrieval and association/disassociation.

## 23. Handover Notes

This app is already quite workflow-heavy. Most bugs will not be simple UI bugs; they will usually be caused by one of these:

- wrong status filter
- wrong selected cycle
- role-specific condition not updated
- Dataverse response shape changed
- local UI state not refreshed after backend update
- custom API returning a different payload shape

When fixing issues, try to keep logic centralized. If the same label, status, AI flag, or budget lens is needed on multiple pages, prefer adding/reusing a helper instead of duplicating logic in each component.

