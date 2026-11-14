# Backlog refinement: every open stage decomposed

Status: draft for owner review. Date: 14 November 2026.

This document fleshes out every open ticket into bounded implementation slices. It is
a refinement artifact, not permission to build: `docs/workflow.md` requires each slice
to exist as its own issue with a complete brief before it becomes `ready-for-agent`.

Decision calls I made while writing this are recorded in
[assumptions.md](assumptions.md) and are numbered `A01`, `A02`, … If an assumption is
wrong, the affected slices are named there so they can be corrected in one pass.

## How to read this

- **Slice ID** is a local label (`S02.1`), not yet a GitHub issue number.
- **Blocked by** names other slices or external inputs.
- **Gate** is what a human must look at. "None" means automation can accept it.
- A slice is _vertical_ when it delivers one user-observable outcome end to end,
  rather than a layer such as "the database schema".

## Summary

| Stage                     | Slices    | Earliest start      | Blocked by owner input?       |
| ------------------------- | --------- | ------------------- | ----------------------------- |
| S01 architecture          | 4         | now (S01.1, S01.2)  | 2 of 4 (field names, numbers) |
| S02 workspace design      | 4         | now                 | no                            |
| S03 offerings/profiles    | 3         | after S01.1, S02.2  | no                            |
| S04 import/review         | 4         | after S03.1         | no                            |
| S05 multipart attempts    | 3         | after S04.3         | no                            |
| S06 choices/short answers | 3         | after S04.3         | no                            |
| S07 MIPS/circuit capture  | 3         | after S04.3         | no                            |
| S08 criterion marking     | 4         | after S05.1         | no (owner review gates)       |
| S09 ST2132 marking        | 3         | after #26 labels    | yes (#26 labels)              |
| S10 CS2100 marking        | 3         | after S06.3         | no (assessment gates)         |
| S11 review/planning       | 4         | after S09/S10       | no                            |
| S12 timed papers          | 3         | after S05–S08       | no                            |
| S13 notes/recall          | 3         | after S08.1         | no                            |
| S14 personal release      | 4         | after S11–S13       | no                            |
| S15 Canvas connector      | 3         | owner Canvas access | yes (Canvas access)           |
| S16 generated practice    | 3         | after S14           | no                            |
| S17 essay assessment      | 2         | after S14           | yes (target module)           |
| S18 forecasts             | 2         | after S11 + data    | no                            |
| S19 invited sharing       | 3         | after S14           | no                            |
| S20 public operation      | 2         | after S19           | no                            |
| S21 lint advisory         | delivered | —                   | no                            |
| #26–#30 evaluation        | see below | partially           | yes                           |

---

## S01 — Architecture evaluation (#2)

Outcome: pick an architecture from evidence, with measured limits and costs.

| ID    | Slice                                                                                                                                | Blocked by         | Gate                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | -------------------------- |
| S01.1 | **Personal hosting decision memo** and ADR accepting or rejecting the one-worker shape                                               | nothing            | Owner signs the ADR        |
| S01.2 | **Portable contract freeze**: turn `docs/evaluation/contracts.md` proposals into a versioned schema file plus validation tests       | nothing            | Owner confirms field names |
| S01.3 | **Evaluation harness consolidation**: unify `evaluation/extraction/*` and the #32 harness behind one runner and one coverage summary | S01.2              | none                       |
| S01.4 | **Measured architecture comparison** against the reviewed pack                                                                       | #26, #27, #28, #29 | Owner accepts the numbers  |

S01.1 is decision-ready today: #30's own 13 November scope correction says the
personal-use half does not depend on the marking-quality work. S01.2 is pure
contract work with no model involvement. S01.4 is the only part that genuinely needs
the owner's private material and a billed provider call.

## S02 — Quiet workspace design (#3)

Outcome: a minimal, beautiful study UI with usable maths, code and diagram workflows.

| ID    | Slice                                                                                                                                        | Blocked by | Gate                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------- |
| S02.1 | **Design tokens and type scale** as code: semantic tokens for spacing, colour, type, focus and reduced motion, with a rendered specimen page | nothing    | Visual review, desktop + narrow |
| S02.2 | **Module selection that survives reload**, with module context visible on every screen and honest empty states                               | S02.1      | Visual review + keyboard        |
| S02.3 | **Answer-editing surface for maths and code**: multiline input, monospace/code mode, long-equation overflow, focus discipline                | S02.2      | Visual review, 200% zoom        |
| S02.4 | **Loading, empty, error and pending states** as a shared pattern, replacing ad-hoc copy                                                      | S02.2      | Visual review                   |

S02.2 is the recommended first code slice: it is a real user outcome, needs no
backend, and has a testable boundary (reload preserves selection; mojibake and
storage failures degrade to the empty state).

## S03 — Module offerings and exam profiles (#4)

| ID    | Slice                                                                                                          | Blocked by   | Gate                     |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------ |
| S03.1 | **Two isolated offerings** (ST2132, CS2100) with semester identity distinct from course code                   | S01.1, S02.2 | none                     |
| S03.2 | **Exam profile versioning**: duration, sections, marks, allowed resources, navigation rules, as versioned data | S03.1        | Owner reviews seed rules |
| S03.3 | **Syllabus topics and skills** hierarchy with excluded scope recorded                                          | S03.1        | none                     |

## S04 — Import and review (#5)

| ID    | Slice                                                                                                                                            | Blocked by   | Gate                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ---------------------------------- |
| S04.1 | **Paste-a-question** with manual marks, parts and shared context; persists as a draft                                                            | S03.1        | none                               |
| S04.2 | **PDF import through the existing extractor**, producing reviewable blocks with anchors and loss signals                                         | S04.1, S01.3 | Visual review of the review screen |
| S04.3 | **Publish a reviewed version**: prompt/key/rubric kept distinct, provenance labelled official/user-reviewed/AI-proposed, old attempts unaffected | S04.2        | Owner reviews one real question    |
| S04.4 | **Duplicate and revision detection** with retire/replace semantics                                                                               | S04.3        | none                               |

## S05 — Multipart mathematical attempts (#6)

| ID    | Slice                                                                                     | Blocked by | Gate          |
| ----- | ----------------------------------------------------------------------------------------- | ---------- | ------------- |
| S05.1 | **Attempt one multipart problem** with parts, dependencies and shared assumptions visible | S04.3      | Visual review |
| S05.2 | **Durable draft**: autosave, saved/unsaved indicator, restore after refresh               | S05.1      | none          |
| S05.3 | **Distinguish skip, blank, timeout and unreadable**, and disclose assisted parts          | S05.2      | none          |

S05.2 is where #35's attempt-lifecycle tests legitimately belong. #35 stays parked
until S01.1 and S05.1 decide the attempt interface.

## S06 — Choices and short answers (#7)

| ID    | Slice                                                                                        | Blocked by | Gate                     |
| ----- | -------------------------------------------------------------------------------------------- | ---------- | ------------------------ |
| S06.1 | **Exact-set keyed scoring** as a pure function with the declared policy table                | S04.3      | none                     |
| S06.2 | **Choice and short-answer capture** preserving selections and text                           | S06.1      | Visual review            |
| S06.3 | **Separate pick score, reasoning diagnosis, confidence and assistance** in the result record | S06.2      | Owner reviews one result |

## S07 — MIPS and circuit capture (#8)

| ID    | Slice                                                                                                      | Blocked by | Gate                              |
| ----- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------- |
| S07.1 | **MIPS editor** preserving whitespace, with the declared ISA/register conventions shown                    | S04.3      | Visual review                     |
| S07.2 | **Circuit answer routes**: image upload plus expression or confirmed structured description                | S04.3      | Visual review                     |
| S07.3 | **Confirmation step for ambiguous labels/wires**, preserving the original and never claiming a checker ran | S07.2      | Owner confirms one ambiguous case |

The circuit-equivalence checker merged in #33 is the check behind S07.3, but a
drawing still needs a confirmed interpretation before it can be checked.

## S08 — Criterion marking (#9)

| ID    | Slice                                                                                                             | Blocked by | Gate                     |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------ |
| S08.1 | **Marking job states** (queued/marking/complete/provisional/failed) with finite retries and no duplicate attempts | S05.1      | none                     |
| S08.2 | **Criterion-level result record** with marks summing correctly and unassessed parts explicit                      | S08.1      | Owner reviews one record |
| S08.3 | **Scoped retrieval** by module, semester, revision and solution-release policy                                    | S04.3      | none                     |
| S08.4 | **Dispute, regrade and self-assessment** preserving the original result                                           | S08.2      | none                     |

## S09 — ST2132 marking (#10)

| ID    | Slice                                                                                             | Blocked by        | Gate                  |
| ----- | ------------------------------------------------------------------------------------------------- | ----------------- | --------------------- |
| S09.1 | **Rubric model for derivations**: assumptions, domain/support constraints, carried-through errors | #26 rubric labels | Assessment gate       |
| S09.2 | **Hypothesis-test and Fisher-information rules** applied to their own criteria                    | S09.1             | Assessment gate       |
| S09.3 | **Measured marking quality** on the reviewed pack                                                 | #29               | Owner accepts figures |

## S10 — CS2100 marking (#11)

| ID    | Slice                                                                                  | Blocked by   | Gate            |
| ----- | -------------------------------------------------------------------------------------- | ------------ | --------------- |
| S10.1 | **Applied-reasoning feedback** beside objective key scores                             | S06.3        | Assessment gate |
| S10.2 | **MIPS review vs assembly vs execution** distinguished in every result                 | S07.1        | Assessment gate |
| S10.3 | **Circuit marking** using the merged equivalence checker, reporting coverage not proof | S07.3, S08.2 | Assessment gate |

## S11 — Review and planning (#12)

| ID    | Slice                                                                            | Blocked by | Gate          |
| ----- | -------------------------------------------------------------------------------- | ---------- | ------------- |
| S11.1 | **Skill evidence ledger**: first/repeat, assisted/independent, immediate/delayed | S09/S10    | none          |
| S11.2 | **Mistake and misconception records** with correction and dispute                | S11.1      | none          |
| S11.3 | **Daily plan** under one total time budget with excluded days and exam priority  | S11.2      | Visual review |
| S11.4 | **Infeasible-coverage disclosure** instead of an unbounded backlog               | S11.3      | none          |

## S12 — Timed papers (#13)

| ID    | Slice                                                                           | Blocked by   | Gate                   |
| ----- | ------------------------------------------------------------------------------- | ------------ | ---------------------- |
| S12.1 | **Paper assembly** preserving sections, optional questions and marks            | S05.3, S06.2 | none                   |
| S12.2 | **Authoritative deadline** that refresh and navigation cannot reset             | S12.1        | none                   |
| S12.3 | **Solution protection and release timing** across practice, hints and retrieval | S12.2        | Owner verifies no leak |

## S13 — Notes and recall (#14)

| ID    | Slice                                                                       | Blocked by | Gate          |
| ----- | --------------------------------------------------------------------------- | ---------- | ------------- |
| S13.1 | **Personal notes** with search, pin, context links and recoverable deletion | S08.1      | Visual review |
| S13.2 | **Explain-back** against scoped evidence with honest feedback               | S08.2      | none          |
| S13.3 | **Short flashcards** distinguishing self-rated from checked                 | S13.1      | none          |

## S14 — Personal release (#15)

| ID    | Slice                                                           | Blocked by | Gate         |
| ----- | --------------------------------------------------------------- | ---------- | ------------ |
| S14.1 | **End-to-end journeys** for both modules with recorded evidence | S11–S13    | Release gate |
| S14.2 | **Access, retention, export and deletion** validated            | S14.1      | Release gate |
| S14.3 | **Interrupted-work recovery**, retry and budget limits verified | S14.1      | Release gate |
| S14.4 | **Deployment runbook** with rollback, no committed secrets      | S14.2      | Release gate |

## S15 — Canvas connector (#16)

| ID    | Slice                                                                            | Blocked by          | Gate  |
| ----- | -------------------------------------------------------------------------------- | ------------------- | ----- |
| S15.1 | **Determine access and supported formats** from bounded sample reads             | owner Canvas access | Owner |
| S15.2 | **Preview/select import** with provenance and honest unsupported-format handling | S15.1               | none  |
| S15.3 | **Repeat-import revision and duplicate detection**                               | S15.2               | none  |

## S16 — Generated practice (#17)

| ID    | Slice                                                                                                  | Blocked by | Gate                    |
| ----- | ------------------------------------------------------------------------------------------------------ | ---------- | ----------------------- |
| S16.1 | **Generation request** from selected authorised sources with explicit type/marks/time and bounded cost | S14.1      | Owner reviews one batch |
| S16.2 | **Validity checks**: ambiguity, answer validity, constraint, near-duplicate                            | S16.1      | none                    |
| S16.3 | **Review-then-publish** honouring reserved-paper protection                                            | S16.2      | Owner reviews one item  |

## S17 — Essay assessment (#18)

| ID    | Slice                                                                    | Blocked by     | Gate            |
| ----- | ------------------------------------------------------------------------ | -------------- | --------------- |
| S17.1 | **Choose the target module and rubric exemplars**                        | owner decision | Owner           |
| S17.2 | **Essay drafting and criterion feedback** accepting defensible positions | S17.1          | Assessment gate |

## S18 — Forecasts (#19)

| ID    | Slice                                                         | Blocked by           | Gate                        |
| ----- | ------------------------------------------------------------- | -------------------- | --------------------------- |
| S18.1 | **Define the forecast target** and its calibration test       | S11.1 with real data | Owner                       |
| S18.2 | **Calibration evaluation against the evidence-only baseline** | S18.1                | Owner decides ship/withhold |

## S19 — Invited sharing (#20)

| ID    | Slice                                                                                           | Blocked by | Gate  |
| ----- | ----------------------------------------------------------------------------------------------- | ---------- | ----- |
| S19.1 | **Permission model**: owner/editor/learner, source visibility separate from question visibility | S14.1      | Owner |
| S19.2 | **Invites and published content** with independent progress                                     | S19.1      | none  |
| S19.3 | **Isolation verification** through retrieval, links, exports and regrades                       | S19.2      | Owner |

## S20 — Public operation (#21)

| ID    | Slice                                                                    | Blocked by | Gate  |
| ----- | ------------------------------------------------------------------------ | ---------- | ----- |
| S20.1 | **Quotas, abuse controls and budget stop behaviour** from pilot evidence | S19.3      | Owner |
| S20.2 | **Onboarding, licensing and rollback ownership**                         | S20.1      | Owner |

---

## Evaluation issues (#26–#30, #35)

These are already well specified; they need input, not more decomposition.

| Issue | What it is waiting for                                  | Decision                                                                                                                                                        |
| ----- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #26   | Reviewed rubrics, conventions, held-out subset          | **Proposed** split, no children created yet: provenance via PR #36 (solutions only), ST2132 rubric labels, CS2100 partial-credit labels. Estimated, not decided |
| #27   | Billed provider pass, timed repair minutes              | Harness exists (PR #32); remaining work is measurement                                                                                                          |
| #28   | Frozen question/answer pairs with confirmed passages    | Not startable without #26 labels                                                                                                                                |
| #29   | #26 labels, thresholds agreed before claims             | Not startable                                                                                                                                                   |
| #30   | #26–#29 evidence, then human review of costs and limits | Hosting decision moves to #44; #30 stays the ADR's review gate                                                                                                  |
| #35   | A real attempt interface above a local store            | Parked; two of its three checks become S05.2; the rest need a deployed Worker                                                                                   |

## What I did not do, and why

I did not create 63 GitHub issues. The workflow forbids dispatching a backlog merely
because it exists, and most slices above are blocked. Creating them all now would
produce a wall of unbuildable tickets and make the frontier harder to see.

All four buildable slices are now issues (see below). Nothing else was promoted.

S21 is marked **delivered** above rather than done: the override shipped in #40/PR #41
with ADR 0003, but stage epic **#22 is still open** and still `needs-triage`. That is a
loose end this document found rather than a slice: #22 can be closed as satisfied, or
left open until a 10.x minimatch fix makes the override removable. The workflow says to
close an issue once its work merges, so closing it is the more consistent choice.

## Promoted so far

| Slice                             | Issue                                                        | Labels            |
| --------------------------------- | ------------------------------------------------------------ | ----------------- |
| S01.1 hosting decision            | [#44](https://github.com/ewonglh/revision-website/issues/44) | `ready-for-human` |
| S01.2 contract freeze             | [#43](https://github.com/ewonglh/revision-website/issues/43) | `ready-for-agent` |
| S02.1 design tokens               | [#45](https://github.com/ewonglh/revision-website/issues/45) | `ready-for-agent` |
| S02.2 persistent module selection | [#46](https://github.com/ewonglh/revision-website/issues/46) | `ready-for-agent` |

Every other slice above stays in this document until its blockers clear. That is
deliberate: an issue that cannot be started is a wish, not a ticket.

## Order I would build in

1. **#44** (decision) — unblocks storage choices; costs no code time.
2. **#45** (tokens) — everything visual depends on the vocabulary.
3. **#46** (module persistence) — first user-observable behaviour, and it stress-tests #45.
4. **#43** (contracts) — needed before any record is persisted, so before S03/S04.

#43 can also run in parallel with #45, since they touch different trees.
