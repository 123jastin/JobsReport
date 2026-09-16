import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';

  try {
    let whereClause = 'WHERE 1=1';
    const bindParams: any[] = [];

    if (search.trim()) {
      whereClause += ' AND (j.title LIKE ? OR c.name LIKE ?)';
      const pattern = `%${search.trim()}%`;
      bindParams.push(pattern, pattern);
    }

    if (status === 'active') {
      whereClause += ' AND j.is_active = 1';
    } else if (status === 'draft') {
      whereClause += ' AND j.is_active = 0';
    }

    const [countResult, jobsResult] = await Promise.all([
      DB.prepare(`
        SELECT COUNT(*) as total 
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        ${whereClause}
      `).bind(...bindParams).first(),

      DB.prepare(`
        SELECT 
          j.id, j.title, j.location, j.apply_url, j.salary,
          j.posted_at, j.expires_at, j.is_active, j.description,
          j.job_category, j.employment_type, j.workplace_type,
          r.name as role,
          c.name as company, c.logo_url
        FROM jobs j
        JOIN roles r ON j.role_id = r.id
        JOIN companies c ON j.company_id = c.id
        ${whereClause}
        ORDER BY j.posted_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindParams, limit, offset).all()
    ]);

    const total = countResult?.total || 0;

    const jobs = jobsResult.results.map((job: any) => ({
      id: job.id,
      title: job.title,
      role: job.role,
      company: job.company,
      location: job.location || 'Remote',
      url: job.apply_url,
      salary: job.salary,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      active: job.is_active === 1,
      hasDescription: !!job.description,
      job_category: job.job_category,
      employment_type: job.employment_type,
      workplace_type: job.workplace_type,
      logoUrl: job.logo_url
    }));

    return new Response(JSON.stringify({
      jobs,
      stats: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + jobs.length < total
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    console.error('Admin jobs list error:', err);
    return new Response(JSON.stringify({
      jobs: [],
      stats: { total: 0, page: 1, limit, totalPages: 0, hasMore: false }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
