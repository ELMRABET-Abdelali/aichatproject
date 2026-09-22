const COOKIE_NAME = 'ecommerce_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

function env(name: string) {
  return process.env[name]?.trim();
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return new Uint8Array(digest);
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value),
  );
  return bytesToHex(new Uint8Array(signature));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}

export function authConfigured() {
  return Boolean(env('ADMIN_PASSWORD') && env('ADMIN_SESSION_SECRET'));
}

export async function passwordMatches(password: string) {
  const expected = env('ADMIN_PASSWORD');
  if (!expected) return false;
  const [a, b] = await Promise.all([sha256(password), sha256(expected)]);
  return timingSafeEqual(a, b);
}

export async function createSessionToken() {
  const secret = env('ADMIN_SESSION_SECRET');
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is missing');
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const signature = await hmac(expires, secret);
  return `${expires}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  const secret = env('ADMIN_SESSION_SECRET');
  if (!secret || !token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(expires, secret);
  const [a, b] = await Promise.all([sha256(signature), sha256(expected)]);
  return timingSafeEqual(a, b);
}

export function readCookie(request: Request, name: string) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function isAuthenticated(request: Request) {
  return verifySessionToken(readCookie(request, COOKIE_NAME));
}

export function sessionCookie(token: string) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${SESSION_SECONDS}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
}

export function expiredSessionCookie() {
  return [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
}
