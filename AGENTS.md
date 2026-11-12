# Working in Revision

Read CONTEXT.md and the relevant ADRs before making changes. Product intent is in docs/feature-spec.md; observed reference behaviour is in docs/reference-site-audit.md.

## Agent skills

### Issue tracker

Issues and implementation specs live in ewonglh/revision-website on GitHub. See docs/agents/issue-tracker.md.

### Triage labels

Use the five default triage roles, with exactly one state and one category per issue. See docs/agents/triage-labels.md.

### Domain docs

Use a single root CONTEXT.md and docs/adr/. See docs/agents/domain.md.

## Delivery workflow

- Stage issues begin as needs-triage. Refine them into bounded, end-to-end child issues before implementation.
- A ready-for-agent child has a precise outcome, acceptance criteria, dependencies, non-goals, test approach, and unresolved questions answered.
- Read the complete issue, comments, dependencies, and applicable docs. Claim only one unblocked implementation issue at a time.
- Use a task branch and a small PR linked to its child issue. Do not mark an epic done because its first slice landed.
- Run the relevant checks and report their results. Update domain docs and ADRs when behaviour or decisions change.
- UI work requires responsive, keyboard, loading/empty/error, and human visual review evidence. Passing CI does not imply visual acceptance.
- Keep orchestration bounded: one accountable manager, explicit task ownership, at most one writer per checkout, and no recursive or background delegation unless authorised. Do not dispatch this backlog merely because it exists.
- Never commit secrets, private course files, student answers, or Canvas sessions. Use original/synthetic public fixtures.
- Keep UI copy brief. Use accessible, quiet layouts and semantic design tokens; do not add decorative dashboards or unimplemented controls.
- Do not claim a proof was verified, code was executed, or a circuit was equivalent unless the corresponding check ran. Preserve uncertainty and source provenance.

## Local checks

Use npm ci, then npm run check. Additional behaviour tests must match the changed feature; do not add tests that only duplicate implementation.

## Scope

The current scaffold is a frontend starting point. Backend, retrieval, marking providers, and automatic deployments remain separate ticketed decisions. GitHub Actions validates changes; it does not run an autonomous coding agent or deploy the application.
