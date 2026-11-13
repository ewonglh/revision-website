import { describe, expect, it } from 'vitest';

import {
  MAX_EXHAUSTIVE_INPUTS,
  compareCircuits,
  deviceCount,
  type Circuit,
  type GateType,
} from './circuit.ts';

/**
 * These tests prove the check, not the marking policy. They cover the
 * acceptance criteria on issue #33: the full-credit case, a counterexample, the
 * synthetic pack's negative control, cycles, floating inputs, unsupported
 * gates, the refusal above the exhaustive limit, and the device constraint being
 * independent of functional equivalence.
 */

const circuit = (
  inputs: readonly string[],
  outputs: readonly string[],
  gates: readonly {
    readonly id: string;
    readonly type: GateType;
    readonly inputs: readonly string[];
  }[],
  outputSources: Readonly<Record<string, string>>,
): Circuit => ({ inputs, outputs, gates, outputSources });

/** Inputs A,B,Y: a single XOR gate. From evaluation/synthetic-pack.json. */
const xorGate = circuit(
  ['A', 'B'],
  ['Y'],
  [{ id: 'g1', type: 'xor', inputs: ['A', 'B'] }],
  { Y: 'g1' },
);

/** Y = (A AND NOT B) OR (NOT A AND B): the pack's stated rubric answer. */
const xorSumOfProducts = circuit(
  ['A', 'B'],
  ['Y'],
  [
    { id: 'notA', type: 'not', inputs: ['A'] },
    { id: 'notB', type: 'not', inputs: ['B'] },
    { id: 'aAndNotB', type: 'and', inputs: ['A', 'notB'] },
    { id: 'notAAndB', type: 'and', inputs: ['notA', 'B'] },
    { id: 'sum', type: 'or', inputs: ['aAndNotB', 'notAAndB'] },
  ],
  { Y: 'sum' },
);

/** Y = NOT(A XNOR B): the pack's correct-alternative answer `circuit-alt`. */
const xorNotXnor = circuit(
  ['A', 'B'],
  ['Y'],
  [
    { id: 'xnor', type: 'xnor', inputs: ['A', 'B'] },
    { id: 'invert', type: 'not', inputs: ['xnor'] },
  ],
  { Y: 'invert' },
);

/** Four-NAND XOR: same function, different device mix and count. */
const xorNandOnly = circuit(
  ['A', 'B'],
  ['Y'],
  [
    { id: 'n1', type: 'nand', inputs: ['A', 'B'] },
    { id: 'n2', type: 'nand', inputs: ['A', 'n1'] },
    { id: 'n3', type: 'nand', inputs: ['B', 'n1'] },
    { id: 'n4', type: 'nand', inputs: ['n2', 'n3'] },
  ],
  { Y: 'n4' },
);

/** The pack's negative control: OR is not XOR. */
const orGate = circuit(
  ['A', 'B'],
  ['Y'],
  [{ id: 'g1', type: 'or', inputs: ['A', 'B'] }],
  { Y: 'g1' },
);

const expectEquivalent = (result: ReturnType<typeof compareCircuits>) => {
  expect(result.exhaustive).toBe(true);
  if (!result.exhaustive) throw new Error('comparison refused');
  expect(result.equivalent).toBe(true);
  expect(result.counterexample).toBeNull();
};

const expectRefusal = (
  result: ReturnType<typeof compareCircuits>,
  code: string,
) => {
  expect(result.exhaustive).toBe(false);
  if (result.exhaustive)
    throw new Error('comparison ran when it should refuse');
  expect(result.code).toBe(code);
  expect(Object.hasOwn(result, 'equivalent')).toBe(false);
};

describe('full-credit case: differently wired, functionally equivalent', () => {
  it('accepts a single XOR gate against the sum-of-products form', () => {
    expectEquivalent(compareCircuits(xorGate, xorSumOfProducts));
  });

  it('accepts NOT(A XNOR B), the pack correct-alternative', () => {
    expectEquivalent(compareCircuits(xorGate, xorNotXnor));
  });

  it('accepts a four-NAND XOR built from different gates', () => {
    expectEquivalent(compareCircuits(xorGate, xorNandOnly));
  });

  it('enumerates every input combination exactly once', () => {
    const result = compareCircuits(xorGate, xorSumOfProducts);
    expect(result.exhaustive).toBe(true);
    if (result.exhaustive) expect(result.inputsCompared).toBe(4);
  });

  it('does not depend on gate declaration order', () => {
    const reversed = circuit(
      xorSumOfProducts.inputs,
      xorSumOfProducts.outputs,
      [...xorSumOfProducts.gates].reverse(),
      xorSumOfProducts.outputSources,
    );
    expectEquivalent(compareCircuits(xorGate, reversed));
  });

  it('does not depend on input declaration order', () => {
    const swapped = circuit(
      ['B', 'A'],
      ['Y'],
      [{ id: 'g1', type: 'xor', inputs: ['B', 'A'] }],
      { Y: 'g1' },
    );
    expectEquivalent(compareCircuits(xorGate, swapped));
  });

  it('treats a circuit as equivalent to itself', () => {
    expectEquivalent(compareCircuits(xorSumOfProducts, xorSumOfProducts));
  });

  it('handles constants as declared gate inputs', () => {
    // Same function as xorSumOfProducts, with a constant tied into each term:
    // (NOT A AND B AND 1) OR (A AND NOT B AND 1). Constants are neutral here,
    // so any difference in the result would be a bug in constant handling.
    const tiedToOne = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'notA', type: 'not', inputs: ['A'] },
        { id: 'notB', type: 'not', inputs: ['B'] },
        { id: 'first', type: 'and', inputs: ['notA', 'B', '1'] },
        { id: 'second', type: 'and', inputs: ['A', 'notB', '1'] },
        { id: 'out', type: 'or', inputs: ['first', 'second'] },
      ],
      { Y: 'out' },
    );
    expectEquivalent(compareCircuits(tiedToOne, xorSumOfProducts));
  });

  it('treats a constant-0 term as absent rather than as a broken gate', () => {
    const withDeadTerm = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'notA', type: 'not', inputs: ['A'] },
        { id: 'notB', type: 'not', inputs: ['B'] },
        { id: 'first', type: 'and', inputs: ['A', 'notB'] },
        { id: 'second', type: 'and', inputs: ['notA', 'B'] },
        // A term that can never contribute because it is ANDed with 0.
        { id: 'dead', type: 'and', inputs: ['A', 'B', '0'] },
        { id: 'sum', type: 'or', inputs: ['first', 'second', 'dead'] },
      ],
      { Y: 'sum' },
    );
    expectEquivalent(compareCircuits(withDeadTerm, xorSumOfProducts));
  });
});

describe('non-equivalence reports a counterexample', () => {
  it('rejects the pack negative control (OR is not XOR)', () => {
    const result = compareCircuits(orGate, xorGate);
    expect(result.exhaustive).toBe(true);
    if (!result.exhaustive) throw new Error('comparison refused');
    expect(result.equivalent).toBe(false);
    expect(result.counterexample).not.toBeNull();
    const counterexample = result.counterexample;
    if (counterexample === null) throw new Error('expected a counterexample');
    // Enumeration order is A,B = 00,01,10,11, so 11 is the first difference.
    expect(counterexample.assignment).toEqual({ A: 1, B: 1 });
    expect(counterexample.outputA).toEqual({ Y: 1 });
    expect(counterexample.outputB).toEqual({ Y: 0 });
    expect(counterexample.differingOutputs).toEqual(['Y']);
  });

  it('names which output differs in a multi-output circuit', () => {
    const bothWrong = circuit(
      ['A', 'B'],
      ['F', 'G'],
      [
        { id: 'xor1', type: 'xor', inputs: ['A', 'B'] },
        { id: 'or1', type: 'or', inputs: ['A', 'B'] },
      ],
      { F: 'xor1', G: 'or1' },
    );
    const bothRight = circuit(
      ['A', 'B'],
      ['F', 'G'],
      [
        { id: 'xor1', type: 'xor', inputs: ['A', 'B'] },
        { id: 'xor2', type: 'xor', inputs: ['A', 'B'] },
      ],
      { F: 'xor1', G: 'xor2' },
    );
    const result = compareCircuits(bothWrong, bothRight);
    expect(result.exhaustive).toBe(true);
    if (!result.exhaustive) throw new Error('comparison refused');
    expect(result.equivalent).toBe(false);
    expect(result.counterexample?.differingOutputs).toEqual(['G']);
  });
});

describe('refuses rather than guesses', () => {
  it('refuses above the exhaustive input limit without claiming equivalence', () => {
    const build = (count: number) => {
      const names = Array.from({ length: count }, (_, index) => `I${index}`);
      // Fold every input into one XOR tree so no input is unused and the
      // refusal can only come from the input limit.
      const gates: { id: string; type: GateType; inputs: string[] }[] = [];
      let previous = names[0] ?? 'A';
      names.slice(1).forEach((name, index) => {
        const id = `fold${index}`;
        gates.push({ id, type: 'xor', inputs: [previous, name] });
        previous = id;
      });
      return circuit(names, ['Y'], gates, { Y: previous });
    };
    const tooWide = MAX_EXHAUSTIVE_INPUTS + 1;
    expectRefusal(
      compareCircuits(build(tooWide), build(tooWide)),
      'too-many-inputs',
    );
  });

  it('still runs at exactly the limit', () => {
    const names = Array.from(
      { length: MAX_EXHAUSTIVE_INPUTS },
      (_, index) => `I${index}`,
    );
    const tree = circuit(
      names,
      ['Y'],
      [{ id: 'g1', type: 'xor', inputs: names }],
      { Y: 'g1' },
    );
    const result = compareCircuits(tree, tree);
    expect(result.exhaustive).toBe(true);
    if (result.exhaustive) {
      expect(result.equivalent).toBe(true);
      expect(result.inputsCompared).toBe(2 ** MAX_EXHAUSTIVE_INPUTS);
    }
  });

  it('detects a combinational cycle instead of looping', () => {
    const cyclic = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'g1', type: 'and', inputs: ['A', 'g2'] },
        { id: 'g2', type: 'or', inputs: ['g1', 'B'] },
      ],
      { Y: 'g2' },
    );
    expectRefusal(compareCircuits(cyclic, xorGate), 'cycle');
  });

  it('rejects an undeclared signal instead of reading it as 0', () => {
    const floating = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'g1', type: 'and', inputs: ['A', 'C'] },
        { id: 'g2', type: 'or', inputs: ['g1', 'B'] },
      ],
      { Y: 'g2' },
    );
    expectRefusal(compareCircuits(floating, xorGate), 'undeclared-signal');
  });

  it('rejects a declared but unused input instead of treating it as constant', () => {
    const unused = circuit(
      ['A', 'B'],
      ['Y'],
      [{ id: 'g1', type: 'not', inputs: ['A'] }],
      { Y: 'g1' },
    );
    expectRefusal(compareCircuits(unused, xorGate), 'unused-input');
  });

  it('rejects unsupported gate types rather than ignoring them', () => {
    for (const type of ['buf', 'tri']) {
      const unsupported = circuit(
        ['A', 'B'],
        ['Y'],
        [{ id: 'g1', type: type as GateType, inputs: ['A', 'B'] }],
        { Y: 'g1' },
      );
      expectRefusal(compareCircuits(unsupported, xorGate), 'unsupported-gate');
    }
  });

  it('rejects wrong arity for NOT', () => {
    const badNot = circuit(
      ['A', 'B'],
      ['Y'],
      [{ id: 'g1', type: 'not', inputs: ['A', 'B'] }],
      { Y: 'g1' },
    );
    expectRefusal(compareCircuits(badNot, xorGate), 'bad-arity');
  });

  it('rejects circuits over different input sets, naming the difference', () => {
    const otherInputs = circuit(
      ['A', 'C'],
      ['Y'],
      [{ id: 'g1', type: 'xor', inputs: ['A', 'C'] }],
      { Y: 'g1' },
    );
    const result = compareCircuits(xorGate, otherInputs);
    expectRefusal(result, 'input-set-mismatch');
    if (!result.exhaustive) expect(result.reason).toContain('"C"');
  });

  it('rejects circuits over different output sets', () => {
    const differentlyNamed = circuit(
      ['A', 'B'],
      ['Out'],
      [{ id: 'g1', type: 'xor', inputs: ['A', 'B'] }],
      { Out: 'g1' },
    );
    expectRefusal(
      compareCircuits(xorGate, differentlyNamed),
      'output-set-mismatch',
    );
  });

  it('rejects an output with no declared source', () => {
    const missing = circuit(
      ['A', 'B'],
      ['Y'],
      [{ id: 'g1', type: 'xor', inputs: ['A', 'B'] }],
      {},
    );
    expectRefusal(compareCircuits(missing, xorGate), 'output-set-mismatch');
  });

  it('reports every structural problem it found, not only the first', () => {
    const broken = circuit(
      ['A', 'A'],
      ['Y', 'Z'],
      [
        { id: 'g1', type: 'not', inputs: ['A', 'B'] },
        { id: 'g2', type: 'buf' as GateType, inputs: ['A'] },
      ],
      {},
    );
    const result = compareCircuits(broken, xorGate);
    expect(result.exhaustive).toBe(false);
    if (!result.exhaustive) {
      // Distinct messages, not the same problem repeated.
      expect(new Set(result.details).size).toBe(result.details.length);
      expect(result.details.length).toBeGreaterThan(1);
      // The primary reason must be one of the problems actually listed.
      expect(
        result.details.some((detail) => detail.includes(result.reason)),
      ).toBe(true);
    }
  });
});

describe('regressions found in independent review', () => {
  it('refuses a gate id that collides with an input name', () => {
    // Before the fix this gate was shadowed by the input of the same name, so
    // the circuit proved equivalent to a different function entirely.
    const shadowed = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'A', type: 'not', inputs: ['B'] },
        { id: 'g', type: 'or', inputs: ['A', 'B'] },
      ],
      { Y: 'g' },
    );
    const aOrB = circuit(
      ['A', 'B'],
      ['Y'],
      [{ id: 'g', type: 'or', inputs: ['A', 'B'] }],
      { Y: 'g' },
    );
    const result = compareCircuits(shadowed, aOrB);
    expectRefusal(result, 'invalid-name');
    if (!result.exhaustive) expect(result.reason).toContain('collides');
  });

  it('does not claim rows it did not evaluate', () => {
    const orThree = circuit(
      ['A', 'B', 'C'],
      ['Y'],
      [{ id: 'g', type: 'or', inputs: ['A', 'B', 'C'] }],
      { Y: 'g' },
    );
    const xorThree = circuit(
      ['A', 'B', 'C'],
      ['Y'],
      [{ id: 'g', type: 'xor', inputs: ['A', 'B', 'C'] }],
      { Y: 'g' },
    );
    const result = compareCircuits(orThree, xorThree);
    expect(result.exhaustive).toBe(true);
    if (!result.exhaustive) throw new Error('comparison refused');
    expect(result.equivalent).toBe(false);
    // OR and XOR agree on 000, 001 and 010, and first differ on 011 (row 4).
    expect(result.inputsCompared).toBe(4);
    expect(result.inputsCompared).toBeLessThan(8);
  });

  it('reports full enumeration only when every row ran', () => {
    const result = compareCircuits(xorGate, xorSumOfProducts);
    expect(result.exhaustive).toBe(true);
    if (result.exhaustive) expect(result.inputsCompared).toBe(2 ** 2);
  });

  it('refuses a malformed circuit record instead of throwing', () => {
    const malformed = [
      null,
      {},
      { inputs: ['A'], outputs: ['Y'], gates: null, outputSources: { Y: 'A' } },
      { inputs: ['A'], outputs: ['Y'], gates: [], outputSources: 'nope' },
      { inputs: ['A'], outputs: ['Y'], gates: [{}], outputSources: { Y: 'A' } },
      { inputs: 'A', outputs: ['Y'], gates: [], outputSources: { Y: 'A' } },
    ];
    for (const value of malformed) {
      expect(() =>
        compareCircuits(value as unknown as Circuit, xorGate),
      ).not.toThrow();
      const result = compareCircuits(value as unknown as Circuit, xorGate);
      expect(result.exhaustive).toBe(false);
      if (!result.exhaustive) expect(result.code).toBe('invalid-name');
    }
  });

  it('refuses a non-string output source instead of throwing', () => {
    // Found in the second review round: the output source was skipped during
    // resolution, and a later step then threw "Missing output".
    const shared = circuit(
      ['A', 'B'],
      ['F', 'G'],
      [{ id: 'g1', type: 'xor', inputs: ['A', 'B'] }],
      { F: 'g1' },
    );
    const malformedSources: unknown[] = [null, 123, true, {}, []];
    for (const bad of malformedSources) {
      const broken = {
        ...shared,
        outputSources: { F: 'g1', G: bad },
      } as unknown as Circuit;
      expect(() => compareCircuits(broken, shared)).not.toThrow();
      const result = compareCircuits(broken, shared);
      expect(result.exhaustive).toBe(false);
      if (!result.exhaustive) {
        expect(result.code).toBe('output-set-mismatch');
        // The diagnostic must name the real defect, not claim a dead gate.
        expect(result.code).not.toBe('unreachable-gate');
        expect(result.reason).toContain('"G"');
      }
    }
  });

  it('refuses an output source that is a string but names nothing', () => {
    const broken = {
      inputs: ['A', 'B'],
      outputs: ['F', 'G'],
      gates: [{ id: 'g1', type: 'xor', inputs: ['A', 'B'] }],
      outputSources: { F: 'g1', G: 'nowhere' },
    } as unknown as Circuit;
    const result = compareCircuits(broken, broken);
    expectRefusal(result, 'undeclared-signal');
  });

  it('refuses a gate that reaches no output instead of counting it as a device', () => {
    const deadGate = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'dead', type: 'and', inputs: ['A', 'B'] },
        { id: 'g', type: 'or', inputs: ['A', 'B'] },
      ],
      { Y: 'g' },
    );
    const result = compareCircuits(deadGate, orGate);
    expectRefusal(result, 'unreachable-gate');
    if (!result.exhaustive) expect(result.reason).toContain('dead');
  });

  it('keeps device total equal to the sum of byType, reporting unknown gates', () => {
    const withUnknown = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'g', type: 'and', inputs: ['A', 'B'] },
        { id: 'u', type: 'buf' as GateType, inputs: ['A', 'B'] },
      ],
      { Y: 'g' },
    );
    const counted = deviceCount(withUnknown);
    expect(counted.total).toBe(1);
    expect(counted.byType.and).toBe(1);
    expect(counted.unsupportedIds).toEqual(['u']);
    expect(counted.total).toBe(
      Object.values(counted.byType).reduce((sum, value) => sum + value, 0),
    );
  });

  it('reports a device count for the pack circuit and its alternatives', () => {
    expect(deviceCount(xorGate)).toEqual({
      total: 1,
      byType: {
        and: 0,
        or: 0,
        not: 0,
        nand: 0,
        nor: 0,
        xor: 1,
        xnor: 0,
      },
      unsupportedIds: [],
    });
  });
});

describe('device count is a constraint, not a consequence of equivalence', () => {
  it('counts an equivalent pair differently so a rubric can fail on devices', () => {
    const gate = deviceCount(xorGate);
    const sumOfProducts = deviceCount(xorSumOfProducts);
    const nandOnly = deviceCount(xorNandOnly);

    // Two equivalent circuits with different device counts. Discovered from
    // the counts rather than typed in, so the assertion would fail if either
    // count were wrong.
    expectEquivalent(compareCircuits(xorSumOfProducts, xorNandOnly));
    const sumOfTerms = Object.values(sumOfProducts.byType).reduce(
      (total, count) => total + count,
      0,
    );
    expect(sumOfProducts.total).toBe(sumOfTerms);
    expect(sumOfProducts.total).toBeGreaterThan(nandOnly.total);
    expect(sumOfProducts.total).not.toBe(gate.total);
    // Equivalence holds for every pair, so credit cannot be decided by
    // `equivalent` alone when the question states a device constraint.
    expectEquivalent(compareCircuits(xorNandOnly, xorGate));
    expect(sumOfProducts.byType).toMatchObject({ not: 2, and: 2, or: 1 });
    expect(nandOnly.byType).toMatchObject({ nand: 4 });
  });

  it('counts each declared gate once', () => {
    expect(deviceCount(xorNandOnly).total).toBe(xorNandOnly.gates.length);
  });
});

describe('gate semantics', () => {
  it('matches De Morgan for NAND and NOR forms', () => {
    const andForm = circuit(
      ['A', 'B'],
      ['Y'],
      [{ id: 'g', type: 'and', inputs: ['A', 'B'] }],
      { Y: 'g' },
    );
    const deMorgan = circuit(
      ['A', 'B'],
      ['Y'],
      [
        { id: 'notA', type: 'not', inputs: ['A'] },
        { id: 'notB', type: 'not', inputs: ['B'] },
        { id: 'g', type: 'nor', inputs: ['notA', 'notB'] },
      ],
      { Y: 'g' },
    );
    expectEquivalent(compareCircuits(andForm, deMorgan));
  });

  it('treats variadic AND gates as their binary equivalence', () => {
    const threeWay = circuit(
      ['A', 'B', 'C'],
      ['Y'],
      [{ id: 'g', type: 'and', inputs: ['A', 'B', 'C'] }],
      { Y: 'g' },
    );
    const nested = circuit(
      ['A', 'B', 'C'],
      ['Y'],
      [
        { id: 'first', type: 'and', inputs: ['A', 'B'] },
        { id: 'second', type: 'and', inputs: ['first', 'C'] },
      ],
      { Y: 'second' },
    );
    expectEquivalent(compareCircuits(threeWay, nested));
  });

  it('distinguishes XNOR from XOR', () => {
    const xnor = circuit(
      ['A', 'B'],
      ['Y'],
      [{ id: 'g', type: 'xnor', inputs: ['A', 'B'] }],
      { Y: 'g' },
    );
    const result = compareCircuits(xnor, xorGate);
    expect(result.exhaustive).toBe(true);
    if (result.exhaustive) expect(result.equivalent).toBe(false);
  });
});

describe('differential check against an independent evaluator', () => {
  /**
   * A second evaluator written in a different style — recursive, memoised, no
   * topological sort and no shared helpers — used to cross-check the exhaustive
   * comparison. Agreement on a truth table derived independently is evidence
   * the enumeration and gate semantics are right; both implementations could
   * still share a conceptual mistake, so this is corroboration, not proof.
   */
  const evaluateIndependently = (
    inputNames: readonly string[],
    gates: readonly {
      readonly id: string;
      readonly type: GateType;
      readonly inputs: readonly string[];
    }[],
    assignment: Readonly<Record<string, 0 | 1>>,
    outputSource: string,
  ): 0 | 1 => {
    const gatesById = new Map(gates.map((gate) => [gate.id, gate] as const));
    const memo = new Map<string, 0 | 1>();
    const valueOf = (name: string): 0 | 1 => {
      if (name === '0') return 0;
      if (name === '1') return 1;
      if (inputNames.includes(name)) return assignment[name] ?? 0;
      const cached = memo.get(name);
      if (cached !== undefined) return cached;
      const gate = gatesById.get(name);
      if (!gate) throw new Error(`unknown signal ${name}`);
      const values = gate.inputs.map(valueOf);
      const everyOne = values.every((value) => value === 1);
      const anyOne = values.some((value) => value === 1);
      const parity = values.reduce<number>((sum, value) => sum + value, 0) % 2;
      const invert = (bit: 0 | 1): 0 | 1 => (bit === 1 ? 0 : 1);
      const result: 0 | 1 = (() => {
        switch (gate.type) {
          case 'and':
            return everyOne ? 1 : 0;
          case 'nand':
            return invert(everyOne ? 1 : 0);
          case 'or':
            return anyOne ? 1 : 0;
          case 'nor':
            return invert(anyOne ? 1 : 0);
          case 'not':
            return invert(values[0] === 1 ? 1 : 0);
          case 'xor':
            return parity === 1 ? 1 : 0;
          case 'xnor':
            return invert(parity === 1 ? 1 : 0);
        }
      })();
      memo.set(name, result);
      return result;
    };
    return valueOf(outputSource);
  };

  it('agrees on every assignment of a three-input parity circuit', () => {
    // XOR of three inputs, written as a single variadic gate and as a chain.
    const flat = circuit(
      ['A', 'B', 'C'],
      ['Y'],
      [{ id: 'g', type: 'xor', inputs: ['A', 'B', 'C'] }],
      { Y: 'g' },
    );
    const chain = circuit(
      ['A', 'B', 'C'],
      ['Y'],
      [
        { id: 'x1', type: 'xor', inputs: ['A', 'B'] },
        { id: 'x2', type: 'xor', inputs: ['x1', 'C'] },
      ],
      { Y: 'x2' },
    );

    const compared = compareCircuits(flat, chain);
    expectEquivalent(compared);

    let ones = 0;
    for (let row = 0; row < 8; row += 1) {
      const A = ((row >>> 2) & 1) as 0 | 1;
      const B = ((row >>> 1) & 1) as 0 | 1;
      const C = (row & 1) as 0 | 1;
      const expected = (A ^ B ^ C) as 0 | 1;
      if (expected === 1) ones += 1;
      expect(
        evaluateIndependently(['A', 'B', 'C'], flat.gates, { A, B, C }, 'g'),
      ).toBe(expected);
      expect(
        evaluateIndependently(['A', 'B', 'C'], chain.gates, { A, B, C }, 'x2'),
      ).toBe(expected);
    }
    // Guards against a loop that trivially agrees on a constant truth table.
    expect(ones).toBe(4);
  });

  it('agrees on a mixed-gate circuit against a form derived from its truth table', () => {
    const inputNames = ['A', 'B', 'C'] as const;
    const mixed = circuit(
      [...inputNames],
      ['Y'],
      [
        { id: 'n1', type: 'nand', inputs: ['A', 'B'] },
        { id: 'n2', type: 'nor', inputs: ['B', 'C'] },
        { id: 'n3', type: 'xnor', inputs: ['n1', 'n2', 'C'] },
        { id: 'n4', type: 'not', inputs: ['n3'] },
      ],
      { Y: 'n4' },
    );

    // Build a sum-of-products circuit from the truth table the *independent*
    // evaluator produces. If the module under test and this evaluator disagree
    // on any row, the two circuits will not compare equivalent and the test
    // fails — neither implementation is used to bless the other.
    const minterms: (readonly [0 | 1, 0 | 1, 0 | 1])[] = [];
    for (let row = 0; row < 8; row += 1) {
      const assignment = {
        A: ((row >>> 2) & 1) as 0 | 1,
        B: ((row >>> 1) & 1) as 0 | 1,
        C: (row & 1) as 0 | 1,
      };
      const value = evaluateIndependently(
        inputNames,
        mixed.gates,
        assignment,
        'n4',
      );
      if (value === 1)
        minterms.push([assignment.A, assignment.B, assignment.C]);
    }
    expect(minterms.length).toBeGreaterThan(0);
    expect(minterms.length).toBeLessThan(8);

    const literals: { id: string; type: GateType; inputs: string[] }[] = [];
    const terms: string[] = [];
    minterms.forEach((bits, termIndex) => {
      const parts = inputNames.map((name, position) => {
        const bit = bits[position];
        if (bit === 1) return name;
        const id = `not_${name}_${termIndex}`;
        literals.push({ id, type: 'not', inputs: [name] });
        return id;
      });
      const id = `term_${termIndex}`;
      terms.push(id);
      literals.push({
        id,
        type: 'and',
        inputs: parts.length > 1 ? parts : [parts[0] ?? inputNames[0], '1'],
      });
    });
    const outputId = terms.length > 1 ? 'sum' : (terms[0] ?? 'none');
    if (terms.length > 1) {
      literals.push({ id: 'sum', type: 'or', inputs: terms });
    }
    const fromTruthTable = circuit([...inputNames], ['Y'], literals, {
      Y: outputId,
    });

    expectEquivalent(compareCircuits(mixed, fromTruthTable));
  });
});
