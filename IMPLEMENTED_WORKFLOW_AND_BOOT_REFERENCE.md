# Implemented Workflow And Boot Reference

This file is the practical source of truth for the current app implementation.

Use it when starting a new Codex chat and you want fast context about:
- boot order and session storage
- ADGE workflow
- DGE workflow
- ownership and sharing
- clarification routing
- DGE recommendation and planning outcome behavior
- where the important logic lives

This document is intentionally based on the current code, not older design notes.

## 1. Current Role Model

### ADGE roles
- `Respondent`
- `Reviewer`
- `Approver`

### DGE roles
- `Strategy Team`
- `SME Team`
- `Strategy Director`

### Admin role
- `ICT Admin`

## 2. Boot Order

Boot is implemented in [src/main.tsx](/abs/path/c:/ICT-Budgeting-2026/src/main.tsx:1).

Current order:
1. `initUserContext()`
2. `initCycleContext()`
3. `initInstanceContext()`
4. `initDgeRoleContext(sessionStorage.getItem('userID'))`
5. render React app

Important behavior:
- ADGE boot happens first
- DGE boot is layered after ADGE context is ready
- ADGE instance boot must not be broken by DGE additions
- `instanceID` and `instanceDetail` are still critical for ADGE-side scoping

## 3. Session Storage

## 3.1 Core keys

Mainly set by [src/services/userContextService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/userContextService.ts:1):

- `ict_app_user`
- `userID`
- `moduleTypeID`
- `moduleConfigTeamIDs`
- `userTeams`
- `currentRole`

## 3.2 Cycle keys

Set by cycle boot/services:

- `cycles`
- `currentCycle`

## 3.3 ADGE instance keys

Set by [src/services/instanceService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/instanceService.ts:1):

- `instanceID`
- `instanceDetail`

`instanceDetail` currently contains:
- `id`
- `name`
- `abbr`
- `planningStartDate`
- `planningEndDate`
- `statuscode`

ADGE dashboards, project lists, and entity naming rely on this.

## 3.4 ADGE role-account keys

Derived from module config + team membership:

- `respondentAccount`
- `respondentAccountName`
- `respondentModuleConfigId`
- `reviewerAccount`
- `reviewerAccountName`
- `reviewerModuleConfigId`
- `approverAccount`
- `approverAccountName`
- `approverModuleConfigId`

## 3.5 DGE keys

Set by [src/services/dgeRoleContextService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeRoleContextService.ts:1):

- `dgeSmeAssignments`
- `dgeStrategyTeam`
- `dgeStrategyDirectorTeam`
- `currentSME`

### `dgeSmeAssignments`

Contains one item per strategic priority that is mapped to an SME team:
- `strategicPriorityId`
- `strategicPriorityName`
- `teamId`
- `teamName`
- `users`

Important:
- `teamName` is resolved from the Dataverse team table
- it is no longer a static `"SME Team"` label

### `dgeStrategyTeam`

Contains:
- `teamId`
- `teamName`
- `users`

### `dgeStrategyDirectorTeam`

Resolved from the Dataverse team named `ICT - Strategy Director`.

Contains:
- `teamId`
- `teamName`
- `users`

### `currentSME`

Used only for SME users.

Contains the currently selected SME domain:
- `strategicPriorityId`
- `strategicPriorityName`
- `teamId`
- `teamName`

If a user belongs to multiple SME mappings:
- all valid SME roles can appear in role switch
- `currentSME` stores the currently selected domain

## 3.6 DGE boot seeding of ADGE team ids

Even DGE users need ADGE team ids for external clarification workflows.

If `moduleConfigTeamIDs` does not already contain ADGE ids, DGE boot seeds them from `dga_module_configurations`.

That means DGE users should still end up with:
- `respondentTeamId`
- `reviewerTeamId`
- `approverTeamId`
- `strategyTeamId`

inside `moduleConfigTeamIDs`.

## 4. Main Workflow Fields

## 4.1 `dga_status_for_adge`

This is the ADGE-facing workflow field.

Current values used by the app:
- `1` = Draft
- `2` = Under Reviewer Review
- `3` = Under Approver Review
- `4` = Approved by Approver
- `5` = Clarification Pending
- `6` = Under DGE Review
- `12` = Reviewer Review Completed

## 4.2 `statuscode`

This is the detailed Dataverse status reason used as the DGE workflow engine.

Current values used:
- `1` = Draft
- `776140001` = Under Reviewer Review
- `576610001` = Reviewer Review Completed
- `776140002` = Under Approver Review
- `776140003` = Approved by Approver
- `776140004` = Under Strategic Alignment Review
- `776140005` = Under SME Review
- `776140006` = Strategic Priority Change Under Review
- `776140007` = Under Quality Check
- `776140008` = Under Final Review
- `776140009` = Review Completed
- `776140010` = Clarification Pending
- `776140011` = Allocation in Progress
- `776140012` = Allocation in Review
- `776140013` = Allocation Completed
- `776140014` = Utilization in Progress
- `776140015` = Utilization Completed

Display rule:
- ADGE screens normally show `dga_status_for_adge`
- DGE screens normally show `statuscode`

## 4.3 DGE recommendation fields

These are used during DGE review:
- `dga_recommended`
- `dga_rejection_reason`
- `dga_rejection_justification`
- `dga_rejected_by`
- `dga_planning_outcome`

Current choices:

### `dga_recommended`
- `1` = No
- `2` = Yes

### `dga_planning_outcome`
- `1` = Recommended by DGE
- `2` = Not Recommended

Current rule:
- when Strategy Director clicks `Complete Review`
- the app reads `dga_recommended`
- if `Yes (2)`, it writes `dga_planning_outcome = 1`
- if `No (1)`, it writes `dga_planning_outcome = 2`

This is implemented in [src/services/dgeWorkflowService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeWorkflowService.ts:1).

## 5. Ownership Model

Workflow moves usually update:
- `ownerid`
- `statuscode`
- `dga_status_for_adge`
- workflow actor lookups where needed

Common lookups used by the app:
- `dga_respondent_systemuser`
- `dga_reviewer_systemuser`
- `dga_approver_systemuser`
- `dga_strategic_alignment_reviewer_systemuser`
- `dga_sme_reviewer_user`
- `dga_sme_reviewer_team`
- `dga_quality_checker`

General ownership model:
- ADGE roles own ADGE-stage items
- Strategy Team owns strategic alignment and quality-check items
- SME team owns SME-stage items
- Strategy Director owns final review items

## 6. Sharing Model

Sharing is implemented through [src/services/recordShareService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/recordShareService.ts:1).

The app uses the custom API behind:
- `dga_WebApiForPortal`

### Grant access

Payload uses:
- `actionName: "grandaccess"`
- `tableName: "dga_ict_budget"`
- `relatedId: <budgetId>`
- `targetId: <teamId>`
- `fetchXml: "read"`

### Revoke access

Payload uses:
- `actionName: "revokeaccess"`
- `tableName: "dga_ict_budget"`
- `relatedId: <budgetId>`
- `targetId: <teamId>`
- `fetchXml: "read"`

### Current helpers
- `shareIctBudgetWithRoleTeam(budgetId, role)`
- `grantIctBudgetAccessToTeam(budgetId, teamId)`
- `revokeIctBudgetAccessFromTeam(budgetId, teamId)`

Important current rule:
- several DGE flows now intentionally grant access before ownership handoff
- this is done to preserve visibility for the initiating governance team

Examples:
- SME route to quality check grants current SME first, then assigns to Strategy Team
- Strategy Team clarification to SME grants Strategy Team first, then assigns to SME
- Strategy Director clarification to Strategy or SME grants Strategy Director first, then assigns away
- strategic priority change request grants current SME before assigning back to Strategy Team

## 7. ADGE Workflow

## 7.1 Respondent

Respondent creates draft:
- `dga_status_for_adge = 1`
- `statuscode = 1`

Respondent submits to reviewer:
- `dga_status_for_adge = 2`
- `statuscode = 776140001`
- owner moves to reviewer team

## 7.2 Reviewer

Reviewer can:
- review
- raise clarification
- submit to approver

Submit to approver:
- `dga_status_for_adge = 3`
- `statuscode = 776140002`
- owner moves to approver team

Raise clarification:
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- owner returns to respondent team

## 7.3 Approver

Approver can:
- approve
- raise clarification
- submit to DGE

Approve:
- `dga_status_for_adge = 4`
- `statuscode = 776140003`

Raise clarification:
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- owner returns to respondent team

Submit to DGE:
- `dga_status_for_adge = 6`
- `statuscode = 776140004`
- current instance submission date is updated
- current instance `statuscode` is updated to DGE review state

## 8. DGE Workflow

## 8.1 Strategy Team

Strategy Team primarily works with:
- `776140004` = Under Strategic Alignment Review
- `776140006` = Strategic Priority Change Under Review
- `776140007` = Under Quality Check
- `776140010` = Clarification Pending

Strategy Team can:
- edit any project form
- bulk update strategic priority/classification
- send projects to SME
- review SME strategic-priority-change requests
- raise clarification from ADGE or SME depending on stage
- route quality-check items to Strategy Director

## 8.2 SME Team

SME only sees projects for the currently selected SME domain.

Domain filtering uses:
- `currentSME.strategicPriorityId`
- matching project `strategicPriorityId`

SME works with:
- `776140005` = Under SME Review
- `776140006` = Strategic Priority Change Under Review
- `776140007` = Under Quality Check
- `776140010` = Clarification Pending

SME can:
- edit only DGE recommendation fields and recommended budgets when allowed
- request strategic priority change
- raise clarification to ADGE respondent
- route to quality check

## 8.3 Strategy Director

Strategy Director is the final DGE governance role above Strategy Team and SME Team.

Resolved by membership in Dataverse team:
- `ICT - Strategy Director`

Main statuses:
- `776140008` = Under Final Review
- `776140009` = Review Completed
- `776140010` = Clarification Pending

Strategy Director can:
- review final DGE items
- raise internal DGE clarification to Strategy Team or SME
- complete review
- publish instance/entity after all budgets are review completed
- start allocation for the instance

## 8.4 Strategy to SME handoff

Implemented in [src/services/dgeWorkflowService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeWorkflowService.ts:1).

When Strategy sends to SME:
- owner moves to mapped SME team
- `dga_sme_reviewer_team` is set
- `dga_status_for_adge = 6`
- `statuscode = 776140005`
- Strategy Team can retain read visibility through sharing

SME team is resolved from:
- budget strategic priority
- `dgeSmeAssignments`

## 8.5 SME strategic priority change request

SME submits requested change without changing the live mapping immediately.

Requested values are stored in:
- `dga_previous_strategic_priority`
- `dga_previous_strategic_priorityclassification`

Then:
- current SME is granted access first
- owner moves to Strategy Team
- `statuscode = 776140006`
- `dga_status_for_adge = 6`

### Approve requested change

When Strategy approves:
- old SME access is revoked first if routing changes to a different SME
- requested values are copied into live strategic fields
- previous/requested fields are cleared
- owner moves to the new SME team
- `dga_sme_reviewer_team` is updated
- `statuscode = 776140005`

### Reject requested change

When Strategy rejects:
- previous/requested fields are cleared
- no revoke/grant happens for the rejected path
- owner goes back to the SME for the current live strategic priority
- `statuscode = 776140005`

## 8.6 SME route to quality check

Before route:
- recommendation fields must be valid
- if recommended = `Yes`
  - recommended budgets are prepared from requested budgets when missing
- if recommended = `No`
  - rejection reason and rejection justification are required
  - recommended budget values are set to `0`

When route happens:
- current SME is granted access first
- owner moves to Strategy Team
- `statuscode = 776140007`
- `dga_status_for_adge = 6`
- `dga_strategic_alignment_reviewer_systemuser` is stamped with current user
- `dga_sme_reviewer_user` is stamped with current user
- Strategy Team is also granted access

## 8.7 Strategy route to Director

When Strategy Team routes to Strategy Director:
- Strategy Director is granted access first
- owner moves to Strategy Director team
- `statuscode = 776140008`
- `dga_status_for_adge = 6`
- Strategy Team can retain visibility

When Strategy Director completes review:
- `statuscode = 776140009`
- `dga_status_for_adge = 6`
- `dga_planning_outcome` is derived from `dga_recommended`

## 8.8 Director entity publish and allocation

On Director Entity Tracker:
- `Publish` appears when all budgets in that instance are `Review Completed`

Publish updates instance:
- `dga_ict_budget_instance.statuscode = 776140004`
- meaning `Review Completed by DGE`

Then `Start Allocation` becomes available.

Start Allocation updates:
- instance `statuscode = 776140005`
- all budgets in that instance `statuscode = 776140011`
- meaning `Allocation in Progress`

## 9. Clarification Model

Clarification logic is implemented in:
- [src/services/clarificationService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/clarificationService.ts:1)
- [src/pages/respondent/ProjectDetail.tsx](/abs/path/c:/ICT-Budgeting-2026/src/pages/respondent/ProjectDetail.tsx:1)

Clarifications are stored in:
- `dga_ict_clarifications`

Current clarification values:
- stage planning = `1`
- stage DGE review = `2`
- scope external = `1`
- scope internal entity = `2`
- scope internal DGE = `3`

Current status values:
- open = `1`
- responded = `776140002`
- closed = `776140003`

Current record types:
- comment = `1`
- clarification = `2`

## 9.1 External ADGE clarification

Raised by:
- Reviewer to Respondent
- Approver to Respondent
- Strategy Team to ADGE
- SME Team to ADGE

For ADGE-side clarification:
- scope = `1` for DGE-to-ADGE external clarification
- scope = `2` for ADGE internal/entity clarification

Current DGE-to-ADGE behavior:
- clarification record is created
- `statuscode = 776140010`
- `dga_status_for_adge = 5`
- owner is not always moved away in every DGE-to-ADGE path
- respondent sees the thread and can reply

Important:
- ADGE dashboards/counts should treat clarification pending as relevant when:
  - budget is clarification pending
  - `dga_status_for_adge = 5`
  - scope is `External` or `Internal (Entity)`

## 9.2 Respondent first reply routing

When Respondent replies first to an ADGE or DGE clarification:
- the record is sent back to the original governance side

Examples:
- Reviewer clarification -> back to Reviewer
- Approver clarification -> back to Approver
- Strategy Team clarification -> back to Strategy Team
- SME clarification -> back to `dga_sme_reviewer_team`

Current return statuses:
- back to Strategy Team -> `776140004`, `dga_status_for_adge = 6`
- back to SME -> `776140005`, `dga_status_for_adge = 6`

## 9.3 Director internal DGE clarification

Strategy Director can raise clarification to:
- Strategy Team
- SME Team

Behavior:
- scope = `3` (`Internal DGE`)
- clarification stage = `2`
- Strategy Director is granted access first
- owner moves to the selected DGE target team
- `statuscode = 776140010`
- `dga_status_for_adge = 6`

### Director -> Strategy Team

On first Strategy reply:
- record returns to Strategy Director
- `statuscode = 776140008`
- `dga_status_for_adge = 6`

### Director -> SME Team

On first SME reply:
- record moves to Strategy Team
- `statuscode = 776140007`
- `dga_status_for_adge = 6`

SME can also route such a project directly to quality check when eligible.

## 9.4 Strategy internal DGE clarification to SME

Strategy Team can raise clarification to SME from quality-check/governance flow.

Behavior:
- scope = `3`
- clarification stage = `2`
- Strategy Team is granted access first
- owner moves to the mapped SME team
- `statuscode = 776140010`
- `dga_status_for_adge = 6`

On SME side:
- project can be edited only within SME-allowed fields
- first reply does not automatically send it to Director
- SME can route it back to quality check when ready

## 9.5 Clarification visibility rules

Current rule:
- ADGE roles should not see `Internal (DGE)` clarification threads
- ADGE roles should show `External` tag when clarification scope is external
- clarification reply/close permissions follow the thread participants and workflow logic

## 10. Edit/View Form Rules

Shared form:
- [src/pages/respondent/ProjectDetail.tsx](/abs/path/c:/ICT-Budgeting-2026/src/pages/respondent/ProjectDetail.tsx:1)

This page is reused by:
- Respondent
- Reviewer
- Approver
- Strategy Team
- Strategy Director
- SME Team

## 10.1 Strategy Team

- full edit access
- can edit even when workflow owner is another role
- governance actions depend on project stage

## 10.2 Strategy Director

- full edit access
- can review projects across DGE final-governance states
- status display is DGE `statuscode`

## 10.3 SME Team

- form is generally locked except for SME-editable DGE fields
- SME can edit only when project belongs to the current SME domain
- editable fields:
  - `dga_recommended`
  - rejection fields when applicable
  - recommended budget amounts
- requested budgets remain read-only for SME

## 10.4 ADGE roles

- normal ADGE workflow editability still applies
- DGE recommendation fields are hidden during normal ADGE stages
- once instance reaches `Review Completed by DGE` or later
  - recommendation fields become visible read-only for ADGE roles

## 10.5 Save-before-action behavior

For DGE actions in the form:
- if the user has unsaved changes
- and clicks an action like route/send/request/review
- the form saves first
- then the workflow action runs

## 11. DGE Project Pages

There are dedicated DGE project pages for:
- Strategy Team
- Strategy Director
- SME Team

They follow the ADGE-style project experience, but:
- DGE roles show DGE `statuscode` labels
- ADGE roles show ADGE-facing status

Scope:
- Strategy Team sees all selected-cycle entity projects
- Strategy Director sees all selected-cycle entity projects
- SME Team sees selected-cycle projects limited to the current SME domain

## 12. Entity Tracker Stage Grouping

Shared stage bucket logic is in [src/services/dgePortfolioService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgePortfolioService.ts:1).

Current grouping:

### Planning
- Draft
- Under Reviewer Review
- Under Approver Review
- Approved by Approver
- Reviewer Review Completed
- Clarification Pending when it is ADGE-facing clarification (`dga_status_for_adge = 5`)

### DGE Review
- Under Strategic Alignment Review
- Under SME Review
- Strategic Priority Change Under Review
- Under Quality Check
- Under Final Review
- Clarification Pending when it is DGE-side clarification

### Review Completed
- Review Completed

### Allocation
- Allocation in Progress
- Allocation in Review
- Allocation Completed

### Utilization
- Utilization in Progress
- Utilization Completed

## 13. Empty States

The app now supports dedicated whole-app empty states for:
- no role found
- no cycle found

Important behavior:
- if no role exists, app should show role empty state
- if no cycle exists, app should show cycle empty state
- if user has `ICT Admin` and there is no cycle, empty state provides navigation to ICT Admin workspace

These empty states are visual-only UX surfaces and should not break existing ADGE or DGE boot behavior.

## 14. Key Files

### Boot / context
- [src/main.tsx](/abs/path/c:/ICT-Budgeting-2026/src/main.tsx:1)
- [src/services/userContextService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/userContextService.ts:1)
- [src/services/cycleService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/cycleService.ts:1)
- [src/services/instanceService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/instanceService.ts:1)
- [src/services/dgeRoleContextService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeRoleContextService.ts:1)

### Workflow / sharing
- [src/services/ictBudgetDraftService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/ictBudgetDraftService.ts:1)
- [src/services/dgeWorkflowService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeWorkflowService.ts:1)
- [src/services/recordShareService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/recordShareService.ts:1)

### Clarifications
- [src/services/clarificationService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/clarificationService.ts:1)

### DGE portfolio/entity mapping
- [src/services/dgePortfolioService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgePortfolioService.ts:1)

### Shared project detail form
- [src/pages/respondent/ProjectDetail.tsx](/abs/path/c:/ICT-Budgeting-2026/src/pages/respondent/ProjectDetail.tsx:1)

## 15. Good New-Chat Prompt

If you start a fresh Codex chat, a strong prompt is:

1. Read `IMPLEMENTED_WORKFLOW_AND_BOOT_REFERENCE.md`
2. Read `Workflow.md`, `Data.md`, `ICT_Budgeting_App_Overview.md`, and `APP_GUIDE.md`
3. Preserve ADGE boot first, then DGE boot
4. Do not break `instanceID` / `instanceDetail`
5. Reuse `ProjectDetail.tsx` as the shared edit/view form
6. Keep ADGE status display based on `dga_status_for_adge`
7. Keep DGE status display based on `statuscode`
8. Respect current ownership + sharing order before changing workflow code

## 16. Short Mental Model

The safest mental model for this app is:

- ADGE side is instance-scoped and account/team-driven
- DGE side is cycle-wide and strategic-priority/team-driven
- ownership moves workflow
- sharing preserves visibility across handoffs
- `dga_status_for_adge` is the ADGE-facing status
- `statuscode` is the DGE workflow engine
- clarification routing depends on who raised it and which scope it uses
- Strategy Team and Strategy Director have governance override access
- SME is domain-scoped and only edits recommendation-related fields
