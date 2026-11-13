import { describe, expect, it } from 'vitest';

import {
  classifyPage,
  coverageSummary,
  dataTablesOf,
  describeLoss,
  documentRecord,
  figureTablesOf,
  pageRecord,
} from './records.mjs';
import { scoreDocumentTables, scoreTimesFive } from './score-tables.mjs';

/** Minimal probe page; individual tests override the fields they care about. */
const page = (overrides = {}) => ({
  page: 1,
  size: { width: 595, height: 842 },
  text: {
    chars: 500,
    nonWhitespace: 400,
    sha256: 'abc',
    preview: 'some text',
  },
  lossSignals: {},
  tables: [],
  drawings: { objects: 0, segments: { horizontal: 0, vertical: 0, other: 0 } },
  images: { count: 0 },
  annotations: { count: 0, withText: 0 },
  ...overrides,
});

/** A grid with `filled` populated cells out of rows*cols. */
const table = (rows, cols, filled, extra = {}) => ({
  rows,
  cols,
  cellsTotal: rows * cols,
  cellsFilled: filled,
  blankCells: rows * cols - filled,
  bbox: [10, 20, 110, 120],
  data: [],
  ...extra,
});

describe('classifyPage', () => {
  it('treats an image-heavy page with almost no text as scanned', () => {
    expect(
      classifyPage(
        page({
          text: { chars: 20, nonWhitespace: 10, sha256: 'x', preview: '' },
          images: { count: 3 },
        }),
      ),
    ).toBe('scanned');
  });

  it('treats a vector-dominant page with sparse prose as a diagram', () => {
    expect(
      classifyPage(
        page({
          text: { chars: 200, nonWhitespace: 150, sha256: 'x', preview: '' },
          drawings: {
            objects: 50,
            segments: { horizontal: 15, vertical: 20, other: 0 },
          },
        }),
      ),
    ).toBe('diagram');
  });

  it('treats a page with a real data grid and prose as a table', () => {
    expect(classifyPage(page({ tables: [table(12, 12, 126)] }))).toBe('table');
  });

  it('treats a page with only boxed figures as not a table page', () => {
    // 8x3 with 1 filled cell is the gate-box shape measured on the pack.
    expect(classifyPage(page({ tables: [table(8, 3, 1)] }))).not.toBe('table');
  });

  it('treats a page whose text has loss signals as math', () => {
    expect(
      classifyPage(page({ lossSignals: { 'private-use-area': 12 } })),
    ).toBe('math');
  });

  it('treats a blank page as empty', () => {
    expect(
      classifyPage(
        page({
          text: { chars: 0, nonWhitespace: 0, sha256: 'x', preview: '' },
        }),
      ),
    ).toBe('empty');
  });
});

describe('dataTablesOf and figureTablesOf', () => {
  it('keeps a real grid even when merged headers leave most cells blank', () => {
    // The p3 adder grid measured 136/414 filled (33%) and scored 16/16 against
    // arithmetic, so it must not be filtered out.
    const adder = table(18, 23, 136);
    expect(dataTablesOf(page({ tables: [adder] }))).toHaveLength(1);
  });

  it('separates a gate box from a data grid on the same page', () => {
    const gateBox = table(8, 3, 1);
    const real = table(12, 12, 126);
    const probePage = page({ tables: [gateBox, real] });
    expect(dataTablesOf(probePage)).toHaveLength(1);
    expect(dataTablesOf(probePage)[0]).toBe(real);
    expect(figureTablesOf(probePage)).toHaveLength(1);
    expect(figureTablesOf(probePage)[0]).toBe(gateBox);
  });

  it('ignores a table that the probe reported as an error', () => {
    expect(
      dataTablesOf(page({ tables: [{ error: 'extract failed' }] })),
    ).toHaveLength(0);
  });
});

describe('describeLoss', () => {
  it('names private-use-area characters', () => {
    expect(describeLoss({ 'private-use-area': 5 })[0]).toContain(
      'private-use-area',
    );
  });

  it('distinguishes replacement characters from unassigned ones', () => {
    expect(describeLoss({ 'replacement-char': 2 })[0]).toContain(
      'bytes were lost',
    );
  });

  it('reports nothing for a clean page', () => {
    expect(describeLoss({})).toEqual([]);
  });
});

describe('pageRecord', () => {
  it('never marks a block as validated without a check', () => {
    const record = pageRecord(page({ tables: [table(12, 12, 126)] }), 'rev1');
    for (const block of record.blocks) {
      expect(block.validation).toBe('none');
      expect(block.reviewState).toBe('unreviewed');
    }
  });

  it('records the route that produced each block', () => {
    const record = pageRecord(page({ tables: [table(12, 12, 126)] }), 'rev1');
    const routes = record.blocks.map((block) => block.route);
    expect(routes).toContain('table-grid');
    expect(routes).toContain('text-layer');
  });

  it('reports blank cells rather than hiding a merged header', () => {
    const record = pageRecord(page({ tables: [table(18, 23, 136)] }), 'rev1');
    const tableBlock = record.blocks.find((block) => block.type === 'table');
    expect(tableBlock.content.hasBlankCells).toBe(true);
    expect(tableBlock.content.blankCells).toBe(414 - 136);
  });

  it('gives two tables on one page distinct anchors', () => {
    const record = pageRecord(
      page({ tables: [table(12, 12, 126), table(2, 11, 22)] }),
      'rev1',
    );
    const tables = record.blocks.filter((block) => block.type === 'table');
    expect(tables).toHaveLength(2);
    expect(tables[0].anchor.ordinal).not.toBe(tables[1].anchor.ordinal);
  });

  it('marks an image-only page as needing a vision route', () => {
    const record = pageRecord(
      page({
        text: { chars: 10, nonWhitespace: 5, sha256: 'x', preview: '' },
        images: { count: 2 },
      }),
      'rev1',
    );
    expect(record.kind).toBe('scanned');
    expect(record.blocks[0].content.needsVisionRoute).toBe(true);
  });

  it('raises a loss block when the text layer lost information', () => {
    const record = pageRecord(
      page({ lossSignals: { 'private-use-area': 46 } }),
      'rev1',
    );
    const lossBlock = record.blocks.find((block) => block.type === 'math');
    expect(lossBlock.content.lossSignals['private-use-area']).toBe(46);
    expect(record.unclear.length).toBeGreaterThan(0);
  });

  it('does not invent an image hash when no render was made', () => {
    expect(pageRecord(page(), 'rev1').imageSha256).toBeNull();
  });

  it('carries the supplied revision and render hash', () => {
    const record = pageRecord(page(), 'sha-of-source', {
      imageSha256: 'sha-of-render',
    });
    expect(record.revision).toBe('sha-of-source');
    expect(record.imageSha256).toBe('sha-of-render');
  });

  it('states explicitly when a page has no extractable content', () => {
    const record = pageRecord(
      page({ text: { chars: 0, nonWhitespace: 0, sha256: 'x', preview: '' } }),
      'rev1',
    );
    expect(record.kind).toBe('empty');
    expect(record.blocks[0].content.reason).toContain('no extractable content');
  });

  it('records the count of figures that find_tables mistook for grids', () => {
    const record = pageRecord(
      page({ tables: [table(12, 12, 126), table(8, 3, 1)] }),
      'rev1',
    );
    const figure = record.blocks.find(
      (block) => block.content?.boxedFiguresDetected,
    );
    expect(figure.content.boxedFiguresDetected).toBe(1);
  });
});

describe('regressions from independent review', () => {
  const grid = (rows, cols, value = '1') =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => value),
    );

  it('keeps a real grid even when the page text is shorter than the table threshold', () => {
    // A genuine 12x12 grid on a page with 99 non-whitespace characters used to
    // classify as prose and drop the table entirely.
    const record = pageRecord(
      page({
        text: { chars: 99, nonWhitespace: 99, sha256: 'x', preview: 'short' },
        tables: [
          {
            rows: 12,
            cols: 12,
            cellsTotal: 144,
            cellsFilled: 126,
            blankCells: 18,
            bbox: [10, 20, 400, 300],
            data: grid(12, 12),
          },
        ],
      }),
      'rev',
    );
    expect(record.blocks.some((block) => block.type === 'table')).toBe(true);
    expect(record.unclear).toEqual([]);
  });

  it('keeps two tables on a short-text page with distinct anchors', () => {
    const tableAt = (bbox) => ({
      rows: 4,
      cols: 4,
      cellsTotal: 16,
      cellsFilled: 16,
      blankCells: 0,
      bbox,
      data: grid(4, 4),
    });
    const record = pageRecord(
      page({
        text: { chars: 40, nonWhitespace: 40, sha256: 'x', preview: 'tiny' },
        tables: [tableAt([0, 0, 100, 100]), tableAt([200, 200, 300, 300])],
      }),
      'rev',
    );
    const tables = record.blocks.filter((block) => block.type === 'table');
    expect(tables).toHaveLength(2);
    expect(tables[0].anchor.bbox).not.toEqual(tables[1].anchor.bbox);
    expect(tables[0].anchor.ordinal).not.toBe(tables[1].anchor.ordinal);
  });

  it('keeps a ruled grid on a page classified as a diagram', () => {
    // Text sits below the table threshold while vectors dominate, so the page
    // classifies as a diagram. The grid must still be emitted.
    const record = pageRecord(
      page({
        text: { chars: 70, nonWhitespace: 70, sha256: 'x', preview: 'wires' },
        drawings: {
          objects: 40,
          segments: { horizontal: 25, vertical: 25, other: 0 },
        },
        tables: [
          {
            rows: 8,
            cols: 4,
            cellsTotal: 32,
            cellsFilled: 32,
            blankCells: 0,
            bbox: [0, 0, 100, 100],
            data: grid(8, 4),
          },
        ],
      }),
      'rev',
    );
    expect(record.kind).toBe('diagram');
    expect(record.blocks.some((block) => block.type === 'table')).toBe(true);
    expect(record.blocks.some((block) => block.type === 'diagram')).toBe(true);
  });

  it('names big-operator loss separately from PUA loss', () => {
    const reasons = describeLoss({
      'private-use-area': 2,
      'big-operator-glyph': 3,
    });
    expect(reasons).toHaveLength(2);
    expect(reasons.some((reason) => reason.includes('big-operator'))).toBe(
      true,
    );
    expect(reasons.some((reason) => reason.includes('private-use-area'))).toBe(
      true,
    );
  });

  it('raises a loss block for a big-operator signal', () => {
    const record = pageRecord(
      page({ lossSignals: { 'big-operator-glyph': 4 } }),
      'rev',
    );
    expect(record.blocks.some((block) => block.type === 'math')).toBe(true);
    expect(record.unclear.some((entry) => entry.includes('big-operator'))).toBe(
      true,
    );
  });

  it('does not re-split an ambiguous 6+6 table as 4-in / 8-out', () => {
    const ambiguous = {
      type: 'table',
      anchor: { page: 1, ordinal: 1 },
      content: { data: [['010101', '010101']] },
    };
    expect(scoreTimesFive(ambiguous).rowsScored).toBe(0);
  });

  it('accepts a grid that groups 4 input bits and 8 output bits', () => {
    const grouped = {
      type: 'table',
      anchor: { page: 1, ordinal: 1 },
      content: { data: [['0010', '00010000']] },
    };
    const result = scoreTimesFive(grouped);
    expect(result.rowsScored).toBe(1);
    expect(result.rowsCorrect).toBe(1);
  });
});

describe('coverageSummary', () => {
  const probe = {
    kind: 'pdf-structure-probe',
    version: 1,
    tool: 'pymupdf test',
    pageCount: 2,
    pagesReported: 2,
    pages: [
      page({ page: 1, tables: [table(12, 12, 126)] }),
      page({ page: 2, lossSignals: { 'private-use-area': 4 } }),
    ],
  };

  it('counts validated and unvalidated blocks separately', () => {
    const summary = coverageSummary(documentRecord(probe, 'rev1'));
    expect(summary.blocks).toBeGreaterThan(0);
    expect(summary.blocksValidated).toBe(0);
    expect(summary.blocksUnvalidated).toBe(summary.blocks);
  });

  it('counts pages with loss signals', () => {
    expect(
      coverageSummary(documentRecord(probe, 'rev1')).pagesWithLossSignals,
    ).toBe(1);
  });

  it('carries a note that coverage is not fidelity', () => {
    expect(coverageSummary(documentRecord(probe, 'rev1')).note).toContain(
      'not fidelity',
    );
  });
});

describe('score-tables', () => {
  const row = (value) => {
    const v = value * 5;
    const bits = (n) => n.toString(2).padStart(4, '0');
    return [
      ...bits(value).split(''),
      ...bits(Math.floor(v / 10)).split(''),
      ...bits(v % 10).split(''),
    ];
  };

  it('scores a correct 5xA grid as fully correct', () => {
    const block = {
      type: 'table',
      anchor: { page: 5, ordinal: 1 },
      content: { data: Array.from({ length: 10 }, (_, v) => row(v)) },
    };
    const result = scoreTimesFive(block);
    expect(result.rowsScored).toBe(10);
    expect(result.rowsCorrect).toBe(10);
  });

  it('detects a misread row rather than accepting a plausible table', () => {
    const data = Array.from({ length: 10 }, (_, v) => row(v));
    // 5*2 = 10 = 0001 0000; a low-nibble misread gives 0000 1000.
    data[2] = ['0', '0', '1', '0', '0', '0', '0', '0', '1', '0', '0', '0'];
    const result = scoreTimesFive({
      type: 'table',
      content: { data },
    });
    expect(result.rowsCorrect).toBe(9);
  });

  it('skips a table with no 4-in / 8-out rows instead of scoring it zero', () => {
    const document = {
      pages: [
        {
          blocks: [
            {
              type: 'table',
              anchor: { page: 1 },
              content: {
                data: [
                  ['A', 'B'],
                  ['C', 'D'],
                ],
              },
            },
          ],
        },
      ],
    };
    const result = scoreDocumentTables(document);
    expect(result.tablesScored).toBe(0);
    expect(result.tables[0].skipped).toContain('no 4-input');
  });
});
