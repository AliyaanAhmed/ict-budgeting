# Budget Copilot Standalone Implementation Guide

## What This Package Contains

This folder contains a standalone local-development prototype of Budget Copilot for ICT budgeting project creation.

It includes:

- A standalone HTML page with the Budget Copilot chat and project creation form.
- A local Node.js proxy server for Core42 Compass and Microsoft Foundry calls.
- Runtime prompts for chat consultation, document analysis, cumulative document analysis, strategic-priority classification, and DGE budget consideration checks.
- Client-side UI behavior for streaming chat, file upload analysis, project field suggestions, model-call inspection, evidence scoring, and form patching after user confirmation.

This package is intended as a handoff/reference implementation for integration into the main app. It is not a production deployment package.

## Folder Structure

```text
BudgetCopilotStandalone/
  budget-copilot.html
  IMPLEMENTATION_GUIDE.md
  scripts/
    budget-copilot.js
    budget-copilot-proxy.js
  styles/
    budget-copilot.css
  Prompts/
    budget-copilot-chat-assistant.md
    supporting-document-evaluation.md
    document-cumulative-evaluation.md
    strategic-priority-classification.md
    budget-consideration-policy-check.md
```

## How To Run Locally

Requirements:

- Node.js 18 or later. The proxy uses the built-in `fetch` API, so no `npm install` is required.

From inside this folder, run:

```powershell
node scripts\budget-copilot-proxy.js
```

Open:

```text
http://localhost:8087/budget-copilot.html
```

You can provide API keys in either of two ways.

Option 1: enter keys in the page Settings panel for local testing.

Option 2: set environment variables before starting the proxy:

```powershell
$env:CORE42_COMPASS_API_KEY="..."
$env:FOUNDRY_API_KEY="..."
node scripts\budget-copilot-proxy.js
```

The page stores local Settings values in browser `localStorage`. Do not use browser-side keys in production.

## AI Providers

The standalone page calls local proxy paths. The proxy forwards requests to the provider APIs.

Core42 Compass:

- Local chat path: `/api/core42/chat/completions`
- Local responses path: `/api/core42/responses`
- Upstream base URL: `https://api.core42.ai`
- Chat upstream: `https://api.core42.ai/v1/chat/completions`
- Responses upstream: `https://api.core42.ai/v1/responses`

Microsoft Foundry:

- Local responses path: `/api/foundry/responses`
- Upstream responses endpoint:

```text
https://foundry-dge-dev-ae.services.ai.azure.com/api/projects/aiproj-ict-dev/openai/v1/responses
```

The active provider can be changed in the Settings panel. Core42 supports the chat completion flow; Foundry is used through the Responses-style flow in this prototype.

## Prompt Responsibilities

`Prompts/budget-copilot-chat-assistant.md`

- Main consultation prompt for chat.
- Defines the assistant role, project-creation guardrails, controlled field guidance, and how to discuss suggested fields.
- This prompt is sent as the first `system` message for chat.

`Prompts/supporting-document-evaluation.md`

- Used for one uploaded file.
- Produces file summary, evidence assessment, suggested project fields, budget lines, account-code suggestions, and review flags.
- File-level output controls suggestions only when there is one completed file analysis.

`Prompts/document-cumulative-evaluation.md`

- Used automatically when two or more file analyses are complete.
- Receives the completed file-analysis JSON outputs as `file_analyses`.
- Its response becomes the source of truth for chat summary, suggestion card, budget rows, account-code suggestions, and evidence status.
- The frontend must not separately merge, sum, reconcile, or deduplicate multiple documents.

`Prompts/strategic-priority-classification.md`

- Only source for Strategic Priority and Strategic Priority Classification.
- Requires Entity Name, Project Name, and Project Description.
- The UI applies only rank 1 output into the suggestion card.
- Chat should not invent strategic-priority values.

`Prompts/budget-consideration-policy-check.md`

- Manual DGE Budget Considerations screening.
- Requires Entity Name, Project Name, and Project Description.
- Results are advisory only and do not patch fields or block project creation.

## Important Behavior To Preserve In The Main App

The frontend must keep chat history and send the relevant messages on each request because chat completion APIs do not hold conversation state automatically.

One uploaded file:

- Run `supporting-document-evaluation.md`.
- Show a compact evidence summary in chat.
- Let the user review and apply suggested fields.

Two or more uploaded files:

- Run `document-cumulative-evaluation.md` after each successful file analysis once the completed count is at least two.
- Use only the latest cumulative response for suggestions, budget rows, account-code suggestions, and evidence status.
- Individual file-level results can remain visible in Documents or model logs, but they should not be merged into project suggestions once cumulative analysis exists.

Strategic priority:

- Trigger only when Entity Name, Project Name, and Project Description are available.
- Use the strategic-priority prompt only.
- Apply rank 1 output to the suggestion card.
- Re-run when Project Name or Project Description changes from chat, file analysis, or cumulative analysis.

DGE Budget Considerations:

- Enable the button only when Entity Name, Project Name, and Project Description are available.
- Run manually when the user clicks `Check DGE Budget Considerations`.
- Show results in chat.
- Do not patch form fields or budget rows.
- Do not block project creation for any match type.

Match type styling:

- `Potential Conflict`: highlight as red/warning.
- `Coordination Required`: informational warning.
- `Allowed With Conditions`: informational advisory.

Suggestion behavior:

- Do not auto-fill the form.
- Keep suggestions separate until the user clicks Apply.
- If new chat information or a new file changes suggested values, update the suggestion card to reflect the latest available analysis.
- Once fields are applied, avoid re-suggesting the same fields unless new information changes them.

## Data Flow Overview

1. User describes a project or uploads a supporting document.
2. Chat requests use the chat prompt plus live runtime context.
3. File uploads are sent to Responses API with `input_file` and `input_text`.
4. File-level JSON is parsed and stored.
5. If two or more file analyses exist, cumulative analysis runs and replaces file-level suggestions as the authoritative source.
6. If Entity Name, Project Name, and Project Description exist, strategic-priority classification can run and add rank 1 results to suggestions.
7. User reviews suggestions and clicks Apply to patch the visible form.
8. DGE Budget Considerations can be run manually and shown as advisory chat output.

## Production Integration Notes

Do not expose Core42 or Foundry API keys in the browser in production. Move provider calls into the application backend or a secure API layer.

Keep prompt files versioned with the app. Treat them as part of the application logic.

Keep request/response logs redacted. API keys and uploaded file bytes must not be displayed in logs.

The Model Calls panel is useful during development and debugging. For production, remove it, restrict it to admin/debug users, or replace it with backend observability.

Add backend limits for upload size, allowed MIME types, request timeouts, and model error handling.

Preserve user confirmation before applying suggestions to the form.

## Test Checklist

Basic load:

- Page opens at `http://localhost:8087/budget-copilot.html`.
- First assistant message asks the user to describe the ICT project or upload a supporting document.
- Settings panel accepts Entity Name, provider, API key, and model.

Chat:

- Chat response streams visibly.
- Basic greetings get a helpful Budget Copilot introduction.
- Off-topic questions are redirected to ICT budgeting project creation.
- Chat history is preserved across turns within the page session.

Single file:

- Uploading one supported file adds it to Documents.
- File is analyzed through Responses API.
- Chat shows a compact evidence summary.
- Documents section shows evidence quality and evidence score.
- Suggest Project Fields button shows extracted fields.

Multiple files:

- Uploading a second file triggers cumulative analysis automatically.
- Suggestion card switches to cumulative response only.
- Budget rows come from cumulative `budget_lines` and `account_code_suggestions`.
- The UI does not perform its own multi-file accumulation or deduplication.

Strategic priority:

- With Entity Name, Project Name, and Project Description available, the classifier runs.
- Rank 1 Strategic Priority and Strategic Priority Classification appear in suggested fields.
- Applying suggestions patches those fields into the form.

DGE Budget Considerations:

- Button is disabled until Entity Name, Project Name, and Project Description are available.
- Button runs the policy-check prompt.
- Chat shows `Policy Number`, `Policy Name`, `Match Type`, `Relevance Score`, and `Required Action`.
- `Potential Conflict` is visually stronger/red.
- `Coordination Required` and `Allowed With Conditions` are informational.
- No policy result blocks project creation or changes form fields.

Security/logging:

- API keys do not appear in model-call logs.
- Uploaded file bytes do not appear in model-call logs.
- Full model response can be opened for debugging without exposing secrets.

## Validation Commands

From inside this folder:

```powershell
node --check scripts\budget-copilot.js
node --check scripts\budget-copilot-proxy.js
```

Then start the standalone proxy:

```powershell
node scripts\budget-copilot-proxy.js
```

Open:

```text
http://localhost:8087/budget-copilot.html
```

Confirm the page loads, prompts are fetched from the copied `Prompts` folder, and Settings accepts Core42 or Foundry keys.

## Notes For Integration Into The Existing App

Use this standalone page as a behavior reference rather than a final UI architecture. In the production app, the same flows can be implemented using the app's component system, state management, authentication, and backend APIs.

The most important integration contracts are:

- Project field suggestions come from parsed model JSON, not from free-text chat alone.
- Controlled values must be selected from the allowed options.
- Strategic priority values must come from the strategic-priority classifier.
- Multi-file project evidence must come from cumulative analysis.
- DGE policy checks are advisory and separate from field suggestions.
- User confirmation is required before patching the form.
