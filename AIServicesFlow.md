# AI Services Flow

## Overview
This app currently uses two AI integration patterns:

- Dataverse custom API for text-generation style prompts
- Power Automate v2 flows for supporting-document AI analysis

Custom API in use:
- `dga_CustomWebApi`
- Path: `/api/data/v9.2/dga_CustomWebApi`

Request body shape:
```json
{
  "action": "directCall",
  "endpoint": "https://api.core42.ai/v1/responses",
  "apikey": "...",
  "model": "gpt-5.1",
  "prompt": "..."
}
```

## Prompt Source
All prompt-based AI templates are loaded from Dataverse table:
- `dga_ai_prompts`

Prompt retrieval behavior:
- prompts are retrieved all at once from `dga_ai_prompts`
- local filtering is then done by `dga_ai_usecase`
- this logic lives in:
  - `src/services/aiPromptService.ts`

Current supported prompt use cases:
- `Strategic Priority & Classification Suggestion`
- `ICT Budget Considerations Evaluation Prompt`

## Current AI Services

### 1. Strategic Priority and Classification Suggestion
Purpose:
- suggest Strategic Priority
- suggest Strategic Priority Classification

Prompt use case:
- `Strategic Priority & Classification Suggestion`

Service:
- `src/services/aiStrategicSuggestionService.ts`

Inputs injected into prompt:
- `{{ENTITY_NAME}}`
- `{{PROJECT_NAME}}`
- `{{PROJECT_DESCRIPTION}}`

Current usage:
- page: `src/pages/respondent/NewProject.tsx`
- trigger: blur on project name or summary in Create Form

Current behavior:
- calls custom API
- parses recommendation response
- renders create-form AI recommendation UI
- supports apply actions for the recommended Strategic Priority and Classification

### 2. ICT Budget Considerations Evaluation
Purpose:
- evaluate the project against DGE ICT Budget Considerations policies

Prompt use case:
- `ICT Budget Considerations Evaluation Prompt`

Service:
- `src/services/aiBudgetConsiderationsService.ts`

Inputs injected into prompt:
- `{{ENTITY_NAME}}`
- `{{PROJECT_NAME}}`
- `{{PROJECT_DESCRIPTION}}`

Current usage:
- page: `src/pages/respondent/NewProject.tsx`
- trigger: blur on project name or summary in Create Form

Current behavior:
- calls custom API
- parses policy evaluation response
- renders AI Budget Considerations component in Create Form
- supports collapsed and expanded review of policy matches

### 3. ICT Supporting Document Evaluation
Purpose:
- evaluate each uploaded supporting document individually through AI
- expose compact per-file evidence summaries in the UI

Service:
- `src/services/aiSupportingDocumentEvaluationService.ts`

Flow:
- `PowerAppV2 - Get Document Summary from Compass`
- Flow ID: `7c1f4991-3d63-d609-528d-9d15937e6444`
- Generated service:
  - `src/generated/services/PowerAppV2_GetDocumentSummaryfromCompassService.ts`

Current usage:
- page: `src/pages/respondent/NewProject.tsx`
- section: `Supporting Documents` in Create Form
- trigger: when a file is attached in the create form upload area

Current request shape:
```json
{
  "fileContent": {
    "name": "document.pdf",
    "contentBytes": "<base64>",
    "mimeType": "application/pdf"
  }
}
```

Current behavior:
- converts the attached file to base64 in the browser
- sends the file payload to the Power Automate v2 flow
- parses the returned structured summary from the nested Automate/OpenAI response
- stores file-level AI state per upload:
  - `queued`
  - `analyzing`
  - `complete`
  - `error`
- renders file-level AI output in:
  - `src/components/shared/SupportingDocumentAiInsights.tsx`

Current per-file accordion behavior:
- collapsed state shows:
  - file name
  - trimmed short summary
  - evidence score
  - compact heading chips
- expanded state shows:
  - `Document Profile`
  - `File Summary`
  - `Evidence Assessment`
  - `Review Flags`

Important parsed sections from the individual document flow:
- `document_profile`
- `file_summary`
- `evidence_assessment`
- `suggested_project_fields`
- `budget_lines`
- `account_code_suggestions`
- `review_flags`

### 4. ICT Supporting Documents Cumulative Summary
Purpose:
- combine multiple individually analyzed supporting documents into one cumulative AI summary
- drive the right-side AI action cards from the combined result

Service:
- `src/services/aiSupportingDocumentEvaluationService.ts`

Flow:
- `PowerAppV2 - Get Cumulative Document Summary from Compass`
- manually wired datasource/service files:
  - `.power/schemas/appschemas/dataSourcesInfo.ts`
  - `src/generated/models/PowerAppV2_GetCumulativeDocumentSummaryfromCompassModel.ts`
  - `src/generated/services/PowerAppV2_GetCumulativeDocumentSummaryfromCompassService.ts`
  - `src/generated/index.ts`

Current request shape:
```json
{
  "fileInputs": [
    {
      "filename": "file-1.pdf",
      "fileResponse": "{...individual file summary response...}"
    },
    {
      "filename": "file-2.pdf",
      "fileResponse": "{...individual file summary response...}"
    }
  ]
}
```

Current cumulative behavior:
- first uploaded file:
  - only the individual document flow is used
  - right-side action cards are populated from the single-file parsed summary
- second and subsequent uploaded files:
  - each new file still goes through the individual document flow first
  - after all currently completed file summaries are available, the cumulative flow is called
  - cumulative summary replaces the right-side action-card content

## Dataverse Persistence For Document AI
New Dataverse tables now persist document AI output after the budget save flow completes.

New data sources:
- `dga_ict_document_summaries`
- `dga_ict_ai_summaries`

Persistence service:
- `src/services/documentAiSummaryStoreService.ts`

### Individual File Summary Storage
Table:
- `dga_ict_document_summary`

Stored values:
- budget lookup -> `dga_ict_budget@odata.bind`
- document name -> `dga_document_name`
- raw individual file summary JSON/string -> `dga_document_summary`

Create-form behavior:
- individual file AI still runs in the browser before save for preview purposes
- actual Dataverse record creation only happens after:
  - budget draft creation succeeds
  - downstream save actions complete
  - file upload succeeds

Edit-form behavior:
- when files are uploaded in edit mode, AI preview can be shown in-session
- persisted individual summary records are only created after:
  - save changes succeeds
  - file upload succeeds

Delete behavior:
- when a supporting document is deleted in edit/detail flow
- matching `dga_ict_document_summary` records are also deleted

### Cumulative Summary Storage
Table:
- `dga_ict_ai_summary`

Stored values:
- budget lookup -> `dga_ReferenceRecordId@odata.bind`
- static context:
  - `dga_role_context = 7`
  - `dga_summary_category = 8`
  - `dga_summary_stage = 1`
  - `dga_summary_type = 1`
- validity -> `dga_is_valid`
- automate response time in ms -> `dga_response_time`
- raw cumulative summary JSON/string -> `dga_response_json`

Persistence rule:
- only one cumulative summary record is maintained per budget context
- when a newer cumulative result is available, the existing record is updated

Single-file special case:
- if only one file exists, no separate cumulative flow is required
- the single-file raw summary is also persisted into `dga_ict_ai_summary`

Multi-file case:
- once 2+ individual file summaries exist, cumulative flow is called using those stored raw file summaries
- latest cumulative output is then upserted into `dga_ict_ai_summary`

## Create Form AI Document UX
Current manual-mode form layout in:
- `src/pages/respondent/NewProject.tsx`

Layout behavior:
- main create form uses a `70 / 30` split
- left side:
  - form sections
  - supporting document upload
  - per-file AI Document Reader
- right side:
  - scrollable AI action-card rail that moves with the form

Current AI action cards:
1. `Suggested Project Fields`
2. `Budget Lines`
3. `Account Code Suggestion`
4. `Summary`

Action-card population behavior:
- if exactly one document has been analyzed:
  - cards are populated from the individual file summary
- if multiple documents have been analyzed and cumulative succeeds:
  - cards are populated from cumulative summary
- if cumulative is loading:
  - action cards show AI loading states
- if no parsed summary is available yet:
  - action cards show empty instructional placeholders

Current implementation note:
- apply functionality is now partially wired in the create form
- currently implemented actions:
  - `Suggested Project Fields`
    - individual `Apply` buttons are available for supported field mappings
    - `Apply All` is available for the card when one or more mappable suggestions exist
    - currently mapped fields:
      - project name -> `initiativeName`
      - project description -> `summary`
      - category -> `category`
      - technology company -> `technologyCompanyId`
  - `Account Code Suggestion`
    - `Add to Budget Line Items` is available
    - the action attempts to match the suggested GL/account code against the classification tree
    - when matched, it creates a new budget draft line item in the form and sets the requested budget from the AI suggestion
- not fully applied yet:
  - budget-line card does not yet push all suggested budget lines into the form in bulk
  - account-code application currently adds to budget items, but does not yet complete every downstream budgeting action automatically
  - additional lookup/dropdown mappings can still be extended

## Detail / Edit Form AI Usage
AI is now also wired into:
- `src/pages/respondent/ProjectDetail.tsx`

Current detail/edit form behavior:
- supporting documents are still retrieved normally for the document section
- persisted individual document summaries are retrieved from:
  - `dga_ict_document_summary`
- persisted cumulative summary is retrieved from:
  - `dga_ict_ai_summary`

Document section behavior:
- supporting documents remain visible through the normal document component
- AI Document Reader is rendered below the document list using stored individual summaries
- per-file detail currently shows:
  - `Document Profile`
  - `File Summary`
  - `Evidence Assessment`
  - `Review Flags`

Edit-mode save behavior:
- when new files are uploaded and save changes succeeds:
  - files are uploaded first
  - individual file summary records are created
  - cumulative summary is recalculated
  - cumulative summary record is created or updated
- if upload fails:
  - persisted AI summary records are not created for those new files

Role-based right-side AI cards in detail flow:
- Respondent:
  - `Suggested Project Fields`
  - `Budget Lines`
  - `Account Code Suggestion`
  - `Summary`
- Reviewer / Approver:
  - `Budget Lines`
  - `Summary`

Current apply support in detail flow:
- respondent edit mode supports:
  - strategic priority / classification apply
  - suggested project field apply
  - account code -> add to budget line items

Current AI text recommendation support in detail flow:
- Strategic Priority and Classification suggestion
- ICT Budget Considerations evaluation
- document-based individual and cumulative summary cards

## Supporting Document Parsing Notes
The supporting-document service includes resilient parsing because the flow response may contain nested serialized JSON.

Current parser behavior:
- unwraps JSON-string layers recursively
- searches nested objects and arrays
- returns the first object containing major headings such as:
  - `document_profile`
  - `file_summary`
  - `evidence_assessment`
  - `suggested_project_fields`
  - `budget_lines`
  - `account_code_suggestions`

Relevant service:
- `src/services/aiSupportingDocumentEvaluationService.ts`

## Logging
Current AI services log:
- prompt record retrieval
- selected prompt template
- interpolation values
- formatted prompt
- custom API request/response
- single-file supporting document flow request/response
- cumulative supporting document flow request/response
- parsed result where applicable

## Current Page Usage Summary
AI is currently wired on:
- `src/pages/respondent/NewProject.tsx`
- `src/pages/respondent/ProjectDetail.tsx`

Current create form AI usage:
- Strategic Priority recommendation
- ICT Budget Considerations evaluation
- Supporting document individual AI analysis
- Supporting document cumulative AI summary
- Right-side AI action cards based on file or cumulative document summaries

## Datasource Protection Reminder
When adding or refreshing new flows/data sources, always re-check:
- `.power/schemas/appschemas/dataSourcesInfo.ts`

Manual entries that must stay intact:
- `dga_customwebapi`
- `dga_webapiforportal`

Reference:
- `MANUAL_DATASOURCE_PROTECTION.md`
