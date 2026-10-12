# AI Component Theme

This document is the source of truth for the AI styling currently used in the app.

It applies to:
- `AI Portfolio Summary`
- `Budget Overview`
- `AI Document Analyzer`
- Create Manual and Create Copilot AI panels
- edit/view right-rail AI cards

## Current Theme Direction

The app now uses a **blue-led government UI** for AI surfaces.

Key rules:
- Blue is the AI language now, not purple.
- Use white or very light blue surfaces for AI content.
- Keep gradients subtle and mostly in headers or AI hero strips.
- Expanded AI content should stay clean and readable.
- AI should feel supportive and premium, not flashy.
- Use `Sparkles` for AI affordance icons where possible.

## Main AI Tokens

| Token | Value | Usage |
|---|---|---|
| Primary blue | `#286CFF` | AI accents, active states, key AI actions |
| Blue hover | `#1F5BFF` | Hover state for primary blue actions |
| Blue active | `#1A4ED8` | Active state |
| Soft blue | `#E7F5FF` | AI panels, assistant backplates, selected states |
| Border blue | `#DDEBFF` | Standard AI/card border |
| Accent blue | `#4F98FF` | Secondary accent in gradients and chips |
| Muted text | `#64748B` | Labels and helper text |
| Body text | `#475569` | Descriptions |
| Main text | `#0F172A` | Headings and primary content |
| Light AI border | `#B0DBFF` | Highlighted AI border |
| Purple AI accent | `#A855F7` | Still used sparingly for old AI affordances like some document and recommendation surfaces |

## Expandable AI Shell

Use this for expandable AI blocks such as:
- `AI Portfolio Summary`
- `Budget Overview`
- `AI Document Analyzer`
- strategic recommendation accordions

Outer shell:

```tsx
className="overflow-hidden rounded-[28px] border border-[#DDEBFF] bg-white dark:border-white/10 dark:bg-[#1E293B]"
```

Header row:

```tsx
className="relative block w-full bg-gradient-to-b from-[#FDF7FF] to-white px-8 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
```

Rules:
- Keep the shell white.
- Keep the gradient only on the top header row.
- Expanded content stays white.
- Do not let the gradient cover the full expanded body.
- Border radius should remain generous and consistent.

## AI Child Card

Use this for cards inside AI panels.

```tsx
className="rounded-2xl border border-[#DDEBFF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]"
```

Rules:
- Child cards stay light and clean.
- Avoid heavy shadows.
- Avoid full-card purple tint.
- Use blue emphasis instead of purple for most AI cues.

## AI Right-Rail Cards

The edit/view right rail uses:
- `Suggested Project Fields`
- `Budget Lines`
- `Account Code Suggestion`
- `Summary`

Typical outer card:

```tsx
className="rounded-2xl border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]"
```

The current inner row treatment is often:

```tsx
className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5"
```

Rules:
- Keep AI right-rail content light and readable.
- Use `Sparkles` for the header icon.
- Use blue for standard AI cues; use purple only when the component already uses it for historical AI styling.

## Budget Overview

Current Budget Overview behavior:
- expandable AI shell
- collapsed state shows the main metrics
- expanded state shows:
  - reviewer view / approver view content
  - AI Budget Consideration details
  - AI review flags
  - policy match cards
  - confidence and file evidence context where applicable

Rules:
- Keep metric cards consistent and compact.
- Use title case on labels.
- AI review flags and policy blocks should remain readable before decorative.

## AI Review Flags

Current chart styling:
- `AI Review Flags` and issue categories use the app primary blue family.
- Severity colors remain distinct and should stay readable.
- Avoid mixing unrelated purple tones into these charts.

## AI Portfolio Summary

Current portfolio-summary behavior:
- used on dashboards and summary surfaces
- current tabs in project screens include:
  - `AI Review Flag`
  - `Recommended Action`
  - `DGE Budget Consideration`
- linked project budget references should be shown where available

Rules:
- Keep summary cards grouped and readable.
- Avoid noisy nested surfaces.
- Keep the title case labels.

## Strategic Recommendation Surfaces

Applies to:
- create form recommendation panels
- edit/view recommendation panels

Rules:
- Strategic recommendation cards can show multiple options.
- Option 2 is actionable too.
- Apply buttons should be available on any actionable option, not just the first one.
- Recommendation panels should keep the same visual language as the rest of the app.

## Supporting Document Analyzer

Current document analyzer behavior:
- shows per-file loading/analyzing state
- shows a compact evidence summary
- can expose file summary, evidence assessment, review flags, budget lines, and account-code suggestions
- supports cumulative summary once multiple files are present

Rules:
- Keep the analyzer panel readable and compact.
- Use blue surfaces for the current design language.
- Use purple only where the existing analyzer affordance already does.

## Loading States

Use this for loading rows or assistant states:

```tsx
className="flex items-center gap-2 rounded-xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] px-3 py-4 text-sm text-[#286CFF]"
```

Rules:
- Prefer blue loading accents now.
- Use dashed borders for active analysis states.

## Empty States

Use subtle blue-tinted empty states:

```tsx
className="flex items-start gap-3 rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] px-4 py-5 text-sm text-[#64748B]"
```

## Buttons

Primary AI action:

```tsx
className="bg-[#286CFF] text-white hover:bg-[#1F5BFF] active:bg-[#1A4ED8]"
```

Secondary AI action:

```tsx
className="border border-[#DDEBFF] bg-white text-[#286CFF] hover:bg-[#F8FBFF]"
```

## What To Avoid

- Full-height gradients on expanded AI content
- Purple everywhere just because a component is AI-related
- Heavy shadows on nested AI cards
- Conflicting blue/purple semantics in the same chart or panel
- Lower-case or all-caps labels where the rest of the app uses title case

## Current Reference Files

- [src/components/shared/AiPortfolioSummary.tsx](src/components/shared/AiPortfolioSummary.tsx)
- [src/pages/respondent/ProjectDetail.tsx](src/pages/respondent/ProjectDetail.tsx)
- [src/pages/respondent/NewProject.tsx](src/pages/respondent/NewProject.tsx)
- [src/components/shared/SupportingDocumentAiInsights.tsx](src/components/shared/SupportingDocumentAiInsights.tsx)
- [src/components/shared/FileUploadDropzone.tsx](src/components/shared/FileUploadDropzone.tsx)

