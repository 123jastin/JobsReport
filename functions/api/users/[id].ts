import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

const extractId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last || last === 'users') return null;
  return last;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const key = extractId(context);
  if (!key) return jsonResponse({ error: 'Missing user id' }, 400);

  try {
    // Fetch by id OR username (nice for SEO URLs later)
    const user: any = await DB.prepare(`
      SELECT
        u.id, u.name, u.username, u.email,
        u.profile_image_url, u.cover_image_url, u.bio,
        u.headline, u.work, u.education, u.location,
        u.website, u.linkedin_url, u.country,
        u.role, u.is_verified, u.created_at
      FROM users u
      WHERE u.id = ? OR u.username = ?
    `).bind(key, key).first();

    if (!user) return jsonResponse({ error: 'User not found' }, 404);

    // Follower count
    const followersRes: any = await DB.prepare(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
    ).bind(user.id).first();
    const followersCount = followersRes?.count || 0;

    // Is the viewer following this user?
    let isFollowing = false;
    const viewer = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (viewer && viewer.sub !== user.id) {
      const followRes = await DB.prepare(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
      ).bind(viewer.sub, user.id).first();
      isFollowing = !!followRes;
    }

    // Jobs count
    const jobsRes: any = await DB.prepare(
      `SELECT COUNT(*) as count FROM jobs
       WHERE user_id = ? AND active = 1
       AND (expires_at IS NULL OR expires_at >= date('now'))`
    ).bind(user.id).first().catch(() => ({ count: 0 }));

    // Stories count
    const storiesRes: any = await DB.prepare(
      `SELECT COUNT(*) as count FROM stories
       WHERE user_id = ? AND is_active = 1
       AND expires_at > datetime('now')`
    ).bind(user.id).first().catch(() => ({ count: 0 }));

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        username: user.username || null,
        email: user.email || null,
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
        followers_count: followersCount,
        jobs_count: jobsRes?.count || 0,
        stories_count: storiesRes?.count || 0,
        is_following: isFollowing,
        created_at: user.created_at || null,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    console.error('User profile error:', err);
    return jsonResponse({ error: 'Failed to load profile' }, 500);
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
