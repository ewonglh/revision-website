// Deterministic checks used to score extraction output. Research code: never
// imported by the application. Every function here is pure and offline.
//
// The point of these checks is that they do not trust a reading. A reading that
// looks fluent can still be wrong (measured: 5/10 rows on a dense truth table),
// so any claim of correctness must come from arithmetic, an executed truth
// table, or agreement with an independent extraction route.

/** Parse a run of `0`/`1` characters into an integer. */
export const bitsToInt = (bits) => {
  if (!/^[01]+$/.test(bits)) {
    throw new Error(`Not a bit string: ${JSON.stringify(bits)}`);
  }
  return Number.parseInt(bits, 2);
};

/** Two decimal digits as 8 BCD bits: tens nibble then units nibble. */
export const toBcd8 = (value) => {
  if (!Number.isInteger(value) || value < 0 || value > 99) {
    throw new Error(`BCD byte range is 0..99, got ${value}`);
  }
  const tens = Math.floor(value / 10);
  const units = value % 10;
  return `${tens.toString(2).padStart(4, '0')}${units.toString(2).padStart(4, '0')}`;
};

/** Expected 5*A table row: input nibble in, eight BCD output bits out. */
export const expectedTimesFive = (inputBits) =>
  toBcd8(5 * bitsToInt(inputBits));

/**
 * Score a parsed 10-row `5*A` table against arithmetic.
 * `rows` is an array of `{ input, output }` bit strings.
 */
export const scoreTimesFiveTable = (rows) => {
  const results = rows.map(({ input, output }) => {
    const expected = expectedTimesFive(input);
    return {
      input,
      output,
      expected,
      correct: output === expected,
      // Which bit positions differ, so an error pattern is visible rather than
      // collapsed into one pass/fail.
      mismatchedPositions: [...output]
        .map((bit, index) => (bit === expected[index] ? null : index))
        .filter((index) => index !== null),
    };
  });
  const correct = results.filter((result) => result.correct).length;
  return {
    results,
    rowsScored: results.length,
    rowsCorrect: correct,
    exact: correct === results.length,
  };
};

/**
 * 4-bit magnitude comparator. `assign` maps signal names to 0/1; names absent
 * from `INPUTS` are treated as constant digits.
 */
export const comparatorOutput = (xSignals, ySignals, tap, assign) => {
  const build = (signals) =>
    signals.reduce((value, signal) => {
      const bit =
        signal === '0' || signal === '1' ? Number(signal) : assign[signal];
      if (bit !== 0 && bit !== 1) {
        throw new Error(`Unassigned signal ${signal}`);
      }
      return value * 2 + bit;
    }, 0);
  const x = build(xSignals);
  const y = build(ySignals);
  if (tap === 'gt') return Number(x > y);
  if (tap === 'eq') return Number(x === y);
  if (tap === 'lt') return Number(x < y);
  throw new Error(`Unknown tap ${tap}`);
};

const INPUTS = ['A', 'B', 'C', 'D'];

const allAssignments = () => {
  const out = [];
  for (let mask = 0; mask < 16; mask += 1) {
    out.push({
      A: (mask >> 3) & 1,
      B: (mask >> 2) & 1,
      C: (mask >> 1) & 1,
      D: mask & 1,
    });
  }
  return out;
};

/** Minterm indices where a single-comparator configuration outputs 1. */
export const comparatorMinterms = ({ x, y, tap }) => {
  const ones = allAssignments().filter(
    (assign) => comparatorOutput(x, y, tap, assign) === 1,
  );
  return new Set(
    ones.map((assign) => bitsToInt(INPUTS.map((k) => assign[k]).join(''))),
  );
};

/**
 * Exhaustively check one comparator configuration against a stated minterm set.
 * This is a real execution, so a pass is check evidence rather than review.
 */
export const checkComparatorConfig = (config) => {
  const computed = comparatorMinterms(config);
  const stated = new Set(config.minterms);
  const extra = [...computed].filter((value) => !stated.has(value));
  const missing = [...stated].filter((value) => !computed.has(value));
  return {
    label: config.label,
    tap: `X${config.tap === 'gt' ? '>' : config.tap === 'lt' ? '<' : '='}Y`,
    mintermsComputed: [...computed].sort((a, b) => a - b),
    mintermsStated: [...stated].sort((a, b) => a - b),
    extra,
    missing,
    passes: extra.length === 0 && missing.length === 0,
  };
};

/**
 * Cross-route agreement. Two readings of the same block either agree or they
 * do not; disagreement means neither is trustworthy unreviewed.
 */
export const crossRouteAgreement = (routeA, routeB) => {
  const normalise = (value) =>
    String(value ?? '')
      .replace(/\s+/g, '')
      .toLowerCase();
  const a = normalise(routeA);
  const b = normalise(routeB);
  return {
    agrees: a === b,
    lengthA: a.length,
    lengthB: b.length,
    // Cheap description of where they diverge, for the record.
    firstDifference:
      a === b
        ? null
        : ([...Array(Math.max(a.length, b.length)).keys()].find(
            (index) => a[index] !== b[index],
          ) ?? null),
  };
};
