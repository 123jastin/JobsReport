import { PagesFunction } from '@cloudflare/workers-types';
import { jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database };

const extractUserId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/users/:id/jobs → ['api','users',':id','jobs']
  const idx = parts.lastIndexOf('jobs');
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
        j.id, j.title, j.location, j.role, j.salary,
        j.employment_type, j.posted_at, j.slug,
        c.name AS company_name,
        c.logo_url AS company_logo
      FROM jobs j
      LEFT JOIN companies c ON c.id = j.company_id
      WHERE (j.user_id = ? OR j.posted_by = ?)
        AND (j.active IS NULL OR j.active = 1)
        AND (j.expires_at IS NULL OR j.expires_at >= date('now'))
      ORDER BY j.posted_at DESC
      LIMIT 50
    `).bind(userId, userId).all();

    const jobs = (result.results || []).map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company_name || 'Unknown',
      company_logo: j.company_logo || null,
      location: j.location || null,
      role: j.role || null,
      salary: j.salary || null,
      employment_type: j.employment_type || null,
      posted_at: j.posted_at || null,
      slug: j.slug || null,
    }));

    return new Response(JSON.stringify({ jobs }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    // Fallback: jobs table may not have user_id yet — return empty gracefully
    console.error('User jobs error:', err);
    return new Response(JSON.stringify({ jobs: [] }), {
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
