import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

// ─────────────────────────────────────────────
// POST /api/notifications/create
//   Body: {
//     type: 'job_created' | 'story_created' | 'job_daily',
//     title, body, link, entityType, entityId,
//     targetUserId?  (omit for broadcast to followers)
//   }
// ─────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const body: any = await context.request.json();
    const type = String(body.type || '').trim();
    const title = String(body.title || '').trim();
    const notifBody = String(body.body || '').trim();
    const link = String(body.link || '').trim();
    const entityType = String(body.entityType || '').trim();
    const entityId = String(body.entityId || '').trim();
    const imageUrl = body.imageUrl ? String(body.imageUrl) : null;

    if (!type || !title) {
      return jsonResponse({ error: 'type and title are required' }, 400);
    }

    // 1. Fetch followers of the actor
    const followersRes: any = await DB.prepare(
      'SELECT follower_id FROM follows WHERE following_id = ?'
    ).bind(payload.sub).all();

    const followerIds = (followersRes.results || [])
      .map((r: any) => r.follower_id)
      .filter((id: string) => id !== payload.sub); // don't notify self

    if (followerIds.length === 0) {
      return jsonResponse({ success: true, created: 0 });
    }

    // 2. Batch insert notifications
    const now = new Date().toISOString();
    const stmts = followerIds.map((uid: string) => {
      const notifId = `notif-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      return DB.prepare(`
        INSERT INTO notifications (
          id, user_id, actor_id, type, title, body, link, image_url,
          entity_type, entity_id, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).bind(
        notifId,
        uid,
        payload.sub,
        type,
        title,
        notifBody,
        link,
        imageUrl,
        entityType,
        entityId,
        now
      );
    });

    await DB.batch(stmts);

    return jsonResponse({ success: true, created: stmts.length });
  } catch (err: any) {
    console.error('Notification create error:', err);
    return jsonResponse({ error: err?.message || 'Failed' }, 500);
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
