# Assumptions log

Every judgement call I made while refining the backlog, so you can amend them.
Date: 14 November 2026. Each entry says what I assumed, why, and what changes if
you disagree.

Status key: **open** (needs your confirmation) · **provisional** (safe to build on,
cheap to change) · **confirmed by you** (quoted where possible).

---

## A01 — Personal hosting shape

**Assumed:** one Cloudflare Worker holding the provider key, D1 for attempts, static
Pages frontend, no queue, no durable workflow, Cloudflare Access single-user auth.

**Why:** #30's own 13 November scope correction proposes exactly this and says the
personal half can be decided now. The only hard constraint is that the key cannot
ship to the browser.

**If wrong:** S01.1, S03.1, S05.2, S08.1 change. Any managed-Postgres choice instead
of D1 mostly moves the storage slice, not the UI slices.

**Status:** open. This is the most consequential item here.

## A02 — Attempt storage is server-side, not localStorage

**Assumed:** saved attempts live in D1 behind the Worker; localStorage is used only
for per-viewer convenience such as the last-selected module.

**Why:** the feature spec requires work to survive a browser restart and to be
recoverable, and S14's release gate asks for saved-work recovery. Browser storage
cannot honestly satisfy that.

**If wrong:** S02.2 could use localStorage, but S05.2 could not, so the split would
need redoing later.

**Status:** provisional.

## A03 — No authentication for the personal release

**Assumed:** one user, gated by Cloudflare Access or a long-lived cookie; no
sign-up, no password reset, no user table.

**Why:** #30 defers identity isolation to a future multi-user decision. Building
auth now would be multi-tenant scaffolding for one person.

**If wrong:** S03.1 and S19.1 grow substantially.

**Status:** open.

## A04 — The evaluation dossier stays the source of truth for limits

**Assumed:** `docs/evaluation/README.md` and the ADRs remain authoritative; this
refinement does not supersede any measured claim.

**Why:** #38 and #37 both added honest-limits sections. Duplicating them elsewhere
would let the two drift.

**If wrong:** only the cross-references in `backlog.md` change.

**Status:** provisional.

## A05 — `T6_sol` and `T7_sol` are both official

**Assumed:** both are official teaching-team solutions, per the change in PR #36.

**Why:** PR #36's diff marks both files official, but its own description says it
deliberately extended provenance to `T6_sol` only and left `T7_sol` unstated. I
could not find a written confirmation for `T7_sol` in the issue history before the
session was interrupted.

**If wrong:** one line in `docs/evaluation/README.md` reverts to "assumed". No code
depends on it, but #26's gold-label gate does.

**Status:** open — **this is a contradiction I could not resolve, not a decision I
made.** Please confirm which file(s) are official.

## A06 — Refinement output lives in the repo, not in 60 issues

**Assumed:** a single `docs/refinement/backlog.md` plus this log, with only the
immediately buildable slices promoted to GitHub issues.

**Why:** `docs/workflow.md` forbids dispatching a backlog merely because it exists.
Creating ~60 blocked tickets would bury the four that can actually start.

**If wrong:** I can create all of them as `needs-triage` children in one pass.

**Status:** provisional.

## A07 — S02.2 (persistent module selection) is the first code slice

**Assumed:** module selection surviving reload is the best first vertical slice —
a real user outcome, no backend, testable boundary.

**Why:** it exercises the token system, storage fallback and module context without
waiting for any architecture decision.

**If wrong:** S01.1 and S01.2 are pure decision/doc slices and remain sensible
firsts.

**Status:** provisional.

## A08 — Design work needs a human visual gate, always

**Assumed:** every S02 slice requires your eyes on desktop, narrow, keyboard and
200% zoom before merge; automation alone never accepts UI.

**Why:** `AGENTS.md` says passing CI does not imply visual acceptance.

**Status:** confirmed by project docs, not by you in this session.

## A09 — Marking slices are gated on #26/#29, not on more code

**Assumed:** S09 and S10 cannot honestly start until reviewed rubric labels exist.
Building the marking UI before the rubric model would enshrine guesses.

**Why:** #29 requires thresholds agreed _before_ any automatic-marking claim.

**Status:** provisional.

## A10 — Essay module is not yet chosen

**Assumed:** S17.1 is a decision for you; I did not pick a module.

**Why:** the stage itself says "select an actual target module" before implementation.

**Status:** open.

## A11 — Canvas access is unavailable until you say otherwise

**Assumed:** no Canvas credentials, no export; S15.1 is blocked.

**Why:** #26 says "do not request hidden keys".

**Status:** open.

## A12 — Meeting the workflow's own rules counts as done

**Assumed:** "fleshed out" means every stage has named slices with outcome,
blockers, acceptance shape and gates — not that every slice has a GitHub issue yet.

**Why:** your goal said "all the tickets are fleshed out", and the workflow treats
refinement as the stage-level deliverable.

**If wrong:** say so and I will promote every slice to an issue.

**Status:** open.

## A13 — No dark mode in the personal release

**Assumed:** the personal release ships light-only. Tokens are structured so a dark
theme is a later additive change, not a rewrite.

**Why:** `docs/design.md` describes one warm off-white palette and no dark variant;
adding one doubles the visual-review surface for every UI slice before the core loop
exists.

**If wrong:** S02.1 gains a token-parity test and every UI slice gains a second visual
review pass.

**Status:** provisional.

---

## The one thing I need from you first

**A01 (hosting shape)** and **A05 (T7_sol provenance)**. A01 unlocks the largest
number of slices; A05 is a factual contradiction in the repo today.
