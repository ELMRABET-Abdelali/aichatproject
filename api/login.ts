import {
  authConfigured,
  createSessionToken,
  passwordMatches,
  sessionCookie,
} from './_auth.js';

export async function POST(request: Request) {
  if (!authConfigured()) {
    return Response.json(
      { error: 'Admin access is not configured on the server.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const password = typeof body.password === 'string' ? body.password : '';

  if (!password || !(await passwordMatches(password))) {
    return Response.json(
      { error: 'Incorrect password.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const token = await createSessionToken();

  return Response.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': sessionCookie(token),
      },
    },
  );
}
