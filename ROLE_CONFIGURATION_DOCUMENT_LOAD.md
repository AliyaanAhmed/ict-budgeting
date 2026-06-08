# Role Configuration And Document Load

This file explains how role configuration and document load currently work in the ICT Budgeting app, covering both the completed ADGE flow and the newer DGE role bootstrap.

## Document Load Sequence

The app boot sequence is defined in [src/main.tsx](/c:/ICT-Budgeting-2026/src/main.tsx).

Load order:

1. `initUserContext()`
2. `initDgeRoleContext()`
3. `initCycleContext()`
4. `initInstanceContext()`
5. React renders the app

This keeps ADGE initialization intact and adds DGE role discovery as a separate step before the cycle and instance context are prepared.

## ADGE Role Configuration

ADGE is entity based.

The user is matched to ADGE roles by checking which configured Dataverse teams they belong to:

- `Respondent`
- `Reviewer`
- `Approver`

### ADGE APIs Used On Load

Defined in [src/services/userContextService.ts](/c:/ICT-Budgeting-2026/src/services/userContextService.ts).

The app uses:

- `SystemusersService`
  - resolves the current Power Apps user to Dataverse `systemuserid`
- `TeammembershipsService`
  - finds all teams for the current Dataverse user
- `Dga_module_typesService`
  - resolves the `ICT Budgeting` module type
- `Dga_module_configurationsService`
  - resolves ADGE module configuration records
- `AccountsService`
  - resolves entity/account names for respondent, reviewer, and approver contexts
- `TeamsService`
  - resolves ADGE team names

### ADGE Session Storage Keys

The ADGE load writes:

- `ict_app_user`
- `userID`
- `moduleTypeID`
- `moduleConfigTeamIDs`
- `userTeams`
- `respondentAccount`
- `respondentAccountName`
- `respondentModuleConfigId`
- `reviewerAccount`
- `reviewerAccountName`
- `reviewerModuleConfigId`
- `approverAccount`
- `approverAccountName`
- `approverModuleConfigId`

### ADGE Active Role

Role switching is handled in [src/context/RoleContext.tsx](/c:/ICT-Budgeting-2026/src/context/RoleContext.tsx).

- The app reads `userTeams`
- It resolves which ADGE roles are available
- It defaults to the first available ADGE role
- The selected role is stored in:
  - `currentRole`

Display names written to `currentRole` are:

- `ICT - Respondent`
- `ICT - Reviewer`
- `ICT - Approver`

## ADGE Instance Configuration

ADGE is also instance based.

After user context and cycle context load, the app resolves the current instance by:

- selected ADGE role
- selected cycle
- role-specific account id

Defined in [src/services/instanceService.ts](/c:/ICT-Budgeting-2026/src/services/instanceService.ts).

### Instance APIs Used

- `Dga_ict_budget_instancesService`
  - finds the current instance for the selected cycle and ADGE entity

### Instance Session Storage Keys

- `instanceID`
- `instanceDetail`

`instanceDetail` stores:

- `id`
- `name`
- `abbr`
- `planningStartDate`
- `planningEndDate`

## Cycle Configuration

Defined in [src/services/cycleService.ts](/c:/ICT-Budgeting-2026/src/services/cycleService.ts).

### Cycle APIs Used

- `Dga_cyclesService`
  - loads all cycles
  - narrows to ICT cycles
  - resolves current and previous cycle

### Cycle Session Storage Keys

- `cycles`
- `currentCycle`

## DGE Role Configuration

DGE is not entity based and does not use instance ownership to determine whether a role should appear.

Two DGE roles are supported:

- `ICT - Strategy Team`
- `ICT - SME Team`

Defined in [src/services/dgeRoleContextService.ts](/c:/ICT-Budgeting-2026/src/services/dgeRoleContextService.ts).

### SME Team Discovery

On load, the app reads strategic priorities and their configured SME groups.

Each strategic priority record may have:

- strategic priority id
- strategic priority name
- SME group team id

The app then:

1. loads all strategic priorities where SME group is not null
2. reads the SME team id for each priority
3. loads team memberships for those teams
4. resolves the users inside those teams
5. stores a session object containing:
   - strategic priority
   - SME team
   - users

If the current logged in user exists in one or more of those SME teams:

- `ICT - SME Team` appears in the role switcher
- each SME assignment appears as its own role option
- the selected SME assignment is stored in `currentSME`

### SME APIs Used

- `Dga_strategic_prioritiesesService`
  - loads strategic priority records and SME group team ids
- `TeammembershipsService`
  - resolves users inside each SME team
- `SystemusersService`
  - resolves user details for those team members

### SME Session Storage Keys

- `dgeSmeAssignments`
- `currentSME`

`dgeSmeAssignments` stores all SME mappings:

- `strategicPriorityId`
- `strategicPriorityName`
- `teamId`
- `teamName`
- `users`

`currentSME` stores the selected SME assignment for the current user.

## Strategy Team Discovery

For Strategy Team, the app does not look at entity configuration.

It:

1. loads the Dataverse team where `name = 'ICT - Strategy Team'`
2. loads that team’s memberships
3. resolves its users
4. checks whether the current logged in user is inside that team

If yes:

- `ICT - Strategy Team` appears in the role switcher

### Strategy APIs Used

- `TeamsService`
  - finds the `ICT - Strategy Team` record
- `TeammembershipsService`
  - loads team members
- `SystemusersService`
  - resolves user details

### Strategy Session Storage Keys

- `dgeStrategyTeam`

This stores:

- `teamId`
- `teamName`
- `users`

## Role Switcher Behavior

The role switcher is rendered in [src/components/layout/Header.tsx](/c:/ICT-Budgeting-2026/src/components/layout/Header.tsx) and configured by [src/context/RoleContext.tsx](/c:/ICT-Budgeting-2026/src/context/RoleContext.tsx).

### ADGE Role Switch

ADGE roles are shown once each:

- `ICT - Respondent`
- `ICT - Reviewer`
- `ICT - Approver`

### DGE Role Switch

Strategy Team:

- shown once if the user belongs to the Strategy Team

SME Team:

- shown once per strategic priority assignment
- each option uses:
  - role label: `ICT - SME Team`
  - subtitle: strategic priority name

If the user belongs to multiple SME teams, they will see multiple SME entries.

When an SME entry is selected:

- `currentRole` is set to `ICT - SME Team`
- `currentSME` is updated to the selected strategic priority assignment

## Important Separation

ADGE and DGE role resolution are intentionally different:

- ADGE
  - entity based
  - instance based
  - role/account configuration comes from module configuration
- DGE
  - not entity based
  - not instance based
  - Strategy role comes from one named team
  - SME role comes from strategic priority → SME group team mapping

This keeps completed ADGE behavior stable while enabling DGE roles to become dynamic.
