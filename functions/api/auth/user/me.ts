import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Unauthorized' }, 401);

    const user: any = await DB.prepare(`
      SELECT id, name, username, email,
             profile_image_url, cover_image_url,
             bio, headline, work, education, location, website, linkedin_url,
             country, role, is_verified, created_at
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
        cover_image_url: user.cover_image_url || '',
        bio: user.bio || '',
        headline: user.headline || '',
        work: user.work || '',              // ← CRITICAL
        education: user.education || '',
        location: user.location || '',
        website: user.website || '',
        linkedin_url: user.linkedin_url || '',
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

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
