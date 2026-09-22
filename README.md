# E-Commerce AI — reconstructed dashboard

This repository rebuilds the lost E-Commerce AI dashboard shown in the internship-project screenshots and keeps the interface ready for the SQL / RAG extensions of the original project.

## Reconstructed pages

- Overview
- AI Chat
- API Test
- Connections
- Documents
- Widget
- API Keys
- Settings

The visual direction intentionally follows the original UI: white workspace, compact left navigation, turquoise AI accent, model/database/document selectors, agent status, compact messages and a bottom composer.

## OpenRouter AI integration

The project now includes a server-side Vercel Function at:

    POST /api/chat

The OpenRouter secret is never sent to the browser. The frontend talks to /api/chat, and the Vercel Function calls OpenRouter.

Curated free models available in the UI:

- nvidia/nemotron-3-ultra-550b-a55b:free — recommended default for reasoning, SQL and agent workflows
- poolside/laguna-s-2.1:free — strong coding / SQL alternative
- google/gemma-4-31b-it:free — general-purpose alternative
- nvidia/nemotron-3.5-lightning:free — faster agent-style tasks
- google/gemma-4-26b-a4b-it:free — lighter multimodal/structured tasks
- openrouter/free — automatic free-model router and fallback

The server only accepts this free-model allowlist, helping avoid accidental paid-model usage.

## Required Vercel environment variable

Add this secret in Vercel Project Settings → Environment Variables:

    OPENROUTER_API_KEY=<your OpenRouter key>

Recommended optional values:

    OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
    OPENROUTER_FALLBACK_MODEL=openrouter/free
    OPENROUTER_APP_NAME=E-Commerce AI
    OPENROUTER_SITE_URL=https://your-project.vercel.app

Apply the variables to Production and Preview if you want PR/branch previews to use AI too. Redeploy after changing environment variables.

Do not create a VITE_OPENROUTER_API_KEY variable. Any VITE_ variable is compiled into frontend code and can be exposed to visitors.

## Vercel deployment

1. Import this GitHub repository in Vercel.
2. Framework preset: Vite.
3. Root directory: repository root.
4. Build command: npm run build.
5. Output directory: dist.
6. Install command: npm install.
7. Node.js: 24.x.
8. Add OPENROUTER_API_KEY and the optional variables above.
9. Deploy.
10. Open /api/health. It should report configured: true.
11. Open the dashboard → API Test and send the default /api/chat request.
12. Open AI Chat and start a real conversation.

## Local frontend

    npm install
    npm run dev

A local Vite-only dev server does not automatically emulate Vercel Functions. For the complete local stack use the Vercel CLI, or deploy a Preview branch on Vercel.

## Optional legacy backend

If the original SQL/RAG server is restored later, set:

    VITE_API_URL=https://your-legacy-backend.example.com

The UI will then use its /query endpoint instead of the built-in /api/chat function.

## Security notes

- Keep OPENROUTER_API_KEY server-side.
- Free-model providers may have different data-retention terms; do not send confidential customer data before reviewing the selected provider policy.
- The NVIDIA Nemotron free endpoint explicitly warns against uploading confidential information or personal data; use a paid/privacy-reviewed provider before sending real customer data.
- The current AI endpoint does not pretend it queried a database or document unless actual retrieved content is supplied.
- SQL integrations should remain read-only by default.


## Important if a key was shared in chat or a file

If an OpenRouter key has been pasted into a chat, document, screenshot or another non-secret location, revoke that key in OpenRouter and create a fresh key before adding it to Vercel. Never commit the replacement key to GitHub.
