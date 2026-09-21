# AI Services Flow

This document describes the AI flows currently implemented in the app.

## Overview

The app uses two AI patterns:
- Dataverse-backed prompt evaluation for strategic and policy analysis
- Power Automate V2 flows for supporting-document analysis

## Prompt-Based AI

Prompt templates are stored in Dataverse:
- table: `dga_ai_prompts`
- service: `src/services/aiPromptService.ts`

The app retrieves prompts from Dataverse and filters them by use case in code.

### 1. Strategic Priority and Classification Suggestions

Purpose:
- suggest the Strategic Priority
- suggest the Strategic Priority Classification

Service:
- `src/services/aiStrategicSuggestionService.ts`

Prompt use case:
- `Strategic Priority & Classification Suggestion`

Inputs:
- `{{ENTITY_NAME}}`
- `{{PROJECT_NAME}}`
- `{{PROJECT_DESCRIPTION}}`

Current usage:
- `src/pages/respondent/NewProject.tsx`
- `src/pages/respondent/ProjectDetail.tsx`

Current behavior:
- used on project name / summary changes
- also reused from stored Budget Overview data on initial document load when available
- output renders the strategic recommendation card in create and edit/view forms
- option 2 is actionable as well in the current UI

### 2. ICT Budget Considerations

Purpose:
- evaluate a project against DGE ICT Budget Considerations

Service:
- `src/services/aiBudgetConsiderationsService.ts`

Prompt use case:
- `ICT Budget Considerations Evaluation Prompt`

Inputs:
- `{{ENTITY_NAME}}`
- `{{PROJECT_NAME}}`
- `{{PROJECT_DESCRIPTION}}`

Current usage:
- `src/pages/respondent/NewProject.tsx`
- `src/pages/respondent/ProjectDetail.tsx`

Current behavior:
- runs when project name or description changes
- on open, if a Budget Overview record already exists, the app reuses the parsed budget-overview policy data first
- the UI shows the AI Budget Consideration card and policy chips from the parsed overview when available
- budget-overview refreshes also refresh the confidence/policy context

## Supporting Document AI

Supporting documents are handled through Power Automate V2 flows.

### 3. Individual Supporting Document Evaluation

Purpose:
- analyze each attached file
- produce file-level AI insights

Service:
- `src/services/aiSupportingDocumentEvaluationService.ts`

Flow:
- `PowerAppV2 - Get Document Summary from Compass`

Flow id:
- `7c1f4991-3d63-d609-528d-9d15937e6444`

Current usage:
- `src/pages/respondent/NewProject.tsx`
- `src/pages/respondent/ProjectDetail.tsx`

Current behavior:
- each attached file is converted to base64 in the browser
- the flow is called per file
- file state can be:
  - `queued`
  - `analyzing`
  - `complete`
  - `error`
- the per-file UI shows:
  - file summary
  - evidence assessment
  - suggested fields
  - budget lines
  - account-code suggestions
  - review flags

### 4. Cumulative Supporting Document Summary

Purpose:
- combine multiple file summaries into one cumulative view
- drive the shared right-side AI action cards

Service:
- `src/services/aiSupportingDocumentEvaluationService.ts`

Current behavior:
- when multiple files exist, the cumulative summary can be generated from the individual file summaries
- cumulative AI output is persisted in Dataverse and reused by the create/edit forms

## Dataverse Persistence For AI Summaries

AI summary persistence service:
- `src/services/documentAiSummaryStoreService.ts`

Tables:
- `dga_ict_document_summary`
- `dga_ict_ai_summary`

Current persisted data:
- individual file summaries
- cumulative document summaries
- parsed budget overview record

Current budget overview behavior:
- the app stores the parsed budget overview record in Dataverse
- when that overview changes, the app syncs AI review flags into the budget record
- the edit/view form reuses that overview instead of waiting for a page refresh where possible

## Current AI Usage On Pages

### Create Form

File:
- `src/pages/respondent/NewProject.tsx`

AI currently shown:
- strategic priority/classification recommendations
- AI Budget Considerations
- supporting document AI summary
- right-rail suggested fields
- budget line previews
- account-code suggestions

### Edit / View Form

File:
- `src/pages/respondent/ProjectDetail.tsx`

AI currently shown:
- budget overview
- AI confidence score
- strategic priority / classification recommendations
- AI Budget Considerations
- supporting document summary
- per-file AI document analysis
- right-rail AI suggestions in edit mode

### Dashboards / Portfolio Summary

Shared component:
- `src/components/shared/AiPortfolioSummary.tsx`

Current behavior:
- shows portfolio-level AI review flags
- shows recommended actions
- shows related project budget references where applicable

## Current Fallback Order

For project open / document load:
1. use the stored Budget Overview record if present
2. derive strategic recommendation and policy data from that record
3. fall back to live AI calls when the stored record is not available or when name/summary changes

## Important Note

The old prompt-based purple AI language is no longer the primary system design. The current app uses blue-led AI surfaces with limited purple accent where legacy AI affordances still exist.

