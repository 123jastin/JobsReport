import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const { slug } = context.params;

  try {
    // 1. Get report
    const reportRes = await DB.prepare(`
      SELECT r.*, roles.name as role
      FROM reports r
      JOIN roles ON r.role_id = roles.id
      WHERE r.slug = ?
      LIMIT 1
    `).bind(slug).first();

    if (!reportRes) {
      return new Response('Not found', { status: 404 });
    }

    const roleId = reportRes.role_id;

    // 2. Get jobs for this role
    const jobsRes = await DB.prepare(`
      SELECT j.*, c.name as company, c.logo_url
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.role_id = ?
      ORDER BY j.posted_at DESC
    `).bind(roleId).all();

    const jobs = jobsRes.results;

    // 3. Compute stats
    const companiesSet = new Set(jobs.map((j: any) => j.company_id));

    const stats = {
      companies: companiesSet.size,
      growth: 12 // placeholder (we’ll calculate later)
    };

    // 4. Chart data (simple version)
    const chartData = groupJobsByMonth(jobs);

    // 5. Distribution (by location example)
    const distribution = groupByLocation(jobs);

    // 6. Companies list
    const companies = Array.from(
      new Map(
        jobs.map((j: any) => [
          j.company_id,
          { name: j.company, url: j.url }
        ])
      ).values()
    );

    return new Response(JSON.stringify({
      id: reportRes.id,
      title: reportRes.title,
      excerpt: reportRes.content,
      role: reportRes.role,
      updatedAt: reportRes.updated_at,

      stats,
      chartData,
      distribution,
      companies,
      jobs
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response('Server error', { status: 500 });
  }
};
