// Provider client for the extraction harness. Research code: never imported by
// the application and never run during `npm run check`.
//
// The owner's provider is a DeepSeek reseller, so nothing about the endpoint is
// assumed. Base URL, model ID and auth style all come from the environment.
// Without them the client refuses to make a call rather than defaulting to a
// plausible-looking URL.

const REQUIRED = [
  'EXTRACTION_BASE_URL',
  'EXTRACTION_MODEL',
  'EXTRACTION_API_KEY',
];

/**
 * Read provider configuration from an environment object.
 * Returns `{ ok: false, missing }` instead of throwing, so a caller can report
 * what is absent without a stack trace.
 */
export const readConfig = (env = process.env) => {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return {
    ok: true,
    config: {
      baseUrl: env.EXTRACTION_BASE_URL.replace(/\/$/, ''),
      model: env.EXTRACTION_MODEL,
      apiKey: env.EXTRACTION_API_KEY,
      authHeader: env.EXTRACTION_AUTH_HEADER || 'authorization',
      authScheme: env.EXTRACTION_AUTH_SCHEME ?? 'Bearer',
      // Most DeepSeek resellers expose an OpenAI-compatible chat endpoint.
      // Override when the provider differs.
      path: env.EXTRACTION_PATH || '/chat/completions',
      timeoutMs: Number(env.EXTRACTION_TIMEOUT_MS || 120_000),
    },
  };
};

const authValue = (config) =>
  config.authScheme ? `${config.authScheme} ${config.apiKey}` : config.apiKey;

/** Build the request body for a single page image. Pure, so it can be tested. */
export const buildPageRequest = (
  config,
  { imageBase64, mimeType, prompt },
) => ({
  model: config.model,
  // Thinking mode is on by default on the direct API [S21]; pin it off here so
  // a page read does not silently bill reasoning tokens under the ingestion
  // budget without the operator choosing to.
  thinking: { type: 'disabled' },
  max_tokens: 2_000,
  temperature: 0,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageBase64}` },
        },
      ],
    },
  ],
});

/** Send one page image and return the raw response plus usage. */
export const readPage = async (config, page, { signal } = {}) => {
  const body = buildPageRequest(config, page);
  const response = await fetch(`${config.baseUrl}${config.path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [config.authHeader]: authValue(config),
    },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(config.timeoutMs),
  });
  const text = await response.text();
  if (!response.ok) {
    // Never echo the body wholesale: it can contain provider diagnostics that
    // should not land in a log.
    throw new Error(
      `Provider returned ${response.status}; body length ${text.length}`,
    );
  }
  const payload = JSON.parse(text);
  return {
    content: payload.choices?.[0]?.message?.content ?? '',
    usage: payload.usage ?? null,
    model: payload.model ?? config.model,
  };
};
