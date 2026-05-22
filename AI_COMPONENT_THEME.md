# AI Component Theme

This document is the source of truth for AI styling across the create flow.
It covers the manual create form AI panels, the Budget Assistant workspace, and the supporting-document analyzer surfaces.

---

## Core Rules

- Purple is the AI language. Blue belongs to standard product UI.
- Gradients live on AI parent containers, not on child cards.
- AI section and card icons are bare icons only. No icon circles, no icon boxes, no tinted icon backgrounds.
- When a section is explicitly AI-first, prefer `Sparkles` for the heading icon.
- Child cards stay clean and mostly white.
- Tinted AI backgrounds are reserved for important information, highlighted summaries, loading states, and emphasized recommendation blocks.
- When highlighting important AI information, use the soft purple tint system, not blue.

---

## Primary AI Tokens

| Token | Value | Usage |
|---|---|---|
| AI primary | `#A855F7` | Titles, icons, key values, AI actions |
| AI primary hover | `#9333EA` | Hover state for purple AI buttons |
| AI primary active | `#7E22CE` | Active state for purple AI buttons |
| AI accent | `#C084FC` | Decorative accent, secondary sparkles, arrows |
| AI border | `#E9D5FF` | Parent card borders, child card borders |
| AI border soft | `#F0D9FF` | Inner separators and lighter inner borders |
| AI tint border | `#A855F726` | Important-info tinted rows and highlighted blocks |
| AI tint background | `#FDF8FF` | Important info, emphasized summaries, recommended action blocks |
| AI gradient start | `#FDF7FF` | Parent gradient top |
| AI gradient end | `#FFFFFF` | Parent gradient bottom |
| AI heading text | `#0F172A` | Standard heading text on light backgrounds |
| AI body text | `#475569` | Standard supporting copy |
| AI muted text | `#64748B` | Metadata and secondary labels |
| AI dark text | `#E9D5FF` | Purple text in dark mode |
| AI dark parent start | `#2A123D` | Dark parent gradient top |
| AI dark parent end | `#1E293B` | Dark parent gradient bottom |

---

## Parent AI Container

Use this for the top-level AI workspace or the main AI grouping card.

```tsx
className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
```

Use on:

- Budget Assistant workspace
- Manual-form AI Action Cards parent
- Other major AI-only grouped sections

Rule:

- Parent gets the gradient
- Children do not

---

## AI Section Header

Use the same heading structure across AI panels and manual-form AI sections.

```tsx
<div className="flex items-start gap-3">
  <div className="mt-1 shrink-0 text-[#A855F7]">
    <Icon className="h-6 w-6" />
  </div>
  <div>
    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Section Title</h3>
    <p className="mt-0.5 text-sm text-[#475569] dark:text-slate-300">Section description</p>
  </div>
</div>
```

Rules:

- Icon is bare
- No colored background behind the icon
- Keep icon vertically aligned with heading text
- Prefer `Sparkles` for major AI section titles such as `AI Document Analyzer` and `AI Budget Considerations`

This now also applies to manual `Supporting Documents` headers when they are styled to match surrounding sections.

---

## AI Child Card

Use this for cards inside an AI parent panel.

```tsx
className="rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]"
```

Use on:

- Suggested Project Fields
- Budget Lines
- Account Code Suggestion
- Summary
- Other individual AI action cards

Rules:

- Child cards remain white
- Border stays purple
- No gradient inside child cards
- Hover lift is subtle only

---

## AI Child Card Header

```tsx
<div className="mb-3 flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <div className="shrink-0 text-[#A855F7]">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Card Title</p>
      <p className="text-xs text-[#64748B] dark:text-slate-300">Subtitle</p>
    </div>
  </div>
</div>
```

Rules:

- Bare icon only
- Title uses AI purple
- Subtitle uses muted neutral text

---

## Important Information Tint Block

Use this when AI content needs emphasis inside a white child card.

```tsx
className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5"
```

Use on:

- Highlighted project-field rows
- Highlighted budget-line rows
- Highlighted account-code block
- Summary highlight block
- Recommended Action block
- Major supporting-document analyzer info rows

Rules:

- This is the approved tint pattern for emphasized AI content
- Prefer this over blue highlight rows
- Do not use this on every row by default; use it only where the AI is surfacing something important

---

## Standard Inner White Row

Use this for normal information rows that do not need emphasis.

```tsx
className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5"
```

Use on:

- Supporting metadata blocks
- Totals
- Secondary evidence snapshots
- Non-emphasized inner cards

---

## Loading State

Use the AI tint language for loading rows inside AI cards.

```tsx
className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF8FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
```

Rules:

- Use purple text
- Use soft purple background
- Dashed border is acceptable for in-progress states

---

## Empty State

Use `EmptyActionCard` for empty AI surfaces.

Current visual language:

```tsx
className="flex items-start gap-3 rounded-2xl border border-dashed border-[#A855F726] bg-[#FDF8FF] px-4 py-5 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
```

Rules:

- Empty state should still belong visually to the AI system
- Use the soft purple tint
- Keep icon bare, not boxed

---

## AI Action Cards In Manual Create Form

The manual create form currently follows this structure:

1. Parent AI container
   - gradient background
   - purple border
   - subtle neutral shadow

2. White child action cards
   - `Suggested Project Fields`
   - `Budget Lines`
   - `Account Code Suggestion`
   - `Summary`

3. Important information inside child cards
   - emphasized rows use `#FDF8FF`
   - emphasized rows use `border-[#A855F726]`

4. Loading and empty states
   - same soft purple tint family

This is the preferred structure for future manual AI panels.

---

## Supporting Document Analyzer

Expanded analyzer cards should follow this rule:

- parent file/result card may use the AI parent treatment, but the main `AI Document Analyzer` wrapper should stay shadowless in create and edit/view flows
- major inner information rows can use `#FDF8FF`
- important highlighted info uses `border-[#A855F726]`
- default inner containers stay white unless emphasis is needed

Good use cases for tint:

- document profile highlight stats
- short summary highlight block
- evidence assessment highlight rows
- no-data informational rows

Avoid:

- mixing blue-tinted informational rows inside AI analyzer content

---

## AI Budget Considerations Panel

This panel is a standalone AI section in the manual create flow.

Rules:

- outer container can use the AI parent family
- collapsed preview cards remain white
- expanded detail cards remain white
- only recommendation-style emphasis blocks should use the soft purple tint
- semantic conflict/coordination/allowed chips can keep their status colors

Approved emphasis:

- `Recommended Action` blocks may use `#FDF8FF`

Not approved here:

- tinting the whole expanded policy card
- adding extra tinted evidence sections unless explicitly designed for that screen

---

## Buttons In AI Cards

Primary AI action:

```tsx
className="bg-[#A855F7] text-white hover:bg-[#9333EA] active:bg-[#7E22CE]"
```

Secondary AI action:

```tsx
className="border border-[#E9D5FF] bg-white text-[#A855F7] hover:bg-[#FDF8FF]"
```

Rules:

- Purple buttons belong to AI actions
- Blue buttons should remain product-level actions, not AI emphasis

---

## What To Avoid

- Blue highlights like `#EEF3FF` or `#F8FBFF` inside AI cards
- Icon background wrappers for AI headings
- Gradients on child cards
- Purple glow-heavy child-card shadows
- Mixing too many unrelated semantic colors into AI layout chrome
- Tinting every inner row until the interface feels muddy

---

## Current Reference Files

- Manual create form AI surfaces: [src/pages/respondent/NewProject.tsx](src/pages/respondent/NewProject.tsx)
- Supporting document analyzer: [src/components/shared/SupportingDocumentAiInsights.tsx](src/components/shared/SupportingDocumentAiInsights.tsx)
- File upload entry surface: [src/components/shared/FileUploadDropzone.tsx](src/components/shared/FileUploadDropzone.tsx)

Use those files as implementation reference when extending AI UI into edit/view flows.
