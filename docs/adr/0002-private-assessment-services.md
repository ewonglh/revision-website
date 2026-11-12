# ADR 0002: Evaluate private assessment service boundaries before backend selection

Status: **proposed, not accepted**. Date: 12 November 2026. Parent: [#2](https://github.com/ewonglh/revision-website/issues/2); research slice [#25](https://github.com/ewonglh/revision-website/issues/25); decision review [#30](https://github.com/ewonglh/revision-website/issues/30).

## Context

ADR 0001 accepts the static React/Vite frontend on Cloudflare Pages. Source ingestion, private persistence, retrieval and criterion marking need a backend, but no representative course pack, reviewed answer benchmark or owner budget is available. The reference site supplies no evidence of its internal architecture. A documentation comparison and small synthetic baseline can bound the next experiments but cannot select reliable marking routes.

## Proposed decision

Preserve the static frontend. Separate authenticated owner-scoped APIs and authoritative attempt state, private immutable originals/derived assets, durable bounded jobs, authorised evidence retrieval and versioned assessment results. Treat source access, hidden-solution release and learner response ownership independently. A model supplies AI review; only an actually run deterministic/executed/formal checker supplies its corresponding evidence.

Shortlist (A) Workers/D1/R2/Workflows with a separately chosen identity service and optional Vectorize, and (B) managed Postgres/Auth/Storage with an explicit durable worker. Permit separate native processing compute for extraction/checkers in either option. Start real intake with a tiny manually reviewed pack if automated extraction repair is expensive. Use portable versioned JSON contracts and checkpointed jobs; do not implement all candidate services.

Neither backend candidate, model route, identity provider, retention policy, quality threshold nor strict-deadline proposal is accepted by this ADR. Details and evidence: [evaluation dossier](../evaluation/README.md), [contracts](../evaluation/contracts.md) and [dated cost worksheet](../evaluation/costs.md).

## Alternatives and tradeoffs

- Cloudflare services have a low documented platform floor and convenient Pages integration; application-level access rules, identity integration and cross-service recovery need careful work. D1 limits and the transaction authority must be demonstrated on the chosen slice.
- Managed Postgres/Auth/Storage costs more at its paid floor but provides integrated identity and SQL/RLS tooling; service-role bypass, storage policies, durable scheduling and production usage still need explicit testing.
- Separate native compute accommodates OCR/layout dependencies and sandboxed checkers; it adds operational, IAM, latency and cost dimensions. It complements the state/storage service rather than replacing it.
- Manual reviewed import is viable for a first tiny set and supplies an extraction repair baseline; it scales with human effort.
- An all-in-one hosted RAG service or direct document-to-grade call could reduce setup but has not demonstrated the required per-revision/per-block permissions, reserved-solution isolation, repair workflow or rubric/version history. Do not assume those properties.

## Consequences and acceptance path

The synthetic run demonstrates a lexical paraphrase miss and unsafe unscoped retrieval, not empirical model quality. No infrastructure or API is installed. Architecture acceptance requires the private pack/reviewer inputs in #26, extraction/repair measurements in #27, isolated retrieval comparison in #28, criterion/checker evaluation in #29, and human review in #30 of costs, failure scenarios and retained limitations. Only then record a specific accepted decision and refine one private end-to-end implementation child. #2 stays open until its actual exit gates pass.
