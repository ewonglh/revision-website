# Incremental engineering workflow

The roadmap consists of stage epics, deliberately labelled `needs-triage`. They describe outcomes, not permission to start building every stage. Milestones express delivery phase; area labels express domain; triage labels express readiness. Assignees, linked PRs, blockers, and open/closed state express execution progress.

## Refinement

1. Read the stage and its source requirements. Check dependencies, existing code, ADRs, and any prior decisions.
2. Settle only the decisions needed for the next demonstrable slice. Record an ADR for consequential architecture decisions, and `needs-info` for specific external input.
3. Create child issues delivering narrow complete behaviours. Each includes an outcome, stable interfaces, acceptance criteria, error cases, non-goals, test boundary, dependencies, and human review gates.
4. Apply `ready-for-agent` only to a complete brief. A ready brief can still be blocked: execution starts only after its open blockers are resolved.
5. Keep stages in triage while details evolve. Marking a stage ready must never be interpreted as a single unrestricted implementation task.

Prefer whole user outcomes over layers: importing one problem with its solution, correcting its extracted parts, and then attempting it is a useful slice. Building an entire database layer independently from the first user flow is usually too broad and hard to validate.

## Implementation

Choose one unassigned child on the unblocked frontier. Record ownership, branch, goal and checks. Work in a task branch or an agent-managed isolated checkout when available. At most one writer owns a checkout; integrate changes serially. Reconcile existing work before starting another agent. A label or issue assignment is a convention, not a lock.

For each child: implement → relevant automated checks → self-review → PR with issue link → independent review where warranted → human visual acceptance for UI → merge within the authorised workflow → close the satisfied issue. Preserve failing or unmerged work for recovery and make the next action explicit.

Every delegation has a finite outcome, scope, files/interfaces, acceptance criteria, checks, budget/deadline and report contract. Do not recurse, run a perpetual manager, or launch unattended jobs just because issues exist. Hosted coding automation and recurring agents are separate decisions; this repository only sets up conventions and CI.

## Human checkpoints

- Visual design: task hierarchy, copy density, desktop/narrow behaviour and keyboard access.
- Assessment: reviewed rubrics and representative correct/partial/incorrect answers.
- Architecture: evaluated source ingestion/retrieval/marking fidelity and personal/pilot costs.
- Release: real saved-work recovery, permissions, budget behaviour and limitations.

Human gates attach to the affected implementation issue and revision; they are not reasons to ask permission for every reversible code change.

## Suggested first progression

1. Refine architecture/evaluation and source/exam profiles using small representative packs.
2. In parallel with those decisions, refine the quiet workspace and answer-editing design using synthetic content.
3. Implement one module → one reviewed real question → one saved attempt → one honest marking result.
4. Add the module-specific edge cases, then review scheduling and timed papers.
5. Exercise private personal use before connectors, generation or sharing.

## Skills and portability

The invoked setup-matt-pocock-skills skill defines the configuration files read by triage, to-spec and to-tickets. Agents should use their installed skills with the repo's configuration. Do not copy machine-specific absolute paths or install unreviewed skill bundles into the public project.

Broad stage creation is intentionally lighter than to-tickets' usual agent-ready slices. When decomposing, follow that skill's vertical-slice and blocking-edge rules; honour this project's explicit request to keep unrefined stages in triage.
