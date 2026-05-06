# ICT Budgeting App - Architecture, Product & Design Guide

## 1. Overview
ICT Budgeting is a role-based budgeting workflow app for government budget submission, review, and approval.

The app supports three personas:
- Respondent: creates, edits, submits, and tracks budget projects.
- Reviewer: reviews submitted projects, raises clarification, and forwards reviewed items.
- Approver: performs final approval, raises clarification, and submits approved items onward to DGE.

The app currently runs on mock data and is structured for future Dataverse integration through service and API adapter layers.

## 2. Current Role Workflows

### Respondent
- Primary pages:
  - Dashboard
  - My Projects
  - New Project
  - Project Detail / Review form
- Core actions:
  - Start a new project manually or with AI assistance.
  - Save draft.
  - Submit to reviewer.
  - Respond to clarification.
  - Track submitted, draft, approved, and clarification-required projects.

### Reviewer
- Primary pages:
  - Dashboard
  - Review Queue
  - Projects
  - Project Detail / Review form
- Core actions:
  - Review submitted projects.
  - Select single or multiple queue items.
  - Approve or raise clarification for one or many projects.
  - Submit reviewed projects to approver.
  - Use AI-assisted summaries and risk cues while reviewing.

### Approver
- Primary pages:
  - Dashboard
  - Approver Queue
  - Project Detail / Review form
- Core actions:
  - Review final-stage projects.
  - Select single or multiple queue items.
  - Approve and submit to DGE.
  - Raise clarification for one or many projects.
  - Use AI-assisted portfolio, risk, and readiness cues.

## 3. Routing & Layout
- Main shell uses `AppLayout`.
- Role pages live under:
  - `src/pages/respondent`
  - `src/pages/reviewer`
  - `src/pages/approver`
- Shared layout components live under:
  - `src/components/layout`
  - `src/components/shared`
  - `src/components/ui`
- The project detail/review experience is route-aware and is reused across respondent, reviewer, and approver contexts.

## 4. Design Direction

### Product Feel
- Government-grade, calm, professional, and modern.
- Decent visual polish over heavy decoration.
- Blue is the main trust and action color.
- Gradients are used sparingly and intentionally.
- Interactive states should feel clear but not flashy.
- Layouts should remain highly readable for dense budget and approval workflows.

### Visual Principles
- Use strong hierarchy through spacing, card grouping, typography, and status badges.
- Prefer white or near-white surfaces with subtle blue borders.
- Use soft shadows to separate important sections.
- Use gradients mainly for AI/Copilot surfaces, hero accents, and selected action moments.
- Avoid overusing purple or decorative gradients on government workflow surfaces.
- Keep labels in Title Case, not all caps.
- Keep table and card view treatments separate.

## 5. Color System

### Primary Blue Palette
- `#286CFF`: primary action, selected state, active tab, AI accent icon.
- `#4F98FF`: secondary blue for gradient endpoints and highlights.
- `#81C1FF`: supporting blue.
- `#B0DBFF`: soft blue border.
- `#E7F5FF`: AI/chat and selected-state background.
- `#DDEBFF`: section/card border.
- `#F8FBFF`: subtle panel background.
- `#0F172A`: main text.
- `#475569`: secondary text.
- `#64748B`: muted labels.

### Status Colors
- Green: approved, ready, success, reviewer-cleared states.
- Amber: pending review, attention, deadline, moderate risk.
- Red: high risk, blocker, clarification urgency.
- Blue: primary workflow action and AI-assisted informational states.

### AI Components
- AI components now use the same blue family as the Copilot chat.
- Recommended AI surface:
  - `bg-gradient-to-b from-[#E7F5FF] to-white`
  - `border border-[#B0DBFF]`
  - blue icon chip using `from-[#286CFF] to-[#4F98FF]`
- Avoid purple AI containers unless specifically required by a future design direction.

## 6. Component Design Patterns

### Cards
- Use `rounded-2xl` or larger radius for modern government cards.
- Use subtle borders:
  - `border-[#DDEBFF]` for standard cards.
  - `border-[#B0DBFF]` for AI or highlighted cards.
- Use soft shadows:
  - `shadow-[0_10px_26px_rgba(15,23,42,0.05)]`
  - `shadow-[0_12px_30px_rgba(15,23,42,0.06)]`
- Add hover feedback on interactive cards:
  - slight lift with `hover:-translate-y-0.5`
  - blue border on hover
  - slightly stronger blue-tinted shadow.

### Tables vs Cards
- Table view keeps its bordered white parent container.
- Card view must remain transparent at the parent level with no extra border, background, or padding.
- Card grids should handle spacing through `gap`, not parent padding.
- Do not remove table wrappers when changing card view design.

### Tabs & Filters
- Tabs should be pill-like, consistent, and easy to scan.
- Active tabs use primary blue with white text.
- Inactive tabs use white or muted backgrounds with blue hover state.
- Count badges should be small, rounded, and visually tied to the tab.
- Filters should use rounded inputs/selects with soft blue borders.

### Selection Controls
- Reviewer and approver queues support single and bulk selection.
- Use custom circular selection controls instead of default browser checkboxes.
- Selected state:
  - blue gradient fill
  - white check icon
  - blue ring or selected card border.
- Selection controls must be aligned with the card header and should not crowd text.

### Buttons
- Primary actions use blue fill and rounded corners.
- Destructive or risk actions use red/amber only when the action semantics require it.
- Secondary actions use outline buttons with blue hover state.
- Queue bulk action buttons are disabled until at least one item is selected.
- Approver final action text should remain consistent as `Approve & Submit to DGE`.

### Modals
- Clarification modal uses a clean, government-grade card surface.
- Header chips must not overlap the close button.
- Right-aligned metadata chips should wrap under the header on narrow widths.
- Labels inside modal content use Title Case.

### Toggles
- Manual/AI mode toggle uses a compact pill track with internal padding.
- The active knob must never touch the container edge.
- Keep thumb movement within the track with visible spacing on both sides.
- EN/AR language toggle active state must fully cover its parent segment and align vertically.

## 7. Dashboard Patterns

### Respondent Dashboard
- Hero/header content stays left aligned.
- `Start New Project` action sits on the right side and vertically centered on desktop.
- On mobile, the action stacks naturally below the text.
- Dashboard cards use clean white surfaces, subtle blue borders, and meaningful icon chips.

### Reviewer Dashboard
- Reviewer dashboard uses risk, clarification, review queue, and AI readiness summaries.
- Cards should provide quick decision cues without overwhelming the page.
- AI summaries should use blue-tinted assistant styling.

### Approver Dashboard
- Approver dashboard emphasizes portfolio readiness, approval blockers, DGE submission progress, and AI risk summaries.
- Large hero and summary panels can use restrained gradients.
- Avoid decorative excess; keep the final approval workflow clear.

## 8. New Project Form Patterns

### Form Structure
- The form uses clear visual grouping with elevated section cards.
- Section icons are large enough to represent the section.
- Numeric section counts are intentionally removed.
- Labels must be Title Case.
- Final submit/action bar appears after all form sections, not sticky.

### Responsiveness
- Header, toggle, form grid, and action areas must stack cleanly on mobile.
- Use responsive grids for fields.
- Avoid fixed widths that overflow on small screens.
- Keep action controls reachable after the user finishes the form.

### Copilot Chat
- Copilot chat width should align with the Create New Project header/form content width.
- Chat uses a vertical blue-to-white gradient:
  - blue presence is stronger at the top.
  - background becomes lighter toward the bottom.
- Header uses blue assistant icon treatment.
- Assistant bubbles use white surfaces with subtle borders and rounded corners.
- Input area stays at the bottom inside the chat panel.
- Chat should feel like an AI assistant but still fit a government-grade site.

## 9. Review Form Patterns

### Layout
- Review form follows the same visual language as the New Project form.
- Main review content uses decent section cards, clear labels, and good spacing.
- Right side includes AI components for review support.
- AI components use blue Copilot-inspired styling.

### Interaction
- Review fields and summaries should be readable first, interactive second.
- Clarification actions should be prominent but not visually aggressive.
- AI suggestions are supporting signals, not final decisions.

## 10. Queue Patterns

### Reviewer Queue
- Queue cards are the primary interaction surface.
- Cards support hover lift, selected state, and inline actions.
- Bulk selection is available for reviewer actions.
- Bulk clarification is supported.
- Filters, tabs, stats, and AI summary areas follow the same blue government scheme.

### Approver Queue
- Queue cards support single and bulk selection.
- Bulk approve action uses `Approve & Submit to DGE`.
- Single and bulk clarification are supported.
- Cards show risk, reviewer-approved state, budget, AI confidence, and expandable AI insight.
- Hover and selected states should match reviewer queue behavior.

## 11. Header, Sidebar & Global Controls

### Sidebar
- Sidebar remains role-aware.
- Active navigation item uses strong blue state.
- Badge counts should remain compact and readable.

### Header
- Includes theme toggle, EN/AR language toggle, notifications, profile, and role switch.
- Language toggle active state must fill the segment cleanly.
- Notification dropdown should use readable contrast in both themes.

### Theme Support
- Components use dark mode utility classes.
- Dark mode should preserve contrast and not flatten card boundaries.
- Blue remains the main accent in both light and dark themes.

## 12. Typography & Content

### Labels
- Form and review labels use Title Case.
- Avoid all-uppercase labels for regular UI fields.
- Reserve uppercase only for tiny metadata where intentional and readable.

### Currency
- Currency uses the Dirham icon and formatted numbers through shared components.
- Shared components:
  - `DirhamIcon`
  - `CurrencyAmount`

### Tone
- UI copy should be clear, direct, and workflow-oriented.
- AI copy should be helpful and advisory, not overconfident.

## 13. Data & Integration Architecture

The app follows a layered structure to support Dataverse without rewriting UI pages.

### Layers
- Domain models: `src/domain`
- API contracts: `src/api`
- Dataverse adapter placeholder: `src/api/dataverse`
- Mock adapter: `src/mocks`
- Provider and service orchestration: `src/services`
- Reusable hooks: `src/hooks`

### Current Data Source
- Active source: mock.
- Existing dummy dataset remains in `src/data/db.ts`.
- Mock API adapter maps that dataset to service contracts.

### Future Dataverse Plan
- Implement methods in `src/api/dataverse/dataverseProjectsApi.ts`.
- Switch source in `src/config.ts` from `mock` to `dataverse`.
- UI pages should consume service layer instead of direct `db.ts` access where possible.

## 14. File Structure Snapshot

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

## 15. Development Notes

### Build & Typecheck
- Use `npm run build` for production verification.
- Use `npx tsc -b` for type checking only.
- Use `npm run dev` for local development.

### Translation in Local Dev
- Browser translation calls are routed through local `/api/translate` middleware in `vite.config.ts`.
- If translation fails, English is preserved as fallback.

### Power Apps
- Power Apps config lives in `power.config.json`.
- Push command is `npx power-apps push`.

## 16. Team Instructions
- Keep business logic in `services`.
- Keep backend calling details inside API adapters.
- Keep UI components presentation-only where possible.
- Preserve table and card view behavior separately.
- Preserve the blue government design language for future screens.
- Use AI gradients only where they reinforce assistant context.
- Keep forms, queues, and review screens responsive by default.
- For Dataverse rollout, replace adapter implementation behind the interface before changing page behavior.

## 17. Status Summary
- Role-based navigation and screens: implemented.
- Dashboard redesigns: implemented.
- New Project form redesign: implemented.
- Review form redesign: implemented.
- Reviewer and Approver queue redesigns: implemented.
- Project card redesigns: implemented.
- Single and bulk queue selection: implemented.
- Clarification modal refinements: implemented.
- EN/AR toggle active-state fix: implemented.
- Mock-first architecture for Dataverse migration: implemented.
- Full page wiring to service layer: partially complete.
