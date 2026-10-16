import { PagesFunction } from '@cloudflare/workers-types';
import { hashPassword, signJwt, jsonResponse, generateId } from '../../_lib/auth';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, JWT_SECRET } = context.env;

  try {
    const body: any = await context.request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const username = body.username ? String(body.username).trim().toLowerCase() : null;
    const country = String(body.country || 'TZ').trim();

    // --- Validation ---
    if (!name || name.length < 2) {
      return jsonResponse({ error: 'Name is required (min 2 characters)' }, 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Valid email is required' }, 400);
    }
    if (!password || password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    // --- Uniqueness ---
    const existingEmail = await DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    if (existingEmail) {
      return jsonResponse({ error: 'Email already registered' }, 409);
    }

    if (username) {
      const existingUser = await DB.prepare(
        'SELECT id FROM users WHERE username = ?'
      ).bind(username).first();
      if (existingUser) {
        return jsonResponse({ error: 'Username already taken' }, 409);
      }
    }

    // --- Create ---
    const id = generateId('user');
    const passwordHash = await hashPassword(password);
    const profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.slice(0, 1).toUpperCase()
    )}&background=1877F2&color=fff&size=128&bold=true&rounded=true`;

    await DB.prepare(`
      INSERT INTO users (
        id, name, username, email, password_hash,
        profile_image_url, country, role, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 0)
    `).bind(
      id, name, username, email, passwordHash,
      body.profile_image_url || profileImage, country
    ).run();

    // --- Token ---
    const token = await signJwt(
      { sub: id, email, role: 'user' },
      JWT_SECRET
    );

    return jsonResponse({
      token,
      user: {
        id,
        name,
        username,
        email,
        profile_image_url: body.profile_image_url || profileImage,
        country,
        role: 'user',
        is_verified: 0,
        bio: '',
        created_at: new Date().toISOString(),
      },
    }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return jsonResponse({ error: 'Registration failed' }, 500);
  }
};
