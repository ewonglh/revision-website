# ADR 0002: Evaluate private assessment service boundaries before backend selection

Status: **partly accepted — personal-use hosting accepted 14 November 2026; multi-user, identity, retention, quality thresholds and deadline policy remain proposed, not accepted**. Date: 12 November 2026. Parent: [#2](https://github.com/ewonglh/revision-website/issues/2); research slice [#25](https://github.com/ewonglh/revision-website/issues/25); hosting decision [#44](https://github.com/ewonglh/revision-website/issues/44); architecture review gate [#30](https://github.com/ewonglh/revision-website/issues/30).

## Context

ADR 0001 accepts the static React/Vite frontend on Cloudflare Pages. Source ingestion, private persistence, retrieval and criterion marking need a backend. A first private pack of 55 pages has since been received and probed locally; it contains tutorial sheets and solutions for ST2132 and lecture decks for both modules, but no MIPS program, no rubric-labelled multipart proof and no reviewed grading benchmark. The owner can supply further lecture notes/tutorials/solutions for both modules and CS2100 Canvas questions; prefers typed answers with provisional AI marks/manual review; and targets **$20/month for grading calls** plus a **separate $100/month for ingesting source files and syllabus content** through a custom provider, at about 1,000 submitted answers/day and a library below 100 MB. The owner specifies DeepSeek-V4.1-Flash-1017 at official API rates, microdollar billing (USD), and 1,000 submitted answers/day. Custom-provider passthrough and actual consumption remain untested. The reference site supplies no evidence of its internal architecture. A documentation comparison, a small synthetic baseline and a text-layer probe can bound the next experiments but cannot select reliable marking routes.

## Accepted decision: personal-use hosting

Accepted 14 November 2026 by the owner (issue [#44](https://github.com/ewonglh/revision-website/issues/44); reasoning in [the hosting memo](../refinement/s01-1-hosting-memo.md)). This is the **only** part of this ADR that is accepted.

| Piece                       | Choice                                    | Why                                             |
| --------------------------- | ----------------------------------------- | ----------------------------------------------- |
| Frontend                    | Static React/Vite on Cloudflare Pages     | ADR 0001, already accepted and unchanged        |
| Key holder + provider proxy | One Cloudflare Worker                     | The only place the provider key exists          |
| Attempts and results        | D1 (free tier)                            | One user's volume is far below the free tier    |
| Extraction and marking      | Synchronous request, bounded time         | No queue or durable workflow at personal volume |
| Identity                    | Cloudflare Access, or a long-lived cookie | One user; no multi-tenant model                 |
| Secrets                     | Worker secrets only                       | Never in the repo, the bundle or a request body |

The forcing constraint is single: the provider key cannot reach the browser. A static build ships any bundled value to anyone who opens devtools, `AGENTS.md` forbids committing secrets, `docs/feature-spec.md` requires credentials never become browser-visible configuration, and Vite inlines `VITE_`-prefixed variables into the bundle by design.

**Cost, as owner targets rather than measurements:** Pages, Worker and D1 free tiers; plus the two provider budgets in the Context above. No billed call has run, so no figure here is verified.

**Checks that would prove the shape** (run at the personal release, S14):

1. The key never reaches the client — grep the built `dist/` and watch a network request in devtools; neither contains it.
2. A saved attempt survives a page reload and a browser restart.
3. A failed provider call produces a visible error, not a blank mark and not a fabricated zero.
4. The key can be rotated by changing one Worker secret, with no frontend deploy.
5. D1 unavailability leaves the attempt in a local draft rather than losing it.

**Explicitly deferred, not evaluated:** multi-tenant identity and row-level security; service-role bypass review; outbox dispatch and at-least-once semantics; fenced lease tokens; per-block solution authorisation inside a shared PDF; invited-pilot release policy; retention and deletion of other people's data; the failure-recovery matrix in [contracts](../evaluation/contracts.md). A second user is the trigger to revisit all of it.

**What would invalidate the accepted rows:** marking running longer than a Worker request may (a queue becomes necessary, so the synchronous row fails); D1's limits or backup story proving unacceptable (the storage row changes to managed Postgres; the frontend and Worker rows are unaffected); or a second user being added.

Accepting this does **not** close [#30](https://github.com/ewonglh/revision-website/issues/30). #44 recorded the hosting decision; #30 remains this ADR's human review gate for the wider architecture, and stays open until the evidence in #26–#29 exists.

## Proposed decision (not accepted)

Preserve the static frontend. Separate authenticated owner-scoped APIs and authoritative attempt state, private immutable originals/derived assets, durable bounded jobs, authorised evidence retrieval and versioned assessment results. Treat source access, hidden-solution release and learner response ownership independently. A model supplies AI review; only an actually run deterministic/executed/formal checker supplies its corresponding evidence.

Shortlist (A) Workers/D1/R2/Workflows with a separately chosen identity service and optional Vectorize, and (B) managed Postgres/Auth/Storage with an explicit durable worker. Permit separate native processing compute for extraction/checkers in either option. Start real intake with a tiny manually reviewed pack if automated extraction repair is expensive. Use portable versioned JSON contracts and checkpointed jobs; do not implement all candidate services.

Neither shortlisted backend candidate, model route, identity provider, retention policy, quality threshold nor strict-deadline proposal is accepted by this ADR beyond the personal-use hosting rows above. Details and evidence: [evaluation dossier](../evaluation/README.md), [contracts](../evaluation/contracts.md) and [dated cost worksheet](../evaluation/costs.md).

## Alternatives and tradeoffs

- Cloudflare services have a low documented platform floor and convenient Pages integration; application-level access rules, identity integration and cross-service recovery need careful work. D1 limits and the transaction authority must be demonstrated on the chosen slice.
- Managed Postgres/Auth/Storage costs more at its paid floor but provides integrated identity and SQL/RLS tooling; service-role bypass, storage policies, durable scheduling and production usage still need explicit testing.
- Separate native compute accommodates OCR/layout dependencies and sandboxed checkers; it adds operational, IAM, latency and cost dimensions. It complements the state/storage service rather than replacing it.
- Manual reviewed import is viable for a first tiny set and supplies an extraction repair baseline; it scales with human effort.
- The received pack shows no single extraction route can be the artifact marking reads from. The raw `get_text()` route decodes big operators to ordinary letters, drops diagram topology and collapses datapath tables. A same-day measurement found `find_tables()` recovering the ruled truth tables exactly (10/10 and 16/16 rows against arithmetic), while reading those same pages as images at the provider's 1024-token downscale scored 5/10 on the dense numeric table yet 5/5 on the large-type diagram page. The owner has accordingly confirmed a **mixed route** rather than a single extractor: choose per content type, and treat disagreement between routes as a check. Vision output needs a non-vision check wherever one exists. Record a page render and an anchored interpretation, noting which route produced it and what validated it, and treat an unreviewed interpretation as unmarkable rather than merely imperfect.
- An all-in-one hosted RAG service or direct document-to-grade call could reduce setup but has not demonstrated the required per-revision/per-block permissions, reserved-solution isolation, repair workflow or rubric/version history. Do not assume those properties.

## Consequences and acceptance path

The synthetic run demonstrates a lexical paraphrase miss and unsafe unscoped retrieval, not empirical model quality. The pack probe demonstrates silent symbol and diagram loss in the raw text route, and the follow-up measurement shows the loss is route-specific rather than total: table structure is recoverable deterministically, dense numeric tables defeat a downscaled vision read, and large-type diagrams are read correctly. It does not establish any provider's accuracy, which #27 must measure with a billed call. No infrastructure or API is installed. Architecture acceptance requires the private pack/reviewer inputs in #26, extraction/repair measurements in #27, isolated retrieval comparison in #28, criterion/checker evaluation in #29, and human review in #30 of costs, failure scenarios and retained limitations. Only then record a specific accepted decision and refine one private end-to-end implementation child. #2 stays open until its actual exit gates pass.
