import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

const extractKey = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last || last === 'stories' || last === 'view') return null;
  return last;
};

// GET /api/stories/:id-or-slug (public + increments view)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const key = extractKey(context);
  if (!key) return jsonResponse({ error: 'Missing story id' }, 400);

  try {
    const story: any = await DB.prepare(`
      SELECT s.*,
             u.name AS author_name,
             u.username AS author_username,
             u.profile_image_url AS author_avatar,
             u.is_verified AS author_verified
      FROM stories s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.id = ? OR s.slug = ?
    `).bind(key, key).first();

    if (!story) return jsonResponse({ error: 'Story not found' }, 404);

    context.waitUntil(
      DB.prepare('UPDATE stories SET views_count = views_count + 1 WHERE id = ?')
        .bind(story.id).run().catch(() => {})
    );

    return new Response(JSON.stringify({
      id: story.id,
      user_id: story.user_id,
      slug: story.slug,
      type: story.type,
      text_content: story.text_content,
      background_style: story.background_style,
      media_url: story.media_url,
      media_thumb: story.media_thumb,
      views_count: (story.views_count || 0) + 1,
      is_active: story.is_active,
      expires_at: story.expires_at,
      created_at: story.created_at,
      user: {
        id: story.user_id,
        name: story.author_name || 'User',
        username: story.author_username || null,
        profile_image_url: story.author_avatar || '',
        is_verified: story.author_verified ?? 0,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    console.error('Story fetch error:', err);
    return jsonResponse({ error: 'Failed to load story' }, 500);
  }
};

// DELETE /api/stories/:id (author only)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const key = extractKey(context);
  if (!key) return jsonResponse({ error: 'Missing story id' }, 400);

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const story: any = await DB.prepare(
      'SELECT id, user_id FROM stories WHERE id = ? OR slug = ?'
    ).bind(key, key).first();

    if (!story) return jsonResponse({ error: 'Story not found' }, 404);

    const isOwner = story.user_id === payload.sub;
    const isAdmin = payload.role === 'admin';
    if (!isOwner && !isAdmin) return jsonResponse({ error: 'Not allowed' }, 403);

    await DB.prepare('DELETE FROM stories WHERE id = ?').bind(story.id).run();
    return jsonResponse({ success: true, deleted: story.id });
  } catch (err) {
    console.error('Story delete error:', err);
    return jsonResponse({ error: 'Failed to delete story' }, 500);
  }
};

// POST /api/stories/:id (view increment fallback)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const key = extractKey(context);
  if (!key) return jsonResponse({ error: 'Missing story id' }, 400);

  try {
    const story: any = await DB.prepare(
      'SELECT id FROM stories WHERE id = ? OR slug = ?'
    ).bind(key, key).first();
    if (!story) return jsonResponse({ error: 'Story not found' }, 404);

    await DB.prepare('UPDATE stories SET views_count = views_count + 1 WHERE id = ?')
      .bind(story.id).run();

    const updated: any = await DB.prepare('SELECT views_count FROM stories WHERE id = ?')
      .bind(story.id).first();

    return jsonResponse({ success: true, views_count: updated?.views_count || 0 });
  } catch (err) {
    console.error('View increment error:', err);
    return jsonResponse({ error: 'Failed to record view' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
