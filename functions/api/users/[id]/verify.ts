import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

const extractUserId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('verify');
  const id = idx > 1 ? parts[idx - 1] : null;
  return id && id !== 'users' ? id : null;
};

// POST /api/users/:id/verify → verify user (admin only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const targetUserId = extractUserId(context);
  if (!targetUserId) return jsonResponse({ error: 'Missing user id' }, 400);

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    // Only admins can verify
    if (payload.role !== 'admin') {
      return jsonResponse({ error: 'Only admins can verify users' }, 403);
    }

    // Check target user exists
    const target: any = await DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(targetUserId).first();
    if (!target) return jsonResponse({ error: 'User not found' }, 404);

    // Mark as verified
    await DB.prepare(
      'UPDATE users SET is_verified = 1, updated_at = datetime("now") WHERE id = ?'
    ).bind(targetUserId).run();

    return jsonResponse({ success: true, id: targetUserId, is_verified: 1 });
  } catch (err: any) {
    console.error('Verify user error:', err);
    return jsonResponse({ error: err?.message || 'Failed to verify' }, 500);
  }
};

// DELETE /api/users/:id/verify → unverify user (admin only)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const targetUserId = extractUserId(context);
  if (!targetUserId) return jsonResponse({ error: 'Missing user id' }, 400);

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    if (payload.role !== 'admin') {
      return jsonResponse({ error: 'Only admins can unverify users' }, 403);
    }

    await DB.prepare(
      'UPDATE users SET is_verified = 0, updated_at = datetime("now") WHERE id = ?'
    ).bind(targetUserId).run();

    return jsonResponse({ success: true, id: targetUserId, is_verified: 0 });
  } catch (err: any) {
    console.error('Unverify user error:', err);
    return jsonResponse({ error: err?.message || 'Failed to unverify' }, 500);
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
