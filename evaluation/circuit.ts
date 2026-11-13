/**
 * Deterministic combinational-circuit equivalence checking.
 *
 * The owner-confirmed marking policy (docs/evaluation/README.md) is that a
 * differently wired but functionally equivalent circuit earns full credit, and
 * that equivalence must come from an actual check rather than a model
 * assertion. This module is that check for small combinational circuits.
 *
 * Scope and limits, deliberately enforced rather than assumed:
 * - Combinational only. Sequential circuits, timing and delay are not modelled.
 * - At most `MAX_EXHAUSTIVE_INPUTS` inputs are enumerated. Above that the
 *   comparison refuses instead of guessing.
 * - Circuits arrive as data. This module does not parse drawings, PDF netlists
 *   or MIPS; an interpretation step has to produce the record first.
 * - A refusal (`exhaustive: false`) carries no `equivalent` field, so a caller
 *   cannot read a proof that did not run.
 *
 * Functional equivalence is not, on its own, full credit: a rubric may also
 * require a device limit. `deviceCount` is exported separately so the caller
 * applies that constraint without this module pretending to know the rubric.
 *
 * No network access, no model call: pure functions over plain data.
 */

export type GateType = 'and' | 'or' | 'not' | 'nand' | 'nor' | 'xor' | 'xnor';

export const GATE_TYPES: readonly GateType[] = [
  'and',
  'or',
  'not',
  'nand',
  'nor',
  'xor',
  'xnor',
];

/** Inputs enumerated by an exhaustive comparison: 2^n rows. */
export const MAX_EXHAUSTIVE_INPUTS = 16;

export type Bit = 0 | 1;

export type Assignment = Readonly<Record<string, Bit>>;

export interface CircuitGate {
  readonly id: string;
  readonly type: GateType;
  readonly inputs: readonly string[];
}

/**
 * A circuit as plain data. Signals are referenced by name: a declared input, a
 * gate id, or the constants `'0'` / `'1'` (the comparator questions use them).
 */
export interface Circuit {
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly gates: readonly CircuitGate[];
  readonly outputSources: Readonly<Record<string, string>>;
}

export interface Counterexample {
  /** The first differing input assignment, in declaration order of `inputs`. */
  readonly assignment: Assignment;
  readonly outputA: Assignment;
  readonly outputB: Assignment;
  readonly differingOutputs: readonly string[];
}

export type CompareRefusalCode =
  | 'invalid-name'
  | 'unsupported-gate'
  | 'bad-arity'
  | 'undeclared-signal'
  | 'unused-input'
  | 'cycle'
  | 'input-set-mismatch'
  | 'output-set-mismatch'
  | 'too-many-inputs'
  | 'unreachable-gate';

export type CompareResult =
  | {
      /**
       * The comparison ran over the enumerated input space rather than refusing.
       * `equivalent: true` here means every row was checked. `equivalent: false`
       * means a counterexample was found and the remaining rows were not run,
       * which is why `inputsCompared` can be below 2^n.
       */
      readonly exhaustive: true;
      readonly equivalent: boolean;
      /**
       * Input combinations actually evaluated. Equals 2^n when the comparison
       * ran to completion; a difference stops at the first counterexample, so a
       * smaller number records the rows that really ran.
       */
      readonly inputsCompared: number;
      /** One entry per input, in this circuit's declaration order. */
      readonly counterexample: Counterexample | null;
    }
  | {
      /** No equivalence claim is made. Treat the record as needing review. */
      readonly exhaustive: false;
      readonly code: CompareRefusalCode;
      readonly reason: string;
      readonly details: readonly string[];
    };

export interface DeviceCount {
  /** Recognised gates only; always equals the sum of `byType`. */
  readonly total: number;
  readonly byType: Readonly<Record<GateType, number>>;
  /** Gate ids with a type this module does not implement. */
  readonly unsupportedIds: readonly string[];
}

interface Problem {
  readonly code: CompareRefusalCode;
  readonly message: string;
}

type SignalRef =
  | { readonly kind: 'constant'; readonly value: Bit }
  | { readonly kind: 'signal'; readonly slot: number };

interface PreparedGate {
  /** Buffer slot the gate's value is written to. */
  readonly slot: number;
  readonly type: GateType;
  readonly refs: readonly SignalRef[];
}

interface PreparedCircuit {
  readonly inputSlots: number;
  readonly gates: readonly PreparedGate[];
  readonly outputOrder: readonly {
    readonly name: string;
    readonly ref: SignalRef;
  }[];
  readonly bufferSize: number;
}

type Preparation =
  | { readonly ok: true; readonly prepared: PreparedCircuit }
  | { readonly ok: false; readonly problems: readonly Problem[] };

type Arity = 1 | 'variadic';

const GATE_ARITY: Readonly<Record<GateType, Arity>> = {
  and: 'variadic',
  or: 'variadic',
  not: 1,
  nand: 'variadic',
  nor: 'variadic',
  xor: 'variadic',
  xnor: 'variadic',
};

const CONSTANT_NAMES = new Set(['0', '1']);

const isGateType = (value: string): value is GateType =>
  Object.hasOwn(GATE_ARITY, value);

const refusal = (problems: readonly Problem[]): CompareResult => {
  const first = problems[0];
  return {
    exhaustive: false,
    code: first?.code ?? 'undeclared-signal',
    reason: first?.message ?? 'Circuit could not be validated.',
    details: problems.map((problem) => `${problem.code}: ${problem.message}`),
  };
};

const readSlot = (values: Uint8Array, ref: SignalRef): Bit => {
  if (ref.kind === 'constant') return ref.value;
  const value = values[ref.slot];
  if (value === undefined) {
    // Unreachable: slots are compiled against a buffer sized for the circuit.
    throw new Error('Circuit signal slot outside the value buffer');
  }
  return value === 0 ? 0 : 1;
};

const refAt = (refs: readonly SignalRef[], index: number): SignalRef => {
  const ref = refs[index];
  if (!ref) {
    // Unreachable: gate arity is validated before compilation.
    throw new Error(`Gate has no input at position ${index}`);
  }
  return ref;
};

const applyGate = (
  type: GateType,
  values: Uint8Array,
  refs: readonly SignalRef[],
): Bit => {
  switch (type) {
    case 'not':
      return readSlot(values, refAt(refs, 0)) === 0 ? 1 : 0;
    case 'and': {
      for (const ref of refs) if (readSlot(values, ref) === 0) return 0;
      return 1;
    }
    case 'nand': {
      for (const ref of refs) if (readSlot(values, ref) === 0) return 1;
      return 0;
    }
    case 'or': {
      for (const ref of refs) if (readSlot(values, ref) === 1) return 1;
      return 0;
    }
    case 'nor': {
      for (const ref of refs) if (readSlot(values, ref) === 1) return 0;
      return 1;
    }
    case 'xor': {
      let parity = 0;
      for (const ref of refs) parity ^= readSlot(values, ref);
      return parity === 0 ? 0 : 1;
    }
    case 'xnor': {
      let parity = 0;
      for (const ref of refs) parity ^= readSlot(values, ref);
      return parity === 0 ? 1 : 0;
    }
  }
};

const prepare = (input: Circuit): Preparation => {
  const problems: Problem[] = [];

  // A malformed record is refused, not thrown on: this data comes from an
  // interpretation step and cannot be trusted to have the declared shape.
  const record: unknown = input;
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;
  if (!isRecord(record)) {
    return {
      ok: false,
      problems: [{ code: 'invalid-name', message: 'circuit is not an object' }],
    };
  }
  const fields = ['inputs', 'outputs', 'gates'] as const;
  for (const field of fields) {
    if (!Array.isArray(record[field])) {
      return {
        ok: false,
        problems: [
          {
            code: 'invalid-name',
            message: `circuit field "${field}" must be an array`,
          },
        ],
      };
    }
  }
  if (!isRecord(record['outputSources'])) {
    return {
      ok: false,
      problems: [
        {
          code: 'invalid-name',
          message: 'circuit field "outputSources" must be an object',
        },
      ],
    };
  }

  const inputNames = record['inputs'] as unknown[];
  const outputNames = record['outputs'] as unknown[];
  const gates = record['gates'] as unknown[];
  const outputSources = record['outputSources'] as Record<string, unknown>;
  for (const name of [...inputNames, ...outputNames]) {
    if (typeof name !== 'string') {
      return {
        ok: false,
        problems: [
          {
            code: 'invalid-name',
            message: `signal name ${JSON.stringify(name)} is not a string`,
          },
        ],
      };
    }
  }
  for (const [name, source] of Object.entries(outputSources)) {
    if (typeof source !== 'string') {
      return {
        ok: false,
        problems: [
          {
            code: 'output-set-mismatch',
            message: `outputSources names ${JSON.stringify(name)} with ${JSON.stringify(source)}, which is not a signal name`,
          },
        ],
      };
    }
  }
  for (const gate of gates) {
    if (
      !isRecord(gate) ||
      typeof gate['id'] !== 'string' ||
      typeof gate['type'] !== 'string' ||
      !Array.isArray(gate['inputs']) ||
      !gate['inputs'].every((name) => typeof name === 'string')
    ) {
      return {
        ok: false,
        problems: [
          {
            code: 'invalid-name',
            message: `gate ${JSON.stringify(gate)} is not a valid gate record`,
          },
        ],
      };
    }
  }

  const typed: Circuit = {
    inputs: inputNames as string[],
    outputs: outputNames as string[],
    gates: gates as Circuit['gates'],
    outputSources: outputSources as Circuit['outputSources'],
  };

  // Input slots are the circuit's own declaration order.
  const inputSlot = new Map<string, number>();
  typed.inputs.forEach((name, index) => {
    if (name.length === 0 || CONSTANT_NAMES.has(name)) {
      problems.push({
        code: 'invalid-name',
        message: `input ${JSON.stringify(name)} is empty or uses a reserved constant name`,
      });
      return;
    }
    if (inputSlot.has(name)) {
      problems.push({
        code: 'invalid-name',
        message: `input ${JSON.stringify(name)} is declared more than once`,
      });
      return;
    }
    inputSlot.set(name, index);
  });

  // Gate ids are validated before any reference is resolved. A gate id that
  // collides with an input name would otherwise be shadowed by the input,
  // silently discarding the gate and proving equivalence for a different
  // circuit — so collisions are an error, not a resolution-order detail.
  const gateSlot = new Map<string, number>();
  const gateOffset = typed.inputs.length;
  typed.gates.forEach((gate, index) => {
    if (gate.id.length === 0 || CONSTANT_NAMES.has(gate.id)) {
      problems.push({
        code: 'invalid-name',
        message: `gate id ${JSON.stringify(gate.id)} is empty or uses a reserved constant name`,
      });
      return;
    }
    if (inputSlot.has(gate.id)) {
      problems.push({
        code: 'invalid-name',
        message: `gate id ${JSON.stringify(gate.id)} collides with an input of the same name; signals share one namespace`,
      });
      return;
    }
    if (gateSlot.has(gate.id)) {
      problems.push({
        code: 'invalid-name',
        message: `gate id ${JSON.stringify(gate.id)} is used more than once`,
      });
      return;
    }
    gateSlot.set(gate.id, gateOffset + index);

    if (!isGateType(gate.type)) {
      problems.push({
        code: 'unsupported-gate',
        message: `gate ${JSON.stringify(gate.id)} has unsupported type ${JSON.stringify(gate.type)}`,
      });
      return;
    }
    const arity = GATE_ARITY[gate.type];
    if (arity === 1 && gate.inputs.length !== 1) {
      problems.push({
        code: 'bad-arity',
        message: `gate ${JSON.stringify(gate.id)} of type "${gate.type}" takes exactly 1 input, received ${gate.inputs.length}`,
      });
    } else if (arity === 'variadic' && gate.inputs.length < 2) {
      problems.push({
        code: 'bad-arity',
        message: `gate ${JSON.stringify(gate.id)} of type "${gate.type}" takes at least 2 inputs, received ${gate.inputs.length}`,
      });
    }
  });

  const declaredOutputs = new Set(typed.outputs);
  if (declaredOutputs.size !== typed.outputs.length) {
    problems.push({
      code: 'invalid-name',
      message: 'an output name is declared more than once',
    });
  }
  for (const name of typed.outputs) {
    if (name.length === 0 || CONSTANT_NAMES.has(name)) {
      problems.push({
        code: 'invalid-name',
        message: `output ${JSON.stringify(name)} is empty or uses a reserved constant name`,
      });
    }
    if (!Object.hasOwn(outputSources, name)) {
      problems.push({
        code: 'output-set-mismatch',
        message: `output ${JSON.stringify(name)} has no entry in outputSources`,
      });
    }
  }
  for (const name of Object.keys(outputSources)) {
    if (!declaredOutputs.has(name)) {
      problems.push({
        code: 'output-set-mismatch',
        message: `outputSources names ${JSON.stringify(name)}, which is not a declared output`,
      });
    }
  }

  const usedInputs = new Set<number>();
  const resolve = (name: string, where: string): SignalRef | null => {
    if (name === '0') return { kind: 'constant', value: 0 };
    if (name === '1') return { kind: 'constant', value: 1 };
    const input = inputSlot.get(name);
    if (input !== undefined) {
      usedInputs.add(input);
      return { kind: 'signal', slot: input };
    }
    const gate = gateSlot.get(name);
    if (gate !== undefined) return { kind: 'signal', slot: gate };
    problems.push({
      code: 'undeclared-signal',
      message: `${where} refers to ${JSON.stringify(name)}, which is not a declared input, gate or constant`,
    });
    return null;
  };

  const outputRefs = typed.outputs.map((name) => {
    const source = outputSources[name];
    if (typeof source !== 'string') return null;
    const ref = resolve(source, `output ${JSON.stringify(name)}`);
    return ref === null ? null : { name, ref };
  });

  const gateRefs = typed.gates.map((gate) =>
    gate.inputs.map((name) => resolve(name, `gate ${JSON.stringify(gate.id)}`)),
  );

  typed.inputs.forEach((name, index) => {
    if (!usedInputs.has(index)) {
      problems.push({
        code: 'unused-input',
        message: `input ${JSON.stringify(name)} is declared but never used; an unconnected input must be stated explicitly rather than read as constant 0`,
      });
    }
  });

  if (problems.length > 0) return { ok: false, problems };

  // Kahn's algorithm gives an evaluation order and detects cycles. Gate
  // dependencies are resolved by id, so declaration order of gates is free.
  const dependencySets = typed.gates.map((gate) => {
    const dependencies = new Set<number>();
    gate.inputs.forEach((name) => {
      const slot = gateSlot.get(name);
      if (slot !== undefined) dependencies.add(slot - gateOffset);
    });
    return dependencies;
  });
  const dependents: number[][] = typed.gates.map(() => []);
  const indegree = dependencySets.map((dependencies) => dependencies.size);
  dependencySets.forEach((dependencies, gate) => {
    for (const dependency of dependencies) dependents[dependency]?.push(gate);
  });
  const queue = indegree
    .map((count, gate) => (count === 0 ? gate : -1))
    .filter((gate) => gate >= 0);
  const order: number[] = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const gate = queue[cursor];
    if (gate === undefined) continue;
    order.push(gate);
    for (const dependent of dependents[gate] ?? []) {
      const remaining = (indegree[dependent] ?? 0) - 1;
      indegree[dependent] = remaining;
      if (remaining === 0) queue.push(dependent);
    }
  }

  if (order.length !== typed.gates.length) {
    const placed = new Set(order);
    const cycleGates = typed.gates
      .filter((_, index) => !placed.has(index))
      .map((gate) => JSON.stringify(gate.id));
    return {
      ok: false,
      problems: [
        {
          code: 'cycle',
          message: `combinational cycle detected among gates ${cycleGates.join(', ')}`,
        },
      ],
    };
  }

  // A gate that reaches no output contributes nothing to the function, yet it
  // would be counted as a device and could hide a misread connection. Refuse
  // rather than silently include or drop it.
  const live = new Set<number>();
  const markLive = (reference: SignalRef) => {
    if (reference.kind !== 'signal' || reference.slot < gateOffset) return;
    const start = reference.slot - gateOffset;
    if (live.has(start)) return;
    const stack = [start];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined || live.has(current)) continue;
      live.add(current);
      for (const dependency of dependencySets[current] ?? [])
        stack.push(dependency);
    }
  };
  for (const entry of outputRefs) if (entry) markLive(entry.ref);
  const dead = typed.gates.filter((_, index) => !live.has(index));
  if (dead.length > 0) {
    return {
      ok: false,
      problems: [
        {
          code: 'unreachable-gate',
          message: `gate(s) ${dead
            .map((gate) => JSON.stringify(gate.id))
            .join(
              ', ',
            )} reach no declared output; remove them or wire them, since a dead gate is not a device count and may be a misread connection`,
        },
      ],
    };
  }

  const preparedGates: PreparedGate[] = order.flatMap((gateIndex) => {
    const gate = typed.gates[gateIndex];
    const refs = gateRefs[gateIndex];
    if (!gate || !refs) return [];
    return [
      {
        slot: gateOffset + gateIndex,
        type: gate.type,
        refs: refs.filter((ref): ref is SignalRef => ref !== null),
      },
    ];
  });

  return {
    ok: true,
    prepared: {
      inputSlots: typed.inputs.length,
      gates: preparedGates,
      outputOrder: outputRefs.filter(
        (entry): entry is { name: string; ref: SignalRef } => entry !== null,
      ),
      bufferSize: gateOffset + typed.gates.length,
    },
  };
};

const evaluate = (
  prepared: PreparedCircuit,
  values: Uint8Array,
  sources: readonly number[],
  canonicalBits: Uint8Array,
): Uint8Array => {
  for (let slot = 0; slot < prepared.inputSlots; slot += 1) {
    const canonical = sources[slot];
    values[slot] =
      canonical === undefined ? 0 : (canonicalBits[canonical] ?? 0);
  }
  for (const gate of prepared.gates) {
    values[gate.slot] = applyGate(gate.type, values, gate.refs);
  }
  return values;
};

/**
 * Compares two circuits over every input assignment (2^n, n <= 16).
 *
 * Input names must match as sets; declaration order need not match. Gates may be
 * listed in any order. On a difference, the first counterexample in enumeration
 * order is returned with each circuit's outputs, so a marker can see why the
 * circuits differ. Above the enumeration limit, or on any structural defect,
 * the result is `exhaustive: false` and makes no equivalence claim.
 */
export function compareCircuits(a: Circuit, b: Circuit): CompareResult {
  const first = prepare(a);
  if (!first.ok) return refusal(first.problems);
  const second = prepare(b);
  if (!second.ok) return refusal(second.problems);

  const inputsA = new Set(a.inputs);
  const inputsB = new Set(b.inputs);
  if (
    inputsA.size !== inputsB.size ||
    [...inputsA].some((name) => !inputsB.has(name))
  ) {
    const onlyA = [...inputsA].filter((name) => !inputsB.has(name));
    const onlyB = [...inputsB].filter((name) => !inputsA.has(name));
    return refusal([
      {
        code: 'input-set-mismatch',
        message: `input names differ: only in A ${JSON.stringify(onlyA)}, only in B ${JSON.stringify(onlyB)}`,
      },
    ]);
  }

  const outputsA = new Set(a.outputs);
  const outputsB = new Set(b.outputs);
  if (
    outputsA.size !== outputsB.size ||
    [...outputsA].some((name) => !outputsB.has(name))
  ) {
    const onlyA = [...outputsA].filter((name) => !outputsB.has(name));
    const onlyB = [...outputsB].filter((name) => !outputsA.has(name));
    return refusal([
      {
        code: 'output-set-mismatch',
        message: `output names differ: only in A ${JSON.stringify(onlyA)}, only in B ${JSON.stringify(onlyB)}`,
      },
    ]);
  }

  const inputCount = a.inputs.length;
  if (inputCount > MAX_EXHAUSTIVE_INPUTS) {
    return refusal([
      {
        code: 'too-many-inputs',
        message: `${inputCount} inputs exceed the exhaustive limit of ${MAX_EXHAUSTIVE_INPUTS}; an equivalence claim needs a reviewed argument instead`,
      },
    ]);
  }

  const canonicalIndex = new Map(a.inputs.map((name, index) => [name, index]));
  const sourcesA = a.inputs.map((name) => canonicalIndex.get(name) ?? 0);
  const sourcesB = b.inputs.map((name) => canonicalIndex.get(name) ?? 0);

  const outputNames = [...a.outputs];
  // Defensive: every declared output resolved during preparation, so a missing
  // entry here would mean a validation gap. Refuse rather than throw, because
  // the contract with callers is that untrusted records produce a refusal.
  const refsFor = (prepared: PreparedCircuit) => {
    const byName = new Map(
      prepared.outputOrder.map((entry) => [entry.name, entry.ref] as const),
    );
    const refs: SignalRef[] = [];
    for (const name of outputNames) {
      const ref = byName.get(name);
      if (!ref) return null;
      refs.push(ref);
    }
    return refs;
  };
  const refsA = refsFor(first.prepared);
  const refsB = refsFor(second.prepared);
  if (refsA === null || refsB === null) {
    return refusal([
      {
        code: 'output-set-mismatch',
        message: 'a declared output has no resolved source after validation',
      },
    ]);
  }

  const totalRows = 2 ** inputCount;
  const canonicalBits = new Uint8Array(inputCount);
  const valuesA = new Uint8Array(first.prepared.bufferSize);
  const valuesB = new Uint8Array(second.prepared.bufferSize);

  let counterexample: Counterexample | null = null;
  let rowsEvaluated = 0;
  for (let row = 0; row < totalRows && counterexample === null; row += 1) {
    rowsEvaluated += 1;
    for (let index = 0; index < inputCount; index += 1) {
      canonicalBits[index] = (row >>> (inputCount - 1 - index)) & 1;
    }
    evaluate(first.prepared, valuesA, sourcesA, canonicalBits);
    evaluate(second.prepared, valuesB, sourcesB, canonicalBits);

    const differingOutputs = outputNames.filter(
      (_name, index) =>
        readSlot(valuesA, refAt(refsA, index)) !==
        readSlot(valuesB, refAt(refsB, index)),
    );
    if (differingOutputs.length === 0) continue;

    const snapshot = (refs: readonly SignalRef[], values: Uint8Array) => {
      const record: Record<string, Bit> = {};
      outputNames.forEach((name, index) => {
        record[name] = readSlot(values, refAt(refs, index));
      });
      return record;
    };
    const assignment: Record<string, Bit> = {};
    a.inputs.forEach((name, index) => {
      assignment[name] = canonicalBits[index] === 1 ? 1 : 0;
    });
    counterexample = {
      assignment,
      outputA: snapshot(refsA, valuesA),
      outputB: snapshot(refsB, valuesB),
      differingOutputs,
    };
  }

  return {
    exhaustive: true,
    equivalent: counterexample === null,
    // Rows actually evaluated. Equals 2^n only when every row was visited; on a
    // counterexample the loop stops there, and the count must not claim work
    // that did not happen.
    inputsCompared: rowsEvaluated,
    counterexample,
  };
}

/**
 * Counts declared gates. This is a count, not a rubric: whether a NOT or a
 * constant input counts as a device is the rubric's decision, so `byType` is
 * reported alongside the total for a "fewest devices" rule to apply.
 *
 * Does not validate the circuit; call `compareCircuits` first when the input
 * came from untrusted data.
 */
export function deviceCount(circuit: Pick<Circuit, 'gates'>): DeviceCount {
  const byType = Object.fromEntries(
    GATE_TYPES.map((type) => [type, 0]),
  ) as Record<GateType, number>;
  const unsupported: string[] = [];
  for (const gate of circuit.gates) {
    if (isGateType(gate.type)) byType[gate.type] += 1;
    else unsupported.push(gate.id);
  }
  return {
    // `total` counts only gates this module recognises, so it always equals the
    // sum of `byType`. An unrecognised gate is reported rather than folded into
    // a device total it cannot justify.
    total: GATE_TYPES.reduce((sum, type) => sum + byType[type], 0),
    byType,
    unsupportedIds: unsupported,
  };
}
