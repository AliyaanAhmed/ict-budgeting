# Data

## What We Use For Dataverse Interaction

We are using the Power Apps Code App generated service pattern with:

- `@microsoft/power-apps/data`
- `getClient(dataSourcesInfo)`
- generated service classes in `src/generated/services/*`

Current generated services:
- `src/generated/services/AccountsService.ts`
- `src/generated/services/Dga_classificationsService.ts`
- `src/generated/services/Dga_ict_budgetsService.ts`
- `src/generated/services/Dga_ict_budget_dga_technology_productsetService.ts`
- `src/generated/services/Dga_ict_budget_line_itemsService.ts`
- `src/generated/services/Dga_strategic_prioritiesesService.ts`
- `src/generated/services/Dga_technologiesService.ts`
- `src/generated/services/Dga_work_streamsService.ts`
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

## Excel Export

Project list Excel export is handled by a shared service:

- `src/services/projectExportService.ts`

Library used:

- `exceljs`

Role pages wired to this export:

- `src/pages/respondent/Projects.tsx`
- `src/pages/reviewer/Projects.tsx`
- `src/pages/approver/Projects.tsx`

### Export flow

Each role page exposes an `Export` button and calls:

```ts
await exportProjectsToExcel(filtered, 'Respondent')
await exportProjectsToExcel(filtered, 'Reviewer')
await exportProjectsToExcel(filtered, 'Approver')
```

Behavior:

- export always uses the currently filtered project list (`filtered`)
- export runs inside `runActionToast(...)`
- download starts in the browser after the workbook buffer is generated
- file name pattern is:
  - `respondent-projects-YYYYMMDD.xlsx`
  - `reviewer-projects-YYYYMMDD.xlsx`
  - `approver-projects-YYYYMMDD.xlsx`

### What the export includes

The workbook is built from live project records plus resolved supporting data:

- project core fields such as ID, name, status, strategic priority, classification, submitted by, pending with, and requested budget
- resolved lookup display values such as:
  - category
  - work stream
  - budget type
  - technology company
  - technology product
- budget line items resolved by ICT budget ID where available
- fallback project budget items when a Dataverse budget ID is not present

### Service dependencies used during export

The export service enriches the workbook using:

- `getBudgetLineItemsByBudgetIds(...)`
- `getIctBudgetDraftById(...)`
- `getTechnologyCompanies()`
- `getWorkStreamOptions()`

This ensures the Excel output reflects the same resolved labels users see in the app rather than only raw stored values.

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

We follow three patterns for N:N association depending on the operation context.

### Pattern 1 - Create Relationship Rows Through The Relationship Table Service

For many-to-many style joins where a relationship/intersect table is registered as a datasource, we create rows directly through that generated service.

Real example:

- ICT Budget <-> Technology Product
- table: `dga_ict_budget_dga_technology_product`
- service: `Dga_ict_budget_dga_technology_productsetService`

Used during ICT budget **Create** form to associate selected technology products with the budget.

Typical payload shape:

```ts
await Dga_ict_budget_dga_technology_productsetService.create({
  'dga_ict_budgetid@odata.bind': `/dga_ict_budgets(${ictBudgetId})`,
  'dga_technologyid@odata.bind': `/dga_technologies(${technologyId})`,
})
```

This is the preferred association pattern on initial create when the relationship table is available as a datasource.

### Pattern 2 - Query The Relationship Table Explicitly

For retrieval of associated rows, we query the relationship table directly instead of relying on raw Web API associate APIs.

Real example:

```ts
await Dga_ict_budget_dga_technology_productsetService.getAll({
  select: ['dga_ict_budgetid', 'dga_technologyid'],
  filter: `dga_ict_budgetid eq ${ictBudgetId}`,
})
```

This is how the app restores selected Technology Product values in the View / Edit form.

### Pattern 3 - Associate / Disassociate On Edit Via Custom API

For the **Edit form**, when the user changes the Technology Product multi-select and saves, we diff the original product IDs (loaded from Dataverse on form open) against the new selection and call `dga_WebApiForPortal` via `executeAsync` for each change.

Service helpers:

- `src/services/webApiForPortalService.ts`
  - `associateTechnologyProduct(ictBudgetId, productId)`
  - `disassociateTechnologyProduct(ictBudgetId, productId)`

#### Associate payload

```ts
{
  actionName: 'associate',
  isAdmin: true,
  userId: '',
  targetTableName: 'dga_technology',
  relatedTableName: 'dga_ict_budget',
  targetId: productId,        // dga_technologyid of the product being added
  relatedId: ictBudgetId,     // dga_ict_budgetid of the opened record
  relationship: 'dga_ict_budget_technology_product',
}
```

#### Disassociate payload

```ts
{
  actionName: 'disassociate',
  isAdmin: true,
  userId: '',
  targetTableName: 'dga_technology',
  relatedTableName: 'dga_ict_budget',
  targetId: productId,        // dga_technologyid of the product being removed
  relatedId: ictBudgetId,     // dga_ict_budgetid of the opened record
  relationship: 'dga_ict_budget_technology_product',
}
```

#### How the diff works (in `handleSaveEdit`)

```ts
const originalProductIds = new Set(savedFormValues.technologyProductIds)
const updatedProductIds  = new Set(formValues.technologyProductIds)

const toAssociate    = formValues.technologyProductIds.filter(id => !originalProductIds.has(id))
const toDisassociate = savedFormValues.technologyProductIds.filter(id => !updatedProductIds.has(id))

await Promise.all([
  ...toAssociate.map(productId    => associateTechnologyProduct(ictBudgetId, productId)),
  ...toDisassociate.map(productId => disassociateTechnologyProduct(ictBudgetId, productId)),
])
```

- `savedFormValues.technologyProductIds` holds the IDs fetched from Dataverse when the form opened (via `getAssociatedTechnologyProductIds`).
- This diff runs inside the main `runActionToast` callback, after `updateIctBudgetDraft` succeeds.
- `savedFormValues` is only updated after all associate/disassociate calls succeed.
- If no products changed, no custom API calls are made.
- Associate and disassociate calls for different products run in parallel.

#### Important field note

`dga_WebApiForPortal` for associate/disassociate requires `targetTableName`, `relatedTableName`, `targetId`, `relatedId`, and `relationship` to be registered as body parameters in `.power/schemas/appschemas/dataSourcesInfo.ts` under the `dga_webapiforportal` entry. These were added manually alongside the existing `actionName`, `isAdmin`, `userId`, and `fetchXml` params. Verify this entry is preserved whenever `add-flow` or `add-data-source` regenerates that file.

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

### Real Example We Also Did: `dga_ict_budget_dga_technology_product`

We added the ICT Budget ↔ Technology Product relationship table with:

- `npx power-apps add-data-source --api-id dataverse --resource-name dga_ict_budget_dga_technology_product --org-url "https://dge.crm15.dynamics.com"`

Generated outputs to verify:

- `src/generated/models/Dga_ict_budget_dga_technology_productsetModel.ts`
- `src/generated/services/Dga_ict_budget_dga_technology_productsetService.ts`
- `power.config.json`
- `.power/schemas/appschemas/dataSourcesInfo.ts`

### Real Example We Also Did: `dga_cycle`

We added the Assessment Cycle table for the ICT Admin role with:

- `npx power-apps add-data-source --api-id dataverse --resource-name dga_cycle --org-url "https://dge.crm15.dynamics.com"`

Generated outputs to verify:

- `src/generated/models/Dga_cyclesModel.ts`
- `src/generated/services/Dga_cyclesService.ts`

Key fields retrieved: `dga_cycleid`, `dga_name`, `_dga_module_type_value`, `dga_planned_start_date`, `dga_planned_end_date`, `statuscode`

Status codes:
- `1` → Draft (fields editable, Publish + Add ADGE buttons)
- `776140001` → Published (read-only, Revise + Mark As Closed buttons)
- `776140002` → Completed (fully read-only, no action buttons)

### Real Example We Also Did: `dga_ict_budget_instance`

We added the ICT Budget Instance table (request instances per cycle) with:

- `npx power-apps add-data-source --api-id dataverse --resource-name dga_ict_budget_instance --org-url "https://dge.crm15.dynamics.com"`

Generated outputs to verify:

- `src/generated/models/Dga_ict_budget_instancesModel.ts`
- `src/generated/services/Dga_ict_budget_instancesService.ts`

Key fields retrieved: `dga_ict_budget_instanceid`, `_dga_cycle_value`, `_dga_entity_value`, `dga_entity_abbr`, `_dga_module_configuration_value`, `dga_name`, `dga_planning_start_date`, `dga_planning_end_date`, `statuscode`

On create: `dga_cycle@odata.bind` → `/dga_cycles(id)`, `dga_entity@odata.bind` → `/accounts(id)`, `dga_name` → account name

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

For `dga_ict_budget_dga_technology_product`, we retrieve with:

- `Dga_ict_budget_dga_technology_productsetService.getAll({ select: ['dga_ict_budgetid', 'dga_technologyid'], filter: \`dga_ict_budgetid eq ${ictBudgetId}\` })`

Purpose:

- get the related `dga_technologyid` values for a specific ICT budget
- use those ids to auto-select the Technology Product multi-select in the View/Edit form
- keep the implementation Code App-safe without using direct `Xrm` browser APIs

## Dynamic Create Form Pattern

The Create Project form is now fully dynamic against Dataverse.

Main screen:

- `src/pages/respondent/NewProject.tsx`

Main wrapper/business services:

- `src/services/ictBudgetDraftService.ts`
- `src/services/strategicPriorityService.ts`
- `src/services/workStreamService.ts`
- `src/services/technologyService.ts`
- `src/services/budgetLineItemService.ts`

### Create Form Lookups And Dependencies

Strategic Priorities:

- retrieve from `dga_strategic_priorities`
- top-level records (no parent) populate `Strategic Priorities`
- child records populate `Strategic Priority Classifications`
- when parent changes:
  - clear selected classification
  - repopulate child dropdown

Work Stream:

- retrieve from `dga_work_stream`
- dropdown populated from Dataverse
- inline create supported through:
  - `createWorkStream(name)`

Technology Company:

- retrieve from `dga_technology`
- only records with company type populate `Technology (Company)`

Technology Product:

- multi-select
- enabled only after company is selected
- create product supported through:
  - `createTechnologyProductForCompany(companyId, name)`

Budget Type:

- uses `dga_activity_type`
- shown as custom radio-style UI
- visible currency fields depend on selected activity type
- when activity type changes:
  - clear budget fields that should no longer be visible

### Create Form Save Draft Flow

When user clicks `Save Draft`:

1. validate required fields
2. create `dga_ict_budget`
3. include lookup bindings and option-set values in payload
4. include:
   - `dga_added_in_allocation = 1`
5. include selected technology product bindings through:
   - `'dga_ict_budget_technology_product@odata.bind': ['/dga_technologies(id)', ...]`
6. create `dga_ict_budget_line_item` rows from selected classification grid

Required field validation we implemented:

- Initiative / Budget Item Name
- Strategic Priorities
- Strategic Priority Classifications
- ICT Budget Items Type
- Planned Start Date
- Planned End Date
- Summary / Description
- Budget Type
- all visible budget currency fields under selected Budget Type
- at least one budget line item

### Create Form Budget Line Items

Budget line items are selected from classification modal and then saved into:

- `dga_ict_budget_line_item`

Each line item uses:

- `dga_ict_budget@odata.bind`
- `dga_classification@odata.bind`
- `dga_name`
- `dga_ebs_account_code`
- `dga_fusion_account_code`
- `dga_budget_requested`

## Dynamic View / Edit Form Pattern

Main screen:

- `src/pages/respondent/ProjectDetail.tsx`

View/Edit form now uses the same field logic as Create Form, but loads data from the opened ICT budget record using:

- `project.ictBudgetId`

### View / Edit Retrieval Flow

1. load dropdown sources:
   - strategic priorities
   - work streams
   - technology companies/products
2. retrieve ICT budget main record using:
   - `Dga_ict_budgetsService.get(ictBudgetId, { select: [...] })`
3. retrieve related technology product ids using:
   - `Dga_ict_budget_dga_technology_productsetService.getAll({ select: ['dga_ict_budgetid', 'dga_technologyid'], filter: \`dga_ict_budgetid eq ${ictBudgetId}\` })`
4. map retrieved `dga_technologyid` values into the Technology Product multi-select so products appear auto-selected
5. retrieve budget line items separately through:
   - `Dga_ict_budget_line_itemsService.getAll(...)`

### View / Edit Metadata We Show

From ICT budget retrieve, we also use:

- `_createdby_value`
- `createdon`
- `modifiedon`
- `dga_status_for_adge`

For display, we prefer Dataverse formatted values when available:

- `_createdby_value@OData.Community.Display.V1.FormattedValue`
- `createdon@OData.Community.Display.V1.FormattedValue`
- `modifiedon@OData.Community.Display.V1.FormattedValue`
- `dga_status_for_adge@OData.Community.Display.V1.FormattedValue`

This is used in:

- header status
- header created by
- Project Creation Details card
- Project Signals status

### View / Edit Save Changes Flow

When user clicks `Save Changes`:

1. validate the same required fields as Create Form
2. update the ICT budget main record using:
   - `Dga_ict_budgetsService.update(...)`
3. save requested budget changes in line items using:
   - `Dga_ict_budget_line_itemsService.update(...)`
4. delete line items using:
   - `Dga_ict_budget_line_itemsService.delete(...)`
5. create additional line items using:
   - `Dga_ict_budget_line_itemsService.create(...)`

### Expand Query / Relationship Retrieval Pattern In Code App

Code App retrieval should prefer generated service methods first:

- `GeneratedService.get(id, { select: [...] })`
- `GeneratedService.getAll({ select: [...], filter: '...', orderBy: [...] })`

For single-record retrieval, we can also pass `expand` when the generated options type supports it.

Example shape:

```ts
await SystemusersService.get(userId, {
  select: ['systemuserid', 'fullname'],
  expand: ['systemuserroles_association($select=roleid,name)'],
})
```

However, in practice we found that not every relationship behaves reliably in the Code App runtime with `expand`.

### Preferred Safe Pattern When Expand Is Not Reliable

If `expand` does not return the related rows as expected, use the same explicit relationship-table pattern we use elsewhere in the app.

Real example used for System Administrator role detection:

1. Query the bridge table:
   - datasource: `systemuserroles`
   - generated service: `SystemuserrolescollectionService`
2. Filter by current user:
   - `systemuserid eq <userId>`
3. Collect `roleid` values
4. Query the `role` table using:
   - generated service: `RolesService`
5. Resolve role names from the returned role rows

Example flow:

```ts
const userRoleLinks = await SystemuserrolescollectionService.getAll({
  select: ['systemuserroleid', 'systemuserid', 'roleid'],
  filter: `systemuserid eq ${userId}`,
})

const roles = await RolesService.getAll({
  select: ['roleid', 'name'],
  filter: `roleid eq ${roleId1} or roleid eq ${roleId2}`,
})
```

This is the preferred Code App-safe pattern when relationship-table retrieval is predictable and `expand` is not.

### Important Code App Limitation We Hit

We do **not** assume every Dataverse `$expand` scenario will work consistently in the Code App runtime.

Because of that:

- we do not rely on `$expand` for Technology Product auto-selection
- instead, we use the registered relationship table datasource:
  - `dga_ict_budget_dga_technology_product`
- and for system-user role resolution we use:
  - `systemuserroles`
  - `role`

In this app, direct relationship-table retrieval is the safest default pattern.

## Role-Based Project Visibility Logic

Our project pages and dashboards should follow the same status mapping per role.

Dataverse status source:

- `dga_status_for_adge`

Mapped app statuses:

- `1` -> `Draft`
- `2` -> `Submitted to Reviewer`
- `3` -> `Submitted to Approver`
- `4` -> `Approved`
- `5` -> `Clarification Required`

### Respondent

Respondent project list / dashboard logic:

- `Draft` -> respondent-owned draft work
- `Clarification Required` -> respondent must respond
- `Submitted to Reviewer` -> currently with reviewer
- `Submitted to Approver` -> currently with approver
- `Approved` -> completed

Respondent project tabs:

- `needs-work` -> `Draft`
- `clarification` -> `Clarification Required`
- `submitted-reviewer` -> `Submitted to Reviewer`

Respondent dashboard dynamic rules:

- metric cards deep-link into `/respondent/projects?tab=<tab-id>`
- clarification panel:
  - if clarification records exist, show top 2 latest clarification projects
  - otherwise show top 2 latest ICT budget records
- requested budget mix:
  - aggregate requested budget by respondent-visible project status
- projects workspace:
  - `On Respondent` = `Draft + Clarification Required`
  - `On Reviewer` = `Submitted to Reviewer`
  - `On Approver` = `Submitted to Approver`
  - `Needs Attention` = `Draft`
- budget type distribution:
  - `Operational Non-Recurring`
  - `Operational Recurring`
  - `New Project`
  - `Project Continuation`

### Reviewer

Reviewer project list logic:

- `pending-review` -> `Submitted to Reviewer`
- `clarification` -> `Clarification Required`
- `submitted-approver` -> `Submitted to Approver`

Reviewer queue:

- `To Review` = `dga_status_for_adge = 2`
- `Reviewed` = `dga_status_for_adge = 3`
- `Clarification Pending` = `dga_status_for_adge = 5`

Reviewer dashboard dynamic rules:

- top metric cards:
  - `Pending Review` -> count of `Submitted to Reviewer`
  - `Clarification Sent` -> count of `Clarification Required`
  - `Sent To Approver` -> count of `Submitted to Approver`
- top metric card deep links:
  - `/reviewer/projects?tab=pending-review`
  - `/reviewer/projects?tab=clarification`
  - `/reviewer/projects?tab=submitted-approver`
- `Projects Requiring Attention`:
  - show top 2 latest records with `Submitted to Reviewer`
  - if none exist, switch heading to `Latest ICT Budgets`
  - fallback shows top 2 latest reviewer-visible projects
- `Queue Budget Mix`:
  - aggregate requested budget across:
    - `Pending Review`
    - `Clarification Sent`
    - `Sent To Approver`
  - keep all cards visible even when a budget bucket is `0`
- `Review Queue Workspace`:
  - `Pending Review` = `Submitted to Reviewer`
  - `Clarif. Sent` = `Clarification Required`
  - `Sent To Approver` = `Submitted to Approver`
  - `Approved` = `Approved`
- reviewer budget type distribution:
  - `Operational Non-Recurring`
  - `Operational Recurring`
  - `New Project`
  - `Project Continuation`

### Approver

Approver project list logic:

- `pending-approval` -> `Submitted to Approver`
- `clarification` -> `Clarification Required`
- `approved` -> `Approved`

Approver queue:

- `Pending` = `dga_status_for_adge = 3`
- `Approved` = `dga_status_for_adge = 4`
- `Clarification Pending` = `dga_status_for_adge = 5`

Approver dashboard dynamic rules:

- top metric cards:
  - `Pending My Approval` -> count of `Submitted to Approver`
  - `Clarification Open` -> count of `Clarification Required`
  - `Approved Project` -> count of `Approved`
- top metric card deep links:
  - `/approver/projects?tab=pending-approval`
  - `/approver/projects?tab=clarification`
  - `/approver/projects?tab=approved`
- `Approval Snapshot`:
  - `Requested Budget` = total requested budget of approver-visible projects
  - `Approved Budget` = total requested budget of `Approved` projects
- `Projects Requiring My Approval`:
  - show top 2 latest records with `Submitted to Approver`
  - if none exist, switch heading to `Latest ICT Budgets`
  - fallback shows top 2 latest approver-visible projects
- `Budget Queue Mix`:
  - aggregate requested budget across:
    - `Drafts on Respondent`
    - `With Reviewer`
    - `Pending My Approval`
    - `Clarification Open`
    - `Approved`
  - keep all cards visible even when a budget bucket is `0`
- `Clarification Monitor`:
  - show only when clarification projects exist
  - list active `Clarification Required` records
  - when hidden, `Quick Actions` stays in the two-column layout beside readiness
- `Quick Actions`:
  - when clarification projects exist, render as a full-width row
  - action cards stay in a single row on large screens
- `Final Approval Readiness`:
  - `Approved` = `Approved`
  - `Pending Approval` = `Submitted to Approver`
  - `With Reviewer` = `Submitted to Reviewer`
  - `On Respondent` = `Draft + Clarification Required`

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

---

## App Initialization Flow (Boot Sequence)

The app runs a sequential async boot chain in `src/main.tsx` before React renders:

```
initUserContext()
  → initCycleContext()
  → initInstanceContext()
  → createRoot(...).render(...)
```

### Step 1 — `initUserContext()` (`src/services/userContextService.ts`)

1. Calls `getContext()` from `@microsoft/power-apps/app` to get the AAD user (objectId, fullName, etc.)
2. Queries `systemusers` by `azureactivedirectoryobjectid` to get the Dataverse `systemuserid`
3. Queries `teammemberships` filtered by `systemuserid` to get all team IDs the user belongs to
4. Queries `dga_module_configuration` with an OR filter across all three role columns (`_dga_respondent_team_value`, `_dga_reviewer_team_value`, `_dga_approver_team_value`) to find which account each team is linked to
5. Fetches team names from `teams` and account names from `accounts`
6. Stores results in sessionStorage:
   - `ict_app_user` → `{ fullName, systemUserId, objectId, ... }`
   - `userTeams` → `[{ teamid, name, role: 'Respondent'|'Reviewer'|'Approver' }]`
   - `respondentAccount` → account GUID for Respondent role
   - `respondentAccountName` → account display name for Respondent role
   - `respondentModuleConfigId` → module config GUID for Respondent role
   - same keys for `reviewer` and `approver`

### Step 2 — `initCycleContext()` (`src/services/cycleService.ts`)

1. Fetches all records from `dga_cycles` (table IS registered in `dataSourcesInfo`)
2. Filters client-side for ICT Budgeting cycles using `dga_module_typename` (formatted lookup value returned automatically by Dataverse)
3. Classifies cycles by today's date:
   - **Current cycle**: today falls within `dga_planned_start_date` → `dga_planned_end_date`
   - **Previous cycle**: most recently ended cycle whose `dga_planned_end_date` is before today
4. Stores results in sessionStorage:
   - `cycles` → `{ allCycles: AppCycle[], currentCycle: AppCycle|null, previousCycle: AppCycle|null }`
   - `currentCycle` → the selected cycle object `{ id, name, startDate, endDate }` (defaults to current cycle, or first in list)

Note: `dga_module_types` is **not** registered in `dataSourcesInfo` — do NOT use `Dga_module_typesService`. The module type filter is handled client-side via `dga_module_typename`.

### Step 3 — `initInstanceContext()` (`src/services/instanceService.ts`)

1. Reads `userTeams` from sessionStorage to determine the default role (first team entry)
2. Gets the account ID for that role from sessionStorage (e.g. `respondentAccount`)
3. Gets the current cycle ID from `sessionStorage["currentCycle"]`
4. Queries `dga_ict_budget_instances` with filter:
   - `_dga_cycle_value eq <cycleId> and _dga_entity_value eq <accountId>`
5. Stores the first matching record in sessionStorage:
   - `instanceID` → GUID string of the instance (`dga_ict_budget_instanceid`)
   - `instanceDetail` → `{ id, name, abbr, planningStartDate, planningEndDate }`

### React-Side Re-fetch (InstanceContext)

After React renders, `src/context/InstanceContext.tsx` watches `activeRole` and `selectedCycle`. When either changes (role switch or cycle switch), it calls `fetchAndStoreInstance(cycleId, accountId)` and updates both sessionStorage and React state.

The account key mapping used in `instanceService.ts`:
- `Respondent` → `sessionStorage["respondentAccount"]`
- `Reviewer` → `sessionStorage["reviewerAccount"]`
- `Approver` → `sessionStorage["approverAccount"]`

### SessionStorage Key Reference

| Key | Type | Set by | Description |
|-----|------|--------|-------------|
| `ict_app_user` | JSON object | `initUserContext` | Full AAD + Dataverse user context |
| `userID` | string | `initUserContext` | Dataverse `systemuserid` for the signed-in user |
| `moduleTypeID` | string | `initUserContext` | `dga_module_typeid` for the ICT Budgeting module |
| `moduleConfigTeamIDs` | JSON object | `initUserContext` | `{ respondentTeamId, reviewerTeamId, approverTeamId }` from `dga_module_configuration` for the resolved account + ICT Budgeting module type |
| `userTeams` | JSON array | `initUserContext` | User's role teams with role labels |
| `respondentAccount` | string | `initUserContext` | Account GUID for Respondent role |
| `respondentAccountName` | string | `initUserContext` | Account display name for Respondent |
| `respondentModuleConfigId` | string | `initUserContext` | Module config GUID for Respondent |
| `reviewerAccount` | string | `initUserContext` | Account GUID for Reviewer role |
| `reviewerAccountName` | string | `initUserContext` | Account display name for Reviewer |
| `reviewerModuleConfigId` | string | `initUserContext` | Module config GUID for Reviewer |
| `approverAccount` | string | `initUserContext` | Account GUID for Approver role |
| `approverAccountName` | string | `initUserContext` | Account display name for Approver |
| `approverModuleConfigId` | string | `initUserContext` | Module config GUID for Approver |
| `cycles` | JSON object | `initCycleContext` | All cycles + current + previous classification |
| `currentCycle` | JSON object | `initCycleContext` / `CycleContext` | Currently selected cycle |
| `currentRole` | string | `RoleContext` | Display name of active role (e.g. `ICT - Respondent`) |
| `instanceID` | string | `initInstanceContext` / `InstanceContext` | GUID of the budget instance for current role+cycle |
| `instanceDetail` | JSON object | `initInstanceContext` / `InstanceContext` | Instance detail: id, name, abbr, dates |

### Additional User Boot Lookup

The user boot flow now also does an explicit ICT Budgeting module lookup and module-configuration lookup for clarification routing.

1. Fetch `dga_module_types` using:
   - `Dga_module_typesService.getAll({ select: ['dga_module_typeid', 'dga_module_name'] })`
2. Match the row whose `dga_module_name` is `ICT Budgeting`
3. Store the resulting `dga_module_typeid` in:
   - `sessionStorage["moduleTypeID"]`
4. Resolve the first available role account in this order:
   - `Respondent`
   - `Reviewer`
   - `Approver`
5. Query `dga_module_configuration` with:
   - `_dga_account_value eq <accountId> and _dga_module_type_value eq <moduleTypeId>`
6. Store the team ids from that record in:
   - `sessionStorage["moduleConfigTeamIDs"]`

Stored shape:

```ts
{
  respondentTeamId: string | null
  reviewerTeamId: string | null
  approverTeamId: string | null
}
```

If the module configuration has only one or two team ids populated, the missing values are stored as `null`. If no matching module configuration is found, the same object is still stored with all values as `null`, so later app code can fail predictably instead of reading an undefined key.

### How instanceID Is Used In Budget Retrieval

All ICT budget queries in `src/api/dataverse/dataverseProjectsApi.ts` add an OData filter:

```
_dga_ict_budget_instance_value eq <instanceID>
```

This scopes every project list, review queue, and approval queue to the current entity's instance for the selected cycle. If no instance ID is found in sessionStorage the filter is omitted (returns all records as fallback).

---

## Power Automate Flow Data Sources

### Why Flows Instead Of Direct Fetch

Power Apps Code Apps enforce a strict Content Security Policy: `connect-src 'none'`.  
This blocks **all** direct `fetch()` / `XMLHttpRequest` calls from browser JavaScript to external URLs — including Power Automate HTTP trigger URLs.

The correct pattern is to register a Power Automate flow as a **connection reference** inside the Code App. The generated connector routes calls through the Power Apps runtime, which is allowed by the CSP.

### How To List Available Solution Flows

Only flows that are **inside a solution** and **active (statecode: 1)** can be added to a Code App.

```bash
npx power-apps list-flows --json
```

From the output, only entries with a non-null `workflowId` and `statecode: 1` are addable. Example:

```json
{
  "name": "PowerAppV2 - Call Upload File Flow",
  "workflowId": "6175a29b-353e-7b35-6971-1a4102feb124",
  "statecode": 1
}
```

**Important:** The `workflowId` returned here is the solution flow GUID. This is **different** from the internal workflow ID embedded in an HTTP trigger URL. Always use `list-flows` to get the correct ID.

### How To Add A Flow To The Code App

```bash
npx power-apps add-flow --flow-id <workflowId>
```

**Requirement:** The Code App must first be added to a solution in Power Apps. If the app is not in a solution, `add-flow` will return a 404.

After running `add-flow`, the CLI:
1. Registers the flow in `power.config.json` under `connectionReferences`
2. Generates `.power/schemas/logicflows/<FlowName>.Schema.json`
3. Generates `src/generated/models/<FlowName>Model.ts`
4. Generates `src/generated/services/<FlowName>Service.ts`
5. Updates `src/generated/index.ts`
6. Updates `.power/schemas/appschemas/dataSourcesInfo.ts`

### How To Remove A Flow From The Code App

```bash
npx power-apps remove-flow --flow-id <workflowId>
```

Or manually:
1. Remove the `connectionReferences` entry from `power.config.json`
2. Delete `.power/schemas/logicflows/<FlowName>.Schema.json`
3. Delete `src/generated/models/<FlowName>Model.ts`
4. Delete `src/generated/services/<FlowName>Service.ts`
5. Remove the export lines from `src/generated/index.ts`

### Generated Flow Service Pattern

The generated service exposes a single `Run(input)` method:

```ts
export class PowerAppV2_CallUploadFileFlowService {
  public static async Run(input: ManualTriggerInput): Promise<IOperationResult<void>>
}
```

The input shape is inferred from the flow's trigger schema. Field names come from the flow's PowerApps V2 trigger parameter titles:

| Schema field name | Flow parameter title | Meaning |
|---|---|---|
| `text` | Payload | JSON stringified file payload |
| `text_1` | URL | Target HTTP trigger URL |

Call pattern:

```ts
const result = await PowerAppV2_CallUploadFileFlowService.Run({ text: '...', text_1: '...' })
if (result.error) throw new Error(result.error.message)
```

Result data is accessed via `result.data` (same as Dataverse services).

---

## Document Upload Functionality

### Flows Added For File Upload

Three flows are registered in this Code App for file upload / document processing:

#### 1. ICT Budget / Clarifications - Upload Files in Sharepoint
- **Flow ID:** `c0932d99-c5e8-e0e8-6f97-973f0dfb97b3`
- **Connection reference key:** `97f6632d-014f-4ebd-b117-2b77336033c2`
- **Data source name:** `ictbudget_clarifications_uploadfilesinsharepoint`
- **Purpose:** Original SharePoint upload flow. Accepts `recordId` and `uploadedFile` object directly.
- **Status:** Registered but superseded by the V2 proxy flow below (401 auth issue at runtime).

#### 2. PowerAppV2 - Call Upload File Flow *(active)*
- **Flow ID:** `6175a29b-353e-7b35-6971-1a4102feb124`
- **Connection reference key:** `bf6ef0cf-67c8-455b-a965-ca34d041a264`
- **Data source name:** `powerappv2_calluploadfileflow`
- **Purpose:** PowerApps V2 trigger proxy flow. Accepts a JSON payload string and a target URL, then makes the HTTP call server-side.
- **Generated service:** `src/generated/services/PowerAppV2_CallUploadFileFlowService.ts`
- **Input schema:**
  - `text` (title: Payload) — JSON stringified file data
  - `text_1` (title: URL) — the HTTP trigger URL of the upload flow

#### 3. PowerAppV2 - Get Document Summary from Compass
- **Flow ID:** `7c1f4991-3d63-d609-528d-9d15937e6444`
- **Connection reference key:** `03f5be90-8cf2-4793-806f-988eae8e970b`
- **Data source name:** `powerappv2_getdocumentsummaryfromcompass`
- **Purpose:** PowerApps V2 trigger flow for AI document summarization from an attached file.
- **Generated service:** `src/generated/services/PowerAppV2_GetDocumentSummaryfromCompassService.ts`
- **Input schema:**
  - `file.name`
  - `file.contentBytes`
- **Response schema:**
  - `summary`

### File Upload Service

**File:** `src/services/fileUploadService.ts`

This service wraps the generated `PowerAppV2_CallUploadFileFlowService` and handles:
1. Reading each file as a base64 string using `FileReader`
2. Building the payload JSON:
   ```ts
   {
     recordId: string,
     uploadedFile: {
       fileName: string,
       fileType: string,       // file extension
       fileContent: string,    // base64 encoded
       folderPath: string      // same as recordId
     }
   }
   ```
3. Calling `PowerAppV2_CallUploadFileFlowService.Run({ text: payload, text_1: UPLOAD_TARGET_URL })`
4. Files are uploaded sequentially (one at a time per record)

Exported functions:
- `uploadFileToRecord(recordId, file)` — upload a single file
- `uploadFilesToRecord(recordId, files)` — upload multiple files sequentially

Important behavior:

- clarification attachments are uploaded into the same ICT budget SharePoint folder as supporting documents
- the clarification entity stores the resulting SharePoint URL(s) in:
  - `dga_file_url`
- this is true for:
  - clarification raised files
  - clarification reply files

### Supporting Document AI Summary Service

**File:** `src/services/aiSupportingDocumentEvaluationService.ts`

This service now wraps the generated `PowerAppV2_GetDocumentSummaryfromCompassService` and handles:
1. Reading the attached file as a base64 string using `FileReader`
2. Building the flow input:
   ```ts
   {
     fileContent: {
       name: file.name,
       contentBytes: base64Content,
       mimeType: file.type || 'application/octet-stream',
     },
   }
   ```
3. Calling `PowerAppV2_GetDocumentSummaryfromCompassService.Run(...)`
4. Logging the flow response in the browser console

Important behavior:

- this no longer uses `dga_ai_prompts`
- this no longer appends prompt text plus base64 into `dga_CustomWebApi`
- current UI trigger is the supporting document attachment flow in `src/pages/respondent/NewProject.tsx`

### FileUploadDropzone Component

**File:** `src/components/shared/FileUploadDropzone.tsx`

Reusable drag-and-drop file selector. Props:

```ts
interface FileUploadDropzoneProps {
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  maxFiles?: number
}
```

Features:
- Drag and drop with child-hover flicker prevention (`dragCounter` ref)
- Duplicate file detection (same name + size)
- File type color badges: PDF=red, DOC/DOCX=blue, XLS/XLSX=green, IMG=purple, PPT=orange
- Remove button fades in on row hover
- Badge shows file count when files are present

### How File Upload Is Wired In Create Form

**File:** `src/pages/respondent/NewProject.tsx`

State: `const [uploadedFiles, setUploadedFiles] = useState<File[]>([])`

Component: `<FileUploadDropzone files={uploadedFiles} onChange={setUploadedFiles} />`

On `Save Draft`:
1. Main `runActionToast` creates the ICT budget and line items
2. If `uploadedFiles.length > 0`, a **separate** `runActionToast` uploads files using `uploadFilesToRecord(createdBudget.id, uploadedFiles)`
3. Upload failure does not block draft save — error toast is shown but navigation proceeds

### How File Upload Is Wired In Edit Form

**File:** `src/pages/respondent/ProjectDetail.tsx`

State: `const [uploadedFiles, setUploadedFiles] = useState<File[]>([])`

In edit mode, a `Supporting Documents` section appears with `<FileUploadDropzone>`.

On `Save Changes`:
1. Main record update runs first
2. If `uploadedFiles.length > 0`, upload runs as a second `runActionToast`
3. Files cleared from state after successful upload
4. Cancel edit also clears staged files

Current edit/view behavior:

- file upload control is shown only for `Respondent`
- file delete is allowed only for:
  - `Respondent`
  - `edit mode`
- reviewers and approvers can view/download files but cannot upload or delete them from the shared detail form
- respondent cannot delete files in view mode

---

## Clarification Integration

Clarifications are now backed by the Dataverse table:

- `dga_ict_clarification`

The Code App includes the generated datasource/service:

- `src/generated/models/Dga_ict_clarificationsModel.ts`
- `src/generated/services/Dga_ict_clarificationsService.ts`
- `.power/schemas/dataverse/ictclarifications.Schema.json`

Main app wrapper:

- `src/services/clarificationService.ts`

### Clarification Create Rules

When Reviewer or Approver raises a clarification:

- create a new `dga_ict_clarification` record
- `dga_ict_budget@odata.bind` -> current ICT budget
- `dga_description` -> modal text
- `dga_clarification_stage` -> `1` (`Planning`)
- `dga_record_type` -> `2` (`Clarification`)
- `dga_scope` -> `2` (`Internal (Entity)`)
- `statuscode` -> `1` (`Open`)
- `dga_clarification_raised_date` -> current ISO datetime
- `dga_raised_by_systemuser@odata.bind` -> `sessionStorage["userID"]`
- `dga_raised_to_team@odata.bind` -> respondent team from `sessionStorage["moduleConfigTeamIDs"]`
- `dga_raised_by_role`:
  - Reviewer -> `ICT - Reviewer`
  - Approver -> `Approver`

Important:

- raise clarification now requires `moduleConfigTeamIDs.respondentTeamId`
- if respondent team id is missing, the create flow throws a clear error instead of silently creating a bad payload

### ICT Budget Assignment Rules

ICT budget workflow transitions now update both:

- `dga_status_for_adge`
- `ownerid@odata.bind`
- `statuscode`

They also stamp the acting user lookup on the ICT budget record:

- respondent actions -> `dga_respondent_systemuser@odata.bind`
- reviewer actions -> `dga_reviewer_systemuser@odata.bind`
- approver actions -> `dga_approver_systemuser@odata.bind`

The user id comes from:

- `sessionStorage["userID"]`

The owner assignment is resolved in this order:

1. `sessionStorage["moduleConfigTeamIDs"]`
2. `sessionStorage["userTeams"]`
3. `sessionStorage["userID"]` as a final fallback for respondent ownership only

Main implementation points:

- `src/services/ictBudgetDraftService.ts`
- `src/api/dataverse/dataverseProjectsApi.ts`
- `src/pages/respondent/ProjectDetail.tsx`

#### On ICT Budget Creation

When Respondent creates a new ICT budget draft:

- initial owner is assigned to the respondent side
- payload includes `ownerid@odata.bind`
- payload also stamps:
  - `dga_respondent_systemuser@odata.bind`
- target owner is resolved from:
  - `moduleConfigTeamIDs.respondentTeamId`
  - fallback `userTeams` respondent team
  - fallback `userID` as system user

#### On Submission / Workflow Handoff

When Respondent submits to Reviewer:

- `dga_status_for_adge` -> `2`
- `statuscode` -> reviewer-submission status
- `ownerid@odata.bind` -> reviewer team
- `dga_respondent_systemuser@odata.bind` -> current user

When Reviewer completes review:

- `dga_status_for_adge` -> `12`
- `statuscode` -> `576610001`
- no owner reassignment
- `dga_reviewer_systemuser@odata.bind` -> current user

When Reviewer submits to Approver:

- `dga_status_for_adge` -> `3`
- `statuscode` -> approver-submission status
- `ownerid@odata.bind` -> approver team
- `dga_reviewer_systemuser@odata.bind` -> current user

When Reviewer raises clarification:

- clarification record is created in `dga_ict_clarification`
- ICT budget status then updates to:
  - `dga_status_for_adge` -> `5`
  - `statuscode` -> clarification-required status
  - `ownerid@odata.bind` -> respondent team
- `dga_reviewer_systemuser@odata.bind` -> current user

When Approver raises clarification:

- clarification record is created in `dga_ict_clarification`
- ICT budget status then updates to:
  - `dga_status_for_adge` -> `5`
  - `statuscode` -> clarification-required status
  - `ownerid@odata.bind` -> respondent team
- `dga_approver_systemuser@odata.bind` -> current user

Approver final approval updates:

- `dga_status_for_adge` -> `4`
- `statuscode` -> approved status
- `dga_approver_systemuser@odata.bind` -> current user
- no owner reassignment is applied in the current implementation

### Clarification First-Reply Reassignment Rule

Clarification now has a first-respondent-reply handoff rule.

If a clarification was originally raised by Reviewer:

- Respondent's first reply shows a confirm dialog
- after confirmation and successful reply create:
  - ICT budget is reassigned back to Reviewer
  - `dga_status_for_adge` returns to reviewer review
  - `statuscode` returns to reviewer review state
  - respondent actor lookup is stamped

If a clarification was originally raised by Approver:

- Respondent's first reply shows a confirm dialog
- after confirmation and successful reply create:
  - ICT budget is reassigned back to Approver
  - `dga_status_for_adge` returns to approver review
  - `statuscode` returns to approver review state
  - respondent actor lookup is stamped

Later clarification replies do not repeat this reassignment logic.

### Record Sharing Rule On Assignment / Workflow Actions

Whenever workflow assignment/status changes happen, the ICT budget record is also shared with the role that just acted on it.

This sharing is done through the custom API:

- datasource/service: `dga_WebApiForPortal`
- action: `grandaccess`

Payload pattern:

```ts
{
  actionName: 'grandaccess',
  tableName: 'dga_ict_budget',
  relatedId: ictBudgetId,
  targetId: teamId,
  fetchXml: 'read',
}
```

Team ids come from:

- `sessionStorage["moduleConfigTeamIDs"]`

Sharing rules:

- Respondent submits to Reviewer -> share with Respondent team
- Reviewer submits to Approver -> share with Reviewer team
- Reviewer raises clarification -> share with Reviewer team
- Approver approves -> share with Approver team
- Approver raises clarification -> share with Approver team
- Respondent first clarification reply handoff -> share with Respondent team

Important:

- `dga_webapiforportal` is a manual datasource entry in `.power/schemas/appschemas/dataSourcesInfo.ts`
- adding new datasources can remove it if that file is regenerated
- always verify this manual datasource still exists after `add-data-source` / `add-flow`

#### Debug Logging

Workflow assignment logs are emitted from both detail-form and queue flows, including:

- resolved `moduleConfigTeamIDs`
- chosen target owner
- final `ownerid@odata.bind`
- final Dataverse update payload

### Clarification Reply Rules

When a reply/comment is added:

- create another `dga_ict_clarification` record
- `dga_parent_clarificaiton@odata.bind` -> parent clarification
- `dga_record_type` -> `1` (`Comment`)
- `dga_scope` -> `2` (`Internal (Entity)`)
- `dga_response_date` -> current ISO datetime
- `dga_raised_by_systemuser@odata.bind` -> `sessionStorage["userID"]`
- if files are attached:
  - upload them into the ICT budget SharePoint folder
  - store uploaded SharePoint URL(s) in `dga_file_url`

After reply create:

- parent clarification is updated with `dga_response_date`
- if the replier is Respondent, parent `statuscode` becomes `776140002` (`Responded`)

### Clarification Close Rules

Whoever raised the clarification can close it by updating the parent record:

- `statuscode` -> `776140003` (`Closed`)
- `dga_response_date` -> current ISO datetime

### UI Wiring

Dynamic clarification UI is wired in:

- `src/pages/respondent/ProjectDetail.tsx`
- `src/pages/reviewer/ReviewQueue.tsx`
- `src/pages/approver/ApprovalQueue.tsx`
- `src/components/shared/ClarificationModal.tsx`
- `src/components/shared/ClarificationThread.tsx`

Current behavior:

- no Clarification Due Date field is used
- role tags are shown from `Raised By (Role)`
- threads and replies are loaded from `dga_ict_clarification`
- reviewer and approver queue actions create live Dataverse clarification records instead of local-only mock data
- clarification raised-file attachments and clarification reply attachments are both shown in the clarification thread
- Supporting Documents uses normalized clarification URLs so clarification tags can appear on both raised files and reply files
- the shared detail form keeps Supporting Documents and Clarification Thread aligned during the same session

---

## App Notifications

Notifications are now backed by the Dataverse table:

- `dga_app_notifications`

Generated datasource/service:

- `src/generated/models/Dga_app_notificationsesModel.ts`
- `src/generated/services/Dga_app_notificationsesService.ts`

Main wrapper:

- `src/services/appNotificationService.ts`

### Notification Create Rules

Whenever workflow hands work off to another role, the app creates a notification for the destination role team.

Notification payload shape:

```ts
{
  dga_notification_id: 'N-001',
  'dga_notification_recipient_team@odata.bind': `/teams(${teamId})`,
  dga_notification_text: notificationText,
  statuscode: 1,
}
```

Rules:

- `statuscode = 1` means `Open`
- notification id is generated in `N-001` to `N-999` format
- recipient team id comes from `sessionStorage["moduleConfigTeamIDs"]`
- text depends on the workflow action performed

Typical workflow cases:

- Respondent submits to Reviewer -> notify Reviewer team
- Reviewer submits to Approver -> notify Approver team
- Reviewer raises clarification -> notify Respondent team
- Approver raises clarification -> notify Respondent team
- Respondent first clarification reply -> notify Reviewer or Approver team depending on original raiser

### Notification Retrieval Rules

Header notifications are no longer dummy data.

Retrieval pattern:

- resolve current role
- map role to the matching team id from `sessionStorage["moduleConfigTeamIDs"]`
- retrieve only open notifications for that team
- sort by `createdon desc`

Only open notifications are shown in the dropdown.

### Notification Read / Close Rules

Single notification mark-as-read:

- update notification record:
  - `statuscode = 576610001`

Mark all as read:

- update all open notification ids to:
  - `statuscode = 576610001`

Only `Open` notifications remain visible in the header dropdown.

---

## Document Retrieval — Pending Implementation

### Current Runtime Pattern

Supporting Documents are retrieved through the custom API wrapper:

- service: `src/services/webApiForPortalService.ts`
- datasource key: `dga_webapiforportal`
- operation: `dga_WebApiForPortal`
- action name: `retrievemultiple`

Current retrieval pattern:

- target table in FetchXML: `sharepointdocument`
- filtered by the opened ICT budget through `regardingobjectid -> dga_ict_budgetid`

Returned rows are mapped into:

- `WebApiPortalDocument`

and rendered by:

- `src/components/shared/SupportingDocuments.tsx`

Clarification Thread renders files from:

- `dga_ict_clarification.dga_file_url`

To keep both views aligned in the shared detail form:

1. the app builds a normalized set of clarification URLs from:
   - clarification raised files
   - clarification reply files
2. the app normalizes SharePoint document URLs from custom API retrieval
3. the app merges clarification-only URLs into Supporting Documents as fallback entries when SharePoint retrieval does not return them

Result:

- clarification tag can show on both:
  - clarification raised file
  - clarification reply file
- Supporting Documents and Clarification Thread stay aligned during the same session
- clarification-linked files can still appear in Supporting Documents even if SharePoint retrieval is temporarily empty

### Historical Attempt And Why It Failed

We attempted to use the `sharepointdocument` Dataverse virtual entity:

```bash
npx power-apps add-data-source --api-id dataverse --resource-name sharepointdocument --org-url https://dge.api.crm15.dynamics.com
```

This generated `SharepointdocumentsService` and `SharepointdocumentsModel`, but querying it returned:

```
error code 0x8006073b: SharePoint S2S and MSTeams integration is not enabled for this entity
```

**Root cause:** The `sharepointdocument` virtual entity only works when SharePoint Document Management is explicitly enabled for the specific Dataverse entity (`dga_ict_budget`) in Dataverse admin settings. It is not a general-purpose file query endpoint.

This data source and generated files were **removed**. The `sharepointdocument` approach is not viable without admin-level Dataverse → SharePoint integration configuration per entity.

### Correct Approach (To Be Implemented)

Create a dedicated Power Automate flow that:
1. Accepts a `recordId` input
2. Queries the SharePoint folder at path `/<recordId>/`
3. Returns a JSON list of files (name, type, url, size, modified date)

Then:
1. Add it to the Code App: `npx power-apps add-flow --flow-id <newFlowId>`
2. Create `src/services/fileRetrievalService.ts` calling the generated service
3. Wire into the View mode documents section in `ProjectDetail.tsx`

The view mode documents section currently shows a "coming soon" placeholder at `sec-documents`.

### How instanceID Is Used In ICT Budget Create

When creating a new ICT budget draft (`src/services/ictBudgetDraftService.ts`), the payload includes:

```typescript
'dga_ict_budget_instance@odata.bind': `/dga_ict_budget_instances(${instanceId})`
dga_abbr_of_entity: entityAbbr  // from instanceDetail.abbr (dga_entity_abbr)
```

These fields link the new budget to the correct instance and stamp the entity abbreviation.
