import { PagesFunction } from '@cloudflare/workers-types';
import { jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database };

const extractUserId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/users/:id/stories → ['api','users',':id','stories']
  const idx = parts.lastIndexOf('stories');
  const id = idx > 1 ? parts[idx - 1] : null;
  return id && id !== 'users' ? id : null;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const userId = extractUserId(context);
  if (!userId) return jsonResponse({ error: 'Missing user id' }, 400);

  try {
    const result = await DB.prepare(`
      SELECT
        s.id, s.user_id, s.slug, s.type, s.text_content, s.background_style,
        s.media_url, s.media_thumb, s.views_count, s.is_active,
        s.expires_at, s.created_at,
        u.name AS author_name,
        u.username AS author_username,
        u.profile_image_url AS author_avatar
      FROM stories s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.user_id = ?
        AND s.is_active = 1
        AND s.expires_at > datetime('now')
      ORDER BY s.created_at DESC
      LIMIT 50
    `).bind(userId).all();

    const stories = (result.results || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      slug: row.slug,
      type: row.type,
      text_content: row.text_content,
      background_style: row.background_style,
      media_url: row.media_url,
      media_thumb: row.media_thumb,
      views_count: row.views_count || 0,
      is_active: row.is_active,
      expires_at: row.expires_at,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        name: row.author_name || 'User',
        username: row.author_username || null,
        profile_image_url: row.author_avatar || '',
      },
    }));

    return new Response(JSON.stringify({ stories }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (err) {
    console.error('User stories error:', err);
    return new Response(JSON.stringify({ stories: [] }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
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
