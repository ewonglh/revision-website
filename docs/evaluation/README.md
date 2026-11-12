# Ingestion, marking and architecture evaluation

Research date: 12 November 2026. Parent: [#2](https://github.com/ewonglh/revision-website/issues/2). Desk study: [#25](https://github.com/ewonglh/revision-website/issues/25). Intake: [#26](https://github.com/ewonglh/revision-website/issues/26); local extraction probe for [#27](https://github.com/ewonglh/revision-website/issues/27). No backend is implemented or provider selected. ADR 0001 remains accepted; [ADR 0002](../adr/0002-private-assessment-services.md) is proposed.

## Findings and evidence limits

The useful next experiment is a reviewed original-to-extracted question and source pack, followed by separate retrieval and marking comparisons. Documentation supports feasible service options; it cannot establish equation fidelity, proof assessment reliability or repair effort on the owner's material.

The repository initially contained no course pack, trusted solutions, answer benchmark, account configuration or budget. The live epic had no comments, children or incoming blockers when checked; it blocks stage #4. The reference-site audit describes visible behaviour and supplies no backend architecture evidence.

A first private pack has now been received and probed ([local extraction evidence](#local-extraction-evidence-from-the-received-pack)). It is small and uneven: two ST2132 tutorial sheets with solutions, two annotated ST2132 lecture decks and one CS2100 logic-circuits deck. It contains no MIPS program, no multipart proof with rubric, and no reviewed grading labels. The findings below are measured on real pages but do not establish marking accuracy or generalise to the wider course library.

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

## Local extraction evidence from the received pack

Received 12 November 2026 and processed locally with PyMuPDF 2.0 (MuPDF 1.28.5). Originals, extracted text and page renders stay in the git-ignored `private/` tree; only aggregate counts are published here. No model, OCR service or network call was used, and no equation or diagram was judged correct by a human reviewer yet. Treat these as measurement of the _text layer_, not a review of extraction quality.

### Pack shape

| File               | Kind                    | Pages |  Text chars | Notes                                                              |
| ------------------ | ----------------------- | ----: | ----------: | ------------------------------------------------------------------ |
| `T6`, `T7`         | ST2132 tutorial sheets  |     1 | 1,033-1,327 | pdfTeX output; dense inline notation                               |
| `T6_sol`, `T7_sol` | ST2132 solutions        |     1 | 1,296-2,219 | same generator; heavy superscript/subscript use                    |
| `L12`, `L13`       | ST2132 annotated slides | 14/11 | 3,774/3,160 | 19 pages carry 690 handwritten **Ink** annotations, none with text |
| `Lect14`           | CS2100 logic circuits   |    26 |       6,896 | slides; 8 content images on 5 pages, plus a repeated QR code       |

The lecture decks are the risk case. Rendering the whole pack at 200 dpi took 2.7 s and produced 7.0 MB of PNG in total, so a page-image route is cheap for this size but scales with page count rather than with text.

A second intake on the same day added the CS2100 task material that was missing from the first: `tut07qns.pdf` (4 pages) and `tut07_selected_ans.pdf` (6 pages), Tutorial #7 on combinational circuits, generated from Word. These are the first pages in the pack that carry a real asked-for-answer circuit problem rather than lecture exposition, and the answers include two alternative solutions for one part. Their text layer behaves differently from the TeX files: prose extracts correctly and there are no big-operator or PUA failures of the kind above (21 PUA characters total, no replacement characters). The failure is structural instead. On the answer page the component and pin labels all extract (`A B C D 0 0 A B C 4-bit //adder X3 X2 X1 X0 Cin S3 ...`) but the connections between them do not, so the recovered text describes a parts list rather than a circuit. Truth-table pages extract as long unaligned digit runs with no row/column structure.

These two files still do not make the pack a grading benchmark: there are no rubric-labelled partial-credit or alternative-answer labels, MIPS is still absent, and the "selected answers" provenance (which questions were omitted, and why) has not been confirmed.

### What the text layer loses silently

Four distinct failures, each verified by reading the rendered page against the extracted text:

| Failure                                | Measured evidence                                                                                                                                                                   | Why it matters                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Big operators become ASCII letters** | TeX `CMEX10` glyphs extract as `U+0050` (`P`) and `U+0058` (`X`); 50 such glyphs across the five TeX files. `∑_{i=1}^{k} p_i` becomes `Pk i=1 pi`                                   | Text looks plausible and is wrong. A model reading this sees a variable, not a summation     |
| **Symbol-font glyphs land in the PUA** | 46 characters in `U+F0xx` (SymbolMT/Wingdings2) on 11 `Lect14` pages; the AND operator `·` is `U+F0D7`                                                                              | Extraction "succeeds" but yields undefined codepoints that render as nothing in most viewers |
| **Subscripts flatten into the run**    | 869 script spans across the pack, imbalanced toward subscripts (612 sub, 132 sup, 125 ambiguous). Plain text emits both as ordinary inline characters: `X1` for `X₁`, `σ2` for `σ²` | Stored text loses the index/restriction distinction, which is often the whole answer         |
| **Piecewise and matrices flatten**     | `T6` density `{λe^{-λx}, x>0; 0, x≤0}` becomes a stray `U+001A` plus wrapped lines; `T7_sol` pool definition flattens to `R^k +,`                                                   | Structure is lost even though every symbol survives; repair is manual                        |

Superscripts are partly recoverable: XHTML output does emit `<sup>`, so `σ²` survives on the rich-text route where plain text flattens it. There are **zero** `<sub>` tags, and subscripts outnumber superscripts roughly 5:1 in this pack, so the XHTML route fixes the minority case and leaves the common one (`X_i`, `p_i`, `S²` indices) indistinguishable from adjacent letters.

### What the text layer does not contain at all

- **Circuit topology.** On `Lect14` p21 the Opcode truth table extracts cleanly (6x8 grid via `find_tables`), but the circuit it describes exists only as 187 vector paths. Gate shapes, wires and junctions have no text representation. On p5 the gate symbols likewise vanish while the surrounding table survives.
- **Diagram-as-image pages.** p20 (`PLA Example`) has a complete 6-column truth table and a PLA circuit, both stored as raster images. The text layer holds only the slide title, and `find_tables` returns nothing.
- **Handwritten annotations.** All 690 Ink annotations have empty content. If the owner's marginal notes carry worked solutions or corrections, a text-only pipeline discards them entirely; they exist only as ink over the rendered page.

### Consequences for the evaluation plan

1. **The text layer is not a safe input for marking on this material.** Silent symbol corruption fails in the worst direction: the model receives fluent, wrong mathematics with no signal that anything was lost. Per [contracts](contracts.md), these pages are readable but must not be auto-marking eligible until repaired and reviewed.
2. **A repairs-versus-routing decision is now measurable.** Either canonicalise math at extraction (big-operator and PUA mapping, script recovery) and keep a rendered page for diagrams, or send page images for the diagram/math pages. The pack shows the split plainly: TeX pages need symbol fixes, slide pages need vision.
3. **Chain-of-custody is required, not optional.** Because the corruption is invisible, every extracted span that feeds marking needs a source anchor back to the physical page and a repair record. A stored excerpt that has silently changed meaning is worse than a missing one.
4. **Diagram questions need a rendered crop regardless of route.** A truth table can be checked from text; the circuit that the question actually asks about cannot.

Not measured: human repair time per page, a second extraction route for comparison (no OCR engine or Docling is installed locally, so the compare-with-managed-route half of #27 is unrun), true OCR on the raster pages, and any marking quality. The `T6_sol`/`T7_sol` files are assumed to be official teaching-team solutions; the owner has not yet confirmed their provenance for grading use.

A page-image route is now feasible on the already-chosen provider rather than a new one: `deepseek-flash` accepts images [S23]. PDF is not an accepted format, so pages must be rendered first, and the 1024-token-per-image cap downscales A4 pages to about 1093x1545. Spot checks of the CS2100 circuit and answer pages at exactly that size remained legible, but legibility is not measured recognition accuracy and no vision call has been made. See [candidate comparison](candidates.md) for the caveat about one model performing extraction and marking.

## Bounded delivery and missing inputs

| Child                                                        | State after refinement               | Outcome / dependency                                                                                    |
| ------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [#25](https://github.com/ewonglh/revision-website/issues/25) | ready-for-agent, claimed for this PR | Synthetic baseline, dated desk study and proposals; unblocked                                           |
| [#26](https://github.com/ewonglh/revision-website/issues/26) | needs-info, partially satisfied      | First pack received and inventoried; still needs reviewed grading labels, conventions and budget review |
| [#27](https://github.com/ewonglh/revision-website/issues/27) | needs-info, local probe done         | Text-layer loss measured on 55 real pages; second route, repair timing and OCR unmeasured               |
| [#28](https://github.com/ewonglh/revision-website/issues/28) | needs-info                           | Evaluate retrieval relevance and isolation; blocked by #25–#27                                          |
| [#29](https://github.com/ewonglh/revision-website/issues/29) | needs-info                           | Evaluate marking/checker routes; blocked by #25–#28                                                     |
| [#30](https://github.com/ewonglh/revision-website/issues/30) | needs-info                           | Human architecture/threshold decision against evidence; blocked by #25–#29                              |

Native sub-issue and blocking edges are recorded on GitHub. Each child has its own outcome, acceptance criteria, non-goals, test boundary and unresolved-input gate. Only #25 is claimed; there is no backlog dispatch. #2 stays open and needs-triage. Merging this research does not satisfy its empirical or architecture-acceptance gates.

The next independent action is #26: inventory a small private pack and agree draft labels/quality thresholds. Start with one ST2132 multipart problem plus proof, CS2100 keyed/applied/MIPS/circuit tasks and just their supporting excerpts. Keep originals, answers and raw outputs outside Git. An official key is useful but does not by itself supply reviewed partial-credit/alternative-answer labels.

Owner follow-up on 12 November: ST2132 and CS2100 lecture notes, tutorial sheets and solutions can be supplied privately, and CS2100 Canvas quiz questions can be exposed. A first slice has since been received and probed (see [local extraction evidence](#local-extraction-evidence-from-the-received-pack)): two ST2132 tutorial sheets with solutions, two annotated ST2132 lecture decks and one CS2100 logic-circuits deck, 55 pages in total. It still contains no MIPS program, no rubric-labelled multipart proof and no reviewed grading benchmark, so it cannot yet support a marking evaluation. The first release will use typed answers, provisional AI marks and manual review. The owner targets $20/month for DeepSeek through a custom provider, a library below 100 MB with text extraction and retained diagrams, and about 1,000 responses/day. See the [updated budget constraint](costs.md); the earlier 20-answer/day scenarios are illustrative only.

Unknowns remain: semester/exam rules, notation, MIPS subset/delay slots/calling convention, circuit representation, official/reviewed status of solutions and source precedence, custom-provider endpoint/model identifier, peak/cache billing passthrough, rate limits/retention, measured tokens per submitted answer, page counts, invited audience, and Canvas formats/access boundaries. The owner specifies DeepSeek-V4.1-Flash-1017 at official API rates with microdollar billing (USD), and confirms that the daily volume means submitted answers. No Canvas access or paid call has occurred. Review only specifically authorised visible questions when that intake is arranged; do not infer hidden-key access from the offer.

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

For #27, compare Docling local layout/OCR with a pinned managed OCR route, optionally a multimodal direct-page route. Measure identical pages, extraction configuration, raw and repaired structural/symbol errors, human repair time, latency and total cost. Export canonical JSON plus original assets; test exact anchors after repair. The first route has now been probed (see [local extraction evidence](#local-extraction-evidence-from-the-received-pack)): raw PyMuPDF text loses big operators, PUA symbol glyphs, subscripts and diagram topology on this pack. No second route, OCR pass, repair timing or cost comparison has run, so the fidelity and repair-time cells remain unmeasured. The probe's failure classes define the error taxonomy those comparisons must report against.

For #28, compare lexical and dense/hybrid retrieval independently with gold relevance labels. Include cross-owner/semester/revision decoys, source retirement, same-file protected solution crops, misleading student assertions and malicious source instructions. Scope before search and recheck at asset/citation fetch. A vector namespace or a single positive lexical result is insufficient authorisation or evidence.

For #29, run at least two accessible candidate models with gold context before end-to-end retrieved context. Record model snapshot, settings, prompt/schema/rubric/source/checker versions, token use, latency, repeats and human adjudication. Use a fixed cap per run and disable unrestricted tools. Compare deterministic choice scores separately. Optional simulators must use a pinned ISA and bounded sandbox; only run checks may appear in `checksPerformed`. Boolean tables cover confirmed finite combinational functions, not sequential/timing behaviour. Use reviewed correct alternatives and held-out examples to expose benchmark overfitting.

See [service and ingestion comparison](candidates.md), [contracts and failure recovery](contracts.md), [cost worksheet](costs.md) and [official evidence register](sources.md).
