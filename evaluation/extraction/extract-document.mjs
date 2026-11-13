// CLI: probe a PDF and write extraction records. Research code.
//
// Requires Python with PyMuPDF for the probe step, then does all classification
// and record building in Node. Fails loudly when the probe cannot run, because a
// silent empty record is the exact failure this ticket exists to prevent.
//
// Usage:
//   node evaluation/extraction/extract-document.mjs <file.pdf> [--out <dir>]
//   node evaluation/extraction/extract-document.mjs <file.pdf> --structure <probe.json>

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { coverageSummary, documentRecord } from './records.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PROBE = join(here, 'pdf', 'probe_pdf.py');

const parseArgs = (argv) => {
  const args = { pdf: null, out: null, structure: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') {
      args.out = argv[index + 1];
      index += 1; // consume the value, or it is mistaken for a positional
    } else if (arg === '--structure') {
      args.structure = argv[index + 1];
      index += 1;
    } else if (!arg.startsWith('--')) {
      args.pdf = arg;
    }
  }
  return args;
};

/** Run the Python probe. Returns parsed JSON or throws with a usable message. */
const runProbe = (pdfPath) => {
  const python = process.env.PYTHON || 'python';
  const result = spawnSync(python, ['-I', PROBE, pdfPath], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) {
    throw new Error(
      `could not start ${python}: ${result.error.message}. Set PYTHON, or pass --structure <probe.json> produced elsewhere.`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `probe exited ${result.status}: ${(result.stderr || result.stdout).slice(0, 500)}`,
    );
  }
  const parsed = JSON.parse(result.stdout);
  if (parsed.error) {
    throw new Error(`probe reported: ${parsed.error}`);
  }
  return parsed;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pdf && !args.structure) {
    console.error(
      'Usage: node extract-document.mjs <file.pdf> [--out <dir>]\n' +
        '       node extract-document.mjs <file.pdf> --structure <probe.json>',
    );
    process.exitCode = 1;
    return;
  }

  let probe;
  if (args.structure) {
    probe = JSON.parse(readFileSync(args.structure, 'utf8'));
    if (probe.error) throw new Error(`probe reported: ${probe.error}`);
  } else {
    probe = runProbe(args.pdf);
  }

  // The revision is the source file's content hash when the file is present,
  // otherwise the probe payload's own hash, so a record always names what it
  // was derived from.
  const revision = args.pdf
    ? createHash('sha256').update(readFileSync(args.pdf)).digest('hex')
    : createHash('sha256').update(JSON.stringify(probe)).digest('hex');

  const document = documentRecord(probe, revision);
  const summary = coverageSummary(document);

  const outDir = args.out ?? join(process.cwd(), 'extraction-records');
  mkdirSync(outDir, { recursive: true });
  const stem = args.pdf ? basename(args.pdf, '.pdf') : 'document';
  writeFileSync(
    join(outDir, `${stem}.record.json`),
    `${JSON.stringify(document, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, `${stem}.coverage.json`),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary, null, 2));
};

try {
  main();
} catch (error) {
  // Loud, non-zero, and no partial record written.
  console.error(`extraction failed: ${error.message}`);
  process.exitCode = 1;
}
