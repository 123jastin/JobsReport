// ============================================================
// Shared JWT + password helpers for Cloudflare Pages Functions
// Uses Web Crypto (native in Workers) — no npm deps required.
// ============================================================

const enc = new TextEncoder();
const dec = new TextDecoder();

const b64urlEncode = (data: ArrayBuffer | Uint8Array | string): string => {
  let bytes: Uint8Array;
  if (typeof data === 'string') bytes = enc.encode(data);
  else if (data instanceof Uint8Array) bytes = data;
  else bytes = new Uint8Array(data);

  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const b64urlDecode = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const importHmacKey = async (secret: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const signJwt = async (
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds = 60 * 60 * 24 * 30 // 30 days
): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encHeader = b64urlEncode(JSON.stringify(header));
  const encPayload = b64urlEncode(JSON.stringify(fullPayload));
  const data = `${encHeader}.${encPayload}`;

  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const encSig = b64urlEncode(sig);

  return `${data}.${encSig}`;
};

export const verifyJwt = async (
  token: string,
  secret: string
): Promise<JwtPayload | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encHeader, encPayload, encSig] = parts;
    const data = `${encHeader}.${encPayload}`;

    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(encSig),
      enc.encode(data)
    );
    if (!valid) return null;

    const payload: JwtPayload = JSON.parse(dec.decode(b64urlDecode(encPayload)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
};

// ============================================================
// Password hashing — PBKDF2-SHA256 with per-user salt.
// Format stored: "pbkdf2$<iterations>$<saltB64>$<hashB64>"
// ============================================================
const PBKDF2_ITERATIONS = 100_000;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  const hashB64 = b64urlEncode(new Uint8Array(bits));
  const saltB64 = b64urlEncode(salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
};

export const verifyPassword = async (
  password: string,
  stored: string
): Promise<boolean> => {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'pbkdf2') return false;

    const iterations = Number(iterStr);
    const salt = b64urlDecode(saltB64);
    const expected = b64urlDecode(hashB64);

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      key,
      expected.length * 8
    );
    const actual = new Uint8Array(bits);

    if (actual.length !== expected.length) return false;
    // Constant-time compare
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
};

// ============================================================
// Auth extraction from request
// ============================================================
export const getAuthUser = async (
  request: Request,
  secret: string
): Promise<JwtPayload | null> => {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  return verifyJwt(token, secret);
};

// ============================================================
// Small helpers
// ============================================================
export const jsonResponse = (body: any, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });

export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
