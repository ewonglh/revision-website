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
export const rowsFromExtractedTable = (block) => {
  const data = block.content?.data ?? [];
  const rows = [];
  for (const row of data) {
    const digits = (Array.isArray(row) ? row : [row]).map(digitsOf).join('');
    if (/^[01]{12}$/.test(digits)) {
      rows.push({ input: digits.slice(0, 4), output: digits.slice(4) });
    }
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
