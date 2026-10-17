import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

const extractTargetId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/users/:id/follow → ['api','users',':id','follow']
  const idx = parts.lastIndexOf('follow');
  const id = idx > 1 ? parts[idx - 1] : null;
  return id && id !== 'users' ? id : null;
};

// POST /api/users/:id/follow → follow
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const targetId = extractTargetId(context);
  if (!targetId) return jsonResponse({ error: 'Missing user id' }, 400);

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    if (payload.sub === targetId) {
      return jsonResponse({ error: 'Cannot follow yourself' }, 400);
    }

    const target: any = await DB.prepare('SELECT id FROM users WHERE id = ?')
      .bind(targetId).first();
    if (!target) return jsonResponse({ error: 'User not found' }, 404);

    await DB.prepare(`
      INSERT OR IGNORE INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `).bind(payload.sub, targetId).run();

    const countRes: any = await DB.prepare(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
    ).bind(targetId).first();

    return jsonResponse({
      success: true,
      is_following: true,
      followers_count: countRes?.count || 0,
    });
  } catch (err) {
    console.error('Follow error:', err);
    return jsonResponse({ error: 'Failed to follow' }, 500);
  }
};

// DELETE /api/users/:id/follow → unfollow
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const targetId = extractTargetId(context);
  if (!targetId) return jsonResponse({ error: 'Missing user id' }, 400);

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    await DB.prepare(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
    ).bind(payload.sub, targetId).run();

    const countRes: any = await DB.prepare(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
    ).bind(targetId).first();

    return jsonResponse({
      success: true,
      is_following: false,
      followers_count: countRes?.count || 0,
    });
  } catch (err) {
    console.error('Unfollow error:', err);
    return jsonResponse({ error: 'Failed to unfollow' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
