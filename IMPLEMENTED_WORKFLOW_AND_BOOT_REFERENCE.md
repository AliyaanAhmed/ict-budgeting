# Implemented Workflow And Boot Reference

This file is a practical reference for the current app implementation.

Use it when you start a new Codex chat and want quick context about:
- app boot and session storage
- ADGE role workflow
- DGE role workflow
- assignment and sharing behavior
- clarification routing
- key services and where the logic lives

This document is based on the current code, not on older mock or design-only notes.

## 1. High-Level Role Model

### ADGE roles
- `Respondent`
- `Reviewer`
- `Approver`

### DGE roles
- `Strategy Team`
- `SME Team`

### Admin/supporting role
- `ICT Admin`

## 2. App Boot Order

Current boot order is implemented in [src/main.tsx](/abs/path/c:/ICT-Budgeting-2026/src/main.tsx:1):

1. `initUserContext()`
2. `initCycleContext()`
3. `initInstanceContext()`
4. `initDgeRoleContext(sessionStorage.getItem('userID'))`
5. render React app

Important:
- ADGE boot happens first
- DGE boot is added after ADGE boot
- DGE boot should not break ADGE context

## 3. Session Storage Keys

## 3.1 Core user/app keys

Set mainly by [src/services/userContextService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/userContextService.ts:1):

- `ict_app_user`
- `userID`
- `moduleTypeID`
- `moduleConfigTeamIDs`
- `userTeams`
- `currentRole`

## 3.2 ADGE role-specific keys

- `respondentAccount`
- `respondentAccountName`
- `respondentModuleConfigId`
- `reviewerAccount`
- `reviewerAccountName`
- `reviewerModuleConfigId`
- `approverAccount`
- `approverAccountName`
- `approverModuleConfigId`

These are derived from:
- current user
- team memberships
- `dga_module_configurations`
- account linked to that ADGE role team

## 3.3 Cycle and instance keys

Set by cycle/instance services:

- `cycles`
- `currentCycle`
- `instanceID`
- `instanceDetail`

`instanceDetail` is critical for ADGE-side scoping and usually includes:
- `id`
- `name`
- `abbr`
- `planningStartDate`
- `planningEndDate`

ADGE dashboards and project lists rely on this instance context.

## 3.4 DGE role keys

Set by [src/services/dgeRoleContextService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeRoleContextService.ts:1):

- `dgeSmeAssignments`
- `dgeStrategyTeam`
- `currentSME`

### `dgeSmeAssignments`
Contains one record per strategic priority that is mapped to an SME team:
- `strategicPriorityId`
- `strategicPriorityName`
- `teamId`
- `teamName`
- `users`

### `dgeStrategyTeam`
Contains:
- `teamId`
- `teamName`
- `users`

### `currentSME`
Only for users who belong to one or more SME teams.
Contains the selected SME domain:
- `strategicPriorityId`
- `strategicPriorityName`
- `teamId`
- `teamName`

## 3.5 Important DGE boot behavior

If a DGE user logs in and `moduleConfigTeamIDs` does not already contain ADGE team ids, DGE boot seeds them from `dga_module_configurations`.

This matters because DGE clarification flow still needs:
- respondent team id
- reviewer team id
- approver team id

So even DGE users should end up with:
- `respondentTeamId`
- `reviewerTeamId`
- `approverTeamId`
- `strategyTeamId`

inside `moduleConfigTeamIDs`.

## 4. Main Workflow Fields

## 4.1 `dga_status_for_adge`

This is the ADGE-facing workflow field.

Current values used:
- `1` = Draft
- `2` = Under Reviewer Review
- `3` = Under Approver Review
- `4` = Approved by Approver
- `5` = Clarification Pending
- `6` = Under DGE Review
- `12` = Reviewer Review Completed

## 4.2 `statuscode`

This is the Dataverse status reason used for deeper workflow state, especially for DGE stages.

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

Important rule:
- ADGE UI usually shows `dga_status_for_adge`
- DGE UI usually shows `statuscode`

## 5. Ownership And Assignment Model

Workflow transitions usually update:
- `ownerid`
- workflow fields
- actor lookups

Common actor lookups:
- `dga_respondent_systemuser`
- `dga_reviewer_systemuser`
- `dga_approver_systemuser`
- `dga_strategic_alignment_reviewer_systemuser`
- `dga_sme_reviewer_user`
- `dga_sme_reviewer_team`
- `dga_quality_checker`

The general rule is:
- ADGE roles own ADGE-stage items
- Strategy Team owns strategy-stage items
- SME team owns SME-stage items
- Strategy Team owns quality-check/final DGE governance items

## 6. Sharing Model

Sharing is implemented through [src/services/recordShareService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/recordShareService.ts:1).

The app uses the custom API:
- `dga_WebApiForPortal`

### Grant access action
Payload uses:
- `actionName: "grandaccess"`
- `tableName: "dga_ict_budget"`
- `relatedId: <budgetId>`
- `targetId: <teamId>`
- `fetchXml: "read"`

### Revoke access action
Payload uses:
- `actionName: "revokeaccess"`
- `tableName: "dga_ict_budget"`
- `relatedId: <budgetId>`
- `targetId: <teamId>`
- `fetchXml: "read"`

### Current helper methods
- `shareIctBudgetWithRoleTeam(budgetId, role)`
- `grantIctBudgetAccessToTeam(budgetId, teamId)`
- `revokeIctBudgetAccessFromTeam(budgetId, teamId)`

Typical usage:
- ownership moves to next team
- previous team may still get read access
- in some DGE reassignment flows old SME access is revoked

## 7. ADGE Workflow

## 7.1 Respondent

Respondent creates draft:
- `dga_status_for_adge = 1`
- `statuscode = 1`
- owner is respondent context

Respondent submits to reviewer:
- `dga_status_for_adge = 2`
- `statuscode = 776140001`
- owner moves to reviewer team

## 7.2 Reviewer

Reviewer can:
- review
- raise clarification
- submit to approver

Reviewer submit to approver:
- `dga_status_for_adge = 3`
- `statuscode = 776140002`
- owner moves to approver team

Reviewer clarification:
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- owner returns to respondent team

## 7.3 Approver

Approver can:
- approve
- raise clarification
- submit to DGE

Approver approve:
- `dga_status_for_adge = 4`
- `statuscode = 776140003`

Approver clarification:
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- owner returns to respondent team

Approver submit to DGE:
- `dga_status_for_adge = 6`
- `statuscode = 776140004`
- instance submission date is updated
- instance `statuscode` can also move to DGE review state when bulk submit flow completes

## 8. DGE Workflow

## 8.1 Strategy Team

Strategy Team mainly works with:
- `776140004` = Under Strategic Alignment Review
- `776140006` = Strategic Priority Change Under Review
- `776140007` = Under Quality Check
- `776140010` = Clarification Pending

Main responsibilities:
- review strategic priority and classification
- bulk update strategic mapping
- assign projects to SME via strategic-priority-to-team mapping
- review SME-requested strategic priority changes
- handle quality-check/final governance steps

## 8.2 SME Team

SME Team only sees projects in its assigned SME domain.

Domain is resolved from:
- `currentSME`
- matching `strategicPriorityId`

SME screens should show only projects whose:
- `budget.strategicPriorityId === currentSME.strategicPriorityId`

SME currently works with:
- `776140005` = Under SME Review
- `776140006` = Strategic Priority Change Under Review
- `776140007` = Under Quality Check
- `776140010` = Clarification Pending

## 8.3 Strategy-to-SME assignment

Implemented in [src/services/dgeWorkflowService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgeWorkflowService.ts:1).

When Strategy sends project to SME:
- owner moves to SME team
- `dga_sme_reviewer_team` is set
- `dga_status_for_adge = 6`
- `statuscode = 776140005`

Strategy determines target SME by matching:
- budget strategic priority id
- `dgeSmeAssignments`

## 8.4 SME strategic priority change request

When SME requests a strategic priority/classification change:
- actual live strategic fields do not change immediately
- requested values are stored in:
  - `dga_previous_strategic_priority`
  - `dga_previous_strategic_priorityclassification`
- owner moves back to Strategy Team
- status becomes `776140006`
- sharing may keep SME visibility

When Strategy approves requested change:
- requested values are copied into live strategic fields
- previous/requested fields are cleared
- project is reassigned to the SME team for the new strategic priority
- old SME access can be revoked via `revokeaccess`
- status returns to `776140005`

When Strategy rejects requested change:
- previous/requested fields are cleared
- project returns to SME based on current live strategic priority
- status returns to `776140005`

## 8.5 SME route to quality check

When SME routes to quality check:
- owner moves to Strategy Team
- `statuscode = 776140007`
- `dga_status_for_adge = 6`
- reviewer user lookups are stamped:
  - `dga_strategic_alignment_reviewer_systemuser`
  - `dga_sme_reviewer_user`

## 9. Clarification Workflow

Clarification logic is implemented in:
- [src/services/clarificationService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/clarificationService.ts:1)
- shared UI in `ProjectDetail.tsx` and `ClarificationThread.tsx`

Clarifications are stored in:
- `dga_ict_clarifications`

Important values:
- clarification stage planning = `1`
- clarification stage DGE review = `2`
- scope external = `1`
- scope internal entity = `2`

## 9.1 ADGE clarification flow

Reviewer or Approver can raise clarification to Respondent.

Result:
- budget moves to respondent ownership
- `statuscode = 776140010`
- `dga_status_for_adge = 5`

First respondent reply sends record back to the original ADGE governance owner:
- Reviewer
- or Approver

## 9.2 DGE clarification flow

Strategy Team and SME Team can raise clarification to Respondent.

When DGE raises clarification:
- clarification stage = `2`
- scope = `1`
- budget owner returns to respondent team
- `statuscode = 776140010`
- `dga_status_for_adge = 5`

Important:
- for DGE clarification, `statuscode` must be `776140010`
- `dga_status_for_adge` must be `5`
- writing `5` directly into `statuscode` is invalid

## 9.3 Respondent reply handoff for DGE clarification

When Respondent replies to a clarification raised by:
- `Strategy Team`
- `SME Team`

the budget is assigned back to that DGE owner:

### Reply back to Strategy Team
- owner moves to strategy team
- `statuscode = 776140004`
- `dga_status_for_adge = 6`

### Reply back to SME Team
- owner moves to `dga_sme_reviewer_team`
- `statuscode = 776140005`
- `dga_status_for_adge = 6`

Clarification thread remains open until the raising side closes it.

## 10. Editability Rules In Project Detail

Shared form page:
- [src/pages/respondent/ProjectDetail.tsx](/abs/path/c:/ICT-Budgeting-2026/src/pages/respondent/ProjectDetail.tsx:1)

This same page is reused by:
- Respondent
- Reviewer
- Approver
- Strategy Team
- SME Team

### Strategy Team
- full edit access
- not limited by normal owner lock in the same way as ADGE roles

### SME Team
- can only edit when the record is currently owned by that SME context
- edit is limited to DGE recommendation fields and recommended budget fields
- if project is no longer assigned to SME, the form becomes read-only

### Respondent / Reviewer / Approver
- editability depends on workflow status and current owner

## 11. DGE-Specific Recommendation Fields

Shown only in DGE-stage edit/view usage, not for ADGE roles.

Current fields:
- `dga_recommended`
- `dga_rejection_reason`
- `dga_rejection_justification`
- `dga_rejected_by`

Behavior:
- if recommended = `Yes`, rejection fields stay hidden
- if recommended = `No`, rejection reason and justification are shown
- `dga_rejected_by` is not meant to be user-entered manually in UI
- it is set from `sessionStorage["userID"]` on save

Budget line items also support:
- requested budget
- recommended budget

For SME:
- requested amount is read-only
- recommended amount is editable when SME is allowed to edit

## 12. Key Service Files

### Boot / context
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

### DGE portfolio mapping
- [src/services/dgePortfolioService.ts](/abs/path/c:/ICT-Budgeting-2026/src/services/dgePortfolioService.ts:1)

### Shared project form
- [src/pages/respondent/ProjectDetail.tsx](/abs/path/c:/ICT-Budgeting-2026/src/pages/respondent/ProjectDetail.tsx:1)

## 13. What To Tell Codex In A New Chat

If you start a fresh chat, a useful prompt is:

1. Read `IMPLEMENTED_WORKFLOW_AND_BOOT_REFERENCE.md`
2. Read `Workflow.md`, `Data.md`, and `ICT_Budgeting_App_Overview.md`
3. Respect current ADGE boot first, then DGE boot
4. Do not break `instanceID` / `instanceDetail`
5. Reuse `ProjectDetail.tsx` as the shared edit/view form
6. Keep ADGE status display based on `dga_status_for_adge`
7. Keep DGE status display based on `statuscode`

## 14. Short Summary

The safest mental model for this app is:

- ADGE side is instance-scoped and account/team-driven
- DGE side is cycle-wide and strategic-priority/team-driven
- ownership controls workflow
- sharing preserves visibility across handoffs
- `dga_status_for_adge` is the ADGE-facing stage
- `statuscode` is the detailed workflow engine, especially for DGE
- clarifications can move records back to Respondent from both ADGE and DGE
- respondent replies return the record to the original reviewer/approver/strategy/SME side
