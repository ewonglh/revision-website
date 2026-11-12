# ADR 0002: Evaluate private assessment service boundaries before backend selection

Status: **proposed, not accepted**. Date: 12 November 2026. Parent: [#2](https://github.com/ewonglh/revision-website/issues/2); research slice [#25](https://github.com/ewonglh/revision-website/issues/25); decision review [#30](https://github.com/ewonglh/revision-website/issues/30).

## Context

ADR 0001 accepts the static React/Vite frontend on Cloudflare Pages. Source ingestion, private persistence, retrieval and criterion marking need a backend. A first private pack of 55 pages has since been received and probed locally; it contains tutorial sheets and solutions for ST2132 and lecture decks for both modules, but no MIPS program, no rubric-labelled multipart proof and no reviewed grading benchmark. The owner can supply further lecture notes/tutorials/solutions for both modules and CS2100 Canvas questions; prefers typed answers with provisional AI marks/manual review; and targets $20/month for DeepSeek through a custom provider at about 1,000 responses/day and a library below 100 MB. The owner specifies DeepSeek-V4.1-Flash-1017 at official API rates, microdollar billing (USD), and 1,000 submitted answers/day. Custom-provider passthrough and actual consumption remain untested. The reference site supplies no evidence of its internal architecture. A documentation comparison, a small synthetic baseline and a text-layer probe can bound the next experiments but cannot select reliable marking routes.

## Proposed decision

Preserve the static frontend. Separate authenticated owner-scoped APIs and authoritative attempt state, private immutable originals/derived assets, durable bounded jobs, authorised evidence retrieval and versioned assessment results. Treat source access, hidden-solution release and learner response ownership independently. A model supplies AI review; only an actually run deterministic/executed/formal checker supplies its corresponding evidence.

Shortlist (A) Workers/D1/R2/Workflows with a separately chosen identity service and optional Vectorize, and (B) managed Postgres/Auth/Storage with an explicit durable worker. Permit separate native processing compute for extraction/checkers in either option. Start real intake with a tiny manually reviewed pack if automated extraction repair is expensive. Use portable versioned JSON contracts and checkpointed jobs; do not implement all candidate services.

Neither backend candidate, model route, identity provider, retention policy, quality threshold nor strict-deadline proposal is accepted by this ADR. Details and evidence: [evaluation dossier](../evaluation/README.md), [contracts](../evaluation/contracts.md) and [dated cost worksheet](../evaluation/costs.md).

## Alternatives and tradeoffs

- Cloudflare services have a low documented platform floor and convenient Pages integration; application-level access rules, identity integration and cross-service recovery need careful work. D1 limits and the transaction authority must be demonstrated on the chosen slice.
- Managed Postgres/Auth/Storage costs more at its paid floor but provides integrated identity and SQL/RLS tooling; service-role bypass, storage policies, durable scheduling and production usage still need explicit testing.
- Separate native compute accommodates OCR/layout dependencies and sandboxed checkers; it adds operational, IAM, latency and cost dimensions. It complements the state/storage service rather than replacing it.
- Manual reviewed import is viable for a first tiny set and supplies an extraction repair baseline; it scales with human effort.
- The received pack shows raw text extraction is unsafe to trust: big operators decode to ordinary letters and diagram topology is absent, so extraction quality cannot be inferred from a successful parse. Budget human repair per page, keep a rendered page for diagrams, and treat an unreviewed extraction as unmarkable rather than merely imperfect.
- An all-in-one hosted RAG service or direct document-to-grade call could reduce setup but has not demonstrated the required per-revision/per-block permissions, reserved-solution isolation, repair workflow or rubric/version history. Do not assume those properties.

## Consequences and acceptance path

The synthetic run demonstrates a lexical paraphrase miss and unsafe unscoped retrieval, not empirical model quality. The pack probe demonstrates silent symbol and diagram loss in the raw text layer, not which extraction route to buy. No infrastructure or API is installed. Architecture acceptance requires the private pack/reviewer inputs in #26, extraction/repair measurements in #27, isolated retrieval comparison in #28, criterion/checker evaluation in #29, and human review in #30 of costs, failure scenarios and retained limitations. Only then record a specific accepted decision and refine one private end-to-end implementation child. #2 stays open until its actual exit gates pass.
