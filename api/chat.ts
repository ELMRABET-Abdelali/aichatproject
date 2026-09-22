import { isAuthenticated } from './_auth';

const FREE_MODELS = new Set([
  'openrouter/free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'poolside/laguna-s-2.1:free',
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

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
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 16000),
    }));

  if (!cleaned.length && typeof body.query === 'string' && body.query.trim()) {
    cleaned.push({
      role: 'user',
      content: body.query.trim().slice(0, 16000),
    });
  }

  return cleaned;
}

function selectModel(requested?: string) {
  const configured =
    env('OPENROUTER_MODEL') || 'nvidia/nemotron-3-ultra-550b-a55b:free';

  const safeConfigured = FREE_MODELS.has(configured)
    ? configured
    : 'google/gemma-4-31b-it:free';

  return requested && FREE_MODELS.has(requested)
    ? requested
    : safeConfigured;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  body: ChatBody,
) {
  const siteUrl =
    env('OPENROUTER_SITE_URL') || 'https://aichatproject.vercel.app';
  const appName = env('OPENROUTER_APP_NAME') || 'E-Commerce AI';

  const system = [
    'You are the E-Commerce AI assistant inside an analytics dashboard.',
    'Be concise, accurate, and useful for business users.',
    'The interface may mention SQL databases, WooCommerce, documents, RAG, and web sources.',
    'Never claim you queried a database, document, or website unless actual retrieved content is present in the conversation.',
    'If the user asks for private store facts that were not supplied, explain that the relevant data connection or RAG source must be connected.',
    'When helping with SQL, prefer read-only SELECT queries and never suggest destructive statements by default.',
    body.database ? `Selected database in the UI: ${body.database}.` : '',
    body.documents ? `Selected document scope in the UI: ${body.documents}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

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
      usage: { include: true },
    }),
  });
}

export const maxDuration = 60;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const apiKey = env('OPENROUTER_API_KEY');

  if (!apiKey) {
    return json(
      {
        error: 'OpenRouter is not configured.',
        code: 'OPENROUTER_API_KEY_MISSING',
      },
      503,
    );
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

  const primaryModel = selectModel(body.model);
  const configuredFallback =
    env('OPENROUTER_FALLBACK_MODEL') || 'openrouter/free';

  const fallbackModel = FREE_MODELS.has(configuredFallback)
    ? configuredFallback
    : 'openrouter/free';

  const attempts = [primaryModel, fallbackModel].filter(
    (model, index, list) => list.indexOf(model) === index,
  );

  let lastError = 'OpenRouter request failed.';

  for (const model of attempts) {
    try {
      const upstream = await callOpenRouter(apiKey, model, messages, body);
      const payload = (await upstream.json().catch(() => ({}))) as any;

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
      lastError =
        error instanceof Error ? error.message : 'Network error.';
    }
  }

  return json(
    {
      error: lastError,
      code: 'OPENROUTER_REQUEST_FAILED',
    },
    502,
  );
}
