import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const body: any = await context.request.json();

    // Only allow these fields to be updated
    const allowed = [
      'name', 'headline', 'bio', 'work', 'education',
      'location', 'website', 'linkedin_url',
      'profile_image_url', 'cover_image_url',
    ];

    const updates: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[key] === null || body[key] === '' ? null : String(body[key]));
      }
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No valid fields to update' }, 400);
    }

    updates.push(`updated_at = datetime('now')`);
    values.push(payload.sub);

    await DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const user: any = await DB.prepare(`
      SELECT id, name, username, email, profile_image_url, cover_image_url,
             bio, headline, work, education, location, website, linkedin_url,
             country, role, is_verified, created_at
      FROM users WHERE id = ?
    `).bind(payload.sub).first();

    return jsonResponse({
      user: {
        id: user.id,
        name: user.name,
        username: user.username || null,
        email: user.email,
        profile_image_url: user.profile_image_url || null,
        cover_image_url: user.cover_image_url || null,
        bio: user.bio || null,
        headline: user.headline || null,
        work: user.work || null,
        education: user.education || null,
        location: user.location || null,
        website: user.website || null,
        linkedin_url: user.linkedin_url || null,
        country: user.country || 'TZ',
        role: user.role || 'user',
        is_verified: user.is_verified || 0,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return jsonResponse({ error: 'Failed to update profile' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
