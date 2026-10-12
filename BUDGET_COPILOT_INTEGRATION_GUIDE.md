# Budget Copilot Integration Guide

## Purpose
This document describes the current, working `Budget Assistant` experience inside `src/pages/respondent/NewProject.tsx`.

Important terminology:
- the UI now says `Budget Assistant`
- the underlying implementation and service names still use `Budget Copilot`

This guide documents:
- the current UI structure
- the actual service call chain
- what state is local vs persisted
- how chat, document AI, policy checks, and save-to-draft work together

---

## Main Files

Primary integration:
- `src/pages/respondent/NewProject.tsx`

Chat orchestration:
- `src/services/aiBudgetCopilotChatService.ts`
- `src/services/repoPromptService.ts`

Reused AI services:
- `src/services/aiStrategicSuggestionService.ts`
- `src/services/aiBudgetConsiderationsService.ts`
- `src/services/aiSupportingDocumentEvaluationService.ts`

Persistence services:
- `src/services/ictBudgetDraftService.ts`
- `src/services/budgetLineItemService.ts`
- `src/services/fileUploadService.ts`
- `src/services/documentAiSummaryStoreService.ts`

Prompt source:
- `BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md`

---

## High-Level Architecture

`NewProject.tsx` contains two separate creation experiences:

### Manual mode
Uses:
- `formValues`
- `budgetItems`
- `uploadedFiles`

This is the existing direct-entry workflow.

### AI mode (`Budget Assistant`)
Uses separate working state:
- `copilotFormValues`
- `copilotBudgetItems`
- `copilotUploadedFiles`
- `copilotPendingSuggestion`
- `chatMessages`
- `copilotSupportingDocumentAnalyses`
- `copilotSupportingDocumentCumulativeAnalysis`
- `copilotAiSuggestions`
- `copilotBudgetConsiderationResult`

Key rule:
- AI mode does not mutate the manual form state while the user is working
- both modes still save through the same draft-creation pipeline

---

## Current UI Behavior

The AI workspace in `NewProject.tsx` now has:
- a `Budget Assistant Workspace` chat panel
- a `Suggestions From This Conversation` panel
- animated switching between those two panels
- a compact welcome card with starter prompts
- a separate draft form on the right side
- a supporting document dropzone in the AI flow

The top create-mode toggle now shows:
- `Manual`
- `Budget Assistant`

---

## Chat Message Model

AI chat messages are stored as `CopilotChatMessage`.

Supported message kinds:
- `text`
- `status`
- `document-analysis`
- `cumulative-analysis`
- `policy-analysis`

Rendering is routed through:
- `renderCopilotChatMessageContent(...)`

This means the assistant can render either:
- regular text replies
- structured cards for working status
- structured document summary cards
- structured cumulative summary cards
- structured policy result cards

---

## Chat Service Flow

The chat integration is handled by:
- `getBudgetCopilotChatReply(...)`
- `getBudgetCopilotStructuredAnalysis(...)`

Both live in:
- `src/services/aiBudgetCopilotChatService.ts`

### Transport
The chat does not call the model directly from the browser.

It sends a request through the Dataverse custom API bridge:
- data source: `dga_customwebapi`
- operation: `dga_CustomWebApi`

The service builds a single prompt containing:
- the repo prompt text
- serialized runtime context
- the conversation transcript
- an instruction for either conversational reply or structured extraction

### Prompt loading
The base system prompt is loaded from the repo by:
- `getBudgetCopilotChatPrompt()`

That function reads:
- `BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md`

through:
- `src/services/repoPromptService.ts`

---

## Runtime Context Sent To Chat

`buildCopilotRuntimeContext()` sends:
- `current_form_state`
- `uploaded_documents`
- `file_analyses`
- `cumulative_analysis`
- `budget_rows`
- `pending_suggestions`
- `entity_name`

This gives the model awareness of:
- what the user already filled
- what files have been analyzed
- what budget rows exist
- what staged suggestions already exist

---

## Standard Chat Turn

The normal text-only flow starts in:
- `sendCopilotPrompt(...)`

Sequence:
1. user message is appended to `chatMessages`
2. a `status` message is added
3. `getBudgetCopilotChatReply(...)` is called
4. the returned full text is revealed with `simulateCopilotAssistantMessage(...)`
5. a second hidden extraction pass runs with `getBudgetCopilotStructuredAnalysis(...)`
6. parsed output is converted into staged suggestions through `stageCopilotSuggestionFromAnalysis(...)`
7. strategic priority enrichment runs through `mergeStrategicPriorityIntoSuggestion(...)`

Key behavior:
- the visible assistant reply is natural language
- structured extraction is separate
- nothing is auto-applied to the form

---

## Structured Suggestion Model

Staged AI suggestions are stored in:
- `copilotPendingSuggestion`

Shape includes:
- `title`
- `fields`
- `budgetRows`
- `source`
- `evidence`
- `reviewFlags`
- `rawModelResponse`

Supported sources:
- `chat`
- `document`
- `cumulative`
- `strategic_priority`

The staged suggestion panel is a review surface, not an auto-write surface.

User action is still required:
- `Apply Suggestions`

---

## Applying Staged Suggestions

Field application is handled by:
- `applyCopilotFieldPatch(...)`

This function resolves user-facing values into real draft values, including:
- category labels to enum values
- activity type labels to enum values
- budget item type labels to enum values
- technology company names to Dataverse IDs
- product names to product IDs
- work stream names to Dataverse IDs
- strategic priority names to Dataverse IDs
- strategic priority classification names to Dataverse IDs

Budget rows are handled in:
- `applyCopilotPendingSuggestion(...)`

Important detail:
- copilot-suggested budget rows may initially carry synthetic IDs like `copilot-...`
- before insertion into `copilotBudgetItems`, the function resolves each GL code against the real classification tree using:
  - `getClassificationRecords()`
  - `buildClassificationTree()`
  - `buildBudgetItemDraft()`

This ensures saved budget line items use real Dataverse classification IDs.

---

## Strategic Priority Suggestions In AI Mode

The AI workspace still reuses the existing strategic-priority service:
- `getStrategicPrioritySuggestions(...)`

Used by:
- `refreshCopilotAiSuggestions(...)`
- `mergeStrategicPriorityIntoSuggestion(...)`

Behavior:
- top recommendations are matched against live lookup data
- staged suggestions store display names
- `applyCopilotFieldPatch(...)` resolves those names back to live Dataverse IDs when applied

This is intentional because:
- the assistant can suggest
- the app still keeps lookup resolution controlled

---

## Budget Considerations In AI Mode

Policy checking uses:
- `evaluateIctBudgetConsiderations(...)`

Triggered from:
- `runCopilotBudgetConsiderationCheck(...)`

Behavior:
1. validates that project name and summary exist
2. appends a `status` chat message
3. calls the policy evaluation service
4. replaces the status message with a `policy-analysis` card or an error text message

Important:
- this is advisory only
- it does not write fields into the draft

---

## Supporting Documents In AI Mode

The AI mode has two document entry paths:

### 1. Chat attachment path
Handled by:
- `sendCopilotPromptWithFile(...)`

Behavior:
1. file is added into `copilotUploadedFiles`
2. the file is marked `analyzing`
3. a user chat message is added
4. a `status` message is added
5. `evaluateSupportingDocument({ file })` runs
6. the result is stored in `copilotSupportingDocumentAnalyses`
7. a staged suggestion can be built from the parsed summary
8. the chat status message is replaced with a `document-analysis` card

Important current behavior:
- this path does not call `getBudgetCopilotChatReply(...)`
- it currently shows the structured document-analysis card directly in chat

### 2. AI form dropzone path
Handled by:
- `FileUploadDropzone` bound to `copilotUploadedFiles`

Background analysis starts from `useEffect` watchers in `NewProject.tsx`.

For each file:
1. local analysis state is created as `queued`
2. the file is promoted to `analyzing`
3. `evaluateSupportingDocument({ file })` runs
4. result is stored in `copilotSupportingDocumentAnalyses`

Completed file summaries are also pushed into the chat as `document-analysis` cards through a dedicated effect, guarded by:
- `shownCopilotDocumentSummaryRef`

---

## Document AI Service Details

Document AI is implemented in:
- `src/services/aiSupportingDocumentEvaluationService.ts`

### Individual file evaluation
Function:
- `evaluateSupportingDocument(...)`

Behavior:
- converts the browser `File` into base64
- calls `PowerAppV2_GetDocumentSummaryfromCompassService.Run(...)`
- parses returned JSON into `SupportingDocumentEvaluationSummary`

### Cumulative evaluation
Function:
- `evaluateCumulativeSupportingDocuments(...)`

Behavior:
- takes completed individual summaries
- sends `filename` and `fileResponse`
- calls `PowerAppV2_GetCumulativeDocumentSummaryfromCompassService.Run(...)`
- parses the returned cumulative summary

So the responsibility split is:
- chat and structured assistant: Dataverse custom API
- supporting-document summarization: Power Automate

---

## Cumulative Document Behavior

When two or more individual document analyses are complete, AI mode automatically evaluates a cumulative summary.

This is managed by:
- `completedCopilotSupportingDocumentInputs`
- `completedCopilotSupportingDocumentScopeKey`
- `copilotSupportingDocumentCumulativeAnalysis`

Flow:
1. completed individual summaries are converted into `fileInputs`
2. `evaluateCumulativeSupportingDocuments(...)` runs
3. the result is stored in `copilotSupportingDocumentCumulativeAnalysis`
4. the chat gets either:
   - a `status` message for cumulative work in progress
   - a `cumulative-analysis` card on success
   - a text error message on failure

The active document authority in AI mode is:
- the latest single-file summary when only one file is complete
- the cumulative summary when multiple files are complete

That active summary feeds:
- staged field suggestions
- budget line suggestions
- account code suggestion surfaces

---

## Current Suggestion Derivation Logic

Document-derived and cumulative-derived suggestions are created by:
- `collectCopilotSuggestedFields(...)`
- `buildBudgetItemsFromSupportingDocumentSummary(...)`
- `stageCopilotSuggestionFromAnalysis(...)`

Strategic-priority enrichment is layered on top by:
- `mergeStrategicPriorityIntoSuggestion(...)`

This means a staged suggestion may contain:
- field patches extracted from documents
- budget rows inferred from account code suggestions
- strategic priority name patches added afterward

---

## What Is Local Preview State vs Persisted Data

### Local-only during the working session
These remain local until save:
- `copilotFormValues`
- `copilotBudgetItems`
- `chatMessages`
- `copilotPendingSuggestion`
- `copilotUploadedFiles`
- `copilotSupportingDocumentAnalyses`
- `copilotSupportingDocumentCumulativeAnalysis`

### Persisted only after save succeeds
These are only created after draft save:
- the ICT budget draft record
- budget line item rows
- uploaded SharePoint files
- `dga_ict_document_summary` rows
- `dga_ict_ai_summary` cumulative row

Key rule:
- document analysis can happen immediately
- persistence of files and AI summary records happens only after a successful draft save

---

## Save Flow In AI Mode

AI mode save starts at:
- `handleCopilotSaveDraft()`

Validation is shared through:
- `validateDraftState(...)`

Persistence uses:
- `saveDraftFromState(...)`

Save sequence:
1. validate `copilotFormValues` and `copilotBudgetItems`
2. build `CreateIctBudgetDraftInput`
3. call `createIctBudgetDraft(...)`
4. call `createBudgetLineItems(...)`
5. if files exist, call `uploadFilesToRecord(...)`
6. if completed AI document summaries exist, call `persistSupportingDocumentAiRecordsForBudget(...)`
7. navigate to the new project detail page

### AI summary persistence
`persistSupportingDocumentAiRecordsForBudget(...)`:
- creates one `dga_ict_document_summary` per completed file
- upserts one cumulative `dga_ict_ai_summary`

Rule:
- with one completed file, the individual summary is also used as the cumulative summary
- with multiple completed files, the cumulative response is persisted

---

## Clear / Reset Behavior

`clearCopilotWorkspace()` resets:
- chat input
- staged file
- chat messages
- copilot form values
- copilot budget items
- uploaded files
- document analysis state
- cumulative analysis state
- staged suggestions
- strategic-priority suggestions
- budget consideration result
- shown-summary guards

This returns AI mode to its initial welcome state.

---

## Current UI Components Used In AI Mode

Rendered directly in the AI experience:
- `BudgetAssistantWelcomeCard`
- `CopilotStatusMessage`
- `CopilotDocumentAnalysisMessage`
- `CopilotCumulativeAnalysisMessage`
- `CopilotPolicyAnalysisMessage`
- `FileUploadDropzone`

Not currently rendered in the AI-mode right panel:
- `SupportingDocumentAiInsights`

That component is still used in manual mode.

---

## Integration Notes And Constraints

### What the current implementation intentionally does
- keeps manual mode isolated from AI mode
- keeps AI suggestions staged until user applies them
- uses existing app-safe Dataverse and Flow integrations
- reuses the same final save contract as manual mode

### What it does not do
- it does not stream from the backend
- it does not persist draft-related AI artifacts before save
- it does not auto-apply assistant suggestions
- it does not bypass classification resolution for budget rows

---

## Current Responsibility Split

### Dataverse custom API
Used for:
- conversational assistant replies
- structured extraction pass
- strategic priority suggestion
- budget considerations check

### Power Automate
Used for:
- individual supporting document analysis
- cumulative supporting document analysis

### Dataverse standard table services
Used for:
- budget draft creation
- budget line item creation
- AI summary persistence

### SharePoint upload pipeline
Used for:
- physical file upload after successful save

---

## Final Summary

The current `Budget Assistant` integration is a guided AI create experience layered on top of the existing `NewProject.tsx` flow.

In practice:
- chat uses the Budget Copilot custom API bridge
- document AI uses Power Automate
- strategic priority and policy checks stay specialized and controlled
- all AI suggestions are staged first
- budget rows are resolved to real classifications before persistence
- final save still goes through the same safe draft pipeline as manual mode

That keeps the AI experience interactive for the user while preserving the production data model and save guarantees already used by the app.
