// Score recorded extraction output against deterministic checks.
//
// This is the step that decides correctness, and it never asks a model. Input
// is a directory of records written by run-extraction.mjs; output is a scored
// summary. Pages without a declared check are reported as unscored rather than
// assumed correct, because most pages on this pack have no ground truth yet.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  checkComparatorConfig,
  crossRouteAgreement,
  expectedTimesFive,
} from './checks.mjs';

const loadRecords = (directory) =>
  readdirSync(directory)
    .filter(
      (name) =>
        name.endsWith('.json') &&
        name !== 'run-summary.json' &&
        name !== 'scored-summary.json',
    )
    .map((name) => JSON.parse(readFileSync(join(directory, name), 'utf8')));

/**
 * A recorded page is intelligible only if it parsed as JSON with blocks. A
 * provider that returns prose where JSON was requested has failed at reading,
 * not at formatting, because the shape was specified.
 */
const structureOf = (record) => {
  if (record.error)
    return { ok: false, reason: `provider error: ${record.error}` };
  try {
    const parsed = JSON.parse(record.raw.replace(/^```json\s*|\s*```$/g, ''));
    if (!Array.isArray(parsed.blocks)) {
      return { ok: false, reason: 'no blocks array' };
    }
    return { ok: true, blocks: parsed.blocks, unclear: parsed.unclear ?? [] };
  } catch {
    return { ok: false, reason: 'output was not JSON' };
  }
};

/** Extract 8-bit rows from a 5*A-style table block, if present. */
export const rowsFromTableBlock = (block) => {
  const rows = [];
  for (const row of block.content ?? []) {
    // A row may arrive as separate cells or as one string; collapse both to a
    // single digit run so a "0001 0000 0101" string is not mistaken for three
    // cells and silently dropped.
    const cells = Array.isArray(row) ? row : [row];
    const digits = cells
      .map((cell) => String(cell).replace(/[^01]/g, ''))
      .join('');
    // Exactly 4 input bits followed by 8 output bits; anything else is not the
    // table shape this check understands.
    if (/^[01]{12}$/.test(digits)) {
      rows.push({ input: digits.slice(0, 4), output: digits.slice(4) });
    }
  }
  return rows;
};

const main = () => {
  const directory = process.argv[2];
  if (!directory) {
    console.error('Usage: node score-records.mjs <records-directory>');
    process.exitCode = 1;
    return;
  }

  const records = loadRecords(directory);
  const scored = [];

  for (const record of records) {
    const structure = structureOf(record);
    const entry = {
      page: record.page,
      route: record.route,
      reviewState: record.reviewState,
      structureOk: structure.ok,
      ...(structure.ok ? {} : { structureFailure: structure.reason }),
    };

    if (structure.ok) {
      // Score any arithmetic-checkable table found on the page.
      const tableChecks = [];
      const skippedTables = [];
      for (const block of structure.blocks) {
        if (block.type !== 'table') continue;
        const rows = rowsFromTableBlock(block);
        if (rows.length < 8) {
          // Say so rather than skipping silently: a table that could not be
          // scored must be visible as a gap in coverage, not as a pass.
          skippedTables.push({
            anchor: block.anchor ?? null,
            rowsParsed: rows.length,
            reason:
              rows.length === 0
                ? 'no row matched the 4-input / 8-output bit shape'
                : 'fewer than 8 checkable rows; not a complete table',
          });
          continue;
        }
        const results = rows.map(({ input, output }) => ({
          input,
          output,
          expected: expectedTimesFive(input),
          correct: output === expectedTimesFive(input),
        }));
        tableChecks.push({
          anchor: block.anchor ?? null,
          rowsScored: results.length,
          rowsCorrect: results.filter((result) => result.correct).length,
          results,
        });
      }
      if (tableChecks.length > 0) entry.arithmeticTables = tableChecks;
      if (skippedTables.length > 0) entry.tablesNotScored = skippedTables;

      // Score any declared comparator configuration.
      const comparators = structure.blocks
        .filter((block) => block.type === 'comparator' && block.config)
        .map((block) => checkComparatorConfig(block.config));
      if (comparators.length > 0) entry.comparators = comparators;

      // Unscored content is stated, never counted as correct.
      if (!entry.arithmeticTables && !entry.comparators) {
        entry.unscored =
          'no deterministic check applies to the blocks on this page';
      }
    }

    scored.push(entry);
  }

  const summary = {
    pagesRead: records.length,
    pagesStructured: scored.filter((entry) => entry.structureOk).length,
    pagesUnstructured: scored.filter((entry) => !entry.structureOk).length,
    pagesWithArithmeticChecks: scored.filter((entry) => entry.arithmeticTables)
      .length,
    pagesWithComparatorChecks: scored.filter((entry) => entry.comparators)
      .length,
    pagesUnscored: scored.filter((entry) => entry.unscored).length,
    tablesNotScored: scored.reduce(
      (total, entry) => total + (entry.tablesNotScored?.length ?? 0),
      0,
    ),
    note: 'Pages without a deterministic check remain unreviewed. Do not read this summary as extraction accuracy.',
    scored,
  };

  writeFileSync(
    join(directory, 'scored-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary, null, 2));
};

export { crossRouteAgreement, structureOf };

// Only run when invoked directly, so the module stays importable and testable.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
