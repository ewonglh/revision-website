import { describe, expect, it } from 'vitest';

import {
  assessCircuitAnswer,
  compareCircuits,
  deviceCount,
  evaluateCircuit,
  topologicalOrder,
  validateCircuit,
} from './circuits.mjs';

/** XOR built from primitives — the "differently wired" full-credit case. */
const xorFromPrimitives = {
  inputs: ['A', 'B'],
  outputs: ['Y'],
  gates: [
    { id: 'n1', type: 'not', inputs: ['A'] },
    { id: 'n2', type: 'not', inputs: ['B'] },
    { id: 'a1', type: 'and', inputs: ['A', 'n2'] },
    { id: 'a2', type: 'and', inputs: ['n1', 'B'] },
    { id: 'o1', type: 'or', inputs: ['a1', 'a2'] },
  ],
  outputSources: { Y: 'o1' },
};

/** XOR as a single gate — functionally identical, fewer devices. */
const xorSingleGate = {
  inputs: ['A', 'B'],
  outputs: ['Y'],
  gates: [{ id: 'x1', type: 'xor', inputs: ['A', 'B'] }],
  outputSources: { Y: 'x1' },
};

/** AND — the negative control. */
const andGate = {
  inputs: ['A', 'B'],
  outputs: ['Y'],
  gates: [{ id: 'a1', type: 'and', inputs: ['A', 'B'] }],
  outputSources: { Y: 'a1' },
};

describe('evaluateCircuit', () => {
  it('computes XOR for every input pair', () => {
    const expected = [
      [{ A: 0, B: 0 }, 0],
      [{ A: 0, B: 1 }, 1],
      [{ A: 1, B: 0 }, 1],
      [{ A: 1, B: 1 }, 0],
    ];
    for (const [assign, value] of expected) {
      expect(evaluateCircuit(xorFromPrimitives, assign).Y).toBe(value);
    }
  });

  it('treats constant signals as constants', () => {
    const circuit = {
      inputs: ['A'],
      outputs: ['Y'],
      gates: [{ id: 'a1', type: 'and', inputs: ['A', '1'] }],
      outputSources: { Y: 'a1' },
    };
    expect(evaluateCircuit(circuit, { A: 1 }).Y).toBe(1);
    expect(evaluateCircuit(circuit, { A: 0 }).Y).toBe(0);
  });
});

describe('validateCircuit', () => {
  it('rejects an unsupported gate rather than ignoring it', () => {
    expect(() =>
      validateCircuit({
        inputs: ['A'],
        outputs: ['Y'],
        gates: [{ id: 'b1', type: 'buf', inputs: ['A'] }],
        outputSources: { Y: 'b1' },
      }),
    ).toThrow(/Unsupported gate type/);
  });

  it('rejects a gate with the wrong number of inputs', () => {
    expect(() =>
      validateCircuit({
        inputs: ['A', 'B'],
        outputs: ['Y'],
        gates: [{ id: 'a1', type: 'and', inputs: ['A'] }],
        outputSources: { Y: 'a1' },
      }),
    ).toThrow(/needs exactly 2 input/);
  });

  it('rejects a floating input instead of treating it as 0', () => {
    expect(() =>
      validateCircuit({
        inputs: ['A', 'B'],
        outputs: ['Y'],
        gates: [{ id: 'a1', type: 'and', inputs: ['A', 'Z'] }],
        outputSources: { Y: 'a1' },
      }),
    ).toThrow(/undeclared signal: Z/);
  });

  it('rejects an output with no source', () => {
    expect(() =>
      validateCircuit({
        inputs: ['A'],
        outputs: ['Y', 'F'],
        gates: [],
        outputSources: { Y: 'A' },
      }),
    ).toThrow(/Output F has no source/);
  });

  it('rejects duplicate gate ids', () => {
    expect(() =>
      validateCircuit({
        inputs: ['A'],
        outputs: ['Y'],
        gates: [
          { id: 'g', type: 'not', inputs: ['A'] },
          { id: 'g', type: 'not', inputs: ['A'] },
        ],
        outputSources: { Y: 'g' },
      }),
    ).toThrow(/Duplicate gate id/);
  });
});

describe('topologicalOrder', () => {
  it('detects a combinational cycle instead of looping', () => {
    const circuit = {
      inputs: ['A'],
      outputs: ['Y'],
      gates: [
        { id: 'g1', type: 'not', inputs: ['g2'] },
        { id: 'g2', type: 'not', inputs: ['g1'] },
      ],
      outputSources: { Y: 'g1' },
    };
    const validated = validateCircuit(circuit);
    expect(() => topologicalOrder(validated.gates, validated.gateIds)).toThrow(
      /cycle/,
    );
  });
});

describe('compareCircuits', () => {
  it('awards equivalence to a differently wired circuit (the full-credit case)', () => {
    const result = compareCircuits(xorFromPrimitives, xorSingleGate);
    expect(result.equivalent).toBe(true);
    expect(result.exhaustive).toBe(true);
    expect(result.assignmentsChecked).toBe(4);
  });

  it('rejects a non-equivalent circuit and returns a counterexample', () => {
    const result = compareCircuits(xorFromPrimitives, andGate);
    expect(result.equivalent).toBe(false);
    expect(result.counterexample).not.toBeNull();
    expect(result.counterexample.assignment).toEqual({ A: 0, B: 1 });
    expect(result.counterexample.left.value).toBe(1);
    expect(result.counterexample.right.value).toBe(0);
  });

  it('compares by output position, not output name', () => {
    const renamed = {
      ...xorSingleGate,
      outputs: ['F'],
      outputSources: { F: 'x1' },
    };
    expect(compareCircuits(xorFromPrimitives, renamed).equivalent).toBe(true);
  });

  it('maps inputs by position so different variable names are allowed', () => {
    const renamed = {
      inputs: ['P', 'Q'],
      outputs: ['Y'],
      gates: [{ id: 'x1', type: 'xor', inputs: ['P', 'Q'] }],
      outputSources: { Y: 'x1' },
    };
    expect(compareCircuits(xorFromPrimitives, renamed).equivalent).toBe(true);
  });

  it('refuses above the exhaustive limit instead of claiming equivalence', () => {
    const many = (prefix) => ({
      inputs: Array.from({ length: 17 }, (_, i) => `${prefix}${i}`),
      outputs: ['Y'],
      gates: [{ id: 'a1', type: 'and', inputs: [`${prefix}0`, `${prefix}1`] }],
      outputSources: { Y: 'a1' },
    });
    const result = compareCircuits(many('A'), many('B'));
    expect(result.equivalent).toBeNull();
    expect(result.exhaustive).toBe(false);
    expect(result.reason).toContain('reviewed argument');
  });

  it('reports differing input counts rather than guessing', () => {
    const result = compareCircuits(xorSingleGate, {
      inputs: ['A'],
      outputs: ['Y'],
      gates: [],
      outputSources: { Y: 'A' },
    });
    expect(result.equivalent).toBe(false);
    expect(result.reason).toContain('different input counts');
  });
});

describe('deviceCount', () => {
  it('counts gates by type', () => {
    expect(deviceCount(xorFromPrimitives)).toEqual({
      total: 5,
      byType: { not: 2, and: 2, or: 1 },
    });
    expect(deviceCount(xorSingleGate).total).toBe(1);
  });
});

describe('assessCircuitAnswer', () => {
  it('gives full credit to an equivalent circuit within the device cap', () => {
    const result = assessCircuitAnswer(xorSingleGate, xorFromPrimitives, {
      maxDevices: 5,
    });
    expect(result.verdict).toBe('full-credit');
  });

  it('does not treat equivalence alone as full credit when a cap is exceeded', () => {
    // The "fewest devices" case: same function, more gates than allowed.
    const result = assessCircuitAnswer(xorFromPrimitives, xorSingleGate, {
      maxDevices: 3,
    });
    expect(result.equivalence.equivalent).toBe(true);
    expect(result.verdict).toBe('equivalent-but-exceeds-device-cap');
    expect(result.devices.withinCap).toBe(false);
  });

  it('marks a non-equivalent answer as such', () => {
    expect(assessCircuitAnswer(andGate, xorSingleGate).verdict).toBe(
      'not-equivalent',
    );
  });

  it('defers to a reviewed argument when it cannot enumerate', () => {
    const many = (prefix) => ({
      inputs: Array.from({ length: 17 }, (_, i) => `${prefix}${i}`),
      outputs: ['Y'],
      gates: [],
      outputSources: { Y: `${prefix}0` },
    });
    expect(assessCircuitAnswer(many('A'), many('B')).verdict).toBe(
      'needs-reviewed-argument',
    );
  });
});
