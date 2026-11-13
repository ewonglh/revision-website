// Extraction harness runner. Research code, run manually and never in CI.
//
// Reads locally rendered page images, sends each to the configured provider,
// and writes an anchored record per page. It deliberately does not decide
// whether a reading is correct: scoring is a separate step using checks.mjs,
// because a provider's fluent output is not evidence that it read the page.
//
// Usage:
//   node evaluation/extraction/run-extraction.mjs --pages <dir> [--out <dir>]
//   node evaluation/extraction/run-extraction.mjs --dry-run --pages <dir>
//
// Without --dry-run it requires EXTRACTION_BASE_URL, EXTRACTION_MODEL and
// EXTRACTION_API_KEY and refuses to start if any is missing.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import { readConfig, readPage } from './provider.mjs';

const EXTRACTION_PROMPT = [
  'Transcribe this page into structured JSON. Rules:',
  '- Reproduce every symbol exactly as printed. Do not simplify mathematics.',
  '- For each table, emit rows and columns as nested arrays of strings.',
  '- For each circuit, list every component and every connection as pairs of',
  '  endpoints. If a connection is not clearly visible, omit it and set',
  '  "unclear": true for that diagram.',
  '- Do not infer values from the surrounding prose. Transcribe what is drawn.',
  '- Return only JSON with the shape',
  '  {"blocks":[{"type","anchor","content"}],"unclear":[string]}.',
].join('\n');

const IMAGE_TYPES = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
]);

const parseArgs = (argv) => {
  const args = { dryRun: false, pages: null, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--pages') args.pages = argv[index + 1];
    else if (arg === '--out') args.out = argv[index + 1];
  }
  return args;
};

const listPages = (directory) =>
  readdirSync(directory)
    .filter((name) => IMAGE_TYPES.has(extname(name).toLowerCase()))
    .sort();

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pages) {
    console.error('Missing --pages <directory of rendered page images>');
    process.exitCode = 1;
    return;
  }

  const pages = listPages(args.pages);
  if (pages.length === 0) {
    console.error(`No supported images in ${args.pages}`);
    process.exitCode = 1;
    return;
  }

  const resolved = readConfig();
  if (args.dryRun || !resolved.ok) {
    // Dry run states exactly what would be sent and what is missing, so the
    // harness is inspectable before any provider account exists.
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          pagesFound: pages.length,
          pageNames: pages,
          providerConfigured: resolved.ok,
          missing: resolved.ok ? [] : resolved.missing,
          requestShape: {
            model: resolved.ok ? resolved.config.model : '<EXTRACTION_MODEL>',
            thinking: 'disabled',
            temperature: 0,
            maxTokens: 2_000,
            imageTokensPerPage: 1_024,
            promptLines: EXTRACTION_PROMPT.split('\n').length,
          },
          note: 'No request sent. Set EXTRACTION_BASE_URL, EXTRACTION_MODEL and EXTRACTION_API_KEY to run.',
        },
        null,
        2,
      ),
    );
    return;
  }

  const outDir = args.out ?? join(args.pages, '..', 'extraction-records');
  mkdirSync(outDir, { recursive: true });

  const records = [];
  for (const name of pages) {
    const path = join(args.pages, name);
    const bytes = readFileSync(path);
    const mimeType = IMAGE_TYPES.get(extname(name).toLowerCase());
    try {
      const response = await readPage(resolved.config, {
        imageBase64: bytes.toString('base64'),
        mimeType,
        prompt: EXTRACTION_PROMPT,
      });
      const record = {
        page: name,
        pageImageSha256: sha256(bytes),
        model: response.model,
        usage: response.usage,
        raw: response.content,
        // Unreviewed by definition: a recorded reading with no check yet.
        reviewState: 'unreviewed',
        route: 'vision',
      };
      records.push(record);
      writeFileSync(
        join(outDir, `${basename(name, extname(name))}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
      );
      console.log(`${name}: ${response.content.length} chars`);
    } catch (error) {
      // A failure is data, not a crash: write the failed record to disk too, so
      // a run where some pages fail does not look shorter than it was. Without
      // this, an all-failed run scores as zero pages rather than as failures.
      const record = {
        page: name,
        pageImageSha256: sha256(bytes),
        error: error.message,
        reviewState: 'unreviewed',
        route: 'vision',
      };
      records.push(record);
      writeFileSync(
        join(outDir, `${basename(name, extname(name))}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
      );
      console.error(`${name}: ${error.message}`);
    }
  }

  const summary = {
    mode: 'billed',
    pagesAttempted: pages.length,
    pagesSucceeded: records.filter((record) => !record.error).length,
    imageTokensPresent:
      1_024 * records.filter((record) => !record.error).length,
    outputTokensReported: records.reduce(
      (total, record) => total + (record.usage?.completion_tokens ?? 0),
      0,
    ),
    records,
  };
  writeFileSync(
    join(outDir, 'run-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(
    `\n${summary.pagesSucceeded}/${summary.pagesAttempted} pages read. Records in ${outDir}`,
  );
};

await main();
