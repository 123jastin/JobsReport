import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // Get counts
    const jobsCount = await DB.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1').first();
    const companiesCount = await DB.prepare('SELECT COUNT(*) as count FROM companies').first();
    const reportsCount = await DB.prepare('SELECT COUNT(*) as count FROM reports').first();

    // Recent activity (last 5 jobs added)
    const recentJobs = await DB.prepare(
      'SELECT id, title, company_id, posted_at FROM jobs ORDER BY posted_at DESC LIMIT 5'
    ).all();

    const recentActivity = recentJobs.results.map((job: any) => ({
      id: job.id,
      action: 'Job Ingested',
      details: `${job.title} added to index`,
      timestamp: job.posted_at
    }));

    return new Response(JSON.stringify({
      addedToday: jobsCount?.count || 0,
      activeJobs: jobsCount?.count || 0,
      totalCompanies: companiesCount?.count || 0,
      lastUpdated: 'Today',
      recentActivity
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      addedToday: 0,
      activeJobs: 0,
      totalCompanies: 0,
      lastUpdated: 'Never',
      recentActivity: []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
