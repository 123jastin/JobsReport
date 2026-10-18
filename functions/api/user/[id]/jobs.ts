// functions/api/users/[id]/jobs.ts
import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest } from '../../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

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

function formatSalary(
  job: any,
  currencies: Record<string, { symbol: string; name: string; flag?: string }>
): string {
  const currency = job.salary_currency || 'TZS';
  const currencyInfo = currencies[currency] || { symbol: currency, name: currency };
  const symbol = currencyInfo.symbol;
  const min = job.salary_min ? Number(job.salary_min).toLocaleString() : '';
  const max = job.salary_max ? Number(job.salary_max).toLocaleString() : '';
  if (min && max) return `${symbol} ${min} - ${max}`;
  if (min) return `${symbol} ${min}+`;
  if (max) return `${symbol} Up to ${max}`;
  if (job.salary && job.salary.trim()) return `${symbol} ${job.salary}`;
  return '';
}

// ─────────────────────────────────────────────
// GET /api/users/:id/jobs  → list
// ─────────────────────────────────────────────
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
    const url = new URL(context.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    const totalRes: any = await DB.prepare(
      'SELECT COUNT(*) as total FROM jobs WHERE user_id = ? AND is_active = 1'
    ).bind(userId).all();
    const totalJobs = totalRes.results?.[0]?.total || 0;

    const jobsRes: any = await DB.prepare(`
      SELECT
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits,
        j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.canonical_url,
        j.whatsapp_number, j.application_instructions,
        r.name AS role,
        c.name AS company, c.id AS company_id, c.logo_url, c.website,
        j.location, j.apply_url, j.salary,
        j.posted_at, j.expires_at, j.is_active, j.user_id
      FROM jobs j
      LEFT JOIN roles r ON j.role_id = r.id
      LEFT JOIN companies c ON c.id = j.company_id
      WHERE j.user_id = ? AND j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    // Currencies
    const currRes: any = await DB.prepare(
      'SELECT code, name, symbol, flag FROM currencies'
    ).all();
    const currenciesMap: Record<string, { symbol: string; name: string; flag?: string }> = {};
    for (const c of currRes.results || []) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
    }

    const jobs = (jobsRes.results || []).map((job: any) => {
      const currencyCode = job.salary_currency || 'TZS';
      const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };
      const titleSlug = job.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      return {
        id: job.id,
        title: job.title,
        description: job.description || '',
        role: job.role || 'General',
        company: job.company || 'Unknown',
        companyId: job.company_id,
        logoUrl: job.logo_url || '',
        companyWebsite: job.website || '',
        location: job.location || 'Remote',
        url: job.apply_url,
        salary: formatSalary(job, currenciesMap),
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: currencyCode,
        salary_currency_symbol: currencyInfo.symbol,
        salary_currency_name: currencyInfo.name,
        salary_currency_flag: currencyInfo.flag || '',
        job_category: job.job_category || 'Other',
        industry: job.industry || '',
        employment_type: job.employment_type || 'FULL_TIME',
        workplace_type: job.workplace_type || 'Onsite',
        education_level: job.education_level || 'Any',
        experience_months: job.experience_months || 0,
        skills: (() => { try { return JSON.parse(job.skills || '[]'); } catch { return []; } })(),
        benefits: (() => { try { return JSON.parse(job.benefits || '[]'); } catch { return []; } })(),
        canonical_url: job.canonical_url || `https://jobsreport.online/market/${titleSlug}-${job.id}`,
        slug: `${titleSlug}-${job.id}`,
        postedAt: job.posted_at,
        expiresAt: job.expires_at,
        active: job.is_active === 1,
        user_id: job.user_id,
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || '',
        city: job.city || '',
        region: job.region || '',
        country: job.country || 'Tanzania',
        images: [] as any[],
      };
    });

    // Attach images
    const jobIds = jobs.map((j: any) => j.id);
    if (jobIds.length > 0) {
      const ph = jobIds.map(() => '?').join(',');
      const imgsRes: any = await DB.prepare(
        `SELECT job_id, url, thumbnail_url, name, type, seo_title, seo_description
         FROM job_images WHERE job_id IN (${ph}) ORDER BY sort_order`
      ).bind(...jobIds).all();

      const byJob: Record<string, any[]> = {};
      for (const img of imgsRes.results || []) {
        if (!byJob[img.job_id]) byJob[img.job_id] = [];
        byJob[img.job_id].push({
          url: img.url,
          thumbnail: img.thumbnail_url || img.url,
          name: img.name,
          type: img.type || 'image',
          seoTitle: img.seo_title || img.name || '',
          seoDescription: img.seo_description || '',
        });
      }
      for (const job of jobs) {
        job.images = byJob[job.id] || [];
      }
    }

    return new Response(JSON.stringify({
      jobs,
      stats: { totalJobs, page, limit, hasMore: offset + jobs.length < totalJobs },
      userId,
    }), {
      headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err: any) {
    console.error('User jobs GET error:', err);
    return new Response(JSON.stringify({
      jobs: [],
      stats: { totalJobs: 0, page: 1, limit: 100, hasMore: false },
      error: err?.message || 'Failed to load user jobs',
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/:id/jobs  → update a job
//   Body: { jobId, title?, description?, salary?, ... }
// ─────────────────────────────────────────────
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const userId = extractUserId(context);
  if (!userId) return new Response(JSON.stringify({ error: 'Missing user id' }), { status: 400, headers: corsHeaders });

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return new Response(JSON.stringify({ error: 'Please log in' }), { status: 401, headers: corsHeaders });

    const body: any = await context.request.json();
    const jobId = String(body.jobId || '').trim();
    if (!jobId) return new Response(JSON.stringify({ error: 'Missing jobId in body' }), { status: 400, headers: corsHeaders });

    // Verify ownership or admin
    const job: any = await DB.prepare('SELECT id, user_id FROM jobs WHERE id = ?').bind(jobId).first();
    if (!job) return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: corsHeaders });

    const isOwner = job.user_id === payload.sub;
    const isAdmin = payload.role === 'admin';
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Not allowed to edit this job' }), { status: 403, headers: corsHeaders });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const push = (col: string, val: any) => { updates.push(`${col} = ?`); values.push(val); };

    if (body.title !== undefined) push('title', String(body.title).trim());
    if (body.description !== undefined) push('description', String(body.description));
    if (body.location !== undefined) push('location', String(body.location));
    if (body.salary !== undefined) push('salary', String(body.salary));
    if (body.url !== undefined) push('apply_url', String(body.url));
    if (body.expiresAt !== undefined) push('expires_at', new Date(body.expiresAt).toISOString());
    if (body.job_category !== undefined) push('job_category', String(body.job_category));
    if (body.industry !== undefined) push('industry', String(body.industry));
    if (body.employment_type !== undefined) push('employment_type', String(body.employment_type));
    if (body.workplace_type !== undefined) push('workplace_type', String(body.workplace_type));
    if (body.education_level !== undefined) push('education_level', String(body.education_level));
    if (body.experience_months !== undefined) push('experience_months', Number(body.experience_months) || 0);
    if (body.skills !== undefined) push('skills', JSON.stringify(body.skills || []));
    if (body.benefits !== undefined) push('benefits', JSON.stringify(body.benefits || []));
    if (body.salary_min !== undefined) push('salary_min', body.salary_min || null);
    if (body.salary_max !== undefined) push('salary_max', body.salary_max || null);
    if (body.salary_currency !== undefined) push('salary_currency', String(body.salary_currency));
    if (body.street_address !== undefined) push('street_address', String(body.street_address));
    if (body.city !== undefined) push('city', String(body.city));
    if (body.region !== undefined) push('region', String(body.region));
    if (body.country !== undefined) push('country', String(body.country));
    if (body.postcode !== undefined) push('postcode', String(body.postcode));
    if (body.whatsapp_number !== undefined) push('whatsapp_number', String(body.whatsapp_number));
    if (body.application_instructions !== undefined) push('application_instructions', String(body.application_instructions));
    if (body.is_active !== undefined) push('is_active', body.is_active ? 1 : 0);

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: corsHeaders });
    }

    values.push(jobId);
    await DB.prepare(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

    return new Response(JSON.stringify({ success: true, id: jobId }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('User jobs PUT error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Failed to update job' }), { status: 500, headers: corsHeaders });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/users/:id/jobs?jobId=X  → delete
// ─────────────────────────────────────────────
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;
  const userId = extractUserId(context);
  if (!userId) return new Response(JSON.stringify({ error: 'Missing user id' }), { status: 400, headers: corsHeaders });

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return new Response(JSON.stringify({ error: 'Please log in' }), { status: 401, headers: corsHeaders });

    // Read jobId from query string OR body
    const url = new URL(context.request.url);
    let jobId = url.searchParams.get('jobId') || '';

    if (!jobId) {
      try {
        const body: any = await context.request.json();
        jobId = String(body?.jobId || '').trim();
      } catch { /* no body */ }
    }

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Missing jobId' }), { status: 400, headers: corsHeaders });
    }

    const job: any = await DB.prepare('SELECT id, user_id FROM jobs WHERE id = ?').bind(jobId).first();
    if (!job) return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: corsHeaders });

    const isOwner = job.user_id === payload.sub;
    const isAdmin = payload.role === 'admin';
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Not allowed to delete this job' }), { status: 403, headers: corsHeaders });
    }

    await DB.prepare('DELETE FROM jobs WHERE id = ?').bind(jobId).run();

    return new Response(JSON.stringify({ success: true, deleted: jobId }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('User jobs DELETE error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Failed to delete job' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
