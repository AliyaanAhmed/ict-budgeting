# Data

This document summarizes the current data layer used by the app.

## Dataverse Integration

The app now uses generated Dataverse services through:
- `@microsoft/power-apps/data`
- `getClient(dataSourcesInfo)`
- generated services under `src/generated/services/*`

Current generated services in use include:
- `AccountsService`
- `Dga_classificationsService`
- `Dga_ict_budgetsService`
- `Dga_ict_budget_line_itemsService`
- `Dga_ict_budget_dga_technology_productsetService`
- `Dga_strategic_prioritiesesService`
- `Dga_technologiesService`
- `Dga_work_streamsService`
- `SystemusersService`
- clarification, notification, cycle, instance, and AI-summary services generated for the app

The app also uses custom API wrappers where Dataverse generated services are not enough:
- `src/services/webApiForPortalService.ts`
- `src/services/fileUploadService.ts`
- `src/services/fileDeleteService.ts`
- `src/services/documentAiSummaryStoreService.ts`

## Current Dataverse-Backed Areas

- ICT budget creation and edit/save
- budget line items
- technology product association
- strategic priorities
- work streams
- clarifications
- notifications
- AI summary persistence
- workflow handoff / sharing
- file upload via Power Automate proxy

## Session Storage Used By The App

The app sets and reads several values on document load and during role/context initialization.

### User / Role Context

- `ict_app_user`
- `userID`
- `moduleTypeID`
- `moduleConfigTeamIDs`
- `userTeams`
- `currentRole`

Role-specific context keys:
- `respondentAccount`
- `respondentAccountName`
- `respondentModuleConfigId`
- `reviewerAccount`
- `reviewerAccountName`
- `reviewerModuleConfigId`
- `approverAccount`
- `approverAccountName`
- `approverModuleConfigId`

### Instance / Cycle Context

- `instanceID`
- `instanceDetail`
- `currentCycle`
- `cycles`

The instance detail object currently includes values such as:
- `id`
- `name`
- `abbr`
- `planningStartDate`
- `planningEndDate`

The app uses `instanceDetail.abbr` when creating ICT budgets so the budget can carry the entity abbreviation.

## Project / Budget Retrieval Pattern

Main service:
- `src/services/projectService.ts`

Project detail flow:
- load project by id
- load ICT budget draft details if the budget is Dataverse-backed
- load budget line items
- load technology products
- load supporting-document summaries and AI summary records

## Supporting Document Persistence

The app persists document AI summaries in Dataverse:
- `dga_ict_document_summary`
- `dga_ict_ai_summary`

These are read back in the edit/view form and reused on load when available.

## Export

Project list export is still handled from the shared export service:
- `src/services/projectExportService.ts`

It exports the currently filtered project list for each role page.

## Current Data Access Pattern

The preferred pattern remains:
1. use the generated Dataverse service
2. map it into app-friendly types in `services/`
3. keep UI components presentation-focused

The app no longer depends on the old mock-first description in the documentation.

