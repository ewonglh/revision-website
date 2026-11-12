# Ingestion, marking and architecture evaluation

Research date: 12 November 2026. Parent: [#2](https://github.com/ewonglh/revision-website/issues/2). Desk study: [#25](https://github.com/ewonglh/revision-website/issues/25). No backend is implemented or provider selected. ADR 0001 remains accepted; [ADR 0002](../adr/0002-private-assessment-services.md) is proposed.

## Findings and evidence limits

The useful next experiment is a reviewed original-to-extracted question and source pack, followed by separate retrieval and marking comparisons. Documentation supports feasible service options; it cannot establish equation fidelity, proof assessment reliability or repair effort on the owner's material.

The repository initially contained no course pack, trusted solutions, answer benchmark, account configuration or budget. The live epic had no comments, children or incoming blockers when checked; it blocks stage #4. The reference-site audit describes visible behaviour and supplies no backend architecture evidence.

The original [synthetic pack](../../evaluation/synthetic-pack.json) contains 8 questions, 18 draft answer cases, 13 passages (8 eligible and 5 isolation decoys), 12 retrieval queries, a table, formatted MIPS, equations, multipart links and an original [functional diagram](../../evaluation/circuit.svg). All content is invented for this evaluation. `p1` etc. are logical fixture anchors, not claims about pages extracted from a PDF. Draft rubric/answer labels have no independent human calibration. Nothing is used as production content.

Run from the repository root with Node 24:

```sh
node evaluation/run-baseline.mjs
node evaluation/costs.mjs
```

The baseline ranks distinct overlapping alphanumeric tokens, drops zero-overlap results and returns at most three after an explicit fixture scope filter. It has no embeddings, reranker, model calls or application integration. The script prints a fixture SHA-256 for each run; the [recorded result](../../evaluation/baseline-results.json) identifies the exact pack used.

| Executed check                | Result                                    | Interpretation                                                                                      |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Scoped lexical retrieval      | 9/10 gold passages found at k=3           | Misses `paraphrase`; tiny authored corpus, no generalisation claim                                  |
| Gold-hit precision at k=3     | 9/16 returned hits (56.25%)               | Authored relevance labels only; not a human-adjudicated support/citation score                      |
| No-evidence queries           | 2/2 return no hits                        | Includes one absent subject and one sentinel attack                                                 |
| Forbidden hits                | 0 scoped; 9 hit occurrences without scope | Negative control demonstrates need for access filtering; no production authorisation claim          |
| Exact-set choice scoring      | 5 cases pass                              | Includes order independence, incomplete/superset and blank choices; reasoning remains separate      |
| Two confirmed XOR expressions | Both match all 4 input rows               | Only these two combinational expressions; no drawing recognition, timing or arbitrary-circuit claim |
| Wrong OR expression           | Rejected by truth-table counterexample    | A meaningful negative control                                                                       |

Some retrieved matches are irrelevant; a nonempty result must not be treated as sufficient evidence. No PDF/OCR extraction, repair timing, dense retrieval, AI grading, proof verification, MIPS assembly/execution, image interpretation, production permissions or deadline/recovery test ran. These are explicit follow-up gates, not silently passing results.

## Bounded delivery and missing inputs

| Child                                                        | State after refinement               | Outcome / dependency                                                                                     |
| ------------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [#25](https://github.com/ewonglh/revision-website/issues/25) | ready-for-agent, claimed for this PR | Synthetic baseline, dated desk study and proposals; unblocked                                            |
| [#26](https://github.com/ewonglh/revision-website/issues/26) | needs-info                           | Private representative pack, trusted grading labels, conventions, budget and review policy; owner inputs |
| [#27](https://github.com/ewonglh/revision-website/issues/27) | needs-info                           | Measure extraction and repair; blocked by #25, #26                                                       |
| [#28](https://github.com/ewonglh/revision-website/issues/28) | needs-info                           | Evaluate retrieval relevance and isolation; blocked by #25–#27                                           |
| [#29](https://github.com/ewonglh/revision-website/issues/29) | needs-info                           | Evaluate marking/checker routes; blocked by #25–#28                                                      |
| [#30](https://github.com/ewonglh/revision-website/issues/30) | needs-info                           | Human architecture/threshold decision against evidence; blocked by #25–#29                               |

Native sub-issue and blocking edges are recorded on GitHub. Each child has its own outcome, acceptance criteria, non-goals, test boundary and unresolved-input gate. Only #25 is claimed; there is no backlog dispatch. #2 stays open and needs-triage. Merging this research does not satisfy its empirical or architecture-acceptance gates.

The next independent action is #26: inventory a small private pack and agree draft labels/quality thresholds. Start with one ST2132 multipart problem plus proof, CS2100 keyed/applied/MIPS/circuit tasks and just their supporting excerpts. Keep originals, answers and raw outputs outside Git. An official key is useful but does not by itself supply reviewed partial-credit/alternative-answer labels.

Unknowns remain: semester/exam rules, notation, MIPS subset/delay slots/calling convention, circuit representation, trusted rubrics and precedence, handwriting frequency, acceptable provisional/manual review, budget/pages/answers/pilot audience, and Canvas export/API availability. The synthetic conventions and cost scenarios below are research assumptions only. No Canvas access is needed for this desk study.

## Evaluation matrix and proposed gates

These are starting thresholds for review in #26/#30, not accepted reliability promises. Freeze sources, gold labels and a held-out subset before tuning. Start with at least 5 reviewed cases per format to find failures, then grow the benchmark; this sample cannot establish production error rates. Publish counts, disagreements and uncertainty, including abstention coverage, rather than an average across unrelated tasks.

| Surface                        | Identical comparison inputs and measurements                                                                                       | Proposed promotion gate                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Equations / tables             | Text and scan versions; symbols, fractions, subscripts, domains, table cells; error counts before/after repair; timed minutes/page | Zero critical semantic errors after review; report unreviewed fidelity separately                                                                   |
| Multipart structure            | Shared assumptions, nested labels, marks, dependency edges, solution separation                                                    | All required parts/dependencies retained; no detached-context publication                                                                           |
| Diagrams / code                | Wires, junctions, labels, assets; MIPS whitespace/opcodes/registers; original crop links                                           | Confirm interpretation; uncertain diagram stays review-only; code transcription reviewed                                                            |
| Source anchors                 | Revision hash, physical page index, printed label, bounding box and excerpt                                                        | Every evaluated citation resolves to the authorised exact revision/crop                                                                             |
| Retrieval                      | Same queries, gold anchors, lexical versus dense/hybrid; recall@3, relevant-hit precision, no-evidence cases, cost/latency         | Draft recall >=95%, relevant-hit precision >=90%; zero forbidden hits; report denominators and failures                                             |
| Choice score                   | Single/exact-set/declared partial-credit keys, blank/skipped distinctions                                                          | 100% against reviewed keys/policies; reasoning assessed independently                                                                               |
| Calculations / applied answers | Gold evidence first, then retrieved evidence; criterion agreement, absolute score error, alternative rejection                     | Draft >=95% criterion agreement and mean absolute error <=5% of available marks per format; zero known correct-alternative rejection in release set |
| Proofs / MIPS / circuits       | Correct alternative, partial, misconception, wrong-confident, ambiguous, unreadable and adversarial cases                          | Same draft rubric targets, plus zero unsupported verification/execution claims; label AI review provisional until reviewed acceptance               |
| Abstention / uncertainty       | Missing/conflicting source, unreadable input, malformed output, unsupported criterion                                              | Every designated unsafe case abstains/requests review on affected criteria; report answered fraction and error among answered cases                 |

Partial/follow-through scoring needs explicit criterion dependencies. Do not penalise the same carried error repeatedly or let a valid downstream method erase an upstream error. Correct pick with flawed reasoning retains its key score but yields separate learning evidence. Mark scores for unresolved criteria as null/pending, never zero by default. Novel proofs remain AI-reviewed even if a definition citation is correct.

For #27, compare Docling local layout/OCR with a pinned managed OCR route, optionally a multimodal direct-page route. Measure identical pages, extraction configuration, raw and repaired structural/symbol errors, human repair time, latency and total cost. Export canonical JSON plus original assets; test exact anchors after repair. No extraction candidate has yet been run, so the repair-time/fidelity cells remain unmeasured.

For #28, compare lexical and dense/hybrid retrieval independently with gold relevance labels. Include cross-owner/semester/revision decoys, source retirement, same-file protected solution crops, misleading student assertions and malicious source instructions. Scope before search and recheck at asset/citation fetch. A vector namespace or a single positive lexical result is insufficient authorisation or evidence.

For #29, run at least two accessible candidate models with gold context before end-to-end retrieved context. Record model snapshot, settings, prompt/schema/rubric/source/checker versions, token use, latency, repeats and human adjudication. Use a fixed cap per run and disable unrestricted tools. Compare deterministic choice scores separately. Optional simulators must use a pinned ISA and bounded sandbox; only run checks may appear in `checksPerformed`. Boolean tables cover confirmed finite combinational functions, not sequential/timing behaviour. Use reviewed correct alternatives and held-out examples to expose benchmark overfitting.

See [service and ingestion comparison](candidates.md), [contracts and failure recovery](contracts.md), [cost worksheet](costs.md) and [official evidence register](sources.md).
