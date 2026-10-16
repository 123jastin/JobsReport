// ============================================================
// User-side auth helpers — SEPARATE from admin auth
// Uses Web Crypto (native in Workers). No npm deps.
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

const importHmacKey = (secret: string) =>
  crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

export interface UserJwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const signUserJwt = async (
  payload: Omit<UserJwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds = 60 * 60 * 24 * 30
): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const full: UserJwtPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const eh = b64urlEncode(JSON.stringify(header));
  const ep = b64urlEncode(JSON.stringify(full));
  const data = `${eh}.${ep}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64urlEncode(sig)}`;
};

export const verifyUserJwt = async (
  token: string,
  secret: string
): Promise<UserJwtPayload | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [eh, ep, es] = parts;
    const data = `${eh}.${ep}`;
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(es),
      enc.encode(data)
    );
    if (!valid) return null;
    const payload: UserJwtPayload = JSON.parse(dec.decode(b64urlDecode(ep)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

// PBKDF2 password hashing (Web Crypto)
const PBKDF2_ITER = 100_000;

export const hashUserPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    key,
    256
  );
  return `pbkdf2$${PBKDF2_ITER}$${b64urlEncode(salt)}$${b64urlEncode(new Uint8Array(bits))}`;
};

export const verifyUserPassword = async (
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
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
};

export const getUserFromRequest = async (
  request: Request,
  secret: string
): Promise<UserJwtPayload | null> => {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  return verifyUserJwt(token, secret);
};

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
