// Parse boolean expressions into circuit data so an expression answer can be
// checked with the same equivalence engine as a drawn circuit. Research code.
//
// The fixture's circuit answers are written as expressions ("Y = NOT(A XNOR B)"),
// and students will type expressions too, so a drawing-only checker would leave
// the common case unverifiable.
//
// Supported syntax, deliberately small so that anything unrecognised fails loudly
// rather than being silently misread:
//   operators : AND, OR, NOT, NAND, NOR, XOR, XNOR  (case-insensitive)
//               `&`, `|`, `~`, `!`, `^`  and `·` `⊕`
//   grouping  : parentheses, any depth
//   names     : identifiers and single letters
//   constants : 0, 1
// `NOT(A XNOR B)` is read as NOT applied to the parenthesised group, which is how
// the fixture writes it.

import { compareCircuits } from './circuits.mjs';

const tokenise = (input) => {
  const tokens = [];
  let index = 0;
  const text = input.trim();
  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '(' || char === ')') {
      tokens.push({ kind: char, value: char });
      index += 1;
      continue;
    }
    if ('&|~!^·⊕'.includes(char)) {
      const map = {
        '&': 'and',
        '|': 'or',
        '~': 'not',
        '!': 'not',
        '^': 'xor',
        '·': 'and',
        '⊕': 'xor',
      };
      tokens.push({ kind: 'op', value: map[char] });
      index += 1;
      continue;
    }
    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(index));
    if (word) {
      const lower = word[0].toLowerCase();
      const operators = new Set([
        'and',
        'or',
        'not',
        'nand',
        'nor',
        'xor',
        'xnor',
      ]);
      tokens.push({
        kind: operators.has(lower) ? 'op' : 'name',
        value: operators.has(lower) ? lower : word[0],
      });
      index += word[0].length;
      continue;
    }
    throw new Error(`Unexpected character: ${JSON.stringify(char)}`);
  }
  return tokens;
};

/**
 * Parse `NOT(A XNOR B)` and friends into `{ inputs, expression }` where the
 * expression is a small tree. A leading `Y = ...` is stripped if present.
 */
export const parseExpression = (source) => {
  // Students end answers with a full stop, and the fixture does too
  // ("Y = NOT(A XNOR B)."). Strip trailing sentence punctuation before parsing;
  // keeping it would fail an answer that is otherwise correct.
  let text = String(source)
    .trim()
    .replace(/[.;,]+$/, '')
    .trim();
  // Drop a leading "Y =" / "F(A,B) =" style label, keeping the right-hand side.
  const assign = /^[A-Za-z_][A-Za-z0-9_]*(\s*\([^)]*\))?\s*=\s*(.+)$/s.exec(
    text,
  );
  let declaredInputs = null;
  if (assign) {
    text = assign[2];
    const params = /^[A-Za-z_][A-Za-z0-9_]*\s*\(([^)]*)\)/.exec(source);
    if (params) {
      declaredInputs = params[1]
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
    }
  }

  const tokens = tokenise(text);
  let position = 0;
  const names = new Set();

  const peek = () => tokens[position];
  const next = () => tokens[position++];

  // Precedence, loosest first: or/nor, then xor/xnor, then and/nand, then not.
  const parsePrimary = () => {
    const token = next();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.kind === '(') {
      const inner = parseOr();
      const close = next();
      if (!close || close.kind !== ')')
        throw new Error('Unbalanced parentheses');
      return inner;
    }
    if (token.kind === 'name') {
      if (token.value === '0' || token.value === '1') {
        return { type: 'const', value: Number(token.value) };
      }
      names.add(token.value);
      return { type: 'var', name: token.value };
    }
    if (token.kind === 'op' && token.value === 'not') {
      return { type: 'not', arg: parsePrimary() };
    }
    throw new Error(`Unexpected token: ${token.value}`);
  };

  const parseAnd = () => {
    let left = parsePrimary();
    for (;;) {
      const token = peek();
      if (!token || token.kind !== 'op') break;
      if (token.value !== 'and' && token.value !== 'nand') break;
      next();
      const right = parsePrimary();
      left = { type: token.value, args: [left, right] };
    }
    return left;
  };

  const parseXor = () => {
    let left = parseAnd();
    for (;;) {
      const token = peek();
      if (!token || token.kind !== 'op') break;
      if (token.value !== 'xor' && token.value !== 'xnor') break;
      next();
      const right = parseAnd();
      left = { type: token.value, args: [left, right] };
    }
    return left;
  };

  const parseOr = () => {
    let left = parseXor();
    for (;;) {
      const token = peek();
      if (!token || token.kind !== 'op') break;
      if (token.value !== 'or' && token.value !== 'nor') break;
      next();
      const right = parseXor();
      left = { type: token.value, args: [left, right] };
    }
    return left;
  };

  const tree = parseOr();
  if (position !== tokens.length) {
    throw new Error(`Unexpected trailing input at token ${position}`);
  }

  return {
    inputs: declaredInputs ?? [...names].sort(),
    expression: tree,
  };
};

/**
 * Flatten an expression tree into the circuit data shape that `compareCircuits`
 * consumes, so both answer styles go through one equivalence engine.
 */
export const expressionToCircuit = (parsed, { outputName = 'Y' } = {}) => {
  const gates = [];
  let counter = 0;
  const emit = (node) => {
    if (node.type === 'const') return String(node.value);
    if (node.type === 'var') return node.name;
    const id = `g${(counter += 1)}`;
    if (node.type === 'not') {
      gates.push({ id, type: 'not', inputs: [emit(node.arg)] });
      return id;
    }
    const [left, right] = node.args;
    gates.push({ id, type: node.type, inputs: [emit(left), emit(right)] });
    return id;
  };
  const source = emit(parsed.expression);
  return {
    inputs: parsed.inputs,
    outputs: [outputName],
    gates,
    outputSources: { [outputName]: source },
  };
};

/** Convenience: parse two expressions and compare them as circuits. */
export const compareExpressions = (a, b) => {
  const left = expressionToCircuit(parseExpression(a));
  const right = expressionToCircuit(parseExpression(b));
  return {
    ...compareCircuits(left, right),
    leftCircuit: left,
    rightCircuit: right,
  };
};

/** Convenience: compare a typed expression against a reference circuit. */
export const compareExpressionToCircuit = (expression, circuit) =>
  compareCircuits(expressionToCircuit(parseExpression(expression)), circuit);
