import { describe, expect, it } from 'vitest';

import {
  bitsToInt,
  checkComparatorConfig,
  comparatorMinterms,
  crossRouteAgreement,
  expectedTimesFive,
  scoreTimesFiveTable,
  toBcd8,
} from './checks.mjs';
import { buildPageRequest, readConfig } from './provider.mjs';
import { rowsFromTableBlock, structureOf } from './score-records.mjs';

describe('bitsToInt', () => {
  it('parses bit strings', () => {
    expect(bitsToInt('0000')).toBe(0);
    expect(bitsToInt('1011')).toBe(11);
  });

  it('rejects non-bit input', () => {
    expect(() => bitsToInt('0120')).toThrow(/Not a bit string/);
  });
});

describe('toBcd8', () => {
  it('renders two decimal digits as two nibbles', () => {
    expect(toBcd8(0)).toBe('00000000');
    expect(toBcd8(45)).toBe('01000101');
    expect(toBcd8(99)).toBe('10011001');
  });

  it('rejects out-of-range input', () => {
    expect(() => toBcd8(100)).toThrow(/range/);
  });
});

describe('expectedTimesFive', () => {
  it('matches arithmetic for every 4-bit input', () => {
    expect(expectedTimesFive('0000')).toBe('00000000');
    expect(expectedTimesFive('0010')).toBe('00010000'); // 10 -> 0001 0000
    expect(expectedTimesFive('0111')).toBe('00110101'); // 35 -> 0011 0101
    expect(expectedTimesFive('1001')).toBe('01000101'); // 45 -> 0100 0101
  });
});

describe('scoreTimesFiveTable', () => {
  const perfectRows = Array.from({ length: 10 }, (_, value) => {
    const input = value.toString(2).padStart(4, '0');
    return { input, output: expectedTimesFive(input) };
  });

  it('scores a correct table as exact', () => {
    const score = scoreTimesFiveTable(perfectRows);
    expect(score.rowsCorrect).toBe(10);
    expect(score.exact).toBe(true);
  });

  it('detects the measured error mode: correct high nibble, wrong low nibble', () => {
    // 0010 -> 5*A = 10 = 0001 0000. A reading of 0000 1000 keeps bits that a
    // misread low-order digit would corrupt, so this is the failure shape that
    // was actually observed rather than a random bit flip.
    const rows = perfectRows.map((row) =>
      row.input === '0010' ? { input: '0010', output: '00001000' } : row,
    );
    const score = scoreTimesFiveTable(rows);
    expect(score.rowsCorrect).toBe(9);
    expect(score.exact).toBe(false);
    const failed = score.results.find((result) => result.input === '0010');
    expect(failed.expected).toBe('00010000');
    expect(failed.mismatchedPositions).toEqual([3, 4]);
  });

  it('does not report a wrong row as correct merely because it is plausible', () => {
    const rows = perfectRows.map((row) =>
      row.input === '0111' ? { input: '0111', output: '00111010' } : row,
    );
    expect(scoreTimesFiveTable(rows).rowsCorrect).toBe(9);
  });
});

describe('comparator checks', () => {
  it('recovers the page-6 (a) configuration', () => {
    const result = checkComparatorConfig({
      label: '(a) F',
      x: ['A', 'B', 'C', 'D'],
      y: ['1', '0', '1', '1'],
      tap: 'gt',
      minterms: [12, 13, 14, 15],
    });
    expect(result.passes).toBe(true);
  });

  it('recovers the page-6 (b) configuration', () => {
    const result = checkComparatorConfig({
      label: '(b) G',
      x: ['A', 'B', 'C', 'D'],
      y: ['D', 'C', 'B', 'A'],
      tap: 'eq',
      minterms: [0, 6, 9, 15],
    });
    expect(result.passes).toBe(true);
  });

  it('rejects a configuration that does not implement the stated function', () => {
    const result = checkComparatorConfig({
      label: 'wrong',
      x: ['A', 'B', 'C', 'D'],
      y: ['1', '0', '1', '1'],
      tap: 'lt',
      minterms: [12, 13, 14, 15],
    });
    expect(result.passes).toBe(false);
    expect(result.extra.length + result.missing.length).toBeGreaterThan(0);
  });

  it('treats constant digits as constants rather than free variables', () => {
    // X=B000 vs Y=C000 with equality is exactly B==C.
    const minterms = comparatorMinterms({
      x: ['B', '0', '0', '0'],
      y: ['C', '0', '0', '0'],
      tap: 'eq',
    });
    expect([...minterms].sort((a, b) => a - b)).toEqual([
      0, 1, 6, 7, 8, 9, 14, 15,
    ]);
  });
});

describe('crossRouteAgreement', () => {
  it('reports agreement after normalising whitespace and case', () => {
    expect(crossRouteAgreement('0001 0000', '0001\n0000').agrees).toBe(true);
  });

  it('reports disagreement and where it starts', () => {
    const result = crossRouteAgreement('00010000', '00001000');
    expect(result.agrees).toBe(false);
    expect(result.firstDifference).toBe(3);
  });
});

describe('provider configuration', () => {
  it('reports every missing variable instead of defaulting to a URL', () => {
    const result = readConfig({});
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      'EXTRACTION_BASE_URL',
      'EXTRACTION_MODEL',
      'EXTRACTION_API_KEY',
    ]);
  });

  it('builds an OpenAI-compatible request with thinking disabled', () => {
    const result = readConfig({
      EXTRACTION_BASE_URL: 'https://provider.example/v1/',
      EXTRACTION_MODEL: 'provider-alias',
      EXTRACTION_API_KEY: 'test-key-not-real',
    });
    expect(result.ok).toBe(true);
    const body = buildPageRequest(result.config, {
      imageBase64: 'AAAA',
      mimeType: 'image/png',
      prompt: 'read',
    });
    expect(body.model).toBe('provider-alias');
    expect(body.thinking).toEqual({ type: 'disabled' });
    expect(body.temperature).toBe(0);
    expect(result.config.baseUrl).toBe('https://provider.example/v1');
    expect(body.messages[0].content[1].image_url.url).toBe(
      'data:image/png;base64,AAAA',
    );
  });

  it('keeps the api key out of the request body', () => {
    const result = readConfig({
      EXTRACTION_BASE_URL: 'https://provider.example/v1',
      EXTRACTION_MODEL: 'm',
      EXTRACTION_API_KEY: 'secret-value',
    });
    const body = JSON.stringify(
      buildPageRequest(result.config, {
        imageBase64: 'AAAA',
        mimeType: 'image/png',
        prompt: 'read',
      }),
    );
    expect(body).not.toContain('secret-value');
  });
});

describe('score-records helpers', () => {
  it('parses table rows given as arrays', () => {
    const rows = rowsFromTableBlock({
      content: [
        ['0', '0', '0', '1', '0', '0', '0', '0', '0', '1', '0', '1'],
        ['0', '0', '1', '0', '0', '0', '0', '1', '0', '0', '0', '0'],
      ],
    });
    expect(rows).toEqual([
      { input: '0001', output: '00000101' },
      { input: '0010', output: '00010000' },
    ]);
  });

  it('parses table rows given as whitespace-separated strings', () => {
    const rows = rowsFromTableBlock({
      content: ['0001 0000 0101'],
    });
    expect(rows).toEqual([{ input: '0001', output: '00000101' }]);
  });

  it('ignores rows that are not 4-in / 8-out', () => {
    expect(
      rowsFromTableBlock({ content: [['0', '0', '0', '1', '0', '1']] }),
    ).toEqual([]);
    expect(rowsFromTableBlock({ content: [['digit', '0', '1', '2']] })).toEqual(
      [],
    );
  });

  it('treats provider error records as unstructured rather than empty successes', () => {
    expect(structureOf({ error: 'provider returned 500' })).toEqual({
      ok: false,
      reason: 'provider error: provider returned 500',
    });
  });

  it('accepts fenced JSON, which providers commonly return', () => {
    const result = structureOf({ raw: '```json\n{"blocks":[]}\n```' });
    expect(result.ok).toBe(true);
  });
});
