import { isAuthenticated } from './_auth.js';

const FREE_MODELS = [
  {
    id: 'google/gemma-4-31b-it:free',
    label: 'Google Gemma 4 31B (free)',
    role: 'Recommended default for this dashboard',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'NVIDIA Nemotron 3 Ultra (free)',
    role: 'Complex reasoning and orchestration',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    label: 'NVIDIA Nemotron 3.5 Lightning (free)',
    role: 'Fast agent and tool-use tasks',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    label: 'Google Gemma 4 26B A4B (free)',
    role: 'Efficient structured and multimodal tasks',
  },
  {
    id: 'openrouter/free',
    label: 'OpenRouter Free Router',
    role: 'Automatic free-model fallback',
  },
];

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: 'Unauthorized.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    {
      ok: true,
      provider: 'OpenRouter',
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      model:
        process.env.OPENROUTER_MODEL ||
        'google/gemma-4-31b-it:free',
      fallbackModel:
        process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/free',
      models: FREE_MODELS,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
