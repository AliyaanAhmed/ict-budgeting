# AI Component Theme

This app uses a dedicated purple visual language for AI-generated recommendations and AI-assisted review surfaces so they feel distinct from the main product blue.

## Primary AI Color

- Base AI primary: `#A855F7`

## Supporting Light Palette

- AI border light: `#E9D5FF`
- AI surface soft: `#FAF5FF`
- AI surface gradient start: `#FDF7FF`
- AI accent glow: `#C084FC`
- AI accent glow strong: `#E879F9`

## Dark Theme Direction

- AI dark surface start: `#2A123D`
- AI dark surface mid: `#231735`
- AI dark surface accent: `#241735`
- AI dark text accent: `#E9D5FF`

## Usage Rules

- Use the purple palette for AI-only UI:
  - AI Document Reader
  - AI Budget Considerations
  - Suggested Strategic Priority AI Recommendation
- Keep semantic states separate:
  - red for errors/conflicts
  - green for success/cleared states
  - amber for caution/review flags
- Use `#A855F7` for AI icons, AI chips, AI buttons, AI scores, and AI-focused borders.
- Prefer light purple gradients over flat blue fills for AI cards.
- When showing animated AI analysis states, use purple/pink glow layers instead of app-primary blue.

## Current Components

- `src/components/shared/SupportingDocumentAiInsights.tsx`
- `src/pages/respondent/NewProject.tsx`

