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
