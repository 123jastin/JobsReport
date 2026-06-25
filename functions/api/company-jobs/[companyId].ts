import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/');
  const companyId = parts[parts.length - 1];

  try {
    const jobsResult = await DB.prepare(`
      SELECT j.id, j.title, j.job_category, j.employment_type, j.workplace_type,
        j.salary_min, j.salary_max, j.salary_currency,
        r.name as role, c.name as company, c.logo_url,
        j.location, j.salary, j.posted_at, j.expires_at, j.is_active
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.company_id = ?
      ORDER BY j.is_active DESC, j.posted_at DESC
    `).bind(companyId).all();

    const jobs = jobsResult.results.map((j: any) => ({
      id: j.id, title: j.title, role: j.role, company: j.company,
      logoUrl: j.logo_url || '', location: j.location || 'Remote',
      salary: j.salary || '', active: j.is_active === 1,
      expiresAt: j.expires_at, postedAt: j.posted_at
    }));

    return new Response(JSON.stringify(jobs), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
