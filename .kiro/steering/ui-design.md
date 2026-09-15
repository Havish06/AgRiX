# AgRiX UI Design Steering

## Product Character

AgRiX must feel like a serious agricultural-financial analysis instrument:

> **Physical paper, field notebooks, brass/metal measurement panels, printed statistical reports, and old financial ledgers.**

It must not resemble a generic AI SaaS dashboard.

## Visual Language

Use restrained skeuomorphism with modern interaction design:

- Paper-like surfaces
- Subtle inset panels
- Raised physical controls
- Thin borders
- Embossed or letterpress section headers
- Restrained shadows
- Tactile sliders, toggles, and buttons
- Clear grids and ruled tables
- Professional, readable charts

The effect should support hierarchy and affordance. It must not become decorative noise.

## Color System

### Backgrounds

- Warm ivory
- Parchment
- Muted beige
- Off-white

### Primary and supporting colors

- Deep forest green
- Dark olive
- Charcoal
- Muted brown
- Warm gray

### Risk colors

- Green → Low
- Amber → Moderate
- Orange/red → High
- Dark red → Very High

### Prohibited

- AI blue/purple gradients
- Neon colors
- Excessive glassmorphism
- Glowing cards
- Giant gradient headings
- Overly rounded cards
- Futuristic visual clichés

## Typography

- Prefer a readable serif or humanist display face for reports and section titles
- Use a clean sans-serif face for controls, tables, and data labels
- Maintain strong hierarchy through weight, spacing, and size rather than color alone
- Use tabular numerals for metrics and tables
- Ensure minimum readable body size for research content
- Avoid decorative fonts that reduce legibility

## Layout

- Desktop-first research workspace
- Clear document-like hierarchy
- Use consistent measurement grids and ruled separators
- Keep charts large enough for labels and uncertainty bands
- Avoid dense dashboards that hide uncertainty or assumptions
- Provide clear separation between:
  - current analysis
  - statistical evidence
  - prediction and forecast
  - uncertainty
  - scenario analysis
  - research metadata

## Core Components

### Panels

- Use subtle inset surfaces for instruments and controls
- Use raised surfaces for primary cards and interactive controls
- Use ruled or paper-like surfaces for reports and tables
- Keep border radius small and restrained

### Buttons and controls

- Raised buttons with tactile press states
- Physical-looking toggles and segmented controls
- Clear focus rings
- Disabled states must be visually distinct
- Loading states must indicate work without blocking unrelated controls

### Forms

- Group related inputs in labeled instrument panels
- Use units in labels or suffixes
- Show validation messages near the relevant field
- Preserve user inputs after recoverable errors
- Make required fields and optional fields explicit

### Charts

- Prioritize information over decoration
- Use readable axes, units, legends, and tooltips
- Render uncertainty intervals as bands or dashed bounds
- Never use fake charts or hard-coded visual values
- Use accessible chart labels and text alternatives
- Use Recharts for standard charts and Plotly only where advanced interaction is required

### Risk displays

- Show score, category, component values, and drivers together
- Use color as a secondary signal; always include text labels
- Explain whether a value is a proxy or an empirically observed probability
- Never visually imply that an agricultural financial risk estimate is a default probability

## Motion and transitions

- Use `150–250ms` ease-out transitions for normal interactions
- Use animation for tabs, cards, chart updates, sliders, scenario changes, loading states, and risk-score changes
- Keep motion subtle and purposeful
- Respect `prefers-reduced-motion`
- Avoid animation that changes data interpretation or causes layout shifts during reading

## Responsive behavior

Minimum supported:

- Desktop
- Laptop
- Tablet

Mobile is progressive enhancement. Charts and controls must remain usable on tablet widths.

## Accessibility

- Semantic HTML and landmark regions
- Keyboard navigation for all interactive controls
- Visible focus indicators
- Sufficient contrast for text and controls
- Labels for every input
- Accessible names for icon-only controls
- Chart alternatives and data tables where appropriate
- Error messages associated with fields
- Do not rely on color alone
- Support reduced motion
- Test with keyboard-only navigation

## Error and empty states

Never show raw stack traces.

Use a calm instrument-panel style:

```text
Analysis unavailable

The selected dataset does not contain sufficient historical observations
for this model.

Try:
• selecting a longer period
• selecting another crop
• selecting another region
```

Include:

- Empty states for no data
- Loading states for background jobs
- Retry actions for recoverable failures
- Clear distinction between unavailable data, unavailable model, and invalid input

## Research transparency

The Research page must expose:

- Dataset and version
- Provider and access date
- Time period
- Features
- Models
- Validation method
- Statistical tests
- Confidence level
- Uncertainty method
- Random seed
- Model version
- Known limitations

## Design review checklist

- [ ] No AI-blue or purple gradient background
- [ ] Warm parchment/ivory palette used consistently
- [ ] Forest green, olive, charcoal, and brown supporting colors
- [ ] Restrained skeuomorphism
- [ ] No excessive rounded cards, glow, or neon
- [ ] Charts represent real backend data
- [ ] Uncertainty is visible, not hidden
- [ ] Proxy/default distinction is explicit
- [ ] Keyboard and screen-reader behavior checked
- [ ] Reduced motion respected
- [ ] Responsive layout checked at tablet width
- [ ] Loading, error, and empty states implemented
