# Existing App UI Conventions

- Plus Jakarta Sans is the application font across every role, route, sidebar, form control, dialog, table, and dashboard. Bundle weights 400, 500, 600, 700, and 800 locally through `@fontsource/plus-jakarta-sans`; use weight 800 with tight tracking for page-level `h1` and `h2` headings.
- IBM Plex Mono is bundled at weights 400 and 600 and is reserved for KPI values, scores, percentages, dates, IDs, counts, and compact numeric badges through `font-mono` or the shared `tabular-nums` treatment.

- Preserve the app font, navy text, blue actions, rounded panels, and dark-mode variants.
- Quality Check keeps SME Review Score prominent in the left panel. AI Confidence Score is a compact badge immediately after the AI Decision tag, with green at 80+, amber at 60+, and red below 60. Missing scores are not zero.
- Budget Overview and Quality Check share `aiRiskStyles.ts`: high risk uses pale red with red text, medium uses a neutral surface with amber text, and low uses neutral slate. Include accessible severity text, not color alone.
- AI recommendations use the existing purple sparkle treatment, distinct from risk severity colors.
- Preserve current workflow permissions and filtering when changing presentation.
