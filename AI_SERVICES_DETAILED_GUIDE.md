# AI Services Detailed Guide

## Purpose
This document explains how AI is integrated into the app today, with special focus on the supporting-document pipeline.

It covers:
- what AI capabilities exist
- which services call Power Automate
- which services call Dataverse custom APIs
- which services persist AI output into Dataverse tables
- how the flow behaves in Create Form
- how the flow behaves in Edit/View Form

This guide is implementation-oriented. It reflects the current codebase, not just the intended design.

---

## High-Level AI Architecture

The app uses three integration patterns for AI-related behavior:

1. `Dataverse Custom API`
- used for text-prompt AI services
- current custom API:
  - data source: `dga_customwebapi`
  - operation: `dga_CustomWebApi`
- current endpoint used behind the custom API:
  - `https://api.core42.ai/v1/responses`

2. `Power Automate v2 Flows`
- used for file-based AI services and SharePoint upload/delete flows
- this includes:
  - individual document summary generation
  - cumulative document summary generation
  - SharePoint upload
  - SharePoint delete

3. `Dataverse Table Persistence`
- used to store AI outputs so they can be reloaded later
- current AI persistence tables:
  - `dga_ict_document_summary`
  - `dga_ict_ai_summary`

---

## AI Features In Scope

Current AI-enabled areas:

1. `Strategic Priority Suggestion`
- suggests strategic priority
- suggests strategic priority classification

2. `AI Budget Considerations`
- evaluates the project against policy considerations
- returns policy matches and overall assessment

3. `AI Document Analyzer`
- evaluates each supporting document separately
- returns structured document-level insight

4. `Cumulative Document Summary`
- combines multiple document summaries into one action-oriented summary
- drives the document-related cards shown in the UI

---

## Core Service Map

### Prompt-Based AI Services

#### `src/services/aiPromptService.ts`
Purpose:
- loads AI prompt templates from Dataverse table `dga_ai_prompts`
- filters prompts by use case

Used by:
- `aiStrategicSuggestionService.ts`
- `aiBudgetConsiderationsService.ts`

#### `src/services/aiStrategicSuggestionService.ts`
Purpose:
- generates strategic priority recommendations

Integration type:
- Dataverse custom API

Uses:
- data source: `dga_customwebapi`
- operation: `dga_CustomWebApi`

Prompt use case:
- `Strategic Priority & Classification Suggestion`

Inputs:
- `entityName`
- `projectName`
- `projectDescription`

Output:
- structured array of recommendations

#### `src/services/aiBudgetConsiderationsService.ts`
Purpose:
- evaluates project details against ICT budget considerations / policy logic

Integration type:
- Dataverse custom API

Uses:
- data source: `dga_customwebapi`
- operation: `dga_CustomWebApi`

Prompt use case:
- `ICT Budget Considerations Evaluation Prompt`

Inputs:
- `entityName`
- `projectName`
- `projectDescription`

Output:
- `assessmentItems`
- `overallAssessment`

---

### Document AI Services

#### `src/services/aiSupportingDocumentEvaluationService.ts`
Purpose:
- handles document AI calls
- parses nested Automate/OpenAI responses

This service contains:

1. `evaluateSupportingDocument(...)`
- sends one file to the individual summary flow

2. `evaluateCumulativeSupportingDocuments(...)`
- sends multiple file summaries to the cumulative flow

3. `parseSupportingDocumentEvaluationSummary(...)`
- parses the returned raw response into usable sections

Important parsed sections:
- `document_profile`
- `file_summary`
- `evidence_assessment`
- `suggested_project_fields`
- `budget_lines`
- `account_code_suggestions`
- `review_flags`

---

### File Transport Services

#### `src/services/fileUploadService.ts`
Purpose:
- uploads files to SharePoint through Power Automate

Integration type:
- Power Automate flow

Flow service:
- `PowerAppV2_CallUploadFileFlowService`

Behavior:
- converts browser `File` to base64
- builds upload payload
- sends payload through generated flow service
- extracts uploaded file URL from the response

#### `src/services/fileDeleteService.ts`
Purpose:
- deletes files from SharePoint through Power Automate

Integration type:
- Power Automate flow

Flow service:
- `ICTBudget_Clarificaitons_DeleteFileFromSharePointService`

Behavior:
- sends only `relativelocation` string as payload
- used when deleting supporting documents from Edit/View flow

#### `src/services/webApiForPortalService.ts`
Purpose:
- retrieves SharePoint documents already attached to a budget

Integration type:
- Dataverse custom API

Uses:
- data source: `dga_webapiforportal`
- operation: `dga_WebApiForPortal`

Important function:
- `retrieveSharePointDocumentsByBudget(...)`

This is not an AI service itself, but it is critical to the document-AI experience because it provides the file list used to bind persisted AI summaries back to visible uploaded files.

---

### AI Persistence Services

#### `src/services/documentAiSummaryStoreService.ts`
Purpose:
- persists and retrieves document AI outputs from Dataverse

Main responsibilities:
- create individual summary records
- retrieve individual summary records
- delete individual summary records when files are deleted
- upsert one cumulative summary record per budget
- clear cumulative summary record when no files remain

Important functions:
- `createDocumentSummaryRecords(...)`
- `getDocumentSummaryRecordsByBudgetId(...)`
- `deleteDocumentSummaryRecordsByDocumentName(...)`
- `getLatestCumulativeSummaryByBudgetId(...)`
- `upsertCumulativeSummaryRecord(...)`
- `clearCumulativeSummaryRecord(...)`

---

## AI-Related Dataverse Tables

### `dga_ict_document_summary`
Purpose:
- stores one record per file summary

Fields used:
- `dga_ict_budget@odata.bind`
- `dga_document_name`
- `dga_document_summary`

Stored content:
- file name
- raw individual AI summary response for that file

---

### `dga_ict_ai_summary`
Purpose:
- stores cumulative document summary for one budget

Fields used:
- `dga_ReferenceRecordId_dga_ict_budget@odata.bind`
- `dga_role_context`
- `dga_summary_stage`
- `dga_summary_type`
- `dga_summary_category`
- `dga_is_valid`
- `dga_response_time`
- `dga_response_json`

Current static values used:
- `dga_role_context = 1`
- `dga_summary_stage = 1`
- `dga_summary_type = 1`
- `dga_summary_category = 8`

Persistence rule:
- one reusable cumulative summary record per budget context
- when files change, this record is updated instead of creating a new one

Special case:
- if only one file exists, that file’s raw summary is also written into this cumulative table

---

## Power Automate Flows Used

### 1. Individual Document Summary Flow
Flow name:
- `PowerAppV2 - Get Document Summary from Compass`

Generated service:
- `src/generated/services/PowerAppV2_GetDocumentSummaryfromCompassService.ts`

Called by:
- `evaluateSupportingDocument(...)`

Input shape:
```json
{
  "fileContent": {
    "name": "document.pdf",
    "contentBytes": "<base64>",
    "mimeType": "application/pdf"
  }
}
```

Output:
- raw flow response
- nested summary payload
- parsed document summary object

---

### 2. Cumulative Document Summary Flow
Flow name:
- `PowerAppV2 - Get Cumulative Document Summary from Compass`

Generated service:
- `src/generated/services/PowerAppV2_GetCumulativeDocumentSummaryfromCompassService.ts`

Called by:
- `evaluateCumulativeSupportingDocuments(...)`

Current request contract from app code:
```json
{
  "text": "{\"fileInputs\":[{\"filename\":\"a.pdf\",\"fileResponse\":\"...\"}]}"
}
```

Logical payload inside that serialized `text` field:
```json
{
  "fileInputs": [
    {
      "filename": "a.pdf",
      "fileResponse": "raw individual summary"
    }
  ]
}
```

Output:
- cumulative raw response
- parsed cumulative summary object

---

### 3. SharePoint Upload Flow
Generated service:
- `src/generated/services/PowerAppV2_CallUploadFileFlowService.ts`

Called by:
- `uploadFilesToRecord(...)`

Purpose:
- uploads browser-selected files to SharePoint

---

### 4. SharePoint Delete Flow
Generated service:
- `src/generated/services/ICTBudget_Clarificaitons_DeleteFileFromSharePointService.ts`

Called by:
- `deleteSharePointDocument(...)`

Purpose:
- deletes a file from SharePoint using `relativelocation`

---

## Create Form Integration

Main page:
- `src/pages/respondent/NewProject.tsx`

### Create Form AI Areas

1. `Strategic Priority AI`
- triggered from project name / summary context
- uses `getStrategicPrioritySuggestions(...)`
- shown inline in form

2. `AI Budget Considerations`
- triggered from project name / summary context
- uses `evaluateIctBudgetConsiderations(...)`
- shown inline in form

3. `AI Document Analyzer`
- per-file UI
- uses `evaluateSupportingDocument(...)`

4. `Right-Side Document AI Cards`
- uses individual summary for one file
- uses cumulative summary for multiple files

### Create Form Supporting Document Flow

When user attaches a file:

1. file is selected in browser
2. local upload card is created
3. `evaluateSupportingDocument(...)` is called for that file
4. file-level analyzer UI shows:
- queued
- analyzing
- complete
- error
5. parsed result is shown in `SupportingDocumentAiInsights.tsx`

At this stage, before draft save:
- AI is preview-only
- no Dataverse summary records are created yet

### Create Form Single File Behavior

If only one file exists:
- only individual flow is called
- right-side cards are populated from that same single-file summary
- that same raw response is later stored both as:
  - one `dga_ict_document_summary` record
  - one `dga_ict_ai_summary` cumulative record

### Create Form Multi File Behavior

If more than one file exists:

For each file:
1. individual file summary is generated first

After all available individual responses exist:
2. cumulative flow is called with all file summaries
3. right-side cards switch to cumulative result

### Create Form Save As Draft Flow

When user clicks `Save as Draft`:

1. budget draft is created
2. normal form persistence runs
3. files are uploaded to SharePoint using `uploadFilesToRecord(...)`
4. after upload succeeds:
- individual file summaries are persisted into `dga_ict_document_summary`
5. cumulative summary is persisted into `dga_ict_ai_summary`

If only one file exists:
- no separate cumulative automate call is needed
- the same single-file raw summary is written into cumulative storage

If multiple files exist:
- cumulative flow output is written into cumulative storage

### Create Form Right-Side Cards

Shown on create form:
- `Suggested Project Fields`
- `Budget Lines`
- `Account Code Suggestion`
- `Summary`

Population logic:
- one file -> single-file summary drives cards
- multiple files -> cumulative summary drives cards

Apply behavior currently present:
- suggested field `Apply`
- suggested field `Apply All`
- account code `Add to Budget Line Items`

---

## Edit/View Form Integration

Main page:
- `src/pages/respondent/ProjectDetail.tsx`

### Edit/View Form AI Areas

1. `Strategic Priority AI`
- same conceptual AI as create form
- shown inline in form area, not only on side rail

2. `AI Budget Considerations`
- same conceptual AI as create form
- shown inline in form area

3. `Supporting Documents`
- existing SharePoint files are retrieved
- stored individual AI summaries are retrieved
- analyzer UI is rebuilt from persisted records

4. `Right-Side Document AI Cards`
- driven by stored cumulative summary when available
- fallback to single latest individual summary if needed

### Initial Load In Edit/View

When budget detail page opens:

1. budget detail is loaded
2. SharePoint files are retrieved using:
- `retrieveSharePointDocumentsByBudget(...)`
3. individual summary records are retrieved using:
- `getDocumentSummaryRecordsByBudgetId(...)`
4. cumulative summary record is retrieved using:
- `getLatestCumulativeSummaryByBudgetId(...)`

The UI then binds:
- file list from SharePoint
- file-level AI summary from `dga_ict_document_summary`
- right-side action cards from `dga_ict_ai_summary`

### Edit Mode File Add Flow

When user adds a file in edit mode:

1. file appears in the local compact upload grid
2. status begins as upload-related
3. file uploads immediately to SharePoint through `uploadFilesToRecord(...)`
4. once upload is confirmed:
- local upload card transitions out
- uploaded file becomes part of retrieved SharePoint file list
5. `evaluateSupportingDocument(...)` runs for the newly added file
6. analyzer shows analyzing state
7. individual file summary is persisted into `dga_ict_document_summary`
8. cumulative summary is recalculated using current document summaries
9. `dga_ict_ai_summary` is updated, not recreated
10. right-side cards refresh from the updated cumulative result

### Edit Mode File Delete Flow

When user deletes a file in edit/view form:

1. file is deleted from SharePoint using `deleteSharePointDocument(...)`
2. matching individual summary record is deleted from `dga_ict_document_summary`
3. remaining document summary records are re-read
4. cumulative summary is recalculated
5. `dga_ict_ai_summary` is updated
6. right-side cards refresh to reflect remaining files

Delete edge cases:

If one file remains after delete:
- cumulative record is updated using that single file’s summary

If no files remain after delete:
- cumulative record is cleared using `clearCumulativeSummaryRecord(...)`
- right-side cards become empty / placeholder state

### Edit/View Role Differences

Supporting document analyzer:
- visible for all roles

Right-side document cards:
- Respondent:
  - `Suggested Project Fields`
  - `Budget Lines`
  - `Account Code Suggestion`
  - `Summary`
- Reviewer / Approver:
  - `Budget Lines`
  - `Summary`

### Edit/View Analyzer Behavior

`SupportingDocumentAiInsights.tsx` is shared between create and detail flows.

Behavior:
- active analyzing file opens automatically
- after analysis completes, item returns to collapsed state
- collapsed state shows:
  - file name
  - trimmed short summary
  - evidence score
  - section chips
- expanded state shows:
  - `Document Profile`
  - `File Summary`
  - `Evidence Assessment`
  - `Review Flags`

---

## Parsing Strategy For Document AI

Why the parser is complex:
- Automate responses may return:
  - direct JSON
  - JSON inside strings
  - OpenAI response envelope
  - nested `output -> content -> text`
  - escaped JSON text

Current parser behavior in `aiSupportingDocumentEvaluationService.ts`:
- unwraps serialized JSON layers
- normalizes escaped strings
- recursively walks arrays and objects
- returns the first object containing key headings such as:
  - `document_profile`
  - `file_summary`
  - `evidence_assessment`
  - `suggested_project_fields`
  - `budget_lines`
  - `account_code_suggestions`

This same parsing logic is used:
- immediately after flow response
- later while rehydrating stored `dga_document_summary`
- later while rehydrating stored `dga_response_json`

---

## UI Components Involved

### `src/components/shared/SupportingDocumentAiInsights.tsx`
Purpose:
- renders file-level analyzer experience

Handles:
- queued state
- analyzing state
- complete state
- error state
- collapsed / expanded transitions

### `src/components/shared/FileUploadDropzone.tsx`
Purpose:
- handles browser file selection UI

Used for:
- create form uploads
- edit-mode local upload staging

### `src/components/shared/SupportingDocuments.tsx`
Purpose:
- renders existing SharePoint document list

This component is not the AI renderer, but it is the visual file list that works alongside the AI analyzer in detail/edit flows.

---

## Custom API vs Power Automate Summary

### Uses Dataverse Custom API

1. `aiStrategicSuggestionService.ts`
- AI strategic priority recommendation

2. `aiBudgetConsiderationsService.ts`
- AI policy / budget consideration evaluation

3. `webApiForPortalService.ts`
- SharePoint document retrieval by budget
- also technology association operations

### Uses Power Automate

1. `fileUploadService.ts`
- upload file to SharePoint

2. `fileDeleteService.ts`
- delete file from SharePoint

3. `aiSupportingDocumentEvaluationService.ts`
- individual document summary
- cumulative document summary

### Uses Dataverse Table Persistence

1. `documentAiSummaryStoreService.ts`
- stores file summaries
- stores cumulative summary
- retrieves stored summaries
- deletes matching individual summary records

---

## Create Form vs Edit/View Form Summary

### Create Form

Main idea:
- AI runs early for preview
- persistence happens after draft save + file upload success

Document AI summary source:
- live in-browser state first
- Dataverse persistence second

### Edit/View Form

Main idea:
- existing files and AI summaries are rehydrated from backend
- new uploads update SharePoint first, then AI, then Dataverse storage
- deletes remove SharePoint file, remove individual summary record, then recalculate cumulative

Document AI summary source:
- persisted Dataverse records
- plus temporary in-session state for newly added files

---

## Operational Notes

1. `dga_customwebapi` and `dga_webapiforportal` are protected manual datasource entries.
- always verify `.power/schemas/appschemas/dataSourcesInfo.ts`
- reference:
  - `MANUAL_DATASOURCE_PROTECTION.md`

2. Document AI persistence is intentionally separated from core budget save logic.
- budget creation / update should still work even if AI recommendation flows fail
- AI should enhance the form, not block the main budgeting workflow

3. Current logs are intentionally verbose.
- this is useful because document AI involves browser files, Power Automate, parsing, persistence, and rehydration

---

## Recommended Reading

For related implementation context:
- [AIServicesFlow.md](./AIServicesFlow.md)
- [AI_COMPONENT_THEME.md](./AI_COMPONENT_THEME.md)
- [CUSTOM_API_GUIDE.md](./CUSTOM_API_GUIDE.md)
- [MANUAL_DATASOURCE_PROTECTION.md](./MANUAL_DATASOURCE_PROTECTION.md)
- [Workflow.md](./Workflow.md)
