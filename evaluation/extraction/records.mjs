// Turn a raw PDF structure probe into anchored extraction records.
//
// Every function here is pure: input is the JSON that probe_pdf.py emitted,
// output is a record. No PDF, no Python and no network are needed to test it.
//
// The rule that governs this module: a block records which route produced it
// and what validated it. A block with no validation is `unreviewed`, and an
// empty extract is never treated as success.

/** Content types the routing policy distinguishes. */
export const PAGE_KINDS = [
  'table',
  'prose',
  'diagram',
  'math',
  'scanned',
  'empty',
];

/**
 * Decide what a page predominantly contains, from deterministic signals only.
 *
 * Thresholds are stated here rather than buried so they can be argued with:
 * a page is `scanned` when it has visible images and almost no text, `diagram`
 * when it is dominated by vector segments with little prose, and `table` when a
 * ruled grid covers a meaningful share of the page.
 */
export const classifyPage = (page) => {
  const nonWhitespace = page.text.nonWhitespace;
  const segments =
    (page.drawings.segments?.horizontal ?? 0) +
    (page.drawings.segments?.vertical ?? 0);
  const dataTables = dataTablesOf(page);
  const largestDataCells = dataTables.reduce(
    (best, table) => Math.max(best, (table.rows ?? 0) * (table.cols ?? 0)),
    0,
  );
  const lossSignalCount = Object.values(page.lossSignals ?? {}).reduce(
    (total, count) => total + count,
    0,
  );

  // A page with images but under ~50 characters of text has no usable text
  // layer: the content is pixels, so only a rendered read can recover it.
  if (nonWhitespace < 50 && (page.images?.count ?? 0) > 0) {
    return 'scanned';
  }
  if (nonWhitespace < 20) {
    return segments > 0 ? 'diagram' : 'empty';
  }
  // A data grid with real extent plus substantial text. `dataTablesOf` has
  // already excluded boxed figures, which `find_tables()` reports as tables
  // with one filled cell.
  if (largestDataCells >= 9 && nonWhitespace > 100) {
    return 'table';
  }
  // Vector-dominant pages with sparse prose are diagrams; the wiring is the
  // content, not the caption.
  if (segments >= 20 && nonWhitespace < 600) {
    return 'diagram';
  }
  if (lossSignalCount > 0) {
    return 'math';
  }
  return 'prose';
};

/**
 * Loss signals the probe reported, as named reasons. These describe what the
 * text layer lost; they do not assert the page is unreadable.
 */
export const describeLoss = (lossSignals = {}) => {
  const reasons = [];
  if (lossSignals['private-use-area']) {
    reasons.push(
      `${lossSignals['private-use-area']} private-use-area characters; symbol glyphs have no standard mapping`,
    );
  }
  if (lossSignals['replacement-char']) {
    reasons.push(
      `${lossSignals['replacement-char']} replacement characters; bytes were lost, not merely unassigned`,
    );
  }
  return reasons;
};

/**
 * Filter probe tables down to ones that actually look like data grids.
 *
 * `find_tables()` also reports boxed figures — a circuit gate symbol with its
 * pins comes back as an 8x3 "table" with one filled cell. On the received pack
 * that produced 17 spurious tables out of 20.
 *
 * The thresholds come from the measured distribution, not intuition. Boxed
 * figures fill 3-7% of their cells and have 1-2 filled cells in total. Real
 * data grids fill 33-100% and have 18+ filled cells. Notably a genuinely
 * correct table (the p3 adder grid that scored 16/16 against arithmetic) fills
 * only 33%, because merged headers leave many cells blank — so a naive 50%
 * threshold would reject the best table in the pack.
 */
export const MIN_FILLED_CELLS = 8;
export const MIN_FILL_RATIO = 0.15;

export const dataTablesOf = (page) =>
  (page.tables ?? []).filter((table) => {
    if (table.error) return false;
    const total = (table.rows ?? 0) * (table.cols ?? 0);
    if (total === 0) return false;
    const filled = table.cellsFilled ?? 0;
    return filled >= MIN_FILLED_CELLS && filled / total >= MIN_FILL_RATIO;
  });

/** Ruled grids that look like boxed figures rather than data. */
export const figureTablesOf = (page) => {
  const data = new Set(dataTablesOf(page));
  return (page.tables ?? []).filter(
    (table) => !table.error && !data.has(table),
  );
};

const bboxOf = (bbox) =>
  Array.isArray(bbox) && bbox.length === 4
    ? bbox.map((value) => Math.round(value * 100) / 100)
    : null;

/** Build a table block from a probe table. Blank cells are reported, not hidden. */
export const tableBlock = (table, pageNumber, index) => ({
  type: 'table',
  anchor: {
    page: pageNumber,
    bbox: bboxOf(table.bbox),
    printedLabel: null,
    ordinal: index + 1,
  },
  route: 'table-grid',
  // The grid was recovered by a deterministic extractor. That is not the same
  // as the values being correct, so validation stays `none` until something
  // checks them; only an arithmetic or cross-route check may change this.
  validation: 'none',
  reviewState: 'unreviewed',
  content: {
    rows: table.rows,
    cols: table.cols,
    cellsFilled: table.cellsFilled,
    blankCells: table.blankCells,
    // Kept because a merged header produces blanks and dropping it would hide
    // a structural defect.
    hasBlankCells: (table.blankCells ?? 0) > 0,
    data: table.data,
  },
});

/** Build a prose block from the page text. */
export const proseBlock = (page, pageNumber) => ({
  type: 'prose',
  anchor: {
    page: pageNumber,
    bbox: null,
    printedLabel: null,
    ordinal: 1,
  },
  route: 'text-layer',
  validation: 'none',
  reviewState: 'unreviewed',
  content: {
    chars: page.text.chars,
    nonWhitespace: page.text.nonWhitespace,
    textSha256: page.text.sha256,
    preview: page.text.preview,
  },
});

/** Build a diagram block from vector geometry. */
export const diagramBlock = (page, pageNumber) => ({
  type: 'diagram',
  anchor: {
    page: pageNumber,
    bbox: null,
    printedLabel: null,
    ordinal: 1,
  },
  route: 'geometry',
  validation: 'none',
  reviewState: 'unreviewed',
  content: {
    objects: page.drawings.objects ?? 0,
    segments: page.drawings.segments ?? null,
    // Wires are geometry, so a netlist reconstructor can consume this later.
    // Topology is deliberately not interpreted here.
    needsNetlistReconstruction: true,
  },
});

/** A page that is pixels only: the deterministic routes cannot read it. */
export const scannedBlock = (page, pageNumber) => ({
  type: 'diagram',
  anchor: {
    page: pageNumber,
    bbox: null,
    printedLabel: null,
    ordinal: 1,
  },
  route: 'geometry',
  validation: 'none',
  reviewState: 'unreviewed',
  content: {
    images: page.images?.count ?? 0,
    reason: 'image-only page; requires a rendered vision read',
    needsVisionRoute: true,
  },
});

/**
 * Build the record for one page.
 *
 * `revision` is supplied by the caller (the source content hash) so a block can
 * be traced to the exact file it came from; `imageSha256` is absent unless a
 * render was made, and must stay absent rather than be invented.
 */
export const pageRecord = (page, revision, { imageSha256 = null } = {}) => {
  const pageNumber = page.page;
  const kind = classifyPage(page);
  const blocks = [];

  if (kind === 'scanned') {
    blocks.push(scannedBlock(page, pageNumber));
  } else if (kind === 'empty') {
    // Nothing to record. Stated explicitly rather than left as an empty array
    // that could be mistaken for a failed extract.
    blocks.push({
      type: 'prose',
      anchor: { page: pageNumber, bbox: null, printedLabel: null, ordinal: 1 },
      route: 'text-layer',
      validation: 'none',
      reviewState: 'unreviewed',
      content: { chars: 0, reason: 'no extractable content on this page' },
    });
  } else if (kind === 'diagram') {
    blocks.push(diagramBlock(page, pageNumber));
    if (page.text.nonWhitespace > 0) blocks.push(proseBlock(page, pageNumber));
  } else if (kind === 'table') {
    const usable = dataTablesOf(page);
    usable.forEach((table, index) => {
      blocks.push(tableBlock(table, pageNumber, index));
    });
    // Figures that `find_tables()` mistook for grids are recorded as diagrams,
    // not discarded: the box is real content, just not tabular data. Recording
    // the count keeps the distinction visible.
    const figures = figureTablesOf(page);
    if (figures.length > 0) {
      blocks.push({
        ...diagramBlock(page, pageNumber),
        content: {
          ...diagramBlock(page, pageNumber).content,
          boxedFiguresDetected: figures.length,
          reason:
            'ruled boxes with mostly empty cells; treated as figures, not tables',
        },
      });
    }
    if (page.text.nonWhitespace > 0) blocks.push(proseBlock(page, pageNumber));
  } else {
    blocks.push(proseBlock(page, pageNumber));
  }

  const loss = describeLoss(page.lossSignals);
  if (loss.length > 0) {
    // A page whose text layer lost information cannot be reviewed as if it were
    // clean, even when the blocks themselves extracted.
    blocks.push({
      type: 'math',
      anchor: { page: pageNumber, bbox: null, printedLabel: null, ordinal: 1 },
      route: 'text-layer',
      validation: 'none',
      reviewState: 'unreviewed',
      content: { lossSignals: page.lossSignals, reasons: loss },
    });
  }

  return {
    page: pageNumber,
    revision,
    imageSha256,
    kind,
    blocks,
    unclear: [
      ...(page.tables ?? [])
        .filter((table) => table.error)
        .map((table) => table.error),
      ...loss,
    ],
  };
};

/** Build records for a whole probe payload. */
export const documentRecord = (probe, revision) => ({
  kind: 'extraction-record',
  version: 1,
  tool: probe.tool,
  pageCount: probe.pageCount,
  pagesReported: probe.pagesReported,
  revision,
  pages: probe.pages.map((page) => pageRecord(page, revision)),
});

/**
 * Coverage summary. Deliberately reports what was *not* validated, because a
 * silent gap in coverage is the failure mode this whole ticket exists to avoid.
 */
export const coverageSummary = (document) => {
  const blocks = document.pages.flatMap((page) => page.blocks);
  const byRoute = {};
  const byType = {};
  for (const block of blocks) {
    byRoute[block.route] = (byRoute[block.route] ?? 0) + 1;
    byType[block.type] = (byType[block.type] ?? 0) + 1;
  }
  return {
    pages: document.pages.length,
    blocks: blocks.length,
    byRoute,
    byType,
    blocksValidated: blocks.filter((block) => block.validation !== 'none')
      .length,
    blocksUnvalidated: blocks.filter((block) => block.validation === 'none')
      .length,
    pagesWithLossSignals: document.pages.filter((page) =>
      page.blocks.some((block) => block.type === 'math'),
    ).length,
    pagesNeedingVision: document.pages.filter((page) =>
      page.blocks.some((block) => block.content?.needsVisionRoute),
    ).length,
    tablesWithBlankCells: blocks.filter(
      (block) => block.type === 'table' && block.content?.hasBlankCells,
    ).length,
    boxedFiguresNotTables: blocks.reduce(
      (total, block) => total + (block.content?.boxedFiguresDetected ?? 0),
      0,
    ),
    pageKindCounts: document.pages.reduce((counts, page) => {
      counts[page.kind] = (counts[page.kind] ?? 0) + 1;
      return counts;
    }, {}),
    note: 'Unvalidated blocks are unreviewed. This summary measures extraction coverage, not fidelity.',
  };
};
