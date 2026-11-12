# Design direction

Quiet, editorial, and practical. Warm off-white surfaces, charcoal text, a muted green accent, fine rules, and generous spacing. A serif heading can provide character; controls and working use readable system sans and monospace fonts. No web font request is needed for the starter.

## Rules

- Put the task and student work first. Use one primary action per view.
- Keep labels short; reveal explanation when it helps a decision. Avoid marketing copy inside study flows.
- Use rows and hierarchy before adding cards. Avoid invented scores, decorative charts, celebratory streaks, gradients, or unimplemented controls.
- Use semantic tokens from the CSS token file rather than introducing arbitrary colours per component.
- Keep primary touch controls comfortably sized, visible keyboard focus, meaningful labels, and non-colour status cues. Respect reduced motion.
- Test narrow screens, 200% zoom, long mathematical notation, multiline code, and readable circuit diagrams.
- Load editors, mathematical rendering, document viewers, and other expensive tools only in the routes that need them.
- UI changes need human visual review alongside automation; record the revision and reviewed scenarios in the PR.

## Scope

The starter shows two module entries and honest empty states. It does not imply authentication, imports, persistence, study progress, or marking have been implemented. The layout is a starting point for the design stage, not final visual acceptance.

Guidance: ui-ux-pro-max skill baseline accessibility/layout rules plus project-specific judgment. Two design-system searches returned marketing/newsletter or children's-app patterns; neither was adopted as a verified fit.
