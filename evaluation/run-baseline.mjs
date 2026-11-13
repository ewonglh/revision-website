import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// An offline research baseline. Never imported by the application.
const raw = readFileSync(new URL('./synthetic-pack.json', import.meta.url));
const pack = JSON.parse(raw);
const tokens = (value) =>
  new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const allowed = (passage, offering) =>
  passage.owner === 'owner-a' &&
  passage.offering === offering &&
  passage.revision === 'r1' &&
  passage.release === 'public-to-owner' &&
  passage.active;
const rank = (query, scoped) => {
  const queryTokens = tokens(query.text);
  return pack.corpus
    .filter((passage) => !scoped || allowed(passage, query.offering))
    .map((passage) => ({
      id: passage.id,
      score: [...tokens(passage.text)].filter((token) => queryTokens.has(token))
        .length,
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((hit) => hit.id);
};

assert.equal(
  new Set(pack.questions.map((question) => question.id)).size,
  pack.questions.length,
);
for (const answer of pack.answers) {
  assert.ok(pack.questions.some((question) => question.id === answer.question));
}
for (const query of pack.queries) {
  for (const id of query.gold) {
    const passage = pack.corpus.find((entry) => entry.id === id);
    assert.ok(
      passage && allowed(passage, query.offering),
      `Invalid gold: ${id}`,
    );
  }
}
const retrieval = pack.queries.map((query) => {
  const hits = rank(query, true);
  assert.ok(
    hits.every((id) =>
      allowed(
        pack.corpus.find((p) => p.id === id),
        query.offering,
      ),
    ),
  );
  return {
    id: query.id,
    gold: query.gold,
    hits,
    matched: query.gold.filter((id) => hits.includes(id)).length,
  };
});
const relevant = retrieval.filter((query) => query.gold.length > 0);
const absent = retrieval.filter((query) => query.gold.length === 0);
const forbiddenUnscopedHits = pack.queries.flatMap((query) =>
  rank(query, false).filter(
    (id) =>
      !allowed(
        pack.corpus.find((p) => p.id === id),
        query.offering,
      ),
  ),
);
// Negative control must demonstrate that relevance alone leaks forbidden evidence.
assert.ok(forbiddenUnscopedHits.length > 0);
assert.deepEqual(retrieval.find((query) => query.id === 'attack').hits, []);

const exactSet = (answer, key) =>
  new Set(answer).size === key.length &&
  key.every((option) => answer.includes(option));
const keyChecks = [
  { answer: ['A', 'B'], marks: 2 },
  { answer: ['B', 'A'], marks: 2 },
  { answer: ['A'], marks: 0 },
  { answer: ['A', 'B', 'C'], marks: 0 },
  { answer: [], marks: 0 },
];
for (const check of keyChecks) {
  assert.equal(exactSet(check.answer, ['A', 'B']) ? 2 : 0, check.marks);
}
const rows = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
];
for (const [a, b, expected] of rows) {
  assert.equal(Number((Boolean(a) && !b) || (!a && Boolean(b))), expected);
  assert.equal(Number(!(a === b)), expected);
}
assert.ok(rows.some(([a, b, expected]) => (a | b) !== expected));
console.log(
  JSON.stringify(
    {
      fixtureSha256: createHash('sha256').update(raw).digest('hex'),
      questions: pack.questions.length,
      draftAnswerCases: pack.answers.length,
      retrieval: {
        queries: retrieval.length,
        recallAt3:
          relevant.reduce((sum, query) => sum + query.matched, 0) /
          relevant.reduce((sum, query) => sum + query.gold.length, 0),
        goldHitPrecisionAt3:
          retrieval.reduce((sum, query) => sum + query.matched, 0) /
          retrieval.reduce((sum, query) => sum + query.hits.length, 0),
        noEvidenceAbstentions: `${absent.filter((query) => query.hits.length === 0).length}/${absent.length}`,
        forbiddenScopedHits: 0,
        forbiddenUnscopedHits: forbiddenUnscopedHits.length,
        details: retrieval,
      },
      deterministic: {
        exactSetCases: keyChecks.length,
        booleanRowsPerExpression: rows.length,
        equivalentExpressions: 2,
        orNegativeControlRejected: true,
      },
      notRun: [
        'PDF/OCR extraction',
        'dense retrieval',
        'AI marking',
        'proof verification',
        'MIPS assembly/execution',
        'drawing interpretation',
        'production access/recovery tests',
      ],
    },
    null,
    2,
  ),
);
