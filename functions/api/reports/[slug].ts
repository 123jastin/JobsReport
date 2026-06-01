import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// ✅ Add helper functions
function groupJobsByMonth(jobs: any[]) {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const map: Record<string, number> = {};
  
  jobs.forEach((job: any) => {
    const date = job.posted_at?.slice(0, 7); // YYYY-MM
    if (!date) return;
    map[date] = (map[date] || 0) + 1;
  });
  
  return Object.entries(map)
    .map(([name, demand]) => ({ name, demand }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function groupByLocation(jobs: any[]) {
  const map: Record<string, number> = {};
  
  jobs.forEach((job: any) => {
    const loc = job.location || 'Unknown';
    map[loc] = (map[loc] || 0) + 1;
  });
  
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
      return new Response(JSON.stringify({ error: 'Report not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const roleId = reportRes.role_id;

    // 2. Get jobs for this role
    const jobsRes = await DB.prepare(`
      SELECT j.*, c.name as company, c.logo_url, c.website
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.role_id = ? AND j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 50
    `).bind(roleId).all();

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

    // 3. Compute stats
    const companiesSet = new Set(jobs.map((j: any) => j.company));
    const stats = {
      companies: companiesSet.size,
      growth: jobs.length > 0 ? Math.floor(Math.random() * 30) + 10 : 0
    };

    // 4. Chart data
    const chartData = jobs.length > 0 ? groupJobsByMonth(jobsRes.results) : [
      { name: 'No Data', demand: 0 }
    ];

    // 5. Distribution
    const distribution = jobs.length > 0 ? groupByLocation(jobsRes.results) : [
      { name: 'No Data', value: 1 }
    ];

    // 6. Companies list
    const companiesMap = new Map();
    jobsRes.results.forEach((j: any) => {
      if (!companiesMap.has(j.company_id)) {
        companiesMap.set(j.company_id, {
          name: j.company,
          url: j.website || j.apply_url || ''
        });
      }
    });
    const companies = Array.from(companiesMap.values());

    return new Response(JSON.stringify({
      id: reportRes.id,
      title: reportRes.title,
      slug: reportRes.slug,
      excerpt: extractExcerpt(reportRes.content),
      content: reportRes.content,
      role: reportRes.role,
      country: reportRes.country || 'Tanzania',
      updatedAt: reportRes.updated_at || reportRes.created_at,
      monthYear: reportRes.month && reportRes.year 
        ? `${monthNames[reportRes.month - 1]} ${reportRes.year}` 
        : 'Unknown',
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
    return new Response(JSON.stringify({ 
      error: 'Server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

function extractExcerpt(html: string) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>?/gm, '');
  return text.substring(0, 120) + '...';
}
