import { authConfigured, isAuthenticated } from './_auth';

export async function GET(request: Request) {
  const authenticated = authConfigured() && (await isAuthenticated(request));
  return Response.json(
    { authenticated, configured: authConfigured() },
    {
      status: authenticated || authConfigured() ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
