import { describe, expect, it } from 'vitest';

import {
  compareExpressions,
  compareExpressionToCircuit,
  expressionToCircuit,
  parseExpression,
} from './expressions.mjs';

/** XOR built from primitives, to compare a typed expression against a drawing. */
const xorCircuit = {
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

describe('parseExpression', () => {
  it('strips a leading output label', () => {
    const parsed = parseExpression('Y = A AND B');
    expect(parsed.expression.type).toBe('and');
    expect(parsed.inputs).toEqual(['A', 'B']);
  });

  it('reads NOT applied to a parenthesised group', () => {
    const parsed = parseExpression('NOT(A XNOR B)');
    expect(parsed.expression.type).toBe('not');
    expect(parsed.expression.arg.type).toBe('xnor');
  });

  it('respects precedence: AND binds tighter than OR', () => {
    const parsed = parseExpression('A AND B OR C');
    expect(parsed.expression.type).toBe('or');
    expect(parsed.expression.args[0].type).toBe('and');
  });

  it('accepts symbolic operators', () => {
    const parsed = parseExpression('A & ~B | C');
    expect(parsed.expression.type).toBe('or');
  });

  it('records declared parameters when the form is F(A,B)', () => {
    const parsed = parseExpression('F(A,B,C) = A AND B');
    expect(parsed.inputs).toEqual(['A', 'B', 'C']);
  });

  it('rejects unbalanced parentheses instead of guessing', () => {
    expect(() => parseExpression('(A AND B')).toThrow(/Unbalanced/);
  });

  it('rejects an unexpected character', () => {
    expect(() => parseExpression('A @ B')).toThrow(/Unexpected character/);
  });
});

describe('expressionToCircuit', () => {
  it('produces circuit data the equivalence engine accepts', () => {
    const circuit = expressionToCircuit(parseExpression('A XOR B'));
    expect(circuit.inputs).toEqual(['A', 'B']);
    expect(circuit.gates).toHaveLength(1);
    expect(circuit.outputSources.Y).toBe('g1');
  });
});

describe('compareExpressions', () => {
  it('matches the fixture answer NOT(A XNOR B) against A XOR B', () => {
    const result = compareExpressions('Y = NOT(A XNOR B)', 'Y = A XOR B');
    expect(result.equivalent).toBe(true);
    expect(result.exhaustive).toBe(true);
  });

  it('matches the expanded sum-of-products form', () => {
    const result = compareExpressions(
      'Y = (A AND NOT B) OR (NOT A AND B)',
      'Y = A XOR B',
    );
    expect(result.equivalent).toBe(true);
  });

  it('rejects a plausible but wrong expression with a counterexample', () => {
    const result = compareExpressions('Y = A OR B', 'Y = A XOR B');
    expect(result.equivalent).toBe(false);
    expect(result.counterexample).not.toBeNull();
  });

  it('rejects AND as a negative control for XOR', () => {
    expect(compareExpressions('Y = A AND B', 'Y = A XOR B').equivalent).toBe(
      false,
    );
  });
});

describe('compareExpressionToCircuit', () => {
  it('checks a typed expression against a drawn circuit', () => {
    const result = compareExpressionToCircuit('Y = NOT(A XNOR B)', xorCircuit);
    expect(result.equivalent).toBe(true);
  });

  it('rejects a typed expression that does not match the drawing', () => {
    expect(
      compareExpressionToCircuit('Y = A AND B', xorCircuit).equivalent,
    ).toBe(false);
  });
});

describe('real fixture answers', () => {
  it('accepts a trailing full stop, as the fixture answer has', () => {
    const parsed = parseExpression('Y = NOT(A XNOR B).');
    expect(parsed.expression.type).toBe('not');
  });

  it('matches the stored correct-alternative against the rubric expression', () => {
    const result = compareExpressions(
      'Y = NOT(A XNOR B).',
      'Y = (A AND NOT B) OR (NOT A AND B)',
    );
    expect(result.equivalent).toBe(true);
    expect(result.assignmentsChecked).toBe(4);
  });
});
