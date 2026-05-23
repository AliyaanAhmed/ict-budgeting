# AI Services Detailed Guide

## Purpose
This guide documents the AI implementation currently present in the app.

It focuses on:
- which AI features exist today
- which services call Dataverse Custom APIs
- which services call Power Automate flows
- how AI output is stored in Dataverse
- how Create Form behaves in both Manual and Budget Assistant modes
- how Edit/View behaves across Respondent, Reviewer, and Approver
- how `Budget Overview`, `Cumulative Document Summary`, and file summaries work together
- how to safely add new flows to the Code App without losing manual datasources

This is an implementation guide, not a future-state design note.

---

## Current AI Features

The app currently uses AI in these main areas:

1. `Strategic Priority Suggestion`
- suggests Strategic Priority
- suggests Strategic Priority Classification

2. `ICT Budget Considerations`
- evaluates project text against policy / budget consideration logic
- returns match groups and overall assessment

3. `Document Analyzer`
- analyzes each uploaded supporting document individually
- extracts summary, evidence score, suggested fields, budget lines, account-code hints, and review flags

4. `Cumulative Document Summary`
- combines multiple individual document summaries into one combined document-evidence summary

5. `Budget Overview`
- AI readiness assessment stored per budget
- includes role-specific summaries, readiness status, issues, actions, and strategic/budget/document scoring

6. `Budget Assistant`
- AI-first project creation experience in `NewProject.tsx`
- chat-driven suggestion staging
- document analysis during create flow

---

## High-Level Architecture

The app uses three integration patterns for AI behavior:

### 1. Dataverse Custom APIs
Used for prompt-based AI calls.

Current manually preserved datasource:
- `dga_customwebapi`

Current generated operation:
- `dga_CustomWebApi`

Used by:
- Strategic Priority suggestion
- ICT Budget Considerations
- Budget Assistant text-chat services

### 2. Power Automate v2 Flows
Used for file-based AI and some side-effect workflows.

Current AI/file-related flows include:
- individual document summary
- cumulative document summary
- ICT Budget AI Overview trigger
- SharePoint upload
- SharePoint delete

### 3. Dataverse Persistence
Used so AI results can be reloaded on later visits.

Main persistence tables:
- `dga_ict_document_summary`
- `dga_ict_ai_summary`

---

## Core Files And Services

## Prompt-Based AI

### `src/services/aiPromptService.ts`
Purpose:
- loads AI prompt templates from Dataverse table `dga_ai_prompts`
- filters prompts by use case

Used by:
- `aiStrategicSuggestionService.ts`
- `aiBudgetConsiderationsService.ts`

### `src/services/aiStrategicSuggestionService.ts`
Purpose:
- generates strategic-priority recommendations

Integration:
- Dataverse Custom API

Inputs:
- `entityName`
- `projectName`
- `projectDescription`

Output:
- structured recommendations

### `src/services/aiBudgetConsiderationsService.ts`
Purpose:
- evaluates project details against ICT Budget Considerations / policy logic

Integration:
- Dataverse Custom API

Inputs:
- `entityName`
- `projectName`
- `projectDescription`

Output:
- `assessmentItems`
- `overallAssessment`

### `src/services/aiBudgetCopilotChatService.ts`
Purpose:
- powers the Budget Assistant chat experience in create flow

Used for:
- free-form chat reply generation
- structured extraction of suggested fields / staged budget guidance

---

## Document AI

### `src/services/aiSupportingDocumentEvaluationService.ts`
Purpose:
- handles file-based AI calls
- parses nested Power Automate / OpenAI response structures

Main functions:
- `evaluateSupportingDocument(...)`
- `evaluateCumulativeSupportingDocuments(...)`
- `parseSupportingDocumentEvaluationSummary(...)`

Parsed sections commonly used by UI:
- `document_profile`
- `file_summary`
- `evidence_assessment`
- `suggested_project_fields`
- `budget_lines`
- `account_code_suggestions`
- `review_flags`

Important error handling:
- Power Automate responses like
  - `{"summary":"An unexpected Error Occured. Summary request failed."}`
  are treated as failure states, not valid analysis.

---

## AI Persistence

### `src/services/documentAiSummaryStoreService.ts`
Purpose:
- stores and retrieves AI output from Dataverse

Key responsibilities:
- create one record per individual document summary
- retrieve stored file summaries by budget
- delete stored file summaries when files are deleted
- upsert or retrieve stored cumulative summary
- retrieve stored budget overview
- invalidate cumulative summary when supporting files change
- invalidate budget overview when form fields change and are saved
- parse nested `dga_response_json` for budget overview payloads

Important functions:
- `createDocumentSummaryRecords(...)`
- `getDocumentSummaryRecordsByBudgetId(...)`
- `deleteDocumentSummaryRecordsByDocumentName(...)`
- `upsertCumulativeSummaryRecord(...)`
- `getLatestBudgetAiSummaryRecordsByBudgetId(...)`
- `invalidateCumulativeSummaryRecord(...)`
- `invalidateBudgetOverviewRecord(...)`
- `parseBudgetOverviewData(...)`

### `src/services/ictBudgetAiOverviewService.ts`
Purpose:
- triggers the background AI Overview flow after create-draft completion

Function:
- `triggerIctBudgetAiOverview(budgetId)`

Generated flow service:
- `PowerAppV2_GetICTBudgetAIOverviewService`

Current request contract:
```json
{
  "text": "<ICT Budget ID>"
}
```

This flow is fire-and-forget from the app perspective. It is triggered after the create workflow completes successfully.

---

## File Transport

### `src/services/fileUploadService.ts`
Purpose:
- uploads browser `File` objects to SharePoint through Power Automate

Generated flow service:
- `PowerAppV2_CallUploadFileFlowService`

### `src/services/fileDeleteService.ts`
Purpose:
- deletes SharePoint files through Power Automate

Generated flow service:
- `ICTBudget_Clarificaitons_DeleteFileFromSharePointService`

### `src/services/webApiForPortalService.ts`
Purpose:
- retrieves SharePoint files already attached to a budget

Manually preserved datasource:
- `dga_webapiforportal`

This service is not an AI generator, but it is critical for Edit/View because AI summaries are matched back onto the retrieved file list.

---

## Dataverse Tables Used For AI

## `dga_ict_document_summary`
Purpose:
- stores one AI record per uploaded supporting document

Fields used:
- `dga_ict_budget@odata.bind`
- `dga_document_name`
- `dga_document_summary`

Stored content:
- file name
- raw AI response string for that file

## `dga_ict_ai_summary`
Purpose:
- stores budget-level AI summaries

Current categories used:
- `1` = `Budget Overview`
- `8` = `Cumulative Document Summary`

Fields used:
- `dga_ReferenceRecordId_dga_ict_budget@odata.bind`
- `dga_summary_category`
- `dga_role_context`
- `dga_summary_stage`
- `dga_summary_type`
- `dga_is_valid`
- `dga_response_time`
- `dga_response_json`
- `modifiedon`

Important note:
- Edit/View now retrieves all AI summary records for the budget and then separates them in JavaScript by `dga_summary_category`

---

## Power Automate Flows Used

## 1. Individual Document Summary
Flow name:
- `PowerAppV2 - Get Document Summary from Compass`

Generated service:
- `src/generated/services/PowerAppV2_GetDocumentSummaryfromCompassService.ts`

Called by:
- `evaluateSupportingDocument(...)`

## 2. Cumulative Document Summary
Flow name:
- `PowerAppV2 - Get Cumulative Document Summary from Compass`

Generated service:
- `src/generated/services/PowerAppV2_GetCumulativeDocumentSummaryfromCompassService.ts`

Called by:
- `evaluateCumulativeSupportingDocuments(...)`

Current request contract:
```json
{
  "text": "{\"fileInputs\":[{\"filename\":\"a.pdf\",\"fileResponse\":\"...\"}]}"
}
```

## 3. ICT Budget AI Overview
Flow name:
- `PowerAppV2 - Get ICT Budget AI Overview`

Generated service:
- `src/generated/services/PowerAppV2_GetICTBudgetAIOverviewService.ts`

Called by:
- `triggerIctBudgetAiOverview(...)`

Current request contract:
```json
{
  "text": "<ICT Budget ID>"
}
```

## 4. SharePoint Upload
Generated service:
- `src/generated/services/PowerAppV2_CallUploadFileFlowService.ts`

## 5. SharePoint Delete
Generated service:
- `src/generated/services/ICTBudget_Clarificaitons_DeleteFileFromSharePointService.ts`

---

## Create Form: Current Behavior

Main page:
- `src/pages/respondent/NewProject.tsx`

Create currently has two experiences:

1. `Manual`
2. `Budget Assistant`

### Default mode
Current default:
- page opens in `Budget Assistant` mode by default

### Budget Assistant landing behavior
Before the first chat interaction:
- the full create header is hidden
- the AI landing section is shown instead
- user can still switch between `Manual` and `Budget Assistant` from the landing panel itself

After the first chat / file interaction:
- the right-side working form appears
- the chat workspace compacts into the left panel

### AI in Create Form

Create uses these AI features:
- strategic priority suggestions
- ICT Budget Considerations
- per-file document AI
- cumulative document AI
- Budget Assistant chat and staged field suggestions

### Supporting-document behavior before Save Draft
When a file is attached in create flow:

1. file is held locally in browser state
2. individual AI summary runs immediately
3. analyzer UI shows queued / analyzing / complete / error
4. if multiple completed file summaries exist, cumulative AI runs
5. the UI preview uses the latest individual summary or cumulative summary

At this stage:
- preview is live in UI
- no Dataverse AI summary records are created yet
- no SharePoint file upload happens yet

### Save Draft blocking rule
Create Save Draft is blocked while document AI is still pending.

This applies to:
- Manual create
- Budget Assistant create

Blocked states include:
- queued file analysis
- analyzing file analysis
- document-analysis error
- missing cumulative analysis when multiple files exist

Reason:
- create flow needs valid individual and cumulative outputs before persistence

### Manual Save Draft flow
High-level order:

1. create budget draft in Dataverse
2. upload files to SharePoint
3. create `dga_ict_document_summary` records for each file
4. store cumulative summary in `dga_ict_ai_summary`
5. trigger `PowerAppV2 - Get ICT Budget AI Overview`

Important rule:
- if only one file exists, the app can reuse that single summary as the cumulative payload written to `dga_ict_ai_summary`

### Budget Assistant Save Draft flow
High-level order:

1. apply staged form values / budget items already present in assistant state
2. create budget draft in Dataverse
3. upload files to SharePoint
4. create `dga_ict_document_summary` records
5. upsert cumulative summary into `dga_ict_ai_summary`
6. trigger `PowerAppV2 - Get ICT Budget AI Overview`

### Budget Assistant suggestion behavior
Current create assistant supports:
- staged field suggestions
- staged budget-line suggestions
- strategic priority recommendation apply
- document-based field apply
- account-code resolution into real classification IDs

---

## Edit/View Form: Current Behavior

Main page:
- `src/pages/respondent/ProjectDetail.tsx`

This page is shared across:
- Respondent
- Reviewer
- Approver

The same AI sections therefore apply across all three roles, with role-specific rendering where needed.

## Main AI sections in Edit/View

1. `AI Recommendation`
- strategic priority / classification recommendation card

2. `Budget Overview`
- primary AI summary block in the main content area
- includes merged policy guidance

3. `Supporting Documents`
- file list + per-file analyzer insights

4. `Action / evidence cards`
- driven from stored cumulative / individual summaries

## What happens on initial page load

When Edit/View opens:

1. budget detail is loaded
2. SharePoint documents are retrieved
3. stored `dga_ict_document_summary` rows are retrieved
4. stored `dga_ict_ai_summary` rows are retrieved for the budget
5. JavaScript splits AI summary rows by `dga_summary_category`
   - category `8` => `Cumulative Document Summary`
   - category `1` => `Budget Overview`
6. the UI binds:
   - visible file list from SharePoint
   - file-level AI from `dga_ict_document_summary`
   - cumulative summary from `dga_ict_ai_summary`
   - budget overview from `dga_ict_ai_summary`

## Clarification-file rule
Clarification files are excluded from document-analyzer logic.

They may still appear in document UI, but they are not used for:
- analyzer matching
- individual summary loading
- cumulative AI inputs

## Current file-add behavior in Edit/View

When a new supporting file is added:

1. file uploads to SharePoint
2. individual AI analysis is generated for the new file
3. a `dga_ict_document_summary` row is created for that file
4. the app does **not** call cumulative AI directly anymore
5. instead, the existing cumulative AI summary row for that budget is invalidated:
   - `dga_is_valid = false`
6. after invalidation, the app re-fetches AI summary records and stores the current `modifiedon`
7. polling begins every 5 seconds
8. polling stops when the cumulative record’s `modifiedon` changes
9. updated cumulative JSON is rendered from the refreshed Dataverse record

## Current file-delete behavior in Edit/View

When a supporting file is deleted:

1. SharePoint file is deleted
2. matching `dga_ict_document_summary` row is deleted
3. cumulative AI record for the budget is invalidated
4. the app polls every 5 seconds
5. polling stops once cumulative record `modifiedon` changes

## Current field-save behavior in Edit/View

When project fields are edited and `Save Changes` succeeds:

1. budget row is updated
2. if there was a real saved change affecting the form payload, the Budget Overview record is invalidated
3. app immediately re-fetches AI summary records
4. current Budget Overview `modifiedon` is stored as the pending baseline
5. polling begins every 5 seconds
6. polling stops once Budget Overview `modifiedon` changes
7. refreshed `dga_response_json` is parsed and re-rendered

Important rule:
- Edit/View no longer waits for `dga_is_valid` to become true
- it uses `modifiedon` change detection

## Polling model

Current polling trigger:
- pending cumulative refresh baseline exists
- or pending budget overview refresh baseline exists

Current poll frequency:
- every 5 seconds

Current stop condition:
- relevant record `modifiedon` changes from the stored post-invalidation value

---

## Budget Overview: Current UI Contract

The app parses the stored `Budget Overview` record from `dga_ict_ai_summary.dga_response_json`.

The parser supports nested OpenAI response wrappers and extracts the actual readiness object from:
- direct JSON
- nested `output[0].content[0].text`
- recursively nested JSON objects

Primary parsed sections currently used:
- `overall_assessment`
- `score_inputs`
- `ai_review_flags`
- `role_views`
- `strategic_alignment`
- `issues`
- `clarifications`
- `recommended_next_actions`
- `validated_items`

### Current merged behavior
`Budget Overview` now includes `AI Budget Consideration` inside it.

Collapsed state uses:
- role-specific short summary
- document evidence
- project fields
- budget account
- strategic fit
- compact AI Budget Consideration
- file evidence scores

Expanded state uses:
- role-specific bullet actions
- strengths
- risks
- key issues
- recommended next actions
- full policy cards

If no Budget Overview record exists yet:
- the empty-state message appears first
- `AI Budget Consideration` can still be expanded underneath if policy data exists

---

## AI Recommendation / Suggested Fields in Edit/View

The Edit/View form supports field-level AI assist for mapped fields.

Current behavior:
- if a stored or suggested AI field differs from the current form field, a small `Sparkles` trigger appears on the field label
- clicking it opens a small suggestion popup
- in view mode, popup explains user must switch to edit mode first
- in edit mode, popup can apply the suggestion directly

Current exclusions:
- Strategic Priority and Strategic Priority Classification field-level helper icons were intentionally removed from the form labels
- strategic recommendation still exists in the dedicated AI Recommendation card

---

## Budget Overview Debug Logging

Current debug logs were intentionally added to help inspect stored overview payloads.

In `documentAiSummaryStoreService.ts`, when overview records load, console output includes:

- `[BudgetOverview] Dataverse Budget Overview record:`
- `[BudgetOverview] Raw dga_response_json:`
- `[BudgetOverview] Top-level parsed payload:`
- `[BudgetOverview] Extracted OpenAI output_text:`
- `[BudgetOverview] Final parsed BudgetOverviewData:`

These logs are useful when validating:
- actual stored JSON shape
- whether the record is wrapped in an OpenAI response object
- what the parser finally renders

---

## How To Add A New Power Automate Flow

Before adding any flow, read:
- `MANUAL_DATASOURCE_PROTECTION.md`

Why:
- adding a flow can regenerate `.power/schemas/appschemas/dataSourcesInfo.ts`
- manual datasource entries can disappear if not restored

### Step 1. List flows from solution
Use:
```bash
npx power-apps list-flows
```

Find the exact flow you want, then copy its flow ID.

### Step 2. Add the flow by ID
Use:
```bash
npx power-apps add-flow --flow-id <FLOW_ID>
```

This generates:
- connector entry in `.power/schemas/appschemas/dataSourcesInfo.ts`
- generated models/services under `src/generated`

### Step 3. Re-check manual datasources
After `add-flow`, open:
- `.power/schemas/appschemas/dataSourcesInfo.ts`

Verify these still exist:
- `dga_customwebapi`
- `dga_webapiforportal`
- `audits`

If any are missing, restore them manually before continuing.

### Step 4. Find the generated service name
Look in:
- `src/generated/services/`

Example:
- `PowerAppV2_GetICTBudgetAIOverviewService.ts`

Then wrap that generated service in a small app-facing service if needed.

Example pattern:
```ts
import { SomeGeneratedFlowService } from '@/generated/services/SomeGeneratedFlowService'

export async function triggerSomething(id: string) {
  const result = await SomeGeneratedFlowService.Run({ text: id })
  if (result.error) {
    throw new Error(result.error.message?.trim() || 'Flow failed.')
  }
}
```

### Step 5. Build
Always run:
```bash
npm run build
```

---

## How To Add A New Dataverse Datasource

Example:
```bash
npx power-apps add-data-source --api-id dataverse --resource-name <table_name> --org-url "https://<org>.crm.dynamics.com"
```

Then:
1. verify the generated datasource exists
2. restore any missing manual entries in `dataSourcesInfo.ts`
3. run `npm run build`

---

## Safe Maintenance Rules

1. Treat `dataSourcesInfo.ts` as sensitive after every flow or datasource add.
2. Do not assume generator output preserves manual entries.
3. In Edit/View, do not directly regenerate cumulative AI from the UI anymore.
4. In Edit/View, use invalidation + `modifiedon` polling for Budget Overview and Cumulative Summary.
5. In Create, do not allow save while required document analysis is still incomplete.
6. In Create, always trigger the ICT Budget AI Overview flow after the draft-save pipeline completes.

---

## Related Files

Main pages:
- `src/pages/respondent/NewProject.tsx`
- `src/pages/respondent/ProjectDetail.tsx`

Main services:
- `src/services/aiStrategicSuggestionService.ts`
- `src/services/aiBudgetConsiderationsService.ts`
- `src/services/aiSupportingDocumentEvaluationService.ts`
- `src/services/aiBudgetCopilotChatService.ts`
- `src/services/documentAiSummaryStoreService.ts`
- `src/services/ictBudgetAiOverviewService.ts`
- `src/services/fileUploadService.ts`
- `src/services/fileDeleteService.ts`
- `src/services/webApiForPortalService.ts`

Protection / flow context:
- `MANUAL_DATASOURCE_PROTECTION.md`
- `.power/schemas/appschemas/dataSourcesInfo.ts`

