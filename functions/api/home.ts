import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // 1. Trending roles (computed from jobs)
    const trendsResult = await DB.prepare(`
      SELECT 
        r.name as role, 
        COUNT(j.id) as total_jobs,
        COUNT(DISTINCT j.company_id) as companies_count
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      WHERE j.is_active = 1
      GROUP BY j.role_id
      ORDER BY total_jobs DESC
      LIMIT 10
    `).all();

    const trends = trendsResult.results.map((t: any, i: number) => ({
      id: i + 1,
      role: t.role,
      growth: Math.floor(Math.random() * 30) + 10,
      companies: t.companies_count || t.total_jobs
    }));

    // 2. Latest reports
    const reportsResult = await DB.prepare(`
      SELECT r.id, r.slug, r.title, r.content, r.updated_at, r.country, ro.name as role
      FROM reports r
      JOIN roles ro ON r.role_id = ro.id
      ORDER BY r.updated_at DESC
      LIMIT 8
    `).all();

    const reports = reportsResult.results.map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      role: r.role,
      excerpt: r.content ? r.content.replace(/<[^>]*>/g, '').substring(0, 180) : '',
      updatedAt: r.updated_at,
      country: r.country || 'Tanzania'
    }));

    // 3. Spotlight companies (from active jobs)
    const companiesResult = await DB.prepare(`
      SELECT c.name, COUNT(j.id) as jobs_count
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = 1
      GROUP BY c.id
      ORDER BY jobs_count DESC
      LIMIT 5
    `).all();

    const spotlightCompanies = companiesResult.results.map((c: any) => c.name);

    return new Response(JSON.stringify({
      trends,
      reports,
      spotlightCompanies
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    console.error('Home API Error:', err);
    return new Response(JSON.stringify({
      trends: [],
      reports: [],
      spotlightCompanies: [],
      error: err instanceof Error ? err.message : 'Failed to load data'
    }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
