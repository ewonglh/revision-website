# Extraction tooling

Research tooling for #27 and #34. Two halves:

| Half                    | Tools                                                                         | Needs                         |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| **Deterministic** (#34) | `extract-document.mjs`, `records.mjs`, `score-tables.mjs`, `pdf/probe_pdf.py` | Python + PyMuPDF, local files |
| **Vision** (#32, draft) | `run-extraction.mjs`, `provider.mjs`, `checks.mjs`                            | Provider URL, model ID, key   |

**Not application code.** Nothing here is imported by the app. `npm run check` runs
only the offline unit tests — no network call, no PDF, no provider.

## Why this exists

The pack probe measured the text route and found silent corruption. An in-session
reading at the provider's 1024-token downscale then scored **5/10 rows** on a dense
truth table, while `find_tables()` scored **10/10** on the same table and the same
vision route scored **5/5** on a large-type diagram page.

So no single route is safe, and a fluent reading is not evidence. These tools exist
to make each route's output _checkable_ and to record which route produced what.

## Vision harness (#32, draft)

Reads rendered page images through the owner's provider and scores the readings
against deterministic checks. It sends nothing without configuration and never
falls back to a guessed URL.

| Variable | Required | Meaning |
| --- | --- | --- |
| `EXTRACTION_BASE_URL` | yes | Provider root, e.g. `https://provider.example/v1` |
| `EXTRACTION_MODEL` | yes | The model ID that provider accepts — not necessarily `deepseek-flash` |
| `EXTRACTION_API_KEY` | yes | Provider key. Never committed, never placed in a request body |
| `EXTRACTION_AUTH_HEADER` | no | Header name; defaults to `authorization` |
| `EXTRACTION_AUTH_SCHEME` | no | Prefix; defaults to `Bearer`. Set empty for a bare key |
| `EXTRACTION_PATH` | no | Defaults to `/chat/completions` (OpenAI-compatible) |
| `EXTRACTION_TIMEOUT_MS` | no | Defaults to 120000 |

No provider call has been billed. Everything below was verified against a local
stand-in provider, so provider behaviour on the real endpoint is unmeasured.

## Deterministic extractor (#34)

### Usage

```sh
# Probe and extract in one step (needs Python + PyMuPDF)
node evaluation/extraction/extract-document.mjs <file.pdf> --out <dir>

# Or reuse a probe produced elsewhere, with no Python at all
python -I evaluation/extraction/pdf/probe_pdf.py <file.pdf> > structure.json
node evaluation/extraction/extract-document.mjs --structure structure.json --out <dir>

# Score extracted tables against arithmetic
node evaluation/extraction/score-tables.mjs <dir>/<name>.record.json
```

### Why Python for the probe

`find_tables()` is the route that scored 10/10 and 16/16 rows against arithmetic.
Reimplementing ruled-grid detection in Node would replace measured behaviour with
an unmeasured guess. The probe therefore only **reports** what PyMuPDF sees; all
classification, routing and record building happens in `records.mjs`, where it is
unit tested without a PDF.

The pack is untrusted input: run the probe with `-I` and treat every string as data.

### What a record contains

Per page, blocks that each state their provenance:

```js
{
  type: 'table' | 'prose' | 'diagram' | 'math',
  anchor: { page, bbox, printedLabel, ordinal },
  route: 'table-grid' | 'text-layer' | 'geometry',
  validation: 'none' | 'arithmetic' | 'cross-route agreement',
  reviewState: 'unreviewed' | 'repaired' | 'verified-against-page',
  content: { … }
}
```

**A block with `validation: 'none'` is unreviewed.** Extraction succeeding is not the
same as extraction being correct, so nothing is marked validated without a check that
actually ran.

### Page classification

Deterministic signals only — no model call:

| Kind      | Signal                                                 |
| --------- | ------------------------------------------------------ |
| `scanned` | images present, under ~50 non-whitespace chars         |
| `diagram` | ≥20 vector segments, sparse prose                      |
| `table`   | a data grid with ≥9 cells and substantial text         |
| `math`    | private-use-area or replacement characters in the text |
| `empty`   | under ~20 non-whitespace chars, no geometry            |

### The gate-box problem

`find_tables()` also reports **boxed figures** as tables. On the received pack a
circuit gate symbol came back as an 8×3 "table" with 1 filled cell, producing 17
spurious tables out of 20.

The filter thresholds come from the measured distribution, not intuition. These
figures are **carried over from the earlier probe recorded in
[the dossier](../../docs/evaluation/README.md)**; this PR's tests run on hand-built
fixtures and do not re-measure the pack. Reproducing them needs the private pack and
a Python install, and no record of that run is committed:

| Grid            | Fill ratio          | Verdict                          |
| --------------- | ------------------- | -------------------------------- |
| Gate box, 8×3   | 4% (1 cell)         | figure, not data                 |
| p3 adder, 18×23 | **33%** (136 cells) | **real data grid, scored 16/16** |
| `5×A`, 12×12    | 88% (126 cells)     | real data grid, scored 10/10     |

A merged header leaves many blank cells, so the best table in the pack fills only a
third of its cells. A naive 50% threshold would have rejected it. The filter is
`filled >= 8 AND fill_ratio >= 0.15`.

## Coverage summary

Every run prints what was **not** validated, because a silent gap is the failure
mode this ticket exists to prevent:

- `blocksValidated` / `blocksUnvalidated`
- `pagesWithLossSignals`
- `pagesNeedingVision`
- `tablesWithBlankCells` (a merged header, reported not hidden)
- `boxedFiguresNotTables`

The summary measures extraction **coverage, not fidelity**.

## Limits

- Deterministic routes only. No provider call, no vision, no netlist reconstruction.
- Scanned pages are flagged for the vision route, not read.
- `score-tables.mjs` currently checks the `5×A` relationship only. Other tables need
  their own checker. It accepts only the two observed row layouts — twelve
  single-bit cells, or a 4-bit and an 8-bit cell — and skips any other grouping
  rather than guessing how to split it.
- **`printedLabel` is always `null`.** The field exists so a later pass can fill
  it, but nothing in the probe or the classifier reads a printed label such as
  "Table 1" off the page. A block's anchor is page plus bounding box only.
- **`imageSha256` is `null` on the CLI path.** `pageRecord` accepts a render hash
  and the unit tests supply one, but `extract-document.mjs` does not render pages,
  so a real run cannot yet prove which render a repair was made against.
- Loss signals are candidates, not verdicts. Big-operator detection matches the
  measured `Pk i=1` decoding shape and deliberately under-reports rather than
  flagging ordinary prose; a symbol block is still `unreviewed`. The PUA range is
  the two real private-use planes — an earlier version included `0xF000-0xFFFD`,
  which incorrectly flagged fullwidth and CJK characters.
- Grids are emitted for every page with a data grid, whatever the page's dominant
  kind. A short-text page or a wire-heavy page still yields its table blocks.
- No accuracy claim is possible without reviewed gold. See the gates in
  [the dossier](../../docs/evaluation/README.md).
