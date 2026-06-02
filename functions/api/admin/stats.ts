import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // Get counts
    const jobsCount = await DB.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1').first();
    const allJobsCount = await DB.prepare('SELECT COUNT(*) as count FROM jobs').first();
    const companiesCount = await DB.prepare('SELECT COUNT(*) as count FROM companies').first();
    const reportsCount = await DB.prepare('SELECT COUNT(*) as count FROM reports').first();
    const rolesCount = await DB.prepare('SELECT COUNT(*) as count FROM roles').first();

    // Recent activity
    const recentJobs = await DB.prepare(
      'SELECT j.id, j.title, c.name as company, j.posted_at FROM jobs j JOIN companies c ON j.company_id = c.id ORDER BY j.posted_at DESC LIMIT 10'
    ).all();

    const recentActivity = recentJobs.results.map((job: any) => ({
      id: job.id,
      action: 'Job Ingested',
      details: `${job.title} at ${job.company}`,
      timestamp: job.posted_at
    }));

    return new Response(JSON.stringify({
      addedToday: allJobsCount?.count || 0,
      activeJobs: jobsCount?.count || 0,
      totalCompanies: companiesCount?.count || 0,
      totalReports: reportsCount?.count || 0,
      totalRoles: rolesCount?.count || 0,
      lastUpdated: 'Today',
      recentActivity
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Stats API Error:', err);
    return new Response(JSON.stringify({
      addedToday: 0,
      activeJobs: 0,
      totalCompanies: 0,
      totalReports: 0,
      totalRoles: 0,
      lastUpdated: 'Never',
      recentActivity: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
