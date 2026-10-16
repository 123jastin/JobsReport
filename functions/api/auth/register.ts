import { PagesFunction } from '@cloudflare/workers-types';
import {
  hashUserPassword, signUserJwt, jsonResponse, generateId,
} from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const body: any = await context.request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const username = body.username ? String(body.username).trim().toLowerCase() : null;
    const country = String(body.country || 'TZ').trim();

    if (!name || name.length < 2) return jsonResponse({ error: 'Name is required (min 2 chars)' }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: 'Valid email is required' }, 400);
    if (!password || password.length < 6) return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);

    const existingEmail = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingEmail) return jsonResponse({ error: 'Email already registered' }, 409);

    if (username) {
      const existingUser = await DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
      if (existingUser) return jsonResponse({ error: 'Username already taken' }, 409);
    }

    const id = generateId('user');
    const passwordHash = await hashUserPassword(password);
    const profileImage = body.profile_image_url
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0, 1).toUpperCase())}&background=1877F2&color=fff&size=128&bold=true&rounded=true`;

    await DB.prepare(`
      INSERT INTO users (id, name, username, email, password_hash, profile_image_url, country, role, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 0)
    `).bind(id, name, username, email, passwordHash, profileImage, country).run();

    // ─────────────────────────────────────────────
    // DEBUG: check secret before signing
    // ─────────────────────────────────────────────
    if (!USER_JWT_SECRET || typeof USER_JWT_SECRET !== 'string' || USER_JWT_SECRET.length < 8) {
      console.error('[register] USER_JWT_SECRET missing or too short');
      // Delete the just-inserted row so the user can retry
      try {
        await DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      } catch {}
      return jsonResponse({
        error: 'Server misconfigured: USER_JWT_SECRET is missing or too short',
        debug: {
          hasSecret: !!USER_JWT_SECRET,
          typeofSecret: typeof USER_JWT_SECRET,
          secretLength: USER_JWT_SECRET ? USER_JWT_SECRET.length : 0,
        },
      }, 500);
    }

    const token = await signUserJwt({ sub: id, email, role: 'user' }, USER_JWT_SECRET);

    return jsonResponse({
      token,
      user: {
        id, name, username, email,
        profile_image_url: profileImage,
        bio: '', country, role: 'user', is_verified: 0,
      },
    }, 201);
  } catch (err: any) {
    console.error('User register error:', err);
    // Roll back the insert if signing failed
    try {
      const body: any = await context.request.clone().json().catch(() => null);
      if (body?.email) {
        await DB.prepare('DELETE FROM users WHERE email = ?')
          .bind(String(body.email).trim().toLowerCase())
          .run();
      }
    } catch {}
    return jsonResponse({
      error: 'Registration failed',
      debug: {
        message: err?.message || String(err),
        name: err?.name || 'Error',
        hasSecret: !!USER_JWT_SECRET,
        secretLength: USER_JWT_SECRET ? USER_JWT_SECRET.length : 0,
      },
    }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
