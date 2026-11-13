# S01.1 — Personal hosting decision memo

Status: proposal for owner sign-off. Date: 14 November 2026.
Related: [ADR 0002](../adr/0002-private-assessment-services.md) (proposed),
[#30](https://github.com/ewonglh/revision-website/issues/30), assumption A01 in
[assumptions.md](assumptions.md).

## The decision being asked for

Adopt a one-user hosting shape — static Pages frontend, one Worker, one D1 database —
and accept ADR 0002 for personal use only, with the multi-user concerns explicitly
deferred rather than evaluated.

## The one constraint that forces a server

The provider key cannot live in the browser. A static build on Cloudflare Pages ships
any bundled value to anyone who opens devtools, and `AGENTS.md` forbids secrets in
Vite environment variables. Everything else in this memo follows from that single
requirement.

## Recommended shape

| Piece                       | Choice                                    | Why                                                      |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Frontend                    | Static React/Vite on Cloudflare Pages     | ADR 0001, already accepted                               |
| Key holder + provider proxy | One Cloudflare Worker                     | The only place the key exists                            |
| Attempts and results        | D1 (free tier)                            | ~1,000 answers/day for one person is far below any limit |
| Extraction and marking      | Synchronous request, bounded time         | No queue or durable workflow at personal volume          |
| Identity                    | Cloudflare Access, or a long-lived cookie | One user; no multi-tenant model                          |
| Secrets                     | Worker secrets only                       | Never in the repo, the bundle or a request body          |

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

## Acceptance checks that would prove it

These are the checks S14 and #35 should run, stated now so the decision is testable:

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

## What this memo does not establish

- That the marking is any good — that is #29, and it is unmeasured.
- That the cost targets are achievable — no billed call has run.
- That the chosen provider route behaves like the in-session readings. The vision
  harness (PR #32) exists precisely because that is unverified.
