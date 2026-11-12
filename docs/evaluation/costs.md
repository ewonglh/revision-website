# Cost worksheet

Checked against fetched official documentation on 12 November 2026. Run `node evaluation/costs.mjs` to reproduce arithmetic. The owner target below supersedes the earlier illustrative personal/pilot volumes. Prices are USD before tax/FX. The owner reports official-price parity for their custom DeepSeek provider; actual passthrough and usage are not yet tested.

## Owner target and custom-provider feasibility

The owner confirmed **DeepSeek-V4.1-Flash-1017** through a custom provider at official API rates, billing in microdollars, a $20/month AI budget, **1,000 submitted answers/day**, and a library estimate below 100 MB with text extraction and retained diagrams. Typed answers come first, with provisional AI marking and manual review. Use USD and 1 microdollar = USD 0.000001, so the monthly cap is 20 million microdollars. No total infrastructure budget was specified.

At 1,000 submitted answers/day over 30 days, the target is **30,000 answers/month**, allowing **$0.0006667 (666.67 microdollars) per answer** averaged across the month. With a hypothetical 10% repeat allowance and one primary call per answer, each primary call must average at most $0.0006061 before any separate escalation, ingestion or embedding spend. Allocate those other AI costs first if they share the $20 cap. Deterministic keyed scoring need not call an LLM for every response; explanations may still require review. Multiple part-level calls per submission must count towards this same budget.

For the earlier illustrative 8,000-input/2,000-output token envelope, 30,000 calls plus 10% repeats consume 264 million input and 66 million output tokens. With uncached rates per million tokens in the same currency as the budget, affordability requires `264 × inputRate + 66 × outputRate <= 20`. This is a constraint, not a price estimate or a claim that this context length is necessary. A part-level response might need much less context; multipart proof assessment may need more. Measure tokens by format and preserve rubric/evidence coverage when reducing context.

Official pricing [S19] maps `deepseek-flash` to the exact requested version; the custom-provider model identifier still needs confirmation before calls. The owner reports official-price parity. These are therefore price scenarios under that report, not measured reseller bills:

| USD per million tokens | Cache-miss input | Cache-hit input | Output |
| ---------------------- | ---------------- | --------------- | ------ |
| Off-peak               | 0.15             | 0.003           | 0.60   |
| Peak                   | 0.30             | 0.006           | 1.20   |

In microdollars **per token**, these have the same numeric values: off-peak uncached input costs 0.15 microdollars/token, not 0.15 dollars/token. Official peak hours are 01:00–04:00 and 06:00–10:00 UTC on weekdays except Chinese public holidays [S19] (09:00–12:00 and 14:00–18:00 Singapore time). Confirm that the custom provider passes through time bands/cache discounts; do not assume all interactive answers can wait for off-peak processing.

| Illustrative tokens per marking call; 30k answers and 10% repeats | Off-peak USD/month | Peak USD/month |
| ----------------------------------------------------------------- | ------------------ | -------------- |
| 8,000 input / 2,000 output, uncached                              | 79.20              | 158.40         |
| 2,000 input / 500 output, uncached                                | 19.80              | 39.60          |
| 2,000 input / 500 output, assumed 90% input-cache hits            | 11.0682            | 22.1364        |

These are marking-only scenario costs. Output tokens must cover billed thinking and final output, not just visible feedback. Thinking mode is enabled by default at high effort in the direct API [S21]; pin the actual mode/output limit and measure usage rather than letting the default expand cost. Truncation must lead to review, not a fabricated completed mark. The compact context/500-token output and 90% hit fraction have **not** been validated for any course format.

The $19.80 compact uncached off-peak scenario leaves only $0.20 for any other work within the cap. Even a short reply may need more internal reasoning or evidence. Cache hits require reusable persisted prefixes and are best effort [S20]; distinct question/rubric/source revisions and changing permissions reduce reuse. Use returned cache-hit/miss usage and never reuse evidence across access scopes for savings. There is no evidence yet that 30,000 source-backed written marks fit $20 reliably. The calculator leaves observed custom-provider cost null; quality and measured consumption remain gates.

Before paid evaluation, confirm the custom-provider alias, billing/usage fields, time-band/cache passthrough, request limits and retention terms; receive the reviewed private pack and bound each run within the remaining $20 monthly AI budget. No API key or paid request has been used. Source size cannot establish token cost; actual usage is authoritative [S22].

The below-100-MB estimate does not determine page count, chunk count, model tokens or monthly response storage. Record original files, extracted text, retained diagrams and accumulated answer/result data separately. Keep immutable authorised originals for source anchors and repair; parsing text does not replace them. Earlier 2/20-GB storage scenarios below are sensitivity examples, not the owner's confirmed library size.

## Earlier illustrative scenarios

In the retained scenarios only, one answer means one complete marking request, potentially multipart. The pilot audience, page counts and answer lengths remain illustrative. They do not multiply the newly reported 1,000 daily responses by an invented user count.

## Inputs and dated prices

| Assumption per 30-day month                                           | Personal                   | Invited pilot                                   |
| --------------------------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| Users × answers/day                                                   | 1 × 20 = 600 answers/month | 20 × 20 = 12,000 answers/month                  |
| Initial library / new pages/month                                     | 1,000 / 100                | 5,000 / 500; shared library, not 20 copies      |
| Originals, images, derived data and response assets in object storage | 2 GB                       | 20 GB                                           |
| DB state including indexes                                            | 0.1 GB                     | 1 GB                                            |
| Chunks, 400 tokens each / embedding dimensions                        | 5,000 / 768                | 25,000 / 768                                    |
| Retrievals per answer; 100 input tokens/query                         | 2                          | 2                                               |
| API/Workflow invocations / CPU per invocation                         | 30,000 / 10 ms             | 600,000 / 10 ms                                 |
| D1 scanned reads / indexed writes                                     | 1m / 0.1m                  | 20m / 2m                                        |
| R2 Class A / Class B operations                                       | 10k / 100k                 | 100k / 1m                                       |
| Jobs × Workflow steps; persisted Workflow state                       | 1k × 8; <0.1 GB-month      | 20k × 8; <1 GB-month                            |
| Queue dispatcher alternative                                          | <=3k operations            | <=60k operations; small reference-only messages |

| SKU / official source                                | Fetched unit price used                                                                                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers Standard [S01]                               | $5/month minimum; 10m requests and 30m CPU ms included; extra $0.30/m requests and $0.02/m CPU ms                                                                                |
| D1 paid [S02]                                        | 25bn rows read/month, 50m writes/month and 5 GB included; then $0.001/m reads, $1/m writes, $0.75/GB-month                                                                       |
| R2 Standard [S03]                                    | 10 GB-month, 1m A and 10m B included; then $0.015/GB-month, $4.50/m A, $0.36/m B; internet egress free; billing rounding applies                                                 |
| Workflows [S04]                                      | Shared Workers request/CPU allowance; 500k steps and 1 GB-month included; then $0.80/100k steps and $0.20/GB-month. Step/storage charging has started, not a perpetual free beta |
| Queue alternative [S05]                              | 1m operations included then $0.40/m; ordinary small delivery uses write/read/delete, retries add operations                                                                      |
| Vectorize [S07]                                      | 50m queried dimensions and 10m stored dimensions included; then $0.01/m queried, $0.05/100m stored dimensions                                                                    |
| Supabase Pro [S09]                                   | $25/month single Micro project after included $10 compute credit; Auth, 8 GB disk, 100 GB files, 250 GB egress included; additional projects/compute/overages extra              |
| Mistral OCR 3 pinned `mistral-ocr-2512` [S13]        | $2/1,000 ordinary pages; $3/1,000 annotated pages. Uses ordinary OCR price here, no batch discount; newer OCR 4 needs repricing                                                  |
| Embeddings `text-embedding-3-small` [S14]            | $0.02/m input tokens; 768-dimensional representation is a scenario, quality unmeasured                                                                                           |
| `gpt-6.1-sol` / Sonnet 5.5 [S14, S17]                | Each $2/m ordinary short-context input, $10/m output; actual tokenisation differs                                                                                                |
| Escalation example Opus 5.5 [S17]                    | $4/m input, $20/m output                                                                                                                                                         |
| Cheap experiment `gpt-6-luna` / Haiku 5.5 [S14, S17] | $0.10/m input, $0.50/m output for the short-context scenario; no quality acceptance implied                                                                                      |

Free allowances are account-wide assumptions, not guaranteed available capacity. No D1/Workers/queue/Workflow overage is projected at these specified counts, but badly indexed queries, excessive polling, autosave frequency or large checkpoints can change that. D1 paid database size limits still apply [S08]. Storage estimates include response media; a handwritten-heavy workload requires remeasurement. Model file/image inputs can bill beyond the assumed text counts.

Vectorize's documented queried-dimension calculation is `(storedVectors + queries) × dimensions`, not `storedVectors × queries × dimensions`. Stored dimensions are calculated separately. This gives pilot stored dimensions 19.2m and query dimensions 37.632m, so only the stored-dimension overage ($0.0046) is projected. Embedding generation is billed separately. One index is assumed.

## Reproducible scenarios

Ordinary request: 8,000 input and 2,000 billed output tokens, costing $0.036. Balanced-only expected bill adds a 10% repeat-call allowance. Reviewed-route scenario additionally escalates 15% of answers at 16,000 input and 4,000 output tokens ($0.144 per escalation), with the same 10% repeat allowance over the route. These percentages are cost assumptions, not observed failure rates. Hard per-job ceilings are in [contracts](contracts.md).

`reviewed marking = answers × (0.036 + 0.15 × 0.144) × 1.10`.

| Recurring subtotal (USD/month)                               | Personal      | Pilot           |
| ------------------------------------------------------------ | ------------- | --------------- |
| Balanced-only marking                                        | 23.76         | 475.20          |
| Marking with 15% stronger review                             | 38.02         | 760.32          |
| New-page OCR including 10% repeat allowance                  | 0.22          | 1.10            |
| New-page + query embeddings                                  | 0.0064        | 0.0680          |
| Cloudflare platform floor + projected storage/vector overage | 5.00          | 5.1546          |
| Supabase single paid project alternative                     | 25.00         | 25.00           |
| Cloudflare + balanced / stronger-review scenario             | 28.99 / 43.24 | 481.52 / 766.64 |
| Supabase + balanced / stronger-review scenario               | 48.99 / 63.24 | 501.37 / 786.49 |

Initial ingestion is additional: ordinary OCR with 10% repeats is $2.20/$11.00 and initial embeddings $0.04/$0.20, personal/pilot respectively. A first-month worksheet can add these to the recurring subtotal; they are not charged again monthly unless reprocessing occurs. Corrections/new source revisions can cause re-embedding and regrading, which require separate budgets.

These are **partial subtotals**, not complete operating quotes. Cloudflare identity/SMTP and native processing remain unpriced decisions. Supabase includes Auth in its platform line, but custom SMTP and other excluded operational work still need pricing. Neither option includes optional backup/monitoring services, extra job runtime, support or human repair/adjudication. Before approval in #30, measure their units and add each line; do not present a free-tier claim.

For native extraction, Cloud Run's official pricing [S18] varies by region and billing mode and jobs have minimum billed duration. Use `vCPU-seconds × regional rate + GiB-seconds × regional rate + image storage/build + egress`, with measured cold/model-download time and retention. No region/hardware/per-page duration has been supplied, so this study leaves the line unquoted rather than applying a convenient region's advertised rate. Local extraction also has setup/compute and human time, even if no cloud bill.

Sensitivity: doubling token counts doubles the reviewed marking line to $76.03/$1,520.64. Escalating every answer instead of 15% costs $118.80/$2,376.00 for marking alone. An experimental cheap-first route with 20% balanced re-review and 10% repeats would cost $5.94/$118.80, but no evidence permits using it for trusted marking. Human repair minutes can outweigh OCR price differences; record them explicitly in #27. The owner's actual budget should determine caps, answered volume and review policy before any paid evaluation.
