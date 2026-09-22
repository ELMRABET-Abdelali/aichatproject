const FREE_MODELS = new Set([
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-lightning:free',
]);

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatBody = {
  query?: string;
  messages?: ChatMessage[];
  model?: string;
  database?: string;
  documents?: string;
};

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

function env(name: string) {
  return process.env[name]?.trim();
}

function safeMessages(body: ChatBody): ChatMessage[] {
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const cleaned = incoming
    .filter((m): m is ChatMessage =>
      !!m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0,
    )
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 16000) }));

  if (!cleaned.length && typeof body.query === 'string' && body.query.trim()) {
    cleaned.push({ role: 'user', content: body.query.trim().slice(0, 16000) });
  }

  return cleaned;
}

function selectedModel(requested?: string) {
  const configured = env('OPENROUTER_MODEL') || 'google/gemma-4-31b-it:free';
  const candidate = requested || configured;
  return FREE_MODELS.has(candidate) ? candidate : configured;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  body: ChatBody,
) {
  const siteUrl = env('OPENROUTER_SITE_URL') || 'https://aichatproject.vercel.app';
  const appName = env('OPENROUTER_APP_NAME') || 'E-Commerce AI';

  const system = [
    'You are the E-Commerce AI assistant inside an analytics dashboard.',
    'Be concise, accurate, and useful for business users.',
    'The interface may mention SQL databases, WooCommerce, documents, RAG and web sources.',
    'Never pretend that you queried a database or document unless actual retrieved content is present in the conversation.',
    'If the user asks for private store facts that were not supplied, explain that the relevant data connection or RAG source must be connected.',
    'When helping with SQL, prefer read-only SELECT queries and never suggest destructive statements by default.',
    body.database ? `Selected database in the UI: ${body.database}.` : '',
    body.documents ? `Selected document scope in the UI: ${body.documents}.` : '',
  ].filter(Boolean).join(' ');

  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': appName,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.25,
      max_tokens: 1200,
    }),
  });
}

export const maxDuration = 60;

export default {
  async fetch(request: Request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const apiKey = env('OPENROUTER_API_KEY');
    if (!apiKey) {
      return json({
        error: 'OpenRouter is not configured.',
        code: 'OPENROUTER_API_KEY_MISSING',
      }, 503);
    }

    let body: ChatBody;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const messages = safeMessages(body);
    if (!messages.length) {
      return json({ error: 'A query or messages array is required.' }, 400);
    }

    const primaryModel = selectedModel(body.model);
    const fallbackModel = env('OPENROUTER_FALLBACK_MODEL') || 'openrouter/free';
    const attempts = [primaryModel, fallbackModel]
      .filter((m, i, arr) => FREE_MODELS.has(m) && arr.indexOf(m) === i);

    let lastError = 'OpenRouter request failed.';

    for (const model of attempts) {
      try {
        const upstream = await callOpenRouter(apiKey, model, messages, body);
        const payload = await upstream.json().catch(() => ({})) as any;

        if (upstream.ok) {
          const content = payload?.choices?.[0]?.message?.content;
          if (typeof content !== 'string' || !content.trim()) {
            lastError = 'The model returned an empty response.';
            continue;
          }

          return json({
            response: content,
            model: payload?.model || model,
            provider: 'OpenRouter',
            usage: payload?.usage || null,
          });
        }

        lastError =
          payload?.error?.message ||
          payload?.message ||
          `OpenRouter returned HTTP ${upstream.status}.`;

        if (upstream.status !== 429 && upstream.status < 500) {
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error.';
      }
    }

    return json({
      error: lastError,
      code: 'OPENROUTER_REQUEST_FAILED',
    }, 502);
  },
};
