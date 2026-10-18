import { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const extractUserId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('jobs');
  const id = idx > 1 ? parts[idx - 1] : null;
  return id && id !== 'users' ? id : null;
};

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const userId = extractUserId(context);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing user id', jobs: [] }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    // ── Fetch ALL jobs for this user ──
    const result = await DB.prepare(`
      SELECT
        j.id,
        j.title,
        j.location,
        j.salary,
        j.employment_type,
        j.posted_at,
        j.expires_at,
        j.is_active,
        j.user_id,
        j.company_id,
        j.role_id,
        c.name AS company_name,
        c.logo_url AS company_logo,
        r.name AS role_name
      FROM jobs j
      LEFT JOIN companies c ON c.id = j.company_id
      LEFT JOIN roles r ON r.id = j.role_id
      WHERE j.user_id = ?
      ORDER BY j.posted_at DESC
    `).bind(userId).all();

    const rows = result.results || [];

    // ── Also check: how many total jobs exist for this user vs null ──
    const totalCheck: any = await DB.prepare(
      'SELECT COUNT(*) as c FROM jobs WHERE user_id = ?'
    ).bind(userId).first();

    const jobs = rows.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company_name || 'Unknown',
      company_logo: j.company_logo || null,
      location: j.location || null,
      role: j.role_name || null,
      salary: j.salary || null,
      employment_type: j.employment_type || null,
      posted_at: j.posted_at || null,
      expires_at: j.expires_at || null,
      is_active: j.is_active,
    }));

    return new Response(JSON.stringify({
      jobs,
      count: jobs.length,
      userId,
      debug: {
        requestedId: userId,
        rowsFromJoin: rows.length,
        countFromDirect: totalCheck?.c || 0,
        rawFirstRow: rows[0] || null,
      },
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      jobs: [],
      error: 'Query failed',
      details: err?.message || String(err),
    }), {
      status: 500,
      headers: corsHeaders,
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
