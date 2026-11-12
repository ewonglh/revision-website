# Contributing

This project starts with personal revision for NUS ST2132 and CS2100. Read the product spec, CONTEXT.md, relevant ADRs, and AGENTS.md before changing behaviour.

## Local development

Use Node 24 and npm:

```sh
npm ci
npm run dev
npm run check
```

The static production output is `dist/`. `npm run preview` serves a built version locally. Cloudflare Pages can use `npm run build` with `dist` as the output directory. A Pages project and backend are not provisioned by this scaffold.

## From stage to implementation

1. Pick an open stage with `needs-triage`; read its outcome, dependencies, and discussion.
2. Refine the stage into small end-to-end slices. Each should deliver demonstrable behaviour with a realistic test boundary; avoid separate database/API/UI tickets for one small user outcome.
3. Record unresolved input as `needs-info` with specific questions. A stage can stay in triage while its settled slices are prepared.
4. Give each child one category and one triage state. Move it to `ready-for-agent` only after the brief is bounded and dependencies/decisions are clear. An open blocker still prevents execution even when the brief is ready.
5. Claim an unassigned, unblocked child, create a task branch, implement its acceptance criteria, and open a linked PR. Do not implement a broad epic directly.
6. Run the relevant checks and explain any limitations. For UI changes, include desktop/mobile, keyboard, empty/loading/error, and long-content evidence, then obtain human visual acceptance before calling that UI accepted.
7. Merge only within the session's authorisation. Close the child after its criteria and review gates pass; close a stage only when its required children and exit criteria are complete.

Use the installed `triage`, `to-spec`, and `to-tickets` skills when appropriate. Tracker/label/domain configuration lives in `docs/agents/`; those files are portable project rules, not machine-specific skill installations.

## Agent task contract

An implementation issue needs: current and desired behaviour; parent and blockers; acceptance criteria; scope/non-goals; affected domain interfaces; test approach; relevant decisions; and any human acceptance gate. Refer to behaviour and stable domain names rather than prescribing functions before discovery. Function-level implementation notes are useful only when a settled interface warrants them.

One manager owns integration. Each checkout has at most one writer. Delegation must be explicitly authorised, bounded by outcome/files/checks and a finite budget, and must not recurse by default. Do not auto-dispatch the backlog or install persistent workers as part of normal issue implementation.

## Quality and data

- `npm run check` runs formatting, lint, type checking, the test runner, and production build. The starter intentionally has no behaviour tests yet; add meaningful tests with the first features. The empty-suite allowance is not a coverage claim.
- Test observable contracts, error recovery, access isolation, and marking/checker boundaries. Avoid tests that merely restate the implementation.
- Keep private course files, model keys, Canvas credentials, student work, and raw provider logs out of Git. Use synthetic or explicitly redistributable fixtures, with provenance.
- Frontend environment variables are public. Secrets belong in the eventual backend, never a Vite variable.
- Keep copy brief and consult `docs/design.md`. Do not invent progress metrics or show actions that do nothing.
- Record consequential design decisions as ADRs. Keep the product spec and glossary aligned with implemented behaviour.

## Automation scope

GitHub Actions runs checks. It does not choose tickets, run coding agents, deploy, or merge. GitHub labels are workflow conventions; they are not a locking service. No claim of unattended execution is made by this setup.
