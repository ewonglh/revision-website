// USD list-price scenarios checked 2026-11-12; citations and exclusions in costs.md.
const call = (input, output, inputRate, outputRate) =>
  (input * inputRate + output * outputRate) / 1_000_000;
const base = call(8_000, 2_000, 2, 10);
const escalation = call(16_000, 4_000, 4, 20);
const cheap = call(8_000, 2_000, 0.1, 0.5);
const money = (value) => Number(value.toFixed(4));
// Owner reports official-price parity; passthrough and usage remain untested.
const ownerResponses = 1_000 * 30;
const ownerBudget = 20;
const deepseekRates = {
  offPeak: { cacheMiss: 0.15, cacheHit: 0.003, output: 0.6 },
  peak: { cacheMiss: 0.3, cacheHit: 0.006, output: 1.2 },
};
const deepseekScenarios = [
  {
    name: 'earlier-long-context',
    input: 8_000,
    output: 2_000,
    cacheFraction: 0,
  },
  { name: 'compact-uncached', input: 2_000, output: 500, cacheFraction: 0 },
  {
    name: 'compact-cache-sensitivity',
    input: 2_000,
    output: 500,
    cacheFraction: 0.9,
  },
].map((scenario) => ({
  ...scenario,
  monthlyUSD: Object.fromEntries(
    Object.entries(deepseekRates).map(([period, rate]) => [
      period,
      money(
        ownerResponses *
          1.1 *
          call(
            scenario.input,
            scenario.output,
            rate.cacheMiss * (1 - scenario.cacheFraction) +
              rate.cacheHit * scenario.cacheFraction,
            rate.output,
          ),
      ),
    ]),
  ),
}));
console.log(
  JSON.stringify(
    {
      name: 'owner-target',
      providerPreference: 'DeepSeek through owner-supplied custom provider',
      modelVersion: 'DeepSeek-V4.1-Flash-1017',
      officialModelAlias:
        'deepseek-flash; confirm custom-provider alias before calls',
      budget: ownerBudget,
      currency: 'USD; billed in microdollars (1 USD = 1000000 microdollars)',
      budgetMicrodollars: ownerBudget * 1_000_000,
      responsesPerMonth: ownerResponses,
      responseUnit: 'submitted answers',
      libraryEstimateMB: '<100; original, diagram and derived sizes unmeasured',
      budgetPerResponse: ownerBudget / ownerResponses,
      budgetMicrodollarsPerResponse: (ownerBudget * 1_000_000) / ownerResponses,
      primaryCallBudgetWithTenPercentRepeats:
        ownerBudget / (ownerResponses * 1.1),
      illustrativeTokenEnvelope: {
        inputMTokens: (ownerResponses * 1.1 * 8_000) / 1_000_000,
        outputMTokens: (ownerResponses * 1.1 * 2_000) / 1_000_000,
        affordabilityConstraint:
          '264 * inputRatePerMTok + 66 * outputRatePerMTok <= 20',
        caveat:
          'Uncached scenario; reserve separate escalation, ingestion and embedding spend first if they share this cap.',
      },
      officialRatesUSDPerMTok: deepseekRates,
      scenarios: deepseekScenarios,
      customProviderObservedCost: null,
      missing: [
        'measured tokens including thinking and actual cache-hit fraction',
        'custom-provider alias, peak/cache billing passthrough, limits and retention',
        'reviewed marking quality and other AI budget consumption',
      ],
    },
    null,
    2,
  ),
);

for (const [name, users, pages, newPages, storedGB, chunks] of [
  ['personal', 1, 1_000, 100, 2, 5_000],
  ['pilot', 20, 5_000, 500, 20, 25_000],
]) {
  const answers = users * 20 * 30;
  const retrievals = answers * 2;
  const balanced = answers * base * 1.1;
  const reviewed = answers * (base + 0.15 * escalation) * 1.1;
  const experimentalCheap = answers * (cheap + 0.2 * base) * 1.1;
  const recurringOcr = ((newPages * 2) / 1_000) * 1.1;
  const initialOcr = ((pages * 2) / 1_000) * 1.1;
  const embeddingInitial = (chunks * 400 * 0.02) / 1_000_000;
  const embeddingRecurring =
    ((newPages * 5 * 400 + retrievals * 100) * 0.02) / 1_000_000;
  const r2 = Math.ceil(Math.max(0, storedGB - 10)) * 0.015;
  const vectorize =
    (Math.max(0, (chunks + retrievals) * 768 - 50_000_000) * 0.01) / 1_000_000 +
    (Math.max(0, chunks * 768 - 10_000_000) * 0.05) / 100_000_000;
  // D1, jobs, requests, operation and step usage assumptions remain in allowances.
  const cloudflare = 5 + r2 + vectorize;
  const supabase = 25;
  const recurringData = recurringOcr + embeddingRecurring;
  console.log(
    JSON.stringify(
      {
        name,
        users,
        answers,
        retrievals,
        marking: {
          balanced: money(balanced),
          withEscalation: money(reviewed),
          experimentalCheap: money(experimentalCheap),
        },
        ingestion: {
          initialOcr: money(initialOcr),
          recurringOcr: money(recurringOcr),
          initialEmbedding: money(embeddingInitial),
          recurringEmbedding: money(embeddingRecurring),
        },
        platform: { cloudflare: money(cloudflare), supabase },
        recurringSubtotal: {
          cloudflareBalanced: money(cloudflare + recurringData + balanced),
          cloudflareEscalation: money(cloudflare + recurringData + reviewed),
          supabaseBalanced: money(supabase + recurringData + balanced),
          supabaseEscalation: money(supabase + recurringData + reviewed),
        },
        doubledTokensMarking: money(reviewed * 2),
        allEscalateMarking: money(answers * (base + escalation) * 1.1),
        exclusions: [
          'Cloudflare identity',
          'SMTP',
          'local/container extraction compute',
          'extra job runtime',
          'monitoring/backups',
          'tax and FX',
          'human review',
        ],
      },
      null,
      2,
    ),
  );
}
