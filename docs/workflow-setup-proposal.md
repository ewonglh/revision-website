# Agent workflow setup proposal

Review draft for the explicitly invoked setup-matt-pocock-skills skill. GitHub, the default five triage labels, and AGENTS.md have been selected. This proposal is not the active agent configuration until applied.

## AGENTS.md — proposed initial contents

```markdown
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
```

## docs/agents/issue-tracker.md — proposed contents

```markdown
# Issue tracker: GitHub

Issues and specs live at https://github.com/ewonglh/revision-website/issues. Use the authenticated gh CLI; infer the repo from its remote, or pass --repo ewonglh/revision-website.

## Conventions

- Read: gh issue view <number> --comments; also inspect labels and dependencies.
- List: gh issue list --state open --json number,title,body,labels,assignees.
- Create/comment/edit with gh issue commands. Use --body-file for multiline text.
- Publishing a spec means creating/updating a GitHub issue, not leaving a local scratch file as the sole request record.
- Stage epics begin needs-triage, with enhancement as the category. Status labels express triage readiness, not implementation progress.
- Use phase and area labels for filtering. Milestones group delivery phases. Open/closed, assignee, linked PRs, and dependency edges describe work progress.
- Use native sub-issues and blocking edges when available; always keep readable parent/blocker references in the body as a fallback.
- Only close an issue when its acceptance criteria are met; close a parent after its required children and acceptance gates are complete.

## Pull requests as a triage surface

PRs as a request surface: no.

## Skills

triage, to-spec, and to-tickets read this tracker configuration. Stage epics deliberately need refinement; do not apply ready-for-agent to a broad roadmap item just because it has been created.
```

## docs/agents/triage-labels.md — proposed contents

```markdown
# Triage labels

| Canonical role  | Tracker label   | Meaning                                              |
| --------------- | --------------- | ---------------------------------------------------- |
| needs-triage    | needs-triage    | Evaluate and refine the issue                        |
| needs-info      | needs-info      | Waiting for specific missing information             |
| ready-for-agent | ready-for-agent | Bounded, fully specified work an agent can implement |
| ready-for-human | ready-for-human | Work requiring human execution or judgment           |
| wontfix         | wontfix         | Rejected; close with an explanation                  |

Every tracked issue carries exactly one of these state labels and one category label: bug or enhancement. Phase, area, and epic labels are additive. Remove the previous triage state when applying a new one. Native GitHub open/closed state and assignments are separate from triage readiness.

Triage notes and briefs produced using the triage skill begin with its required AI-generated disclaimer. High-level stage epics stay needs-triage until decomposed; a child's readiness does not change the parent's state automatically.
```

## docs/agents/domain.md — proposed contents

```markdown
# Domain docs

Layout: single-context. Read root CONTEXT.md and relevant docs/adr/ decisions before exploring or changing the domain. If a future doc is absent, proceed without generating placeholder contexts or suggesting a monorepo split.

Use the glossary's vocabulary in issues, specs, tests, and code. Surface conflicts with an ADR explicitly rather than silently overriding it. Add or update domain terms when their meaning has actually been settled; record consequential decisions with their context, alternatives, and implications.

Product requirements live in docs/feature-spec.md. The reference audit is evidence about another website, not authority for this project's implementation. A reviewed implementation issue and accepted ADRs refine the product draft; contradictory changes should update the draft or record the deliberate exception.
```

## Other scaffold work already authorised

- Create public GitHub repository ewonglh/revision-website, preserving the current local history and documents.
- Add a React + TypeScript + Vite static frontend scaffold, semantic CSS tokens, and concise empty module screens. Use npm, already available on this machine.
- Add CI for formatting, lint, type checking, tests as applicable, and a production build; no deployment credentials or autonomous coding workflows.
- Add issue/PR templates, CONTRIBUTING.md, a small domain glossary, and an ADR explaining the frontend choice while leaving backend services open.
- Publish high-level stage epics as needs-triage + enhancement, with phase/area labels, milestones, dependency references, expected outcomes, and decomposition instructions.
- Use the skill configuration as editable repo documentation. Future agents should apply the installed triage/to-spec/to-tickets skills as appropriate; local absolute skill paths must not be copied into portable repository instructions.
