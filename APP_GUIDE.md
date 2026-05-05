# ICT Budgeting App - Architecture & Product Guide

## 1. Overview
ICT Budgeting is a role-based budgeting workflow app with three user personas:
- Respondent: creates and submits budget projects
- Reviewer: reviews submissions and can approve or raise clarification
- Approver: final approver before DGE submission; can approve or raise clarification

The project currently runs on dummy/mock data but is now structured for future Dataverse integration.

## 2. Current Role Workflows

### Respondent
- Primary pages:
  - Dashboard
  - Projects list
  - New Project form
  - Project Detail / Review form (editable when applicable)
- Core actions:
  - Create project
  - Save draft
  - Submit to reviewer
  - Respond to clarification

### Reviewer
- Primary pages:
  - Dashboard
  - Review Queue
  - Projects
  - Project Detail / Review form
- Core actions:
  - Open project for review
  - Mark reviewed / approve (workflow action)
  - Raise clarification
  - Submit reviewed project to approver

### Approver
- Primary pages:
  - Dashboard
  - Approval Queue
  - Project Detail / Review form
- Core actions:
  - Open project for final review
  - Approve
  - Raise clarification
  - Submit onward to DGE (future integration)

## 3. Routing & Layout
- Main app shell uses `AppLayout`.
- Role pages are under:
  - `src/pages/respondent`
  - `src/pages/reviewer`
  - `src/pages/approver`
- Shared project form/detail view is reused across role routes.

## 4. UI/UX System

### Visual Direction
- Government-grade, modern, responsive, high-clarity interface.
- Sidebar + fixed header layout.
- Role switch dropdown in header.
- Form and queue-heavy experience with clear status, risk, and action controls.

### Sidebar Behavior
- Collapse/expand behavior tied to logo interaction.
- Active item uses strong blue state.

### Header Behavior
- Includes:
  - Theme toggle (light/dark)
  - Language toggle (EN/AR)
  - Notifications dropdown
  - Profile + role switch

## 5. Color Scheme

### Primary (App Theme)
- `#286CFF`
- `#4F98FF`
- `#81C1FF`
- `#B0DBFF`
- `#FFFFFF`

### AI Components Theme
- `#D946EF`
- `#E879F9`
- `#F0ABFC`
- `#F5D0FE`

### Rules in current implementation
- Blue palette is primary app language.
- Purple palette is reserved for AI-specific containers/headings/icons.
- AI portfolio-like surfaces use light purple backgrounds per UX requests.

## 6. Toggles & Modes

### Dark/Light Mode
- Managed in `AppLayout` using `dark` class on document root.
- Components use theme-aware utility classes and CSS variables.

### EN/AR Toggle
- AR toggle does two things:
  - switches direction `ltr/rtl`
  - translates page text dynamically
- Translation is implemented through local dev endpoint `/api/translate` to avoid browser CORS issues.
- If translation fails, English is preserved as fallback.

### Role Toggle
- Role switch in header updates app context and navigates to role dashboard.

## 7. Data & Integration Architecture (Important)

The app now follows a layered structure to support future Dataverse without rewriting UI pages.

### Layers
- Domain models: `src/domain`
- API contracts: `src/api`
- Dataverse adapter placeholder: `src/api/dataverse`
- Mock adapter (active now): `src/mocks`
- Provider + service orchestration: `src/services`
- Reusable hooks: `src/hooks`

### Current Data Source
- Active source: `mock`
- Existing dummy dataset remains in `src/data/db.ts`
- Mock API adapter maps that dataset to service contracts.

### Future Dataverse Plan
- Implement methods in `src/api/dataverse/dataverseProjectsApi.ts`
- Switch source in `src/config.ts` from `mock` to `dataverse`
- UI pages should consume service layer instead of direct `db.ts` for seamless migration.

## 8. File Structure Snapshot

```text
src/
  api/
    dataverse/
      dataverseProjectsApi.ts
    httpClient.ts
    projectsApi.ts
  assets/
  components/
    charts/
    layout/
    shared/
    ui/
  config.ts
  context/
    RoleContext.tsx
  data/
    db.ts
  domain/
    types.ts
  hooks/
    useRoleProjects.ts
  lib/
    pageTranslator.ts
    utils.ts
  mocks/
    mockProjectsApi.ts
  pages/
    approver/
    respondent/
    reviewer/
  services/
    projectService.ts
    projectsApiProvider.ts
  App.tsx
  index.css
  main.tsx
vite.config.ts
```

## 9. Project Process (Current)

### Project Listing
- Respondent and Reviewer use similar project list UI.
- Filters and status tabs differ by role logic.
- Service layer has role-specific status filter helper.

### Create Form
- Current: UI-only / dummy flow.
- Planned:
  - retrieve lookup data via API
  - submit project via create API

### Review Form
- Current: reads from dummy project data.
- Planned:
  - retrieve project details by id
  - run action APIs (approve/clarification/submit)

### Queue Actions
- Reviewer queue and Approver queue both expose action buttons.
- Planned to trigger execute/action APIs.

## 10. Typography & Currency

### Typography
- Previous monospace-heavy currency presentation was removed for cleaner prominence.

### Currency
- `AED` text replaced with Dirham icon + formatted number via reusable component.
- Shared components:
  - `DirhamIcon`
  - `CurrencyAmount`

## 11. Notification Dropdown
- Unread/active styling refined for proper contrast in both light and dark.
- Avoids harsh blue block with low-contrast text.

## 12. Development Notes

### Build & Typecheck
- Use:
  - `npx tsc -b`
  - `npm run dev`

### Translation in Local Dev
- Browser no longer calls public translators directly.
- Uses local `/api/translate` middleware in `vite.config.ts`.

### Recommended Next Refactor Step
- Complete migration of all pages to `projectService` methods.
- Remove direct page-level dependency on `src/data/db.ts` in UI pages.

## 13. Team Instructions
- Keep business logic in `services` layer.
- Keep backend calling details inside API adapters.
- Keep UI components presentation-only where possible.
- For Dataverse rollout, do not change page behavior first; replace adapter implementation behind interface.

## 14. Status Summary
- UI redesign and theming: implemented
- Role-based navigation and screens: implemented
- Translation toggle behavior: implemented
- Mock-first architecture for Dataverse migration: implemented
- Full page wiring to service layer: partially complete (foundation ready)

15. Deployment:
What I did:

Built your app (dist)
Initialized Power Apps code config (power.config.json)
Pushed to your DGE environment with pac code push
Received live play URL
