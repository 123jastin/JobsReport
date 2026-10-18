import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

// ─────────────────────────────────────────────
// GET /api/notifications
//   Query: ?limit=30&offset=0
// ─────────────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const url = new URL(context.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const result: any = await DB.prepare(`
      SELECT
        n.id,
        n.type,
        n.title,
        n.body,
        n.link,
        n.image_url,
        n.actor_id,
        n.entity_type,
        n.entity_id,
        n.is_read,
        n.created_at,
        u.name AS actor_name,
        u.username AS actor_username,
        u.profile_image_url AS actor_avatar
      FROM notifications n
      LEFT JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(payload.sub, limit, offset).all();

    const totalRes: any = await DB.prepare(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?'
    ).bind(payload.sub).first();

    const unreadRes: any = await DB.prepare(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(payload.sub).first();

    const notifications = (result.results || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      imageUrl: n.image_url,
      actorId: n.actor_id,
      actor: n.actor_id ? {
        id: n.actor_id,
        name: n.actor_name || 'User',
        username: n.actor_username,
        profileImageUrl: n.actor_avatar,
      } : null,
      entityType: n.entity_type,
      entityId: n.entity_id,
      isRead: n.is_read === 1,
      createdAt: n.created_at,
    }));

    return jsonResponse({
      notifications,
      total: totalRes?.total || 0,
      unread: unreadRes?.unread || 0,
      hasMore: offset + notifications.length < (totalRes?.total || 0),
    });
  } catch (err: any) {
    console.error('Notifications GET error:', err);
    return jsonResponse({
      notifications: [],
      total: 0,
      unread: 0,
      hasMore: false,
      error: err?.message || 'Failed',
    }, 500);
  }
};

// ─────────────────────────────────────────────
// POST /api/notifications/mark-read
//   Body: { ids?: string[], all?: boolean }
// ─────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const body: any = await context.request.json();

    if (body?.all) {
      await DB.prepare(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
      ).bind(payload.sub).run();
      return jsonResponse({ success: true });
    }

    if (Array.isArray(body?.ids) && body.ids.length > 0) {
      const placeholders = body.ids.map(() => '?').join(',');
      await DB.prepare(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`
      ).bind(payload.sub, ...body.ids).run();
    }

    return jsonResponse({ success: true });
  } catch (err: any) {
    return jsonResponse({ error: err?.message || 'Failed' }, 500);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/notifications?id=xxx
// ─────────────────────────────────────────────
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonResponse({ error: 'Missing notification id' }, 400);

    await DB.prepare(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?'
    ).bind(id, payload.sub).run();

    return jsonResponse({ success: true, deleted: id });
  } catch (err: any) {
    return jsonResponse({ error: err?.message || 'Failed' }, 500);
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
