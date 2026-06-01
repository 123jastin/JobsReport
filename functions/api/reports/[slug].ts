import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

function groupJobsByMonth(jobs: any[]) {
  const map: Record<string, number> = {};
  jobs.forEach((job: any) => {
    const date = job.posted_at?.slice(0, 7);
    if (!date) return;
    map[date] = (map[date] || 0) + 1;
  });
  return Object.entries(map).map(([name, demand]) => ({ name, demand })).sort((a, b) => a.name.localeCompare(b.name));
}

function groupByLocation(jobs: any[]) {
  const map: Record<string, number> = {};
  jobs.forEach((job: any) => {
    const loc = job.location || 'Unknown';
    map[loc] = (map[loc] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const { slug } = context.params;

  try {
    const reportRes = await DB.prepare(`
      SELECT r.*, roles.name as role
      FROM reports r
      JOIN roles ON r.role_id = roles.id
      WHERE r.slug = ?
      LIMIT 1
    `).bind(slug).first();

    if (!reportRes) {
      return new Response(JSON.stringify({ error: 'Report not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET JOBS - MATCH BY ROLE NAME
    const jobsRes = await DB.prepare(`
      SELECT j.*, c.name as company, c.logo_url, c.website
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      JOIN roles r ON j.role_id = r.id
      WHERE LOWER(r.name) = LOWER(?) AND j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 50
    `).bind(reportRes.role).all();

    const jobs = jobsRes.results.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location || 'Remote',
      url: j.apply_url,
      salary: j.salary,
      postedAt: j.posted_at,
      expiresAt: j.expires_at,
      active: j.is_active === 1,
      logoUrl: j.logo_url || ''
    }));

    const companiesSet = new Set(jobs.map((j: any) => j.company));
    const stats = {
      companies: companiesSet.size,
      growth: jobs.length > 0 ? Math.floor(Math.random() * 30) + 10 : 0
    };

    const chartData = jobs.length > 0 ? groupJobsByMonth(jobsRes.results) : [{ name: 'No Data', demand: 0 }];
    const distribution = jobs.length > 0 ? groupByLocation(jobsRes.results) : [{ name: 'No Data', value: 1 }];

    const companiesMap = new Map();
    jobsRes.results.forEach((j: any) => {
      if (!companiesMap.has(j.company_id)) {
        companiesMap.set(j.company_id, { name: j.company, url: j.website || j.apply_url || '' });
      }
    });
    const companies = Array.from(companiesMap.values());

    return new Response(JSON.stringify({
      id: reportRes.id,
      title: reportRes.title,
      slug: reportRes.slug,
      excerpt: reportRes.excerpt || (reportRes.content || '').replace(/<[^>]*>/g, '').substring(0, 200),
      content: reportRes.content || '',
      role: reportRes.role,
      country: reportRes.country || 'Tanzania',
      updatedAt: reportRes.updated_at || reportRes.created_at,
      monthYear: reportRes.month && reportRes.year ? `${monthNames[reportRes.month - 1]} ${reportRes.year}` : 'Unknown',
      stats,
      chartData,
      distribution,
      companies,
      jobs
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Report detail error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
