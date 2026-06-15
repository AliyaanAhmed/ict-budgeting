---
name: ict-budgeting-copilot
description: Use this skill to answer questions about the ICT Budgeting app, Dataverse records, ADGE and DGE workflows, role queues, clarifications, assignments, sharing, allocation, utilization, and budget governance.
---

# ICT Budgeting Copilot Skill

Use this skill when a user asks the Copilot about the ICT Budgeting 2026 app, its Dataverse records, role-specific queues, dashboards, project status, clarification threads, assignments, sharing, allocation, utilization, or DGE review workflow.

This skill assumes the Copilot has access to Dataverse through MCP. Dataverse is the source of truth for live records. This file explains how to interpret those records in the context of the app workflow.

## Primary Goals

- Answer user questions about ICT budget projects, instances, cycles, entities, queues, statuses, budgets, recommendations, clarifications, and ownership.
- Explain what action is available to a role and why.
- Summarize portfolio, entity, SME-domain, or project-level progress using live Dataverse data.
- Interpret app behavior using `IMPLEMENTED_WORKFLOW_AND_BOOT_REFERENCE.md` as the workflow source of truth.
- Keep ADGE and DGE workflow concepts separate so answers do not mix instance-scoped ADGE behavior with cycle-wide DGE governance behavior.

## When To Use This Skill

Use this skill for questions such as:

- "How many projects are pending with reviewer?"
- "Which projects are under SME review for Digital Infrastructure and Cloud?"
- "Why can/can't this role edit this project?"
- "Who owns this budget right now?"
- "Which clarifications are waiting for ADGE respondent?"
- "What happens when Strategy Director completes review?"
- "Which entity can start allocation?"
- "Show projects added during allocation."
- "What is the recommended budget versus allocated budget?"
- "Which projects are not recommended by DGE?"

## Core Dataverse Tables

Use exact schema names when querying Dataverse.

- `dga_ict_budget_instance`: entity/cycle instance, ADGE account scope, instance status.
- `dga_ict_budget`: project/budget header record.
- `dga_ict_budget_line_item`: project budget line amounts and account codes.
- `dga_ict_clarifications`: clarification threads.
- Clarification replies table: reply/comment records linked to clarification threads, if available in the MCP schema.
- `dga_module_configuration`: per-instance ADGE Respondent/Reviewer/Approver team configuration.
- `team`: Dataverse owner/team table.
- `systemuser`: Dataverse user table.
- `dga_strategic_priorities`: DGE strategic priority records.
- Strategic priority classification table: use the actual MCP schema name available in Dataverse.

## Role Model

### ADGE Roles

- Respondent
- Reviewer
- Approver

ADGE roles are instance-scoped. They normally see records for their current `instanceID` / `instanceDetail`.

### DGE Roles

- Strategy Team
- SME Team
- Strategy Director

DGE roles are cycle-wide. Strategy Team and Strategy Director see all selected-cycle instance projects. SME Team sees only selected-cycle projects matching the active SME strategic priority domain.

### Admin Role

- ICT Admin

ICT Admin is used for administration, including cycle creation when no cycle exists.

## Critical Status Fields

### `dga_status_for_adge`

This is the ADGE-facing status field. ADGE screens normally use this field for status labels.

Known values:

- `1`: Draft
- `2`: Under Reviewer Review
- `3`: Under Approver Review
- `4`: Approved by Approver
- `5`: Clarification Pending
- `6`: Under DGE Review
- `7`: Allocation In Progress
- `8`: Allocation In Review
- `9`: Allocation Completed
- `10`: Utilization in Progress
- `11`: Utilization Completed
- `12`: Reviewer Review Completed

### `statuscode`

This is the detailed workflow status reason used by DGE screens and workflow logic.

Known values:

- `1`: Draft
- `776140001`: Under Reviewer Review
- `576610001`: Reviewer Review Completed
- `776140002`: Under Approver Review
- `776140003`: Approved by Approver
- `776140004`: Under Strategic Alignment Review
- `776140005`: Under SME Review
- `776140006`: Strategic Priority Change Under Review
- `776140007`: Under Quality Check
- `776140008`: Under Final Review
- `776140009`: Review Completed
- `776140010`: Clarification Pending
- `776140011`: Allocation in Progress
- `776140012`: Allocation in Review
- `776140013`: Allocation Completed
- `776140014`: Utilization in Progress
- `776140015`: Utilization Completed

Rule: ADGE users generally see `dga_status_for_adge`; DGE users generally see `statuscode`.

## Instance Status And Budget Visibility

Budget visibility depends on the `dga_ict_budget_instance.statuscode`.

- Planning: show Requested Budget only.
- Review Completed by DGE: show Requested Budget, Recommended Budget, and Planning Outcome.
- Allocation: show Requested Budget, Recommended Budget, Allocated Budget, Planning Outcome, and Added In Allocation.
- Utilization: show Requested Budget, Recommended Budget, Allocated Budget, Utilized Budget, Planning Outcome, and Added In Allocation.

DGE project pages can show all four budget columns because DGE roles work across the full governance lifecycle.

## Recommendation Fields

DGE recommendation fields:

- `dga_recommended`
- `dga_rejection_reason`
- `dga_rejection_justification`
- `dga_rejected_by`
- `dga_planning_outcome`

Choices:

- `dga_recommended = 1`: No
- `dga_recommended = 2`: Yes
- `dga_planning_outcome = 1`: Recommended by DGE
- `dga_planning_outcome = 2`: Not Recommended

When Strategy Director completes review, the app derives `dga_planning_outcome` from `dga_recommended`.

## Ownership And Sharing

Ownership moves workflow. Sharing preserves visibility after ownership changes.

Common owner lookups and actor lookups:

- `ownerid`
- `dga_respondent_systemuser`
- `dga_reviewer_systemuser`
- `dga_approver_systemuser`
- `dga_strategic_alignment_reviewer_systemuser`
- `dga_sme_reviewer_team`
- `dga_sme_reviewer_user`
- `dga_quality_checker`

Sharing uses custom API `dga_WebApiForPortal`.

Grant access payload:

- `actionName`: `grandaccess`
- `tableName`: `dga_ict_budget`
- `relatedId`: budget id
- `targetId`: team id
- `fetchXml`: `read`

Revoke access payload:

- `actionName`: `revokeaccess`
- `tableName`: `dga_ict_budget`
- `relatedId`: budget id
- `targetId`: team id
- `fetchXml`: `read`

Important sharing examples:

- SME route to quality check grants current SME first, then assigns to Strategy Team.
- Strategy Team clarification to SME grants Strategy Team first, then assigns to SME.
- Strategy Director clarification to Strategy or SME grants Strategy Director first, then assigns away.
- SME strategic priority change request grants current SME before assigning back to Strategy Team.
- Strategy approval of a strategic priority change revokes old SME access if routing changes to a different SME.

## ADGE Workflow Summary

Respondent creates or edits planning drafts, then submits to Reviewer.

Reviewer reviews, raises clarification, or submits to Approver.

Approver approves, raises clarification, submits to DGE during planning, completes allocation review during allocation, and starts utilization after all budgets are allocation completed.

Planning Submit to DGE:

- sets budget status to Under Strategic Alignment Review
- sets ADGE-facing status to Under DGE Review
- updates instance submission date
- updates instance status to DGE review state

Allocation Submit to DGE:

- starts Utilization
- updates instance status to Utilization
- updates instance budgets to Utilization in Progress
- assigns budgets back to instance Respondent team

## DGE Workflow Summary

### Strategy Team

Strategy Team can:

- edit any project during DGE governance.
- bulk update strategic priority and classification.
- send projects to SME.
- review SME strategic-priority-change requests.
- raise clarification from ADGE or SME depending on stage.
- route quality-check items to Strategy Director.

### SME Team

SME Team is domain-scoped by `currentSME.strategicPriorityId`.

SME Team can:

- edit only recommendation fields and recommended budget where allowed.
- request strategic priority change.
- raise clarification to ADGE respondent only while Under SME Review.
- route to quality check after recommendation validation passes.

### Strategy Director

Strategy Director can:

- review final DGE items.
- raise internal DGE clarification to Strategy Team or SME Team.
- complete review.
- publish an instance after all budgets are Review Completed.
- start allocation for an instance.

## Clarification Model

Clarification scope values:

- `1`: External
- `2`: Internal Entity
- `3`: Internal DGE

Clarification stage values:

- `1`: Planning
- `2`: DGE Review
- `3`: Allocation

Clarification status values:

- `1`: Open
- `776140002`: Responded
- `776140003`: Closed

### External DGE-To-ADGE Clarification

Raised by Strategy Team or SME Team to ADGE Respondent.

Rules:

- create clarification record.
- set `statuscode = 776140010`.
- set `dga_status_for_adge = 5`.
- owner remains with the current DGE owner.
- do not assign or share the budget to ADGE.
- resolve `dga_raised_to` from the budget's own instance module configuration Respondent team.
- do not use the DGE user's `moduleConfigTeamIDs` session value for this.

### ADGE Internal Clarification

Raised by Reviewer or Approver to Respondent.

Rules:

- scope is `Internal Entity`.
- owner returns to Respondent team.
- Respondent first reply returns to the original ADGE governance role.

### Internal DGE Clarification

Raised between Strategy Director, Strategy Team, and SME Team.

Rules:

- scope is `Internal DGE`.
- ADGE roles should not see these threads.
- raised-to team/user controls reply permission.
- Strategy Director to Strategy Team first reply returns to Strategy Director.
- Strategy Director to SME first reply moves to Strategy Team / Under Quality Check.
- Strategy Team to SME first reply returns to Strategy Team / Under Quality Check.

## Query Patterns For Copilot

### ADGE User Questions

1. Resolve current cycle.
2. Resolve current ADGE instance.
3. Query budgets for that instance.
4. Use `dga_status_for_adge` for status display.
5. Use instance status to decide which budget fields to show.

### Strategy Team Questions

1. Resolve current cycle.
2. Query all instances in the selected cycle.
3. Query all budgets for those instances.
4. Use `statuscode` for status display.
5. Include strategic priority, classification, Target SME, clarification, quality-check, and final-review context.

### SME Team Questions

1. Resolve current cycle.
2. Resolve `currentSME`.
3. Query all selected-cycle instance budgets.
4. Filter to budgets whose strategic priority matches `currentSME.strategicPriorityId`.
5. Use `statuscode` for status display.

### Strategy Director Questions

1. Resolve current cycle.
2. Query all instances in the selected cycle.
3. Query all budgets for those instances.
4. Focus on Under Final Review, Review Completed, Clarification Pending, entity publish, allocation readiness, and utilization readiness.

## Answering Rules

- Query Dataverse for live data when the user asks about current counts, statuses, owners, budgets, or records.
- Prefer formatted Dataverse labels when available.
- Do not invent records or counts.
- If the requested cycle/entity/project is ambiguous, ask for the missing context.
- Keep internal GUIDs hidden unless the user asks for them.
- Explain both the user-facing status and the workflow reason when it helps.
- For mutation/action questions, explain what records would change before suggesting an action.
- Do not perform write actions unless explicitly requested and confirmed.

