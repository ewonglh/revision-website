# S01.1 — Personal hosting decision memo

Status: **owner-approved 14 November 2026** ("im fine with it, cloudflare worker is
free"). The remaining work is the ADR 0002 amendment described at the end, not another
decision. Date: 14 November 2026.
Related: [ADR 0002](../adr/0002-private-assessment-services.md) (proposed),
[#30](https://github.com/ewonglh/revision-website/issues/30), assumption A01 in
[assumptions.md](assumptions.md).

## The decision being asked for

Adopt a one-user hosting shape — static Pages frontend, one Worker, one D1 database —
and accept ADR 0002 for personal use only, with the multi-user concerns explicitly
deferred rather than evaluated.

## The one constraint that forces a server

The provider key cannot live in the browser. A static build on Cloudflare Pages ships
any bundled value to anyone who opens devtools. Three documents agree: `AGENTS.md`
forbids committing secrets; `docs/feature-spec.md` requires that credentials never
become browser-visible application configuration; and Vite's `VITE_`-prefixed
variables are inlined into the bundle by design, so they cannot hold a secret even if
one were never committed. Everything else in this memo follows from that single
requirement.

## Recommended shape

| Piece                       | Choice                                    | Why                                                                                                                       |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend                    | Static React/Vite on Cloudflare Pages     | ADR 0001, already accepted                                                                                                |
| Key holder + provider proxy | One Cloudflare Worker                     | The only place the key exists                                                                                             |
| Attempts and results        | D1 (free tier)                            | One user's volume is far below D1's free tier; the 1,000/day figure is a throughput target, not a measurement (see below) |
| Extraction and marking      | Synchronous request, bounded time         | No queue or durable workflow at personal volume                                                                           |
| Identity                    | Cloudflare Access, or a long-lived cookie | One user; no multi-tenant model                                                                                           |
| Secrets                     | Worker secrets only                       | Never in the repo, the bundle or a request body                                                                           |

## What this buys

- One deployable, one place secrets live, one database to back up.
- No service that bills by the minute or runs unattended.
- The frontend stays exactly what ADR 0001 chose, so the UI work in S02 is unaffected
  by this decision.

## What it costs, honestly

| Item            | Cost                                                              |
| --------------- | ----------------------------------------------------------------- |
| Pages           | Free tier                                                         |
| Worker requests | Free tier covers personal volume                                  |
| D1              | Free tier                                                         |
| Provider calls  | The two existing budgets: $20/month grading, $100/month ingestion |

No measured figure exists for actual provider spend at your volume. The budgets are
owner targets, not estimates this memo can verify.

The **1,000 submitted answers/day** figure in `docs/evaluation/` is a throughput
target the owner set, and #26 still asks for it to be confirmed or revised; it is not a
measured personal volume. Nothing here depends on it: one person's real volume is
smaller than any figure the plan carries, and the D1 row would only need revisiting if
that target turned out to be a per-user multiplier for an invited pilot.

## Acceptance checks that would prove it

These are the checks **S14** should run, stated now so the decision is testable. Two of
them (2 and 3) are also within **#35**'s boundary, which is deterministic lifecycle
tests against a local or in-memory store; the other three need a deployed Worker, real
secrets or real D1, which #35 explicitly excludes.

1. **The key never reaches the client.** Grep the built `dist/` for the key and watch
   a network request in devtools; neither may contain it.
2. **A saved attempt survives a page reload and a browser restart.**
3. **A failed provider call produces a visible error**, not a blank mark and not a
   fabricated zero.
4. **The key can be rotated** by changing one Worker secret, with no frontend deploy.
5. **D1 unavailability leaves the attempt in a local draft** rather than losing it.

## What would make this wrong

- If marking needs to run longer than a Worker request may, a queue becomes necessary
  and the "synchronous" row fails.
- If you later want a second user, identity isolation, row-level security and budget
  isolation become real work — this shape does not provide them.
- If D1's limits or backup story are unacceptable for your data, the storage row
  changes to managed Postgres; the frontend and Worker rows are unaffected.

## Explicitly deferred, not evaluated

Multi-tenant identity and row-level security; service-role bypass review; outbox
dispatch and at-least-once semantics; fenced lease tokens; per-block solution
authorisation inside a shared PDF; invited-pilot release policy; retention and
deletion of other people's data; the failure-recovery matrix in
`docs/evaluation/contracts.md`.

A second user is the trigger to revisit all of it.

## Is this enough to accept ADR 0002?

No, and it should not be. ADR 0002 currently bundles backend choice with
identity, retention, quality thresholds and deadline policy. This memo resolves the
**hosting** question for one user. Accepting ADR 0002 as written would also imply
decisions this memo has not made.

**Recommendation:** amend ADR 0002 to record the personal-use hosting decision as
accepted, and leave the multi-user section proposed. That keeps one ADR rather than
splitting into a fourth, while making the accepted scope unambiguous.

### How #30 and #44 divide the work

They currently overlap: both ask for the same ADR amendment. They should not:

- **#44** records the accepted _hosting shape_ — this memo, in the ADR's status line
  and its accepted-scope section.
- **#30** stays the ADR's **human-review gate** for the whole architecture, exactly as
  ADR 0002:28 says ("human review in #30 of costs, failure scenarios and retained
  limitations"). It stays open and `needs-info` until #26–#29 supply the evidence that
  gate is waiting for.

So amending the ADR via #44 does **not** close #30, and must not read as if it did. The
amendment should name #44 as the recorder of the hosting decision and restate #30 as the
remaining acceptance path, so the ADR does not end up claiming an acceptance it has not
been given.

## What this memo does not establish

- That the marking is any good — that is #29, and it is unmeasured.
- That the cost targets are achievable — no billed call has run.
- That the chosen provider route behaves like the in-session readings. The vision
  harness (PR #32) exists precisely because that is unverified.
