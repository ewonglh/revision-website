# Cost worksheet

Checked against fetched official documentation on 12 November 2026. USD list prices before tax/FX, shared-account allowance consumption and discounts. Run `node evaluation/costs.mjs` to reproduce arithmetic. These are explicit research scenarios, not an owner-approved budget or measured usage. One answer means one complete marking request, potentially a multipart question, not one keystroke or criterion.

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
