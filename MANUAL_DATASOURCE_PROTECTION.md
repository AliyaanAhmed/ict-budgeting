# Manual Data Source Protection

When adding a new Power Automate flow or Dataverse data source to this Code App, do not assume `.power/schemas/appschemas/dataSourcesInfo.ts` is safe.

## Why this matters

Commands like:

- `npx power-apps add-flow --flow-id <flow-id>`
- `npx power-apps add-data-source --api-id dataverse --resource-name <table>`

can regenerate `.power/schemas/appschemas/dataSourcesInfo.ts` and silently remove datasource entries that were added manually.

## Current manual entries that must be preserved

These entries are not guaranteed to survive regeneration and must be checked after every new flow or datasource add:

- `dga_customwebapi`
  - used by existing AI services such as Strategic Suggestion and ICT Budget Considerations
- `dga_webapiforportal`
  - used by SharePoint document retrieval, relationship associate/disassociate, and sharing flows

## Required post-add checklist

After adding any new flow or datasource:

1. Open `.power/schemas/appschemas/dataSourcesInfo.ts`
2. Verify the new generated entry exists
3. Verify these manual entries still exist:
   - `dga_customwebapi`
   - `dga_webapiforportal`
4. If either manual entry is missing, restore it before continuing
5. Run `npm run build`

## Important note for flow updates

If a flow input/output shape changes:

1. Refresh the generated flow files if needed
2. Re-check `.power/schemas/appschemas/dataSourcesInfo.ts`
3. Re-apply any removed manual datasource entries

## Safe rule

Whenever a new flow or datasource is added:

- add the new generated entry
- keep all manually added datasource entries
- never replace manual entries just because the generator rewrote the file
