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

**Status:** **confirmed by you, 14 November 2026** — "im fine with it, cloudflare
worker is free". The Worker row is confirmed on cost grounds as well as the secret
constraint. Still owed: the ADR 0002 amendment itself, which is #44's remaining work,
not a further decision.

## A02 — Attempt storage is server-side, not localStorage

**Assumed:** saved attempts live in D1 behind the Worker; localStorage is used only
for per-viewer convenience such as the last-selected module.

**Why:** not because browser storage is unsafe — it survives a restart quite happily.
The feature spec requires that drafts "show when they cannot reach the server"
(`docs/feature-spec.md:372`), that saved work survives refresh with retry/resume for
interrupted marking (`:374`, scenario A09), and S14's release gate asks for real
saved-work recovery. A local-only store can satisfy none of the "cannot reach the
server" or recovery clauses honestly, because it cannot distinguish a saved attempt
from one the server never received.

**If wrong:** S02.2 could use localStorage, but S05.2 could not, so the split would
need redoing later.

**Status:** provisional.

## A03 — No authentication for the personal release

**Assumed:** one user, gated by Cloudflare Access or a long-lived cookie; no
sign-up, no password reset, no user table.

**Why:** #30 defers identity isolation to a future multi-user decision. Building
auth now would be multi-tenant scaffolding for one person.

**If wrong:** S03.1 and S19.1 grow substantially.

**Status:** the one-user half is implied by A01's confirmation; the mechanism
(Cloudflare Access versus a long-lived cookie) is deliberately still open and belongs
to S03.1. Nothing here is multi-tenant.

## A04 — The evaluation dossier stays the source of truth for limits

**Assumed:** `docs/evaluation/README.md` and the ADRs remain authoritative; this
refinement does not supersede any measured claim.

**Why:** #38 and #37 both added honest-limits sections. Duplicating them elsewhere
would let the two drift.

**If wrong:** only the cross-references in `backlog.md` change.

**Status:** provisional.

## A05 — `T6_sol` and `T7_sol` are both official

**Assumed:** both are official teaching-team solutions.

**Why:** PR #36's diff marks both files official. Its _description_ originally said it
extended provenance to `T6_sol` only, while its commit said the owner had confirmed
`T7_sol` as well; I treated the description as stale and corrected it rather than
changing the diff. That inference is what you confirmed on 14 November, so the history
now agrees with itself. Note what this does **not** settle: `tut07_selected_ans.pdf`
still does not state which questions were omitted, and official provenance supplies no
per-criterion or partial-credit labels — which is the part #26 actually needs.

**If wrong:** one line in `docs/evaluation/README.md` reverts to "assumed". No code
depends on it, but #26's gold-label gate does.

**Status:** **confirmed by you, 14 November 2026** — "t7 sol is verified". The
inference recorded above was correct, so PR #36's wording stands and #26's gold-label
gate can treat both files as official. It still supplies no per-criterion marks, which
is the part #26 has to produce.

## A06 — Refinement output lives in the repo, not in 63 issues

**Assumed:** a single `docs/refinement/backlog.md` (63 slices) plus this log, with only
the immediately buildable slices promoted to GitHub issues.

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

Nothing decided so far is blocking. A01 and A05 are both confirmed (14 November
2026). The next genuine owner input is whichever of A10 (essay module) or A11 (Canvas
access) the roadmap reaches first — both are blocked behind S14 anyway.
