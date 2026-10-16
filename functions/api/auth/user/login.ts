import { PagesFunction } from '@cloudflare/workers-types';
import { verifyUserPassword, signUserJwt, jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const body: any = await context.request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400);
    }

    const user: any = await DB.prepare(`
      SELECT id, name, username, email, password_hash,
             profile_image_url, bio, country, role, is_verified, created_at
      FROM users WHERE email = ?
    `).bind(email).first();

    if (!user) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    const ok = await verifyUserPassword(password, user.password_hash);
    if (!ok) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    const token = await signUserJwt(
      { sub: user.id, email: user.email, role: user.role || 'user' },
      USER_JWT_SECRET
    );

    return jsonResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || null,
        email: user.email,
        profile_image_url: user.profile_image_url || '',
        bio: user.bio || '',
        country: user.country || 'TZ',
        role: user.role || 'user',
        is_verified: user.is_verified || 0,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('User login error:', err);
    return jsonResponse({ error: 'Login failed' }, 500);
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
