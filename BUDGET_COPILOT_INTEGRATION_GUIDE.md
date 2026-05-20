# Budget Copilot Integration Guide

## Purpose
This document explains the full `Budget Copilot` integration that now lives inside the existing create flow in `src/pages/respondent/NewProject.tsx`.

It focuses on:
- what was implemented
- how AI mode differs from manual mode
- which services are reused
- which integrations use `Dataverse custom API`
- which integrations use `Power Automate`
- how document AI works in copilot mode
- how draft save works in copilot mode
- what state is preview-only vs persisted

This is the implementation guide for the new `AI Copilot` create-mode workflow.

---

## High-Level Goal

The app already had:
- a full `Manual` create form
- AI helper services for:
  - Strategic Priority suggestion
  - Budget Considerations policy evaluation
  - individual supporting-document summary
  - cumulative supporting-document summary

The goal of this work was to add a real `AI Copilot` budget-creation experience without breaking the manual create flow.

Important design rule:
- `Manual mode` stays intact
- `AI mode` is a separate guided workspace
- both modes still end in the same safe budget creation pipeline

---

## What Was Implemented

### 1. Real AI Copilot Mode Inside `NewProject.tsx`
The old placeholder AI tab in `NewProject.tsx` was replaced with a real copilot workspace.

The new AI mode now includes:
- a real chat panel
- staged suggestions
- a separate copilot draft form
- preview-only supporting-document AI
- document-driven suggestion cards
- budget rows preview and apply behavior
- save-to-draft behavior using the same final persistence pipeline as manual mode

This means the AI toggle now switches between:
- `Manual`
- `AI Copilot`

without the AI mode being just a visual stub.

---

### 2. Dedicated Copilot Chat Service
New service:
- [src/services/aiBudgetCopilotChatService.ts](/c:/ICT-Budgeting-2026/src/services/aiBudgetCopilotChatService.ts)

Purpose:
- handle copilot chat turns
- call the existing Dataverse custom API bridge
- avoid direct browser HTTP calls to Core42
- support full-response mode instead of backend streaming

Key exported types/functions:
- `BudgetCopilotChatMessage`
- `BudgetCopilotRuntimeContext`
- `getBudgetCopilotChatReply(...)`
- `getBudgetCopilotStructuredAnalysis(...)`

Behavior:
- builds one full prompt per turn
- serializes:
  - system prompt
  - runtime context
  - conversation transcript
- sends the prompt to the custom API bridge
- returns a full text reply
- runs a second structured extraction pass to stage fields/budget suggestions

This is the main orchestration layer for copilot chat.

---

### 3. Repo Prompt Loader For Copilot Prompt Files
New service:
- [src/services/repoPromptService.ts](/c:/ICT-Budgeting-2026/src/services/repoPromptService.ts)

Purpose:
- load prompt markdown from repository files at build/runtime
- keep the copilot prompt in repo instead of moving it into `dga_ai_prompts`

Current prompt source:
- [BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md](/c:/ICT-Budgeting-2026/BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md)

Why this was added:
- the copilot prototype already had a strong prompt file
- the requirement was to preserve repo prompt files in this phase
- prompt loading had to work through the app bundle, not through direct fetch/proxy

---

## Core Design Principle

The most important architectural decision is:

`AI mode does not create a second persistence system.`

Instead:
- AI mode has its own local working state
- user can review/apply suggestions
- when the user clicks `Save Draft`, the app uses the same safe create pipeline as manual mode

This avoids:
- duplicate budget-save logic
- divergence between manual and AI-created records
- downstream workflow incompatibility

---

## Where The Main Integration Lives

Main page:
- [src/pages/respondent/NewProject.tsx](/c:/ICT-Budgeting-2026/src/pages/respondent/NewProject.tsx)

This file now contains two separate create workspaces:

### Manual Workspace
Uses:
- `formValues`
- `budgetItems`
- `uploadedFiles`
- existing manual AI helper behavior

### Copilot Workspace
Uses:
- `copilotFormValues`
- `copilotBudgetItems`
- `copilotUploadedFiles`
- `copilotPendingSuggestion`
- `copilotSupportingDocumentAnalyses`
- `copilotSupportingDocumentCumulativeAnalysis`
- `chatMessages`
- `copilotAiSuggestions`
- `copilotBudgetConsiderationResult`

This separation is intentional so AI mode can be interactive without mutating manual-mode state.

---

## AI Services Reused By Copilot

The copilot does not duplicate the domain AI services that already exist in the app.

It reuses these existing services:

### 1. Strategic Priority Suggestion
Service:
- [src/services/aiStrategicSuggestionService.ts](/c:/ICT-Budgeting-2026/src/services/aiStrategicSuggestionService.ts)

Used in copilot for:
- post-chat suggestion refresh
- matching project name + summary to strategic priority recommendations

Integration type:
- `Dataverse custom API`

---

### 2. ICT Budget Considerations
Service:
- [src/services/aiBudgetConsiderationsService.ts](/c:/ICT-Budgeting-2026/src/services/aiBudgetConsiderationsService.ts)

Used in copilot for:
- policy evaluation of the current copilot draft

Integration type:
- `Dataverse custom API`

Behavior:
- advisory only
- does not auto-apply anything to the draft

---

### 3. Individual Supporting Document Summary
Service:
- [src/services/aiSupportingDocumentEvaluationService.ts](/c:/ICT-Budgeting-2026/src/services/aiSupportingDocumentEvaluationService.ts)

Function:
- `evaluateSupportingDocument(...)`

Used in copilot for:
- immediate file preview analysis in AI mode

Integration type:
- `Power Automate`

Behavior in AI mode:
- file is analyzed immediately for preview
- file is **not** uploaded to SharePoint yet
- no Dataverse summary row is created yet

---

### 4. Cumulative Supporting Document Summary
Service:
- [src/services/aiSupportingDocumentEvaluationService.ts](/c:/ICT-Budgeting-2026/src/services/aiSupportingDocumentEvaluationService.ts)

Function:
- `evaluateCumulativeSupportingDocuments(...)`

Used in copilot for:
- replacing single-file suggestion authority with combined multi-file summary once 2+ analyzed files exist

Integration type:
- `Power Automate`

Behavior in AI mode:
- only runs when 2 or more individual file summaries are complete
- uses individual file summaries as its input payload

---

## AI Services Used By Copilot Chat

The chat itself uses a new service, but the actual AI call still goes through the existing app-safe bridge.

### Copilot Chat Path
UI:
- `NewProject.tsx`

Service:
- `aiBudgetCopilotChatService.ts`

Bridge:
- Dataverse custom API `dga_CustomWebApi`

Remote endpoint behind bridge:
- `https://api.core42.ai/v1/responses`

Model:
- `gpt-5.1`

Why this path was chosen:
- direct browser HTTP calls are not allowed in the app architecture
- local proxy architecture from the standalone prototype must not be used in the production app
- the app already has a custom API bridge pattern for text-generation services

---

## Copilot Prompt Strategy

Prompt source used for chat:
- [BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md](/c:/ICT-Budgeting-2026/BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md)

This prompt is loaded by:
- `repoPromptService.ts`

It is then consumed by:
- `aiBudgetCopilotChatService.ts`

Why this matters:
- chat prompt did not move into `dga_ai_prompts`
- existing prompt-file ownership in repo was preserved
- production app still consumes it safely through the bundled code path

---

## Conversation Model

Each chat turn rebuilds the prompt from:
- system prompt
- runtime context
- visible chat history

Runtime context sent to the copilot includes:
- current copilot draft form state
- uploaded document metadata
- completed individual file analyses
- cumulative analysis when available
- current budget rows
- staged pending suggestions
- entity name

This runtime context is serialized into prompt text before the custom API call.

This means the model can reason over:
- what the user already said
- what fields are already populated
- what documents were analyzed
- what suggestions are already staged

---

## Full-Response Instead Of Streaming

The prototype used streaming behavior.

The production integration does not use backend streaming.

Instead:
- `getBudgetCopilotChatReply(...)` returns one full text response
- React simulates typing in the UI by progressively revealing the returned string

Why this was done:
- matches current app-safe integration constraints
- avoids direct streaming transport complexity
- preserves the “live AI” feel in the interface

---

## Structured Extraction Pass

After the visible assistant reply is generated, the app performs a second hidden structured call:
- `getBudgetCopilotStructuredAnalysis(...)`

Purpose:
- convert conversation state into machine-usable draft suggestions
- keep the visible chat helpful and natural
- keep extracted fields structured and safe to stage

This structured output is used to build:
- `copilotPendingSuggestion.fields`
- `copilotPendingSuggestion.budgetRows`
- optional review flags/evidence

Important rule:
- these suggestions are staged first
- they are not auto-applied

---

## Staged Suggestion Model

Copilot suggestions are stored in:
- `copilotPendingSuggestion`

Shape includes:
- title
- field patches
- budget row suggestions
- source
- evidence
- review flags
- raw model response

Sources supported:
- `chat`
- `document`
- `cumulative`
- `strategic_priority`

Apply behavior:
- `Apply Suggestions` patches the AI draft state only
- budget rows are merged into `copilotBudgetItems`
- user stays in control before final save

This preserves the product rule:
- advisory until user applies

---

## Copilot Draft State

AI mode does not reuse `formValues` while the user is working.

It uses:
- `copilotFormValues`
- `copilotBudgetItems`
- `copilotFieldErrors`
- `copilotBudgetItemsError`

This gives three benefits:

1. Manual mode remains untouched
2. Copilot can stage/apply suggestions safely
3. Final save can still map to the same create payload contract

---

## Supporting Document AI In Copilot Mode

### Preview-Only During Live Session
When a file is attached in AI mode:
- it is added to `copilotUploadedFiles`
- individual summary is requested immediately
- analyzer UI shows status through `SupportingDocumentAiInsights`

But during the live session:
- file is not uploaded to SharePoint
- no `dga_ict_document_summary` row is created yet
- no `dga_ict_ai_summary` row is created yet

This is different from edit/view mode, where upload can happen immediately.

---

### Individual File Flow In Copilot Mode
For each attached file:

1. file is added locally
2. file status becomes `queued`
3. `evaluateSupportingDocument(...)` runs
4. AI response is parsed
5. analyzer UI shows result
6. document-derived suggestions can populate action cards / staged suggestion state

UI component reused:
- [src/components/shared/SupportingDocumentAiInsights.tsx](/c:/ICT-Budgeting-2026/src/components/shared/SupportingDocumentAiInsights.tsx)

This is the same AI document analyzer component used elsewhere in the app.

---

### Cumulative File Flow In Copilot Mode
When 2 or more individual file summaries are complete:

1. the app builds `fileInputs`
2. each input sends:
   - `filename`
   - `fileResponse` = raw individual summary
3. `evaluateCumulativeSupportingDocuments(...)` runs
4. parsed cumulative summary becomes the active document-summary source

Result:
- single-file guidance is replaced by combined multi-file guidance
- right-side/inline document suggestion surfaces now use cumulative authority

---

## Action Cards In Copilot Mode

Copilot mode includes document-driven suggestion surfaces using the same parsed summary model:

- `Suggested Project Fields`
- `Account Code Suggestion`
- budget rows preview via staged suggestions

These use:
- individual summary when only 1 file has completed
- cumulative summary when multiple files are complete

This preserves the same product rule already used in manual mode document AI.

---

## Strategic Priority Suggestions In Copilot Mode

Copilot mode also supports strategic priority recommendation refresh based on the current copilot draft.

Used state:
- `copilotAiSuggestions`
- `copilotAiSuggestionLoading`
- `copilotAiSuggestionError`
- `copilotAiPromptUsecase`

Flow:
1. project name and summary are available in `copilotFormValues`
2. `refreshCopilotAiSuggestions(...)` calls the existing strategic priority service
3. suggestions are matched to live Dataverse lookup records
4. user can apply the chosen recommendation into the copilot draft

Important:
- strategic priority still comes from the existing specialized service
- chat does not replace the controlled strategic-priority integration

---

## Budget Considerations In Copilot Mode

Copilot mode can run:
- `evaluateIctBudgetConsiderations(...)`

Purpose:
- evaluate the current copilot draft against budget policy considerations

Behavior:
- result is shown in copilot mode UI
- advisory only
- no auto-application to draft fields

This matches the intended behavior from the plan:
- policy evaluation is a guardrail, not a field writer

---

## Save Draft Flow In Copilot Mode

This is the most important compatibility piece.

AI mode does **not** create a separate persistence implementation.

Instead it uses the same final save behavior as manual mode.

### Shared Save Concept
At save time, AI mode provides:
- `copilotFormValues`
- `copilotBudgetItems`
- `copilotUploadedFiles`
- completed document AI summaries
- cumulative document summary when applicable

These are then passed through the same safe create contract as manual mode.

### Save Sequence
When user clicks `Save Draft` in AI mode:

1. validate copilot draft state
2. build `CreateIctBudgetDraftInput`
3. create budget draft in Dataverse
4. create budget line items in Dataverse
5. upload attached files to SharePoint
6. create individual `dga_ict_document_summary` records
7. create or update `dga_ict_ai_summary`
8. navigate to the created project detail page

This is the same persistence philosophy already used in manual create mode.

---

## Shared Persistence Services Used At Save Time

### Upload Service
- [src/services/fileUploadService.ts](/c:/ICT-Budgeting-2026/src/services/fileUploadService.ts)

Used to:
- upload AI-mode attached files only after budget creation succeeds

---

### Document Summary Persistence
- [src/services/documentAiSummaryStoreService.ts](/c:/ICT-Budgeting-2026/src/services/documentAiSummaryStoreService.ts)

Used to:
- create one `dga_ict_document_summary` record per file
- create/update one `dga_ict_ai_summary` cumulative record

Important behavior:
- if only one file exists, that same individual summary is also used as the cumulative record
- if more than one file exists, the latest cumulative summary is persisted

---

## Dataverse / Power Automate / Custom API Responsibility Split

### Dataverse Custom API
Used for:
- Budget Copilot chat
- Budget Copilot structured extraction
- Strategic Priority suggestion
- Budget Considerations evaluation

Custom API data source:
- `dga_customwebapi`

Operation:
- `dga_CustomWebApi`

---

### Power Automate
Used for:
- individual document summary
- cumulative document summary
- file upload to SharePoint

This means document AI is still flow-backed, not direct custom-API-backed.

---

### Dataverse Tables
Used for:
- budget draft storage
- budget line item storage
- individual file summary persistence
- cumulative summary persistence

Relevant AI persistence tables:
- `dga_ict_document_summary`
- `dga_ict_ai_summary`

---

## Files Added For This Integration

### New Files
- [src/services/aiBudgetCopilotChatService.ts](/c:/ICT-Budgeting-2026/src/services/aiBudgetCopilotChatService.ts)
- [src/services/repoPromptService.ts](/c:/ICT-Budgeting-2026/src/services/repoPromptService.ts)

### Main Modified File
- [src/pages/respondent/NewProject.tsx](/c:/ICT-Budgeting-2026/src/pages/respondent/NewProject.tsx)

### Reused Existing Files
- [src/services/aiStrategicSuggestionService.ts](/c:/ICT-Budgeting-2026/src/services/aiStrategicSuggestionService.ts)
- [src/services/aiBudgetConsiderationsService.ts](/c:/ICT-Budgeting-2026/src/services/aiBudgetConsiderationsService.ts)
- [src/services/aiSupportingDocumentEvaluationService.ts](/c:/ICT-Budgeting-2026/src/services/aiSupportingDocumentEvaluationService.ts)
- [src/services/documentAiSummaryStoreService.ts](/c:/ICT-Budgeting-2026/src/services/documentAiSummaryStoreService.ts)
- [src/services/fileUploadService.ts](/c:/ICT-Budgeting-2026/src/services/fileUploadService.ts)
- [src/components/shared/SupportingDocumentAiInsights.tsx](/c:/ICT-Budgeting-2026/src/components/shared/SupportingDocumentAiInsights.tsx)

---

## Post-Integration Fixes And Enhancements

This section documents all fixes and behavioral improvements made after the initial integration was shipped.

---

### Fix 1 — Chat Response Showing Raw JSON Instead Of Text

**Problem:**
The chat bubble was rendering the full raw JSON response from the Dataverse bridge instead of the assistant's message text.

**Root cause:**
`extractTextFromResult` in `aiBudgetCopilotChatService.ts` returned string payloads directly without attempting to parse them as JSON first. The Dataverse custom API bridge wraps the Core42 response as a JSON string, so the payload arrives as a string containing a JSON object.

**Fix:**
Added a `JSON.parse` attempt at the top of the `string` handling branch. If the string is valid JSON, the function recurses into the parsed value instead of returning the string literal.

```ts
if (typeof payload === 'string') {
  const parsed = tryParseJson(payload)
  if (parsed !== null) return extractTextFromResult(parsed)
  return payload
}
```

---

### Fix 2 — Second Layer Of Raw JSON (Core42 Output Array)

**Problem:**
After Fix 1, the response was still showing raw JSON when the Core42 API returned its `output` as an array of content objects.

**Root cause:**
`output` was in the `prioritizedKeys` list. When the function recursed into `record['output']` and received an array, it fell through to `JSON.stringify(payload)` because there was no array guard before the object processing path.

**Fix:**
Added explicit `Array.isArray` handling at the top of `extractTextFromResult`, before the object processing path. The array handler walks the Core42 `output[].content[].text` structure directly.

```ts
if (Array.isArray(payload)) {
  const parts: string[] = []
  for (const item of payload) {
    const content = (item as Record<string, unknown>).content
    if (!Array.isArray(content)) continue
    for (const contentItem of content) {
      const text = (contentItem as Record<string, unknown>).text
      if (typeof text === 'string' && text.trim()) parts.push(text)
    }
  }
  if (parts.length > 0) return parts.join('\n').trim()
  return ''
}
```

---

### Fix 3 — Markdown Bold Not Rendering In Chat Bubbles

**Problem:**
The copilot's use of `**bold**` markdown was showing as literal asterisks in the chat bubble.

**Fix:**
Added a `renderCopilotMessage` helper (module-level, above the component) that splits each line on `**...**` patterns and wraps matched segments in `<strong>` tags. Each line is separated by a `<br />`.

```tsx
function renderCopilotMessage(text: string) {
  const lines = text.split('\n')
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <span key={lineIndex}>
        {lineIndex > 0 && <br />}
        {parts.map((part, partIndex) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
            : part
        )}
      </span>
    )
  })
}
```

Chat bubble render was updated to: `<p className="leading-6">{renderCopilotMessage(msg.text)}</p>`

---

### Feature — File Upload Inside The Chat Panel

**What was added:**
A paperclip file-attach button was added directly inside the copilot chat input bar. This allows users to attach a file and optionally add a note before sending.

**New state:**
```tsx
const [chatStagedFile, setChatStagedFile] = useState<File | null>(null)
const chatFileInputRef = useRef<HTMLInputElement>(null)
```

**UI behavior:**
- Paperclip button opens a hidden `<input type="file">`
- When a file is staged, a chip appears above the input showing the filename with an ✕ dismiss button
- The paperclip button highlights (purple) when a file is staged
- Send button is enabled when either text is typed or a file is staged
- Input placeholder changes to `"Add a note about this file (optional)..."` when a file is staged

**Send behavior:**
`handleSend` routes to `sendCopilotPromptWithFile` when a file is staged, otherwise to `sendCopilotPrompt`.

---

### Feature — `sendCopilotPromptWithFile` — Copilot-Driven File Response

**What was added:**
A new function `sendCopilotPromptWithFile` handles the complete file-upload-in-chat flow.

**Flow:**
1. Immediately marks the file as `analyzing` in `copilotSupportingDocumentAnalyses` and adds it to the in-flight ref — prevents the background `useEffect` from double-running the same analysis
2. Adds the file to `copilotUploadedFiles`
3. Posts the user's message and a placeholder AI message `"Analyzing **{filename}**..."` to the chat
4. Calls `evaluateSupportingDocument({ file })` via Power Automate
5. Stores the completed analysis in `copilotSupportingDocumentAnalyses`
6. Builds a full `BudgetCopilotRuntimeContext` with the new analysis included
7. Calls `getBudgetCopilotChatReply` — produces a conversational copilot response informed by the document
8. Clears the `"Analyzing..."` placeholder and uses `simulateCopilotAssistantMessageInPlace` to type the copilot reply into the same message slot (not a new bubble)
9. Calls `getBudgetCopilotStructuredAnalysis` with the copilot reply already in the transcript
10. Calls `stageCopilotSuggestionFromAnalysis` and `mergeStrategicPriorityIntoSuggestion`

**Key design rule:**
The chat response after file upload comes from `getBudgetCopilotChatReply` — a full conversational reply. The raw document analysis is never shown directly in chat. This matches the intended behavior from the standalone prototype.

---

### Feature — `simulateCopilotAssistantMessageInPlace`

**What was added:**
A helper function that types progressively into the **last existing AI message** in the chat, rather than appending a new bubble.

Used by `sendCopilotPromptWithFile` to replace the `"Analyzing..."` placeholder with the actual copilot reply without adding a second bubble.

```tsx
const simulateCopilotAssistantMessageInPlace = async (targetText: string) => {
  setCopilotTyping(true)
  let current = ''
  while (current.length < targetText.length) {
    const remaining = targetText.length - current.length
    const chunkSize = remaining > 140 ? 14 : remaining > 60 ? 8 : 4
    current = targetText.slice(0, current.length + chunkSize)
    setChatMessages((prev) => {
      const next = [...prev]
      const lastIndex = next.length - 1
      if (lastIndex >= 0 && next[lastIndex].from === 'ai') {
        next[lastIndex] = { ...next[lastIndex], text: current }
      }
      return next
    })
    await new Promise((resolve) => window.setTimeout(resolve, 18))
  }
  setCopilotTyping(false)
}
```

---

### UI Change — Removed Three Sections From Copilot View

**What was removed from the copilot right-panel:**

1. **AI Document Analyzer** — `<SupportingDocumentAiInsights>` was removed from the "Supporting Documents Preview" section. Document analysis still runs in the background; only the raw analyzer UI card was removed.

2. **Suggested Project Fields card** — the entire `<div className="grid gap-4 lg:grid-cols-2">` block containing the field suggestion card was removed.

3. **Account Code Suggestion card** — removed from the same grid block.

**Why:**
The copilot chat already stages and presents these suggestions through the "Suggestions From This Conversation" card. Showing the raw AI document analyzer and field/account code suggestion cards alongside the chat created redundant and confusing parallel surfaces.

The underlying services and state for all three still exist and continue to run — they were only removed from the rendered output.

---

### Fix 4 — Strategic Priority Showing GUIDs Instead Of Names

**Problem:**
The "Suggestions From This Conversation" card was displaying raw Dataverse GUIDs in the Strategic Priority and Strategic Priority Classification fields, e.g.:
```
Strategic Priorities 524f441e-5e49-f111-bec6-70a8a521c02d
Strategic Priority Classifications ba4f441e-5e49-f111-bec6-70a8a521c02d
```

**Root cause:**
`mergeStrategicPriorityIntoSuggestion` was storing `priorityRecord.id` (a GUID) in `copilotPendingSuggestion.fields`. The suggestion card displays the raw field value, so it rendered the GUID.

**Fix:**
Changed `mergeStrategicPriorityIntoSuggestion` to store `priorityRecord.name` and `classificationRecord.name` instead of their `.id` values.

```tsx
const priorityExtraFields: Partial<Record<keyof FormValues, string | string[]>> = {
  strategicPriorityId: priorityRecord.name,
}
if (classificationRecord?.id) {
  priorityExtraFields.strategicPriorityClassificationId = classificationRecord.name
}
```

**Why this is correct:**
`applyCopilotFieldPatch` resolves the strategic priority field using fuzzy name matching (`labelsMatch`) against live Dataverse lookup records. It expects a display name string, not a GUID. Storing the name means:
- the suggestion card shows a human-readable label
- `applyCopilotFieldPatch` correctly resolves name → ID at apply time

---

### Fix 5 — Budget Line Items Not Created On Save Draft

**Problem:**
The copilot recommended GL codes, they appeared correctly in the "Suggestions From This Conversation" card and in the budget table after applying, but on Save Draft no budget line item records were created in Dataverse.

**Root cause:**
`buildBudgetItemsFromSupportingDocumentSummary` assigns fabricated IDs to copilot-suggested budget rows:
```ts
id: `copilot-${accountCode}-${index}`,
```

At save time, `createBudgetLineItems` calls `buildCreateRecord` which binds:
```ts
'dga_classification@odata.bind': `/dga_classifications(${item.id})`,
```

Since `item.id` is `copilot-55001-0` (not a real GUID), Dataverse rejects the bind and creates no record.

**Fix:**
`applyCopilotPendingSuggestion` was made async. When the user clicks "Apply Suggestions", it now:
1. Fetches the full classification tree via `getClassificationRecords`
2. For each suggested budget row with a fake `copilot-` ID, fuzzy-matches the row's `glCode` against level-4 classification nodes (same strategy used in `applyCopilotAccountCodeSuggestion`)
3. Resolves the match to a real classification GUID using `buildBudgetItemDraft`
4. Preserves the copilot-suggested `budgetRequested` amount on the resolved draft
5. Items whose GL code cannot be matched are silently skipped; items already carrying a real GUID pass through unchanged

```tsx
const applyCopilotPendingSuggestion = async () => {
  if (!copilotPendingSuggestion) return
  applyCopilotFieldPatch(copilotPendingSuggestion.fields)

  if (copilotPendingSuggestion.budgetRows.length > 0) {
    const classificationRecords = await getClassificationRecords()
    const { nodeMap } = buildClassificationTree(classificationRecords)
    const resolvedItems: BudgetItemDraft[] = []

    for (const row of copilotPendingSuggestion.budgetRows) {
      if (!row.id.startsWith('copilot-')) {
        resolvedItems.push(row)
        continue
      }
      // fuzzy match glCode → real classification node
      const searchTerm = row.glCode.trim().toLowerCase()
      let matchedId: string | null = null
      for (const [id, node] of nodeMap.entries()) {
        if (node.level !== 4) continue
        const nodeName = (node.name ?? '').toLowerCase()
        if (
          nodeName.includes(searchTerm) ||
          searchTerm.includes(nodeName) ||
          (node.ebsCode ?? '').toLowerCase() === searchTerm ||
          (node.fusionCode ?? '').toLowerCase() === searchTerm
        ) { matchedId = id; break }
      }
      if (!matchedId) continue
      const draft = buildBudgetItemDraft(matchedId, nodeMap)
      if (draft) resolvedItems.push({ ...draft, budgetRequested: row.budgetRequested })
    }

    if (resolvedItems.length > 0) {
      setCopilotBudgetItems((prev) => {
        const existing = new Set(prev.map((item) => item.id))
        const additions = resolvedItems.filter((item) => !existing.has(item.id))
        return additions.length > 0 ? [...prev, ...additions] : prev
      })
      setCopilotBudgetItemsError(null)
    }
  }

  setCopilotPendingSuggestion(null)
}
```

**Result:**
Budget line items applied from copilot suggestions now carry real Dataverse classification GUIDs and are correctly persisted when the user saves draft.

---

### Fix 6 — Chat Auto-Scroll Scrolling The Whole Page

**Problem (first attempt):**
A `useEffect` using `chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })` was added to scroll the chat to the latest message. This scrolled the entire page instead of just the chat container.

**Root cause:**
`scrollIntoView` bubbles scroll upward through the DOM until it finds a scrollable ancestor — which was the page itself, not the chat box.

**Fix (correct approach):**
Removed `scrollIntoView` entirely. Instead, `chatScrollRef` is attached directly to the overflow container div:

```tsx
<div ref={chatScrollRef} className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
```

The `useEffect` now sets `scrollTop` on the container itself:

```tsx
useEffect(() => {
  const el = chatScrollRef.current
  if (el) el.scrollTop = el.scrollHeight
}, [chatMessages])
```

This scrolls only the chat box, not the page. New messages and streaming chunks both trigger the effect, keeping the latest message always visible.

---

## What Was Explicitly Not Brought Over From The Standalone Prototype

The standalone prototype had extra behavior that was intentionally not copied into the production app.

Not carried over:
- local proxy architecture
- browser-stored provider API key workflow
- direct Core42 HTTP calls
- direct Foundry HTTP calls
- provider picker UI
- backend streaming dependency

Why:
- production app must use safe internal integrations
- custom API / flow architecture already exists and must remain the contract

---

## What Stayed Aligned With The Prototype

Behavior preserved from the prototype:
- guided chat-first interaction
- staged suggestions
- structured extraction after visible chat response
- document analysis as evidence context
- cumulative summary becoming the authority when multiple files exist
- strategic priority remaining a controlled specialized service
- budget considerations remaining advisory

So the user experience intent from the prototype was preserved, but the transport and persistence model was adapted to the production app.

---

## Validation And Safety Model

Copilot mode still respects the same safety boundaries as manual mode:

- required fields are validated before save
- user must explicitly apply staged suggestions
- budget line items still need valid requested amounts
- files are only persisted after actual draft creation succeeds
- document AI persistence only happens after file upload succeeds

This keeps AI mode from bypassing the normal create workflow rules.

---

## Final Summary

The new Budget Copilot integration adds a full AI-assisted create experience while keeping the existing application architecture intact.

In short:
- chat uses `Dataverse custom API`
- documents use `Power Automate`
- prompt file stays in repo
- AI mode has separate working state
- nothing is auto-finalized without user review
- save still uses the same safe Dataverse creation pipeline
- document summaries persist only after the budget draft and files are successfully saved

This makes the copilot mode production-compatible without disrupting the existing manual create flow.
