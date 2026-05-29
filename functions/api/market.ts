import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // Jobs
    const jobsRes = await DB.prepare(`
      SELECT j.*, 
             r.name as role,
             c.name as company,
             c.logo_url
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 100
    `).all();

    const jobs = jobsRes.results.map((j: any) => ({
      id: j.id,
      title: j.title,
      role: j.role,
      company: j.company,
      location: j.location,
      url: j.apply_url,
      salary: j.salary,
      postedAt: j.posted_at,
      expiresAt: j.expires_at,
      logoUrl: j.logo_url
    }));

    // Roles
    const rolesRes = await DB.prepare(`
      SELECT name FROM roles
    `).all();

    const roles = rolesRes.results.map((r: any) => r.name);

    // Companies
    const companiesRes = await DB.prepare(`
      SELECT name, logo_url FROM companies
    `).all();

    const companies = companiesRes.results.map((c: any) => ({
      name: c.name,
      logoUrl: c.logo_url
    }));

    return new Response(JSON.stringify({
      jobs,
      roles,
      companies
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response('Failed to load market data', { status: 500 });
  }
};
