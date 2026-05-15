# ICT Budgeting Workflow

This document explains the workflow used in the ICT Budgeting app across Respondent, Reviewer, Approver, and post-DGE handling.

It covers:
- role-by-role workflow behavior
- `dga_status_for_adge` and `statuscode` usage
- assignment rules
- sharing rules
- clarification behavior
- notification behavior
- the direct workflow after the first DGE submission

## Roles

The app uses these primary business roles:
- `Respondent`
- `Reviewer`
- `Approver`
- `Strategy Team` for DGE-stage ownership after approver submission

Supporting technical/admin role:
- `ICT Admin`

## Core Fields

## `dga_status_for_adge`

This is the main workflow-stage field used to move the ICT budget through ADGE and then into DGE-related flow.

Current values used by the app:
- `1` = Draft
- `2` = Under Reviewer Review
- `3` = Under Approver Review
- `4` = Approved by Approver
- `5` = Clarification Required / Clarification Pending
- `6` = Under DGE Review
- `12` = Reviewer Review Completed

Downstream DGE/allocation/utilization statuses are also interpreted by the app as `Submitted to DGE` for role views when appropriate.

## `statuscode`

This is the Dataverse status reason used alongside `dga_status_for_adge`.

Current values used by the app:
- `1` = Draft
- `776140001` = Under Reviewer Review
- `576610001` = Reviewer Review Completed
- `776140002` = Under Approver Review
- `776140003` = Approved by Approver
- `776140010` = Clarification Required
- `776140004` = Under Strategic Alignment Review / Under DGE Review

Important current rule:
- form lock/unlock logic should rely on `statuscode` plus assignment/ownership
- `status_for_adge` is not the primary field for deciding editability anymore

## Actor Lookup Fields

The ICT Budget record is also stamped with the acting user during workflow actions:
- `dga_respondent_systemuser@odata.bind`
- `dga_reviewer_systemuser@odata.bind`
- `dga_approver_systemuser@odata.bind`

The user id comes from:
- `sessionStorage["userID"]`

These lookups are updated:
- on create for respondent
- on workflow submission by respondent
- on reviewer review actions
- on approver actions

## Assignment Model

Assignments are done by changing `ownerid` to the target role team.

Team ids come from session storage:
- key: `moduleConfigTeamIDs`

Stored values:
- `respondentTeamId`
- `reviewerTeamId`
- `approverTeamId`
- `strategyTeamId`

Assignment uses team ownership:
- `/teams(<teamId>)`

Fallback behavior may use user/team context already loaded in session storage if needed.

## Sharing Model

When workflow ownership changes, the app also shares the ICT budget with the previous business role where required.

Sharing is done through custom API:
- datasource: `dga_webapiforportal`
- operation: `dga_WebApiForPortal`

Grant-access payload pattern:

```json
{
  "actionName": "grandaccess",
  "tableName": "dga_ict_budget",
  "relatedId": "<ictBudgetId>",
  "targetId": "<teamId>",
  "fetchXml": "read"
}
```

Share targets by action:
- Respondent submits to Reviewer -> share with `Respondent`
- Reviewer submits to Approver -> share with `Reviewer`
- Reviewer raises clarification -> share with `Reviewer`
- Approver approves -> share with `Approver`
- Approver raises clarification -> share with `Approver`
- Respondent first clarification reply returning record -> share with `Respondent`
- Approver submits to DGE -> share with `Approver`
- Direct post-DGE approver submission -> share with `Approver`

## Notification Model

Notifications are created in:
- `dga_app_notifications`

Used fields:
- `dga_notification_id`
- `dga_notification_recipient_team`
- `dga_notification_text`
- `statuscode`

Notification create rules:
- recipient team is the role/team the item is moving to
- `statuscode = 1` means open
- close / read uses `statuscode = 576610001`

Notifications are created on workflow handoff actions such as:
- respondent -> reviewer
- reviewer -> approver
- reviewer -> respondent clarification
- approver -> respondent clarification
- approver -> strategy team
- respondent clarification reply return to reviewer/approver

## Standard Workflow

## 1. Respondent

### Create

When respondent creates an ICT budget:
- record is created in Draft
- `dga_status_for_adge = 1`
- `statuscode = 1`
- respondent actor lookup is set
- owner is respondent team/current respondent ownership path

### Edit

Respondent can edit only when:
- status is respondent-owned by `statuscode`
- and the record is assigned to the respondent team/user context

### Submit to Reviewer

Action:
- `Submit to Reviewer`

Updates:
- `dga_status_for_adge = 2`
- `statuscode = 776140001`
- assign to reviewer team
- set respondent user lookup
- share with respondent team
- create notification for reviewer team

Supporting documents rule:
- respondent submission requires at least one supporting document

## 2. Reviewer

### Under Reviewer Review

When record is with reviewer:
- `dga_status_for_adge = 2`
- `statuscode = 776140001`

Available actions in normal flow:
- `Complete Review`
- `Raise Clarification`

### Complete Review

Action:
- `Complete Review`

Updates:
- `dga_status_for_adge = 12`
- `statuscode = 576610001`
- no reassignment
- reviewer actor lookup is set

### Reviewer Review Completed

When status is completed:
- reviewer can only `Submit to Approver`
- reviewer cannot raise clarification in this state

### Submit to Approver

Action:
- `Submit to Approver`

Updates:
- `dga_status_for_adge = 3`
- `statuscode = 776140002`
- assign to approver team
- set reviewer user lookup
- share with reviewer team
- create notification for approver team

### Raise Clarification

Allowed only from:
- Under Reviewer Review

Updates:
- clarification record is created with `raisedByRole = Reviewer`
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- assign to respondent team
- set reviewer user lookup
- share with reviewer team
- create notification for respondent team

## 3. Approver

### Under Approver Review

When record is with approver:
- `dga_status_for_adge = 3`
- `statuscode = 776140002`

Normal actions before first DGE submission:
- `Approve Project`
- `Raise Clarification`

### Approve Project

Action:
- `Approve Project`

Updates:
- `dga_status_for_adge = 4`
- `statuscode = 776140003`
- no owner reassignment at project level
- set approver user lookup
- share with approver team

### Raise Clarification

Updates:
- clarification record is created with `raisedByRole = Approver`
- `dga_status_for_adge = 5`
- `statuscode = 776140010`
- assign to respondent team
- set approver user lookup
- share with approver team
- create notification for respondent team

## 4. Submit Entire Entity to DGE

This is a portfolio/entity-level action for approver.

Condition:
- all projects in the cycle/entity must be approved

Action:
- `Submit to DGE`

Where shown:
- Approver Dashboard
- Approver Queue

Updates for each approved project:
- `dga_status_for_adge = 6`
- `statuscode = 776140004`
- assign to `Strategy Team`
- set approver user lookup
- share with approver team
- create notification for strategy team

After successful submit:
- UI changes to submitted state instead of showing the button
- approver dashboards/queues treat these items as `Submitted to DGE`

## Clarification Flow

Clarifications are stored separately and shown in thread UI.

Clarification records include:
- raised clarification message
- replies
- optional file URLs
- raising role metadata

## Raising Clarification

Reviewer or Approver can raise clarification.

When clarification is raised:
- ICT budget status moves to respondent clarification state
- record is assigned back to respondent
- previous role retains shared access
- notification is sent to respondent team

## Respondent Reply

When respondent replies to a clarification:
- replies continue in thread
- supporting documents and clarification files stay visible together

### First Reply Handoff Rule

If the clarification was raised by reviewer or approver, the first respondent reply triggers workflow return.

Behavior:
- show confirmation dialog
- message tells respondent the project will return to the original role

If raised by reviewer:
- assign back to reviewer
- set status back to reviewer review
- share with respondent
- notify reviewer team

If raised by approver:
- assign back to approver
- set status back to approver review
- share with respondent
- notify approver team

Later replies do not re-trigger the handoff.

## Post-DGE Direct Workflow

Once any single project in the cycle/entity has already been submitted to DGE:
- status = `Submitted to DGE`
- `statuscode = 776140004`

then the workflow changes for later projects in that cycle/entity.

This is a cycle-level shortcut rule.

## Direct Flow Path

After first DGE submission exists:
- Respondent creates project
- Respondent submits to Reviewer
- Reviewer submits directly to Approver
- Approver submits directly to DGE

## What Changes

### Reviewer

Reviewer no longer needs `Complete Review` for new actionable flow in that cycle.

Instead:
- project in reviewer stage can go directly to `Submit to Approver`

### Approver

Approver no longer needs to first mark project approved for those later projects.

Instead:
- project in approver stage can go directly to DGE
- action label becomes direct DGE submission behavior

Updates:
- `dga_status_for_adge = 6`
- `statuscode = 776140004`
- assign to strategy team
- share with approver
- notify strategy team

## Queue Behavior

### Reviewer Queue

Reviewer queue includes:
- `To Review`
- `Reviewed`
- `Clarification Pending`

Important behavior:
- if reviewer has already processed a project and it later moved to approver or DGE, reviewer queue should still reflect it as `Reviewed`
- non-actionable reviewed/downstream items remain historically visible but should not allow reviewer action buttons

### Approver Queue

Approver queue includes:
- `Pending`
- `Approved`
- `Clarification Pending`
- `Submitted to DGE`

Direct flow note:
- after first DGE submission exists, actionable pending approver items may go directly to DGE

## Queue Selection Rules

In reviewer and approver queues:
- only actionable rows are selectable
- `Select all` selects only actionable visible rows
- non-actionable rows cannot be selected individually

Examples of non-actionable items:
- reviewer queue items already historically reviewed and moved downstream
- approver queue items already approved, clarified, or submitted to DGE

## Role Visibility and Interpretation

Respondent, Reviewer, and Approver are treated as ADGE-side users.

For these roles:
- app workflow meaning is centered on `dga_status_for_adge`
- downstream DGE/allocation/utilization statuses are grouped into a `Submitted to DGE` style state for portfolio visibility

## Dashboard Meaning by Role

### Respondent

Respondent sees downstream items as “already submitted for review/governance”.

### Reviewer

Reviewer sees downstream projects as already reviewed once they have left reviewer-controlled flow.

### Approver

Approver sees:
- pending approval
- approved but not yet submitted to DGE
- submitted to DGE

## Summary of Main Workflow Paths

## Standard Path

1. Respondent creates draft
2. Respondent submits to reviewer
3. Reviewer completes review
4. Reviewer submits to approver
5. Approver approves
6. Approver submits full entity to DGE

## Clarification Path

1. Reviewer or approver raises clarification
2. Record returns to respondent
3. Respondent first reply returns it to original raiser
4. Original role continues review

## Post-DGE Shortcut Path

1. Any project already submitted to DGE exists in cycle/entity
2. Respondent submits new project to reviewer
3. Reviewer submits directly to approver
4. Approver submits directly to DGE

