# Existing App UI Conventions

- Preserve the app font, navy text, blue actions, rounded panels, and dark-mode variants.
- Quality Check keeps SME Review Score prominent in the left panel. AI Confidence Score is a compact badge immediately after the AI Decision tag, with green at 80+, amber at 60+, and red below 60. Missing scores are not zero.
- Budget Overview and Quality Check share `aiRiskStyles.ts`: high risk uses pale red with red text, medium uses a neutral surface with amber text, and low uses neutral slate. Include accessible severity text, not color alone.
- AI recommendations use the existing purple sparkle treatment, distinct from risk severity colors.
- Preserve current workflow permissions and filtering when changing presentation.
