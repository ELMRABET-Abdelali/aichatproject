# Vercel setup — E-Commerce AI

Repository:
ELMRABET-Abdelali/aichatproject

## Import settings

Use these values when importing the GitHub repository into Vercel:

| Setting | Value |
| --- | --- |
| Project name | aichatproject |
| Production branch | main |
| Framework preset | Vite |
| Root directory | ./ |
| Install command | npm install |
| Build command | npm run build |
| Output directory | dist |
| Node.js version | 24.x |

The repository already contains `vercel.json` for the two server-side functions:

- `POST /api/chat`
- `GET /api/health`

## Environment variables

Add these under Vercel → Project Settings → Environment Variables.

### Required

`OPENROUTER_API_KEY`

Paste your OpenRouter API key here. Keep it server-side. Do not use a `VITE_` prefix.

### Recommended

`OPENROUTER_MODEL=google/gemma-4-31b-it:free`

`OPENROUTER_FALLBACK_MODEL=openrouter/free`

`OPENROUTER_APP_NAME=E-Commerce AI`

### Optional after the first deployment

`OPENROUTER_SITE_URL=https://YOUR-PROJECT.vercel.app`

Replace the placeholder with the actual Vercel production URL, then redeploy.

Apply the variables to Production and Preview if branch previews should use the AI endpoint.

## Do not set this yet

Do not add `VITE_API_URL` unless a separate legacy SQL/RAG backend has actually been deployed. When it is absent, the frontend correctly uses the built-in Vercel function at `/api/chat`.

## Verification after deployment

1. Open `https://YOUR-PROJECT.vercel.app/api/health`.
2. Confirm `configured` is `true`.
3. Open the dashboard and go to **API Test**.
4. Send the default `POST /api/chat` request.
5. Open **AI Chat** and send a normal question.
6. The assistant response should show the OpenRouter model used below the message.

## Security

- Never commit the OpenRouter API key to GitHub.
- Never create `VITE_OPENROUTER_API_KEY`; Vite variables are browser-visible.
- The current free-model setup is intended for demos and low-volume testing.
- Do not send confidential customer information to free model endpoints until the provider data policy is acceptable for the deployment.
