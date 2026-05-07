# Data

## What We Use For Dataverse Interaction

We are using the Power Apps Code App generated service pattern with:

- `@microsoft/power-apps/data`
- `getClient(dataSourcesInfo)`
- generated service classes in `src/generated/services/*`

Current generated services:
- `src/generated/services/AccountsService.ts`
- `src/generated/services/Dga_classificationsService.ts`
- `src/generated/services/Dga_ict_budget_line_itemsService.ts`
- `src/generated/services/SystemusersService.ts`

Both services use:
- `createRecordAsync` (Create)
- `retrieveRecordAsync` (Retrieve single)
- `retrieveMultipleRecordsAsync` (Retrieve list)
- `updateRecordAsync` (Update)
- `deleteRecordAsync` (Delete)
- `executeAsync` (metadata or custom Dataverse requests)

Data source metadata/config comes from:
- `.power/schemas/appschemas/dataSourcesInfo`

## Pattern We Are Following

Pattern: **Generated Typed Service Layer** (service class per table)

Each table has a generated TypeScript model + service, and app code calls service methods directly instead of writing raw Web API fetch calls.

Example pattern:
- `AccountsService.getAll(...)`
- `AccountsService.create(...)`
- `Dga_classificationsService.getAll(...)`
- `SystemusersService.getAll(...)`

This keeps Dataverse calls typed and consistent with Power Apps runtime policies.

## Associate / Disassociate

Right now, explicit associate/disassociate helper methods are **not implemented** in current generated services.

If needed, we can do association operations using `client.executeAsync({ dataverseRequest: ... })` with the proper Dataverse action payload, or add generated Dataverse action/function wrappers and call those.

## How Dataverse Was Connected To This Code App

High-level flow:
1. Initialize/connect Code App to Power Apps environment.
2. Add Dataverse data sources/tables to the app (which generates typed models/services).
3. Use generated services from `src/generated/services` in UI/business code.

Result: The app uses authenticated Power Apps runtime data access, not custom auth logic.

## Adding A New Dataverse Table To The Code App

Important: a table existing in the Dataverse environment or inside a solution is **not enough**.  
It must also be added to the **Code App project** as a data source so Power Apps generates:

- `power.config.json` registration
- `.power/schemas/appschemas/dataSourcesInfo.ts`
- `.power/schemas/dataverse/*.Schema.json`
- generated TypeScript model/service files in `src/generated`

### Real Example We Did: `dga_classification`

We added the table with:

- `npx power-apps add-data-source --api-id dataverse --resource-name dga_classification --org-url "https://dge.crm15.dynamics.com"`

Notes:

- Use the **Dataverse org URL**, such as `https://<org>.crm15.dynamics.com`
- Do **not** use the maker portal URL like `https://make.powerapps.com/...`
- After adding the data source, Power Apps generated:
  - `.power/schemas/dataverse/classifications.Schema.json`
  - `src/generated/models/Dga_classificationsModel.ts`
  - `src/generated/services/Dga_classificationsService.ts`

### Repeatable Steps For Any New Table

1. Confirm the table exists in the target Dataverse environment.
2. Get the Dataverse org URL:
   - example: `https://dge.crm15.dynamics.com`
3. Add the table to the Code App:
   - `npx power-apps add-data-source --api-id dataverse --resource-name <logical-table-name> --org-url "https://<org>.crm15.dynamics.com"`
4. Verify generated outputs:
   - `power.config.json`
   - `.power/schemas/appschemas/dataSourcesInfo.ts`
   - `.power/schemas/dataverse/*.Schema.json`
   - `src/generated/models/*`
   - `src/generated/services/*`
5. Use the generated service in app code.
6. Run build:
   - `npm run build`
7. Push the updated app:
   - `npx power-apps push`

### Real Example We Also Did: `dga_ict_budget_line_item`

We added the line-item table with:

- `npx power-apps add-data-source --api-id dataverse --resource-name dga_ict_budget_line_item --org-url "https://dge.crm15.dynamics.com"`

Generated outputs to verify:

- `.power/schemas/dataverse/ictbudgetlineitems.Schema.json`
- `src/generated/models/Dga_ict_budget_line_itemsModel.ts`
- `src/generated/services/Dga_ict_budget_line_itemsService.ts`

## Retrieval Pattern For New Tables

Preferred pattern: use the generated service, not raw fetch.

Example with classification table:

- `Dga_classificationsService.getAll({ select: [...], orderBy: ['dga_name asc'] })`

Then map the generated model into app-specific domain types inside a custom adapter/service file.

For `dga_classification`, we mapped:

- `dga_classification_level` as the hierarchy level:
  - `1 = L1`
  - `2 = L2`
  - `3 = L3`
  - `4 = GL Code`
- `dga_ebs_account_code` as EBS code
- `_dga_parent_classification_value` as the self-lookup parent
- `dga_fusion_account_code` as Fusion code
- formatted choice/lookup labels for display names

For `dga_ict_budget_line_item`, we retrieve with:

- `Dga_ict_budget_line_itemsService.getAll({ select: [...], filter: \`_dga_ict_budget_value eq ${projectId}\`, orderBy: ['dga_name asc'] })`

Selected fields:

- `dga_ict_budget_line_itemid`
- `dga_budget_requested`
- `_dga_classification_value`
- `dga_ebs_account_code`
- `dga_fusion_account_code`
- `_dga_ict_budget_value`
- `dga_name`

Important retrieval note:

- this table only gives the classification lookup id/name directly
- to show `L1 / L2 / L3` in UI, we also retrieve `dga_classification` records and rebuild the hierarchy path from `_dga_classification_value`

## Create / Update Pattern For New Tables

After a table is added to the Code App and generated:

- Create: `GeneratedTableService.create(record)`
- Update: `GeneratedTableService.update(id, changedFields)`
- Retrieve single: `GeneratedTableService.get(id, options)`
- Retrieve multiple: `GeneratedTableService.getAll(options)`
- Delete: `GeneratedTableService.delete(id)`

Field handling rule we are following:

- Choice / Option set:
  - retrieve formatted label for display
  - use raw numeric value for create/update
- Lookup:
  - retrieve formatted lookup name for display
  - use lookup binding / raw lookup value for create/update
- Currency:
  - treat as numeric/integer in app payloads unless table behavior requires otherwise
- Text / Multiline Text:
  - use plain string values

### Budget Line Item Create Example

For creating a budget line item from the classification modal:

- `dga_ict_budget@odata.bind` uses the opened project / ICT budget id
- `dga_classification@odata.bind` uses the selected GL code classification id
- `dga_name` uses the selected classification name
- `dga_fusion_account_code` uses the selected GL Fusion code
- `dga_ebs_account_code` uses the selected GL EBS code

Example shape:

```ts
await Dga_ict_budget_line_itemsService.create({
  'dga_ict_budget@odata.bind': `/dga_ict_budgets(${projectId})`,
  'dga_classification@odata.bind': `/dga_classifications(${classificationId})`,
  dga_name: classificationName,
  dga_fusion_account_code: fusionCode,
  dga_ebs_account_code: ebsCode,
} as Omit<Dga_ict_budget_line_itemsBase, 'dga_ict_budget_line_itemid'>)
```

Implementation note:

- generated Power Apps models can mark additional fields as required in TypeScript even when Dataverse can supply them automatically at runtime
- because of that, our app should build the actual Dataverse payload in a wrapper service and cast there instead of editing generated files

## How We Deploy

Local test/runtime:
- `npx power-apps run`

Deploy (push latest bundle to hosted Power Apps code app):
- `npx power-apps push`

After push, app is available from the Power Apps play URL for this environment/app.

## CRUD Summary

- Create: `*.create(record)` -> `createRecordAsync`
- Read one: `*.get(id, options)` -> `retrieveRecordAsync`
- Read many: `*.getAll(options)` -> `retrieveMultipleRecordsAsync`
- Update: `*.update(id, changedFields)` -> `updateRecordAsync`
- Delete: `*.delete(id)` -> `deleteRecordAsync`

## Notes

- Generated files include header: "This file is autogenerated. Do not edit this file directly."
- For custom operations, use wrapper utilities or custom files that call generated services, instead of modifying generated files manually.
