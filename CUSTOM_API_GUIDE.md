# Custom Dataverse API — Integration Guide

How we connected `dga_WebApiForPortal` (a developer-registered Dataverse custom API) to the Code App, and how to repeat the pattern for any future custom API.

---

## Why this approach

Power Apps Code Apps run under a strict CSP that blocks all direct `fetch()` calls to external URLs. Every data call must go through the Power Apps runtime SDK (`@microsoft/power-apps/data`). The `DataClient.executeAsync` method supports a `customapi` action type that POSTs to any unbound Dataverse custom action via the runtime's authenticated channel — no fetch, no tokens, no CORS issues.

---

## How it works (step by step)

### 1. Register the data source in `dataSourcesInfo.ts`

File: `.power/schemas/appschemas/dataSourcesInfo.ts`

Add an entry whose key is a lowercase slug you choose (this is the `tableName` you pass to `executeAsync`). The entry's `apis` object must contain the exact schema-name of the custom API (`dga_WebApiForPortal`), with a full `IApiDefinition`.

```ts
"dga_webapiforportal": {
  "tableId": "",
  "version": "",
  "primaryKey": "",
  "dataSourceType": "Dataverse",
  "apis": {
    "dga_WebApiForPortal": {
      "path": "/api/data/v9.2/dga_WebApiForPortal",
      "method": "POST",
      "parameters": [
        { "name": "actionName", "in": "body", "required": true,  "type": "string"  },
        { "name": "isAdmin",    "in": "body", "required": true,  "type": "boolean" },
        { "name": "userId",     "in": "body", "required": false, "type": "string"  },
        { "name": "fetchXml",   "in": "body", "required": true,  "type": "string"  }
      ]
    }
  }
}
```

**Rules for `IApiDefinition`:**
- `path` — OData path appended to the Dataverse instance URL. The SDK strips a leading `/` automatically.
- `method` — `"POST"` for actions, `"GET"` for functions.
- `parameters[].in`:
  - `"body"` — included in the JSON request body, keyed by `name`.
  - `"query"` — appended as OData function parameters `FunctionName(p1=v1)`.
  - `"path"` — substituted into `{placeholder}` segments in `path`.

**Do NOT add this entry to `power.config.json`** (`databaseReferences.default.cds.dataSources`). Adding it there triggers an "entity dependency check" on push that fails because `dga_webapiforportal` is not a real Dataverse table. The entry only belongs in `dataSourcesInfo.ts`.

---

### 2. Call it via `executeAsync`

```ts
import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'

const result = await getClient(dataSourcesInfo).executeAsync<RequestType, ResponseType>({
  dataverseRequest: {
    action: 'customapi',
    parameters: {
      operationName: 'dga_WebApiForPortal',   // must match the key in apis{}
      tableName:     'dga_webapiforportal',    // must match the top-level key in dataSourcesInfo
      body: {
        actionName: 'retrievemultiple',
        isAdmin:    true,
        userId:     '',
        fetchXml:   '<fetch>...</fetch>',
      },
    },
  },
})
```

**What the SDK does internally:**
1. Looks up `dataSourcesInfo['dga_webapiforportal']` — throws "Unable to find data source" if missing.
2. Looks up `.apis['dga_WebApiForPortal']` — returns `{ success: false, error: "Operation not found…" }` if missing.
3. Calls `_getDefaultDataverseEnvironmentInfo()` to get the runtime Dataverse instance URL from `default.cds` database references (this is the authenticated environment URL, not read from config).
4. Builds the final URL: `instanceUrl + apiDef.path` (e.g. `https://org.crm.dynamics.com/api/data/v9.2/dga_WebApiForPortal`).
5. Maps each `body` param by name from the input `body` object into the HTTP request body.
6. POSTs via the runtime's authenticated channel — CSP-safe, no tokens needed in app code.

---

## Current implementation: retrieving SharePoint documents

Service: `src/services/webApiForPortalService.ts`

The `dga_WebApiForPortal` custom API wraps the SharePoint document virtual table with admin privileges, accepting a FetchXML query and returning a `retrieveResponse` array.

```ts
const result = await client.executeAsync<Body, { retrieveResponse: WebApiPortalDocument[] }>({
  dataverseRequest: {
    action: 'customapi',
    parameters: {
      operationName: 'dga_WebApiForPortal',
      tableName: 'dga_webapiforportal',
      body: {
        actionName: 'retrievemultiple',
        isAdmin: true,
        userId: '',
        fetchXml: buildSharePointDocumentFetchXml(budgetId),
      },
    },
  },
})

const docs: WebApiPortalDocument[] = result.data?.retrieveResponse ?? []
```

The FetchXML links `sharepointdocument` to `dga_ict_budget` via `regardingobjectid`, filtering by the budget GUID. This returns all SharePoint files attached to that ICT Budget record.

---

## WARNING: `npx power-apps add-flow` overwrites `dataSourcesInfo.ts`

The `add-flow` command regenerates `.power/schemas/appschemas/dataSourcesInfo.ts` from scratch every time it runs. **Any manually added entry (like `dga_webapiforportal`) will be silently deleted.**

### Checklist — every time you run `add-flow`

After running `npx power-apps add-flow --flow-id <id>`, immediately do the following before building or pushing:

1. Open `.power/schemas/appschemas/dataSourcesInfo.ts`.
2. Check that the `dga_webapiforportal` entry is still present.
3. If it is missing, re-add it (copy from the block in [Step 1](#1-register-the-data-source-in-datasourcesinfots) above).
4. Build and push.

### Quick way to verify

```bash
grep -c "dga_webapiforportal" .power/schemas/appschemas/dataSourcesInfo.ts
```

If the output is `0`, the entry is gone — re-add it before continuing.

### Why this happens

`add-flow` calls the CLI's internal code generator which writes a fresh file from the Power Apps project manifest. It has no knowledge of hand-written entries. The file header even says *"This file is auto-generated. Do not modify it manually."* — we have to modify it anyway for custom APIs not registered as app data sources, so the tradeoff is accepted, but the re-add step after every `add-flow` run is mandatory.

---

## Template for a new custom API

1. **Find the schema name** of the custom API in Dataverse (e.g. `contoso_MyAction`).
2. **Add to `dataSourcesInfo.ts`:**

```ts
"contoso_myaction": {
  "tableId": "", "version": "", "primaryKey": "",
  "dataSourceType": "Dataverse",
  "apis": {
    "contoso_MyAction": {
      "path": "/api/data/v9.2/contoso_MyAction",
      "method": "POST",
      "parameters": [
        { "name": "paramOne", "in": "body", "required": true, "type": "string" }
        // add all input parameters the action expects
      ]
    }
  }
}
```

3. **Create a service file** (`src/services/myActionService.ts`):

```ts
import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'

export async function callMyAction(paramOne: string): Promise<MyResult> {
  const result = await getClient(dataSourcesInfo).executeAsync<{ paramOne: string }, MyResult>({
    dataverseRequest: {
      action: 'customapi',
      parameters: {
        operationName: 'contoso_MyAction',
        tableName: 'contoso_myaction',
        body: { paramOne },
      },
    },
  })
  if (!result.success) throw new Error(result.error?.message ?? 'Custom API call failed')
  return result.data
}
```

4. **Do not touch `power.config.json`.**
5. **Build and push**: `npm run build && npx power-apps push`

---

## Key SDK facts

| Fact | Detail |
|------|--------|
| Only `executeAsync` can call custom APIs | `DataClient` has no `callAction` — it does not exist |
| `tableName` resolves the environment, not an entity | The SDK uses it to look up `dataSourcesInfo[tableName]` and then calls `_getDefaultDataverseEnvironmentInfo()` for the actual OData base URL |
| `customapi` vs `getEntityMetadata` | Only two supported `action` values in the current SDK |
| Response key is API-specific | `dga_WebApiForPortal` returns `{ retrieveResponse: [...] }` — other APIs will differ |
| Path is appended to the instance URL | `/api/data/v9.2/ActionName` produces `https://org.crm.dynamics.com/api/data/v9.2/ActionName` |
