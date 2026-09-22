# E-Commerce AI — reconstructed UI

This branch rebuilds the lost E-Commerce AI dashboard visible in the internship-project screenshots and extends the original VoloBuilds AI SQL/RAG project with the full dashboard shell.

## Reconstructed pages

- Overview
- AI Chat
- API Test
- Connections
- Documents
- Widget
- API Keys
- Settings

The visual direction intentionally follows the original: white workspace, compact left navigation, turquoise AI accent, model/database/document selectors, agent status, compact message bubbles and a bottom composer.

## Functional behavior

The UI works immediately in demo mode: navigation, chat interactions, uploads, connection toggles, widget preview, API key controls and settings are interactive.

To connect AI Chat to a compatible backend, create a local environment file:

    VITE_API_URL=http://localhost:3000

When configured, the chat sends POST requests to:

    {VITE_API_URL}/query

with JSON:

    { "query": "..." }

This keeps the reconstructed frontend compatible with the query pattern used by the original VoloBuilds project.

## Run

    npm install
    npm run dev

## Build

    npm run build
