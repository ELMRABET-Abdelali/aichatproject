# E-Commerce AI — reconstructed dashboard

This project rebuilds the lost E-Commerce AI interface shown in the internship screenshots and keeps the structure ready for the original SQL/RAG backend.

## Included UI

- Overview
- AI Chat
- API Test
- Connections
- Documents
- Widget
- API Keys
- Settings

The visual direction follows the original dashboard: compact left navigation, white workspace, turquoise AI accent, model/database/document selectors, agent status, chat bubbles and the bottom composer.

## Current functional state

The UI is interactive and deployable on Vercel.

AI Chat calls the server-side Vercel Function at:

    POST /api/chat

The OpenRouter API key stays on the server and is never exposed to the browser.

The interface also keeps support for a future separate/legacy backend through:

    VITE_API_URL=https://your-backend.example.com

If VITE_API_URL is not defined, the app uses /api/chat automatically.

## OpenRouter free models

The model selector currently includes:

- google/gemma-4-31b-it:free
- nvidia/nemotron-3-ultra-550b-a55b:free
- nvidia/nemotron-3.5-lightning:free
- google/gemma-4-26b-a4b-it:free
- openrouter/free

Default recommendation for this prototype:

    google/gemma-4-31b-it:free

Automatic fallback:

    openrouter/free

## Vercel deployment

Import this GitHub repository into Vercel.

Use:

    Framework Preset: Vite
    Root Directory: ./
    Install Command: npm install
    Build Command: npm run build
    Output Directory: dist
    Node.js Version: 24.x

Then add these variables under:

    Project Settings -> Environment Variables

Required:

    OPENROUTER_API_KEY=<your OpenRouter secret key>

Recommended:

    OPENROUTER_MODEL=google/gemma-4-31b-it:free
    OPENROUTER_FALLBACK_MODEL=openrouter/free
    OPENROUTER_SITE_URL=https://YOUR-PROJECT.vercel.app
    OPENROUTER_APP_NAME=E-Commerce AI

Do NOT create a VITE_OPENROUTER_API_KEY variable. Any variable prefixed with VITE_ can be bundled into frontend code.

After deployment, verify:

    https://YOUR-PROJECT.vercel.app/api/health

Expected result:

    configured: true

Then open AI Chat and send a message.

## Local development

Create a local .env file from .env.example and insert your own OpenRouter key.

Run:

    npm install
    npm run dev

For the closest local reproduction of Vercel Functions, use the Vercel CLI:

    npx vercel dev

## Security notes

- Never commit OPENROUTER_API_KEY.
- Keep SQL connections read-only for the AI tools.
- Free model endpoints are rate-limited and can change availability.
- Do not send confidential customer/store information to a free inference endpoint until you have reviewed that provider's data policy.

## Next backend phase

The current Vercel AI endpoint makes the reconstructed application genuinely usable as a chat application. The next backend phase is to reconnect the original project capabilities:

1. PostgreSQL / WooCommerce read-only tools.
2. document ingestion and embeddings.
3. semantic RAG search.
4. safe SQL query generation.
5. web scraping connector.
6. source citations inside AI answers.
