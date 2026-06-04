# Relationship Query Guide

This guide explains how we handle related tables in the Code App when one table has a one-to-many relationship with another table.

It covers:
- how to add the data sources
- how to retrieve parent and child records
- when to use relationship tables
- when to use `expand`
- how we usually stitch related data together in code

## 1. Basic Example

Imagine two tables:

- `Table 1` = parent table
- `Table 2` = child table

Example relationship:
- one `Table 1` record can have many `Table 2` records
- each `Table 2` record belongs to one `Table 1` record

This is the most common pattern we use in the app.

## 2. Adding The Data Source

If the table is used in the app, it must be added to the Power Apps Code App as a datasource.

Command pattern:

```bash
npx power-apps add-data-source --api-id dataverse --resource-name <logical-table-name> --org-url "https://<org>.crm15.dynamics.com"
```

### Example

If `Table 2` is a Dataverse table named `dga_child_items`, we would add it like this:

```bash
npx power-apps add-data-source --api-id dataverse --resource-name dga_child_items --org-url "https://dge.crm15.dynamics.com"
```

After that, Power Apps generates:
- schema metadata in `.power/schemas/dataverse/`
- generated model in `src/generated/models/`
- generated service in `src/generated/services/`

## 3. What The Generated Service Gives Us

Once the datasource is added, we use the generated service instead of raw fetch calls.

Generated service example:
- `src/generated/services/Dga_child_itemsService.ts`

Typical methods available:
- `getAll(...)`
- `get(...)`
- `create(...)`
- `update(...)`
- `delete(...)`
- `execute(...)`

So the normal pattern is:

```ts
await Dga_child_itemsService.getAll({
  select: ['field1', 'field2'],
  filter: '_dga_parent_value eq <parentId>',
})
```

## 4. Retrieving One-To-Many Data

For one-to-many relationships, we usually do **not** rely on one giant `expand` query everywhere.

Instead, the normal pattern is:
1. load the parent record
2. load the child records using a filter on the parent lookup id
3. map the child rows into the UI shape

### Example Pattern

Parent table:
- `Table 1`

Child table:
- `Table 2`

If `Table 2` has a lookup column like `_dga_table1_value`, we retrieve child rows like this:

```ts
const children = await Dga_child_itemsService.getAll({
  select: ['dga_child_itemid', 'dga_name', '_dga_table1_value'],
  filter: `_dga_table1_value eq ${parentId}`,
})
```

Then we use those rows in the UI.

## 5. When To Use `expand`

Use `expand` only when:
- the generated service supports it cleanly
- the relationship is simple enough
- the data is truly just a related lookup you want in one call

In this app, we usually prefer:
- separate retrieval calls
- direct filtering by lookup id
- code-side grouping/mapping

That approach has been more reliable in the Code App runtime.

## 6. Common Relationship Patterns We Use

### A. Parent + Child Table

Used when the child table stores a lookup back to the parent.

Example flow:
- add both tables as datasources
- retrieve the parent record
- retrieve child rows with a filter on the parent id
- display them together

### B. Intersect / Relationship Table

Used for many-to-many relationships.

Example:
- ICT Budget ↔ Technology Product
- relationship table:
  - `dga_ict_budget_dga_technology_product`

Pattern:
- add the relationship table as a datasource
- use the generated relationship-table service
- create rows in the relationship table to associate records
- query the relationship table to restore selected values

### C. Relationship Grouping In Code

Used when the UI needs nested data.

Example:
- Clarification record
- Clarification reply rows

Pattern:
- retrieve all clarification rows for a budget
- group replies by `dga_parent_clarificaiton`
- map them into a nested clarification thread

## 7. Real App Examples

### Team Hover

Team hover loads related records in separate steps:

1. `TeamsService.getAll(...)`
2. `TeammembershipsService.getAll(...)`
3. `SystemusersService.get(...)` for each member

This is not one expand query.

Files:
- `src/components/shared/TeamHoverCard.tsx`
- `src/services/userContextService.ts`

### Clarifications

Clarifications are retrieved from:
- `Dga_ict_clarificationsService`

Pattern:
- query clarifications by budget id
- group replies under their parent clarification
- render the nested thread in the UI

Files:
- `src/services/clarificationService.ts`
- `src/components/shared/ClarificationThread.tsx`
- `src/pages/respondent/ProjectDetail.tsx`

### Technology Products

Budget ↔ Technology Product uses a relationship table:
- `Dga_ict_budget_dga_technology_productsetService`

Pattern:
- query by budget id to restore selected products
- create/disassociate rows when the selection changes

Files:
- `src/services/webApiForPortalService.ts`
- `src/services/ictBudgetDraftService.ts`
- `src/pages/respondent/ProjectDetail.tsx`
- `src/pages/respondent/NewProject.tsx`

## 8. Recommended Implementation Steps For A New One-To-Many Case

If we get a new pair of tables:
- `Table 1` = parent
- `Table 2` = child

Do this:

1. Add `Table 1` and `Table 2` to the Code App as datasources.
2. Let Power Apps generate the typed models/services.
3. Create a service wrapper in `src/services/` if you want cleaner app logic.
4. Retrieve the parent with `GeneratedService.get(...)`.
5. Retrieve the children with `GeneratedService.getAll({ filter: ... })`.
6. Group or map the child rows in code.
7. Pass the final shaped data to the UI component.

## 9. Recommended Retrieval Pattern

Preferred:

```ts
const parent = await ParentService.get(parentId, { select: ['...'] })
const children = await ChildService.getAll({
  select: ['...'],
  filter: `_dga_parent_value eq ${parentId}`,
})
```

Then:

```ts
return {
  ...parent.data,
  children: children.data ?? [],
}
```

This keeps the app predictable and avoids depending too much on complex nested `expand` queries.

## 10. Summary

In this app, relationship handling usually means:
- add the related table(s) as Power Apps datasources
- use generated Dataverse services
- retrieve parent and child records separately
- join them in app code
- use relationship/intersect tables directly for many-to-many links

That is the pattern we currently follow across:
- team/user hover
- clarifications
- technology products
- budget line items
- portfolio and AI summary relationships

