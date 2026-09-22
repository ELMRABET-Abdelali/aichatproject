const FREE_MODELS = [
  {
    id: 'google/gemma-4-31b-it:free',
    label: 'Google Gemma 4 31B (free)',
    role: 'Recommended for this dashboard',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'NVIDIA Nemotron 3 Ultra (free)',
    role: 'Complex reasoning',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    label: 'NVIDIA Nemotron 3.5 Lightning (free)',
    role: 'Fast agent tasks',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    label: 'Google Gemma 4 26B A4B (free)',
    role: 'Fast multimodal / structured tasks',
  },
  {
    id: 'openrouter/free',
    label: 'OpenRouter Free Router',
    role: 'Automatic free fallback',
  },
];

export default {
  async fetch(request: Request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    return Response.json(
      {
        ok: true,
        provider: 'OpenRouter',
        configured: Boolean(process.env.OPENROUTER_API_KEY),
        model: process.env.OPENROUTER_MODEL || FREE_MODELS[0].id,
        fallbackModel: process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/free',
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
  },
};
