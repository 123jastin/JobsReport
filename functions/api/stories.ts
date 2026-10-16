import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse, generateId } from '../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

const slugify = (text: string, maxWords = 6): string => {
  const clean = String(text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean).slice(0, maxWords);
  return (words.join('-').slice(0, 60) || 'job-story');
};

// GET /api/stories
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const showAll = url.searchParams.get('all') === '1';
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

  try {
    let query = `
      SELECT
        s.id, s.user_id, s.slug, s.type, s.text_content, s.background_style,
        s.media_url, s.media_thumb, s.views_count, s.is_active,
        s.expires_at, s.created_at,
        u.name AS author_name,
        u.username AS author_username,
        u.profile_image_url AS author_avatar
      FROM stories s
      LEFT JOIN users u ON u.id = s.user_id
    `;
    if (!showAll) {
      query += ` WHERE s.is_active = 1 AND s.expires_at > datetime('now')`;
    }
    query += ` ORDER BY s.created_at DESC LIMIT ?`;

    const result = await DB.prepare(query).bind(limit).all();

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
    console.error('Stories list error:', err);
    return jsonResponse({ error: 'Failed to load stories' }, 500);
  }
};

// POST /api/stories (auth required)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in to post a story' }, 401);

    const body: any = await context.request.json();
    const type = String(body.type || '').trim();
    const textContent = body.text_content ? String(body.text_content).trim() : null;
    const backgroundStyle = body.background_style ? String(body.background_style) : null;
    const mediaUrl = body.media_url ? String(body.media_url) : null;
    const mediaThumb = body.media_thumb ? String(body.media_thumb) : null;
    const expiresAt = String(body.expires_at || '').trim();

    if (type !== 'text' && type !== 'image') return jsonResponse({ error: 'Type must be "text" or "image"' }, 400);
    if (type === 'text' && (!textContent || textContent.length < 2)) return jsonResponse({ error: 'Text content is required' }, 400);
    if (type === 'text' && textContent && textContent.length > 2000) return jsonResponse({ error: 'Text content too long (max 2000 chars)' }, 400);
    if (type === 'image' && !mediaUrl) return jsonResponse({ error: 'Media URL is required for image stories' }, 400);
    if (!expiresAt) return jsonResponse({ error: 'Deadline is required' }, 400);

    const expiresTs = Date.parse(expiresAt);
    if (!Number.isFinite(expiresTs)) return jsonResponse({ error: 'Invalid deadline format' }, 400);
    if (expiresTs <= Date.now()) return jsonResponse({ error: 'Deadline must be in the future' }, 400);

    const id = generateId('story');
    const shortTail = id.split('-').pop()?.slice(0, 6) || Math.random().toString(36).slice(2, 8);
    const baseSlug = type === 'text' ? slugify(textContent || '') : 'story-image';
    const slug = `${baseSlug}-${shortTail}`;

    await DB.prepare(`
      INSERT INTO stories (
        id, user_id, slug, type, text_content, background_style,
        media_url, media_thumb, views_count, is_active, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
    `).bind(
      id, payload.sub, slug, type, textContent, backgroundStyle,
      mediaUrl, mediaThumb, new Date(expiresTs).toISOString()
    ).run();

    const created: any = await DB.prepare(`
      SELECT s.*, u.name AS author_name, u.username AS author_username, u.profile_image_url AS author_avatar
      FROM stories s LEFT JOIN users u ON u.id = s.user_id WHERE s.id = ?
    `).bind(id).first();

    return jsonResponse({
      story: {
        id: created.id,
        user_id: created.user_id,
        slug: created.slug,
        type: created.type,
        text_content: created.text_content,
        background_style: created.background_style,
        media_url: created.media_url,
        media_thumb: created.media_thumb,
        views_count: created.views_count || 0,
        is_active: created.is_active,
        expires_at: created.expires_at,
        created_at: created.created_at,
        user: {
          id: created.user_id,
          name: created.author_name || 'User',
          username: created.author_username || null,
          profile_image_url: created.author_avatar || '',
        },
      },
    }, 201);
  } catch (err) {
    console.error('Create story error:', err);
    return jsonResponse({ error: 'Failed to create story' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
