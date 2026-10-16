import { PagesFunction } from '@cloudflare/workers-types';
import { getAuthUser, jsonResponse } from '../../_lib/auth';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB, JWT_SECRET } = context.env;

  try {
    const payload = await getAuthUser(context.request, JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Unauthorized' }, 401);

    const user: any = await DB.prepare(`
      SELECT id, name, username, email,
             profile_image_url, bio, country, role,
             is_verified, created_at
      FROM users WHERE id = ?
    `).bind(payload.sub).first();

    if (!user) return jsonResponse({ error: 'User not found' }, 404);

    return jsonResponse({
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
    console.error('Me error:', err);
    return jsonResponse({ error: 'Failed to fetch user' }, 500);
  }
};
