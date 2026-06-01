# AI Component Theme

This document is the source of truth for AI styling across dashboards, project screens, create flows, and edit/view forms.
It reflects the current design language now used in:

- `AI Portfolio Summary`
- `Budget Overview`
- `AI Document Analyzer`
- manual-create AI panels
- right-rail AI cards such as `Suggested Project Fields`, `Budget Lines`, `Account Code Suggestion`, and `Summary`

---

## Core Rules

- Purple is the AI language. Blue belongs to standard product UI.
- Expandable AI components use a white outer shell.
- Only the first header/button row gets the gradient.
- Expanded AI content stays white.
- AI child cards stay mostly white and clean.
- Use soft purple tint only for emphasized AI information, not for every row.
- For AI-first headings, prefer `Sparkles`.
- AI icons are usually bare icons. Avoid decorative icon circles unless a component already intentionally uses one.
- Do not let gradient fill the full expanded height of an accordion surface.

---

## Primary AI Tokens

| Token | Value | Usage |
|---|---|---|
| AI primary | `#A855F7` | AI icons, titles, emphasis, primary AI actions |
| AI primary hover | `#9333EA` | Hover state for purple buttons |
| AI primary active | `#7E22CE` | Active purple button state |
| AI accent | `#C084FC` | Secondary accent, lighter AI emphasis |
| AI border | `#E9D5FF` | Main AI border |
| AI border soft | `#F0D9FF` | Inner separators, softer borders |
| AI tint border | `#A855F726` | Emphasized AI row border |
| AI tint background | `#FDF8FF` | Emphasized AI background |
| AI gradient start | `#FDF7FF` | Top of AI accordion header gradient |
| AI gradient end | `#FFFFFF` | Bottom of AI accordion header gradient |
| AI shell background | `#FFFFFF` | Default outer shell background |
| AI heading text | `#0F172A` | Main heading text on light surfaces |
| AI body text | `#475569` | Body text |
| AI muted text | `#64748B` | Secondary labels and metadata |
| AI dark shell | `#1E293B` | Outer dark shell |
| AI dark gradient start | `#2A123D` | Dark gradient top |
| AI dark gradient end | `#1E293B` | Dark gradient bottom |
| AI dark text | `#E9D5FF` | Purple-tinted AI text in dark mode |

---

## Expandable AI Shell

Use this for accordion, collapse/expand, or revealable AI components such as:

- `AI Portfolio Summary`
- `Budget Overview`
- `AI Document Analyzer`
- AI recommendation accordions

Outer shell:

```tsx
className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]"
```

Header/button row:

```tsx
className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
```

Rules:

- Outer shell stays white.
- Gradient is applied only to the first row.
- Expanded area remains white.
- Do not stretch the gradient through the full expanded body.
- In dark mode, keep the same pattern: dark shell body, dark gradient only on the first row.

---

## Static AI Parent Surface

Use this only for non-expandable AI panels that intentionally need a full AI background treatment.

```tsx
className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
```

Rules:

- Use sparingly.
- Prefer the expandable-shell pattern first.
- Do not use this as the default for accordion bodies.

---

## AI Section Header

Use a consistent AI heading pattern across AI sections.

```tsx
<div className="flex items-start gap-3">
  <div className="mt-1 shrink-0 text-[#A855F7]">
    <Sparkles className="h-5 w-5" />
  </div>
  <div>
    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Section Title</h3>
    <p className="mt-0.5 text-sm text-[#475569] dark:text-slate-300">Section description</p>
  </div>
</div>
```

Rules:

- Prefer `Sparkles` for AI section titles.
- Icon color should be `#A855F7`.
- Main title may use `font-bold`.
- Subheadings inside the component should usually use `font-semibold`, not `font-bold`.

---

## AI Child Card

Use for individual AI cards inside a white AI parent.

```tsx
className="rounded-2xl border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]"
```

Rules:

- Child cards stay white.
- No gradient on child cards.
- Keep shadows minimal or remove them if the layout already feels dense.
- Avoid heavy purple glow shadows.

---

## Standard AI Emphasis Block

Use for important AI content inside a white card.

```tsx
className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5"
```

Use on:

- highlighted AI summaries
- key evidence notes
- emphasized recommendation text
- important AI surfaced details

Rules:

- Use only when content needs emphasis.
- Do not tint every row in a card.

---

## AI Right-Rail Cards

This applies to the edit/view right-side AI cards:

- `Suggested Project Fields`
- `Budget Lines`
- `Account Code Suggestion`
- `Summary`

Outer card:

```tsx
className="rounded-2xl border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]"
```

Inner highlighted panel pattern currently used in these cards:

```tsx
className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5"
```

Rules:

- These cards are still AI cards, but their inner surface is allowed to use the lighter blue-white content treatment now used in the right rail.
- Header icon for these cards should always be `Sparkles`.
- Header icon color should be `#A855F7`.
- Keep the outer card aligned with the shared project-side card language.
- Use the same card rhythm as `Project Creation Details`, but differentiate AI cards with the AI border language.

---

## AI Child Card Header

For right-rail and internal AI cards:

```tsx
<div className="mb-3 flex items-center justify-between gap-3">
  <div className="flex items-center gap-2.5">
    <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Card Title</p>
  </div>
</div>
```

Rules:

- Use `Sparkles` consistently for AI card headings.
- Heading text should be black/white, not purple.
- Purple should be used for icon and selective emphasis, not for every title.

---

## AI Portfolio Summary

Current design rules:

- Uses the expandable AI shell pattern.
- White outer section.
- Gradient only on the accordion button/header.
- Expanded body stays white.
- On dashboards, use clean sections for:
  - `AI Review Flags`
  - `Recommended Actions`
  - charts
- Avoid too many nested bordered child cards in the expanded summary.

Project-screen variant:

- Uses tabbed content.
- Current tabs:
  - `AI Review Flag`
  - `Recommended Action`
  - `DGE Budget Consideration`
- Footer CTA label:
  - `View Full AI Portfolio Summary`
- Footer CTA area should not use a top border.

Project-screen DGE Budget Consideration rules:

- Always show all 3 types:
  - `Coordination Required`
  - `Allowed With Conditions`
  - `Potential Conflict`
- Present these in separate white cards.
- Show count, short explanation, and relevant project IDs.

---

## Budget Overview

Current design rules:

- Uses the expandable AI shell pattern.
- `Budget Overview` is the main heading.
- Subheadings such as `Respondent View`, `Approver View`, `AI Budget Consideration`, and `File Evidence Scores` should be calmer and lighter than the main heading.
- Expanded content is white.
- Metric cards such as:
  - `Document Evidence`
  - `Project Fields`
  - `Budget Account`
  - `Strategic Fit`
  should be white and low-noise.
- Avoid unnecessary shadows on these inner metric cards.

AI Budget Consideration in Budget Overview:

- Heading should be simple, no boxed heading treatment.
- Policy cards should stay white.
- Policy cards should not use shadow.
- Probability can be shown as a compact circular progress treatment.
- Match-type labels must use full wording:
  - `Coordination Required`
  - `Allowed With Conditions`
  - `Potential Conflict`

---

## AI Recommendation Accordion

Applies to strategic-priority and classification recommendation sections in edit/view.

Rules:

- Uses the white-shell plus gradient-header pattern.
- Expanded body remains white.
- Option cards should not use heavy shadow.
- `Rank` labels should be black, not muted gray.
- Border radius should stay consistent with surrounding cards.

---

## AI Document Analyzer

Use the same shell rule:

- white outer container
- gradient only on first row
- white expanded body

Rules:

- Major information rows may use the soft purple emphasis tint.
- Do not mix blue info rows inside the core AI analyzer content.
- Important document findings can use emphasized tint blocks.
- Default content areas should remain white.

---

## Loading State

Use this for AI loading rows:

```tsx
className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF8FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
```

Rules:

- Use purple text.
- Use soft purple tint.
- Dashed border is acceptable for active AI processing.

---

## Empty State

Use this pattern for empty AI areas:

```tsx
className="flex items-start gap-3 rounded-2xl border border-dashed border-[#A855F726] bg-[#FDF8FF] px-4 py-5 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
```

Rules:

- Keep it visually inside the AI language.
- Use tint lightly.
- Keep icon treatment simple.

---

## Buttons In AI Components

Primary AI action:

```tsx
className="bg-[#A855F7] text-white hover:bg-[#9333EA] active:bg-[#7E22CE]"
```

Secondary AI action:

```tsx
className="border border-[#E9D5FF] bg-white text-[#A855F7] hover:bg-[#FDF8FF]"
```

Project-screen footer CTA pattern:

```tsx
className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-3 text-sm font-semibold text-[#A855F7] shadow-sm transition-colors hover:border-[#C084FC] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF] dark:hover:bg-white/10"
```

Rules:

- Purple actions are AI actions.
- Blue actions remain product actions.
- Avoid mixing blue emphasis into AI-primary CTA styling.

---

## What To Avoid

- Full-height gradient backgrounds inside expanded accordion bodies
- Blue highlight rows inside core AI components unless the card pattern explicitly uses the right-rail light blue content style
- Heavy AI child-card shadows
- Too many nested child cards inside one AI component
- Purple title text on every inner card heading
- Random semantic colors across AI chrome that break the palette
- Repeating the same AI summary text in multiple places inside the same component

---

## Current Reference Files

- Dashboard and project AI portfolio summary: [src/components/shared/AiPortfolioSummary.tsx](src/components/shared/AiPortfolioSummary.tsx)
- Edit/view form AI surfaces: [src/pages/respondent/ProjectDetail.tsx](src/pages/respondent/ProjectDetail.tsx)
- Manual create AI surfaces: [src/pages/respondent/NewProject.tsx](src/pages/respondent/NewProject.tsx)
- Supporting document analyzer: [src/components/shared/SupportingDocumentAiInsights.tsx](src/components/shared/SupportingDocumentAiInsights.tsx)
- File upload entry surface: [src/components/shared/FileUploadDropzone.tsx](src/components/shared/FileUploadDropzone.tsx)

Use these as the live implementation references when extending or refining AI UI.
