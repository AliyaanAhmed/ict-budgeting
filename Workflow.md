# ICT Budgeting Workflow

This document reflects the workflow currently implemented in the app for Respondent, Reviewer, Approver, and the post-approval DGE handoff.

## Roles

Primary business roles:
- `Respondent`
- `Reviewer`
- `Approver`
- `Strategy Team` for the DGE-stage handoff after approver submission

Supporting technical/admin role:
- `ICT Admin`

## Workflow Fields

### `dga_status_for_adge`

This is the main workflow stage field used by the app.

Current values used by the app:
- `1` = Draft
- `2` = Under Reviewer Review
- `3` = Under Approver Review
- `4` = Approved by Approver
- `5` = Clarification Required
- `6` = Submitted to DGE
- `12` = Reviewer Review Completed

### `statuscode`

Dataverse status reason values currently used by the app:
- `1` = Draft
- `776140001` = Under Reviewer Review
- `576610001` = Reviewer Review Completed
- `776140002` = Under Approver Review
- `776140003` = Approved by Approver
- `776140010` = Clarification Required
- `776140004` = Submitted to DGE / Under Strategic Alignment Review

The app uses `statuscode` plus ownership/assignment to decide editability.

## Session / Assignment Context

Workflow actions resolve ownership using session-stored context:
- `sessionStorage["moduleConfigTeamIDs"]`
- `sessionStorage["userTeams"]`
- `sessionStorage["userID"]`
- `sessionStorage["currentRole"]`

Instance / cycle context also comes from session storage:
- `sessionStorage["instanceID"]`
- `sessionStorage["instanceDetail"]`
- `sessionStorage["currentCycle"]`
- `sessionStorage["cycles"]`

The app also stores role-specific account and module config context:
- `respondentAccount`
- `respondentAccountName`
- `respondentModuleConfigId`
- `reviewerAccount`
- `reviewerAccountName`
- `reviewerModuleConfigId`
- `approverAccount`
- `approverAccountName`
- `approverModuleConfigId`

## Ownership And Sharing

Workflow transitions update:
- `ownerid`
- the relevant actor lookup:
  - respondent actions -> `dga_respondent_systemuser`
  - reviewer actions -> `dga_reviewer_systemuser`
  - approver actions -> `dga_approver_systemuser`
- the workflow fields above

The app also shares the record using `dga_WebApiForPortal` when ownership changes or clarification flow needs previous-role visibility.

## Standard Workflow

### 1. Respondent

Respondent creates a draft:
- status: `Draft`
- owner: Respondent context
- actor lookup: respondent user

Respondent can edit when the record is assigned to the respondent context and is in a respondent-owned workflow state.

Respondent submits to reviewer:
- `dga_status_for_adge = 2`
- `statuscode = 776140001`
- owner moves to reviewer context
- respondent actor lookup is stamped
- reviewer notification is created

Supporting documents:
- respondent submission expects supporting documents to exist before final submit logic completes

### 2. Reviewer

Reviewer sees:
- `Submitted to Reviewer`
- `Reviewer Review Completed`
- `Clarification Required`
- `Sent to Approver` in queue views when a project has been forwarded

Reviewer actions:
- `Mark as Reviewed`
- `Raise Clarification`
- `Submit to Approver`

Reviewer submit to approver:
- `dga_status_for_adge = 3`
- `statuscode = 776140002`
- owner moves to approver context
- reviewer actor lookup is stamped
- approver notification is created

Reviewer clarification:
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- owner returns to respondent context
- reviewer actor lookup is stamped
- respondent notification is created

### 3. Approver

Approver sees:
- `Submitted to Approver`
- `Approved`
- `Clarification Required`
- `Submitted to DGE`

Approver actions:
- `Approve Project`
- `Raise Clarification`
- `Submit to DGE` when the cycle is ready

Approver approve:
- `dga_status_for_adge = 4`
- `statuscode = 776140003`
- approver actor lookup is stamped

Approver clarification:
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- owner returns to respondent context
- approver actor lookup is stamped
- respondent notification is created

## Clarification Flow

Clarifications are stored in `dga_ict_clarification`.

Current behavior:
- Reviewer or Approver can raise clarification
- Respondent replies in-thread
- clarification files and reply files are preserved and shown in the thread
- the first respondent reply can hand the record back to the original role

Clarification reply handoff:
- if Reviewer raised it, first respondent reply sends the record back to Reviewer
- if Approver raised it, first respondent reply sends the record back to Approver

## Post-DGE Shortcut Flow

Once the first project in the current cycle has been submitted to DGE:
- later projects can follow the shorter path
- reviewer items can move more directly to approver
- approver can submit directly to DGE

This is reflected in the queue labels and submission behavior currently used in the app.

## Queue Behavior

### Reviewer Queue

Current reviewer queue tabs:
- `To Review`
- `Reviewed`
- `Sent to Approver`
- `Clarification`

Rules:
- `Reviewed` should contain only reviewer-completed items
- forwarded items are shown in `Sent to Approver`
- queue counts should match the current workflow labels

### Approver Queue

Current approver queue tabs:
- `Pending Approval`
- `Approved`
- `Clarification`
- `Submitted to DGE`

Rules:
- `Amount Requested` is shown in the queue header summary
- budget/request summary should not duplicate across the header
- the queue strip mirrors the dashboard submission context

## Notifications

Workflow notifications are created in `dga_app_notifications`.

Open notifications use:
- `statuscode = 1`

Read/closed notifications use:
- `statuscode = 576610001`

Notifications are generated for:
- respondent -> reviewer
- reviewer -> approver
- reviewer -> respondent clarification
- approver -> respondent clarification
- respondent clarification reply handoff
- approver -> DGE

## Summary

The current workflow is:
1. Respondent drafts and submits
2. Reviewer reviews, completes review, or raises clarification
3. Reviewer forwards to approver
4. Approver approves, clarifies, or submits to DGE
5. After the first DGE submission, later projects can take the shorter route

