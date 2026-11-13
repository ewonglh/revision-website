// Deterministic combinational-circuit equivalence checking. Research code.
//
// The owner has confirmed that a differently wired but functionally equivalent
// circuit earns full credit. That makes equivalence a criterion, and a criterion
// needs a check: a model asserting two circuits are equivalent is AI review, not
// check evidence.
//
// Two rules this module is built around:
//   1. `equivalent: true` is only ever returned for an input space that was
//      actually enumerated. Above the exhaustive limit it refuses and asks for a
//      reviewed argument instead.
//   2. Functional equivalence never implies full credit on its own. A rubric may
//      also require a minimum-device or approved-gate constraint, so device count
//      is reported separately and the caller must combine the two.

/** Gates this checker implements. Anything else is rejected, not ignored. */
export const SUPPORTED_GATES = new Set([
  'and',
  'or',
  'not',
  'nand',
  'nor',
  'xor',
  'xnor',
]);

/** Above this many inputs the space is not enumerated. */
export const EXHAUSTIVE_INPUT_LIMIT = 16;

const GATE_ARITY = {
  and: 2,
  or: 2,
  nand: 2,
  nor: 2,
  xor: 2,
  xnor: 2,
  not: 1,
};

const applyGate = (type, values) => {
  switch (type) {
    case 'and':
      return values.every((value) => value === 1) ? 1 : 0;
    case 'or':
      return values.some((value) => value === 1) ? 1 : 0;
    case 'nand':
      return values.every((value) => value === 1) ? 0 : 1;
    case 'nor':
      return values.some((value) => value === 1) ? 0 : 1;
    case 'xor':
      return values.reduce((acc, value) => acc ^ value, 0);
    case 'xnor':
      return values.reduce((acc, value) => acc ^ value, 0) === 1 ? 0 : 1;
    case 'not':
      return values[0] === 1 ? 0 : 1;
    default:
      throw new Error(`Unsupported gate type: ${type}`);
  }
};

const CONSTANTS = new Set(['0', '1']);

/**
 * Validate structure and return the signal names that are readable.
 *
 * Throws on anything ambiguous: an unknown gate, a wrong arity, a duplicate id,
 * a signal nothing defines, or a combinational cycle. Failing loudly matters more
 * than being permissive here — a checker that silently treats a floating input as
 * 0 will award marks for a broken circuit.
 */
export const validateCircuit = (circuit) => {
  if (!circuit || typeof circuit !== 'object') {
    throw new Error('Circuit must be an object');
  }
  const { inputs, outputs, gates, outputSources } = circuit;
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error('Circuit must declare at least one input');
  }
  if (!Array.isArray(outputs) || outputs.length === 0) {
    throw new Error('Circuit must declare at least one output');
  }
  if (!Array.isArray(gates)) {
    throw new Error('Circuit must declare a gates array');
  }
  if (!outputSources || typeof outputSources !== 'object') {
    throw new Error('Circuit must declare outputSources');
  }
  if (new Set(inputs).size !== inputs.length) {
    throw new Error('Duplicate input name');
  }
  const declared = new Set(inputs);
  const gateIds = new Set();
  for (const gate of gates) {
    if (!gate || typeof gate.id !== 'string') {
      throw new Error('Every gate needs a string id');
    }
    if (gateIds.has(gate.id)) throw new Error(`Duplicate gate id: ${gate.id}`);
    if (declared.has(gate.id)) {
      throw new Error(`Gate id collides with an input name: ${gate.id}`);
    }
    if (!SUPPORTED_GATES.has(gate.type)) {
      throw new Error(`Unsupported gate type: ${gate.type}`);
    }
    gateIds.add(gate.id);
    const expected = GATE_ARITY[gate.type];
    if (!Array.isArray(gate.inputs) || gate.inputs.length !== expected) {
      throw new Error(
        `Gate ${gate.id} (${gate.type}) needs exactly ${expected} input(s)`,
      );
    }
  }
  // Every referenced signal must resolve to an input, a constant, or a gate.
  for (const gate of gates) {
    for (const signal of gate.inputs) {
      if (
        CONSTANTS.has(signal) ||
        declared.has(signal) ||
        gateIds.has(signal)
      ) {
        continue;
      }
      throw new Error(
        `Gate ${gate.id} references undeclared signal: ${signal}`,
      );
    }
  }
  for (const output of outputs) {
    const source = outputSources[output];
    if (source === undefined) {
      throw new Error(`Output ${output} has no source`);
    }
    if (
      !CONSTANTS.has(source) &&
      !declared.has(source) &&
      !gateIds.has(source)
    ) {
      throw new Error(`Output ${output} sources undeclared signal: ${source}`);
    }
  }
  return { inputs, outputs, gates, gateIds, declared };
};

/** Topological order of gate ids, or a cycle error. */
export const topologicalOrder = (gates, gateIds) => {
  const byId = new Map(gates.map((gate) => [gate.id, gate]));
  const state = new Map(); // 0 = unvisited, 1 = visiting, 2 = done
  const order = [];
  const visit = (id, path) => {
    const status = state.get(id) ?? 0;
    if (status === 2) return;
    if (status === 1) {
      throw new Error(`Combinational cycle: ${[...path, id].join(' -> ')}`);
    }
    state.set(id, 1);
    for (const signal of byId.get(id).inputs) {
      if (gateIds.has(signal)) visit(signal, [...path, id]);
    }
    state.set(id, 2);
    order.push(id);
  };
  for (const gate of gates) visit(gate.id, []);
  return order;
};

/** Evaluate one circuit for one assignment of its inputs. */
export const evaluateCircuit = (circuit, assign) => {
  const { inputs, outputs, gates, gateIds, declared } =
    validateCircuit(circuit);
  const order = topologicalOrder(gates, gateIds);
  const values = new Map();
  for (const name of declared) {
    if (!(name in assign)) throw new Error(`Input ${name} not assigned`);
    values.set(name, assign[name]);
  }
  const byId = new Map(gates.map((gate) => [gate.id, gate]));

  const resolve = (signal) => {
    if (CONSTANTS.has(signal)) return Number(signal);
    if (values.has(signal)) return values.get(signal);
    throw new Error(`Unresolved signal: ${signal}`);
  };

  for (const id of order) {
    const gate = byId.get(id);
    values.set(id, applyGate(gate.type, gate.inputs.map(resolve)));
  }

  const result = {};
  for (const output of outputs) {
    result[output] = resolve(circuit.outputSources[output]);
  }
  return result;
};

const assignmentsFor = (inputs) => {
  const out = [];
  const total = 2 ** inputs.length;
  for (let mask = 0; mask < total; mask += 1) {
    const assign = {};
    inputs.forEach((name, index) => {
      // Most significant bit first, so A B C reads left to right.
      assign[name] = (mask >> (inputs.length - 1 - index)) & 1;
    });
    out.push(assign);
  }
  return out;
};

/**
 * Compare two circuits for functional equivalence.
 *
 * Outputs are matched by the *ranked position* of their name in each circuit's
 * `outputs` array: comparing by name would be wrong when one answer calls its
 * output `Y` and another calls it `F`.
 */
export const compareCircuits = (a, b) => {
  const left = validateCircuit(a);
  const right = validateCircuit(b);

  if (left.inputs.length !== right.inputs.length) {
    return {
      equivalent: false,
      exhaustive: false,
      reason: `different input counts (${left.inputs.length} vs ${right.inputs.length})`,
      inputsCompared: 0,
      counterexample: null,
    };
  }
  if (left.outputs.length !== right.outputs.length) {
    return {
      equivalent: false,
      exhaustive: false,
      reason: `different output counts (${left.outputs.length} vs ${right.outputs.length})`,
      inputsCompared: 0,
      counterexample: null,
    };
  }
  const n = left.inputs.length;
  if (n > EXHAUSTIVE_INPUT_LIMIT) {
    // Refuse rather than guess. Returning `equivalent: true` here would claim a
    // result for an input space that was never enumerated.
    return {
      equivalent: null,
      exhaustive: false,
      reason: `${n} inputs exceeds the exhaustive limit of ${EXHAUSTIVE_INPUT_LIMIT}; needs a reviewed argument`,
      inputsCompared: 0,
      counterexample: null,
    };
  }

  // Map the right circuit's inputs onto the left's by position, so two answers
  // may use different variable names.
  const remap = (assign) => {
    const mapped = {};
    right.inputs.forEach((name, index) => {
      mapped[name] = assign[left.inputs[index]];
    });
    return mapped;
  };

  for (const assign of assignmentsFor(left.inputs)) {
    const outLeft = evaluateCircuit(a, assign);
    const outRight = evaluateCircuit(b, remap(assign));
    for (let index = 0; index < left.outputs.length; index += 1) {
      const nameLeft = left.outputs[index];
      const nameRight = right.outputs[index];
      if (outLeft[nameLeft] !== outRight[nameRight]) {
        return {
          equivalent: false,
          exhaustive: true,
          reason: 'found a distinguishing input assignment',
          inputsCompared: n,
          counterexample: {
            assignment: { ...assign },
            left: { output: nameLeft, value: outLeft[nameLeft] },
            right: { output: nameRight, value: outRight[nameRight] },
          },
        };
      }
    }
  }

  return {
    equivalent: true,
    exhaustive: true,
    reason: `all ${2 ** n} input assignments agree`,
    inputsCompared: n,
    assignmentsChecked: 2 ** n,
    counterexample: null,
  };
};

/**
 * Device count, reported separately from equivalence.
 *
 * The rubric may cap device count ("fewest devices", "no other gates"). Passing
 * equivalence while failing the cap is not full credit, so the caller must
 * combine this rather than treating equivalence as sufficient.
 */
export const deviceCount = (circuit) => {
  const { gates } = validateCircuit(circuit);
  const byType = {};
  for (const gate of gates) {
    byType[gate.type] = (byType[gate.type] ?? 0) + 1;
  }
  return { total: gates.length, byType };
};

/**
 * Combine equivalence with a device constraint, so "full credit" is decided by
 * one call rather than by a caller who might forget the second half.
 */
export const assessCircuitAnswer = (submitted, reference, options = {}) => {
  const equivalence = compareCircuits(submitted, reference);
  const submittedDevices = deviceCount(submitted);
  const referenceDevices = deviceCount(reference);
  const maxDevices = options.maxDevices ?? null;
  const withinCap =
    maxDevices === null ? null : submittedDevices.total <= maxDevices;

  let verdict;
  if (equivalence.equivalent === null) {
    verdict = 'needs-reviewed-argument';
  } else if (!equivalence.equivalent) {
    verdict = 'not-equivalent';
  } else if (withinCap === false) {
    verdict = 'equivalent-but-exceeds-device-cap';
  } else {
    verdict = 'full-credit';
  }

  return {
    verdict,
    equivalence,
    devices: {
      submitted: submittedDevices,
      reference: referenceDevices,
      maxAllowed: maxDevices,
      withinCap,
    },
    note: 'Functional equivalence is check evidence. A device cap is a separate criterion and is reported, not assumed.',
  };
};
