# ICT Budgeting App Guide

This guide reflects the current shipped app, not the older mock-era design.

## 1. Product Overview

ICT Budgeting is a role-based government workflow app for budget submission, review, approval, and DGE handoff.

Supported personas:
- Respondent
- Reviewer
- Approver

## 2. Current Page Structure

### Respondent
- Dashboard
- Projects
- New Project
- Project Detail / Edit-View

### Reviewer
- Dashboard
- Projects
- Review Queue
- Project Detail / Edit-View

### Approver
- Dashboard
- Projects
- Approver Queue
- Project Detail / Edit-View

## 3. Current Workflow Shape

- Respondent creates and submits projects
- Reviewer reviews, completes review, raises clarification, or forwards to approver
- Approver approves, raises clarification, or submits to DGE
- After the first DGE submission in a cycle, later projects can use the shorter direct flow

For the detailed workflow states and queue labels, use:
- [Workflow.md](Workflow.md)

## 4. Current Visual Direction

The app now uses a **blue government UI** with restrained AI accents.

### What The App Looks Like Now
- White and near-white surfaces
- Soft blue borders and shadows
- Blue primary actions
- Clean cards and clear section grouping
- AI surfaces that feel calm and premium rather than flashy

### AI Styling
- Blue is the primary AI language
- Purple is only used sparingly for some legacy AI affordances
- Expandable AI panels use a white shell with a light header gradient
- Expanded AI bodies stay white
- The current AI theme is documented in:
  - [AI_COMPONENT_THEME.md](AI_COMPONENT_THEME.md)

## 5. Shared Layout Patterns

### Dashboards
- Each dashboard uses a role-aware hero/header
- Each dashboard has action cards, workspace summary blocks, and charts
- AI summary areas and issue charts use the same current design language

### Projects Screens
- Table view and card view are both supported
- Action cards and filters are role-aware
- AI review flags are shown in the current blue palette

### Review / Approver Queues
- Queue cards support selection and workflow actions
- Queue headers now include compact budget summary information rather than large old summary blocks
- Export buttons were removed from queue views

### Project Detail / Edit-View
- Reused across all roles
- Supports edit mode and view mode
- Contains the Budget Overview accordion
- Contains supporting-document AI analysis
- Contains strategic recommendations and AI budget consideration surfaces

## 6. Current AI Surfaces

### Budget Overview
- shows confidence
- shows AI review flags
- shows strategic and policy context
- reuses the stored budget overview data when available

### Supporting Documents
- shows per-file analysis
- shows cumulative summary when multiple files exist
- shows file-level evidence assessment
- shows suggested fields and budget/account-code guidance

### Strategic Recommendation
- strategic priority and classification recommendations are shown in both create and edit/view
- option 2 is also actionable in the current UI

### Portfolio Summary
- used on dashboards and summary areas
- shows AI review flags and recommended actions
- shows related project references where available

## 7. Current Session Data

The app stores a substantial amount of context in session storage on load.

Important keys:
- `ict_app_user`
- `userID`
- `moduleTypeID`
- `moduleConfigTeamIDs`
- `userTeams`
- `currentRole`
- `instanceID`
- `instanceDetail`
- `currentCycle`
- `cycles`
- role account keys and names:
  - `respondentAccount`
  - `respondentAccountName`
  - `respondentModuleConfigId`
  - `reviewerAccount`
  - `reviewerAccountName`
  - `reviewerModuleConfigId`
  - `approverAccount`
  - `approverAccountName`
  - `approverModuleConfigId`

The instance detail is used to show entity/cycle context in the dashboards and to stamp new ICT budget records with the correct entity abbreviation.

## 8. UI Rules We Follow Now

- Use Title Case labels
- Keep headings compact and readable
- Use blue for primary product actions
- Use AI gradients only where they support AI surfaces
- Avoid mixing old purple-heavy AI styling into normal dashboard chrome
- Keep table view and card view behavior separate
- Keep queue, dashboard, and detail screens aligned with the live workflow

## 9. Development Notes

- Dataverse services are the main integration path now
- Power Automate is used for document upload and document AI flows
- sessionStorage is relied on heavily for current user, role, team, cycle, and instance context
- Use `npm run build` to verify the app before pushing changes

## 10. Reference Files

- [Workflow.md](Workflow.md)
- [AI_COMPONENT_THEME.md](AI_COMPONENT_THEME.md)
- [AIServicesFlow.md](AIServicesFlow.md)
- [Data.md](Data.md)
- `src/pages/respondent/ProjectDetail.tsx`
- `src/pages/respondent/NewProject.tsx`
- `src/components/shared/AiPortfolioSummary.tsx`
- `src/components/shared/SupportingDocumentAiInsights.tsx`

