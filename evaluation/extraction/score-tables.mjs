// Score a table block from an extraction record against arithmetic.
//
// This is the bridge between #34 (extraction) and #27 (fidelity measurement):
// it takes the `5×A` grid as the deterministic route recovered it and checks
// every row against arithmetic. It exists so the mixed-route claim ("tables are
// handled by find_tables") is verified against real extracted output rather than
// against a prototype script.

import { readFileSync } from 'node:fs';

/** Flatten a table cell (or nested cell) to a digit run. */
const digitsOf = (cell) => String(cell ?? '').replace(/[^01]/g, '');

const expectedTimesFive = (inputBits) => {
  const value = Number.parseInt(inputBits, 2) * 5;
  const tens = Math.floor(value / 10);
  const units = value % 10;
  return `${tens.toString(2).padStart(4, '0')}${units.toString(2).padStart(4, '0')}`;
};

/**
 * Pull 4-in / 8-out rows out of a table block's raw data.
 *
 * The extractor reports the grid exactly as `find_tables()` saw it, including
 * merged-header blanks, so a row is only usable when its populated cells happen
 * to form a 12-bit run.
 */
const isBinaryCell = (cell) => {
  const text = String(cell ?? '').trim();
  return /^[01]+$/.test(text);
};

/**
 * Pull 4-in / 8-out rows out of a table block's raw data.
 *
 * Two layouts are accepted, both observed rather than assumed:
 * - twelve single-bit cells, which is what `find_tables()` reports for the
 *   measured 5×A grid;
 * - two cells holding 4 and 8 bits, for a grid that groups the nibbles.
 *
 * Any other split is ambiguous. Joining every digit and searching for a 12-bit
 * run would silently re-split a 6+6 or 3×4 table as 4-in / 8-out and score it
 * as though the grouping had been understood, so an unrecognised layout is
 * skipped and left visible rather than guessed at.
 */
export const rowsFromExtractedTable = (block) => {
  const data = block.content?.data ?? [];
  const rows = [];
  for (const row of data) {
    const cells = (Array.isArray(row) ? row : [row])
      .map((cell) => String(cell ?? '').trim())
      .filter((cell) => cell.length > 0);
    if (!cells.every(isBinaryCell)) continue;

    const total = cells.reduce((length, cell) => length + cell.length, 0);
    if (total !== 12) continue;

    const singleBits = cells.every((cell) => cell.length === 1);
    const nibbleGroups =
      cells.length === 2 && cells[0].length === 4 && cells[1].length === 8;
    if (!singleBits && !nibbleGroups) continue;

    const digits = cells.join('');
    rows.push({ input: digits.slice(0, 4), output: digits.slice(4) });
  }
  return rows;
};

/** Score every usable row against `5×A` arithmetic. */
export const scoreTimesFive = (block) => {
  const rows = rowsFromExtractedTable(block);
  const results = rows.map(({ input, output }) => ({
    input,
    output,
    expected: expectedTimesFive(input),
    correct: output === expectedTimesFive(input),
  }));
  return {
    anchor: block.anchor ?? null,
    rowsScored: results.length,
    rowsCorrect: results.filter((result) => result.correct).length,
    results,
  };
};

/** Score every table block in a document record. */
export const scoreDocumentTables = (document) => {
  const tables = document.pages
    .flatMap((page) => page.blocks)
    .filter((block) => block.type === 'table')
    .map((block) => scoreTimesFive(block))
    // A table with no 4-in/8-out rows is not this check's subject, but saying so
    // keeps the gap visible instead of silently scoring zero tables.
    .map((result) =>
      result.rowsScored > 0
        ? result
        : { ...result, skipped: 'no 4-input / 8-output rows in this table' },
    );
  const scored = tables.filter((table) => table.rowsScored > 0);
  return {
    tablesFound: tables.length,
    tablesScored: scored.length,
    rowsScored: scored.reduce((total, table) => total + table.rowsScored, 0),
    rowsCorrect: scored.reduce((total, table) => total + table.rowsCorrect, 0),
    tables,
  };
};

if (process.argv[1]?.endsWith('score-tables.mjs')) {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node score-tables.mjs <record.json>');
    process.exitCode = 1;
  } else {
    const document = JSON.parse(readFileSync(path, 'utf8'));
    console.log(JSON.stringify(scoreDocumentTables(document), null, 2));
  }
}
