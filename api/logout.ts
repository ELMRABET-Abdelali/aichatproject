import { expiredSessionCookie } from './_auth.js';

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': expiredSessionCookie(),
      },
    },
  );
}
