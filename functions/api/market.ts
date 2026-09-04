// functions/api/market.ts
import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

function formatSalary(job: any): string {
  const symbol = job.salary_currency === 'USD' ? '$' : 
                 job.salary_currency === 'EUR' ? '€' : 
                 job.salary_currency === 'GBP' ? '£' : 'TSh';
  
  const min = job.salary_min ? Number(job.salary_min).toLocaleString() : '';
  const max = job.salary_max ? Number(job.salary_max).toLocaleString() : '';
  
  if (min && max) return `${symbol} ${min} - ${max}`;
  if (min) return `${symbol} ${min}+`;
  if (max) return `${symbol} Up to ${max}`;
  if (job.salary && job.salary.trim()) return `${symbol} ${job.salary}`;
  return '';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  
  // Pagination
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;

  // Filters
  const category = url.searchParams.get('category');
  const company = url.searchParams.get('company');
  const role = url.searchParams.get('role');
  const location = url.searchParams.get('location');
  const workplaceType = url.searchParams.get('workplace_type');

  try {
    // Build WHERE clause
    let whereClause = 'WHERE j.is_active = 1';
    const bindParams: any[] = [];
    
    if (category && category !== 'all') {
      whereClause += ' AND j.job_category = ?';
      bindParams.push(category);
    }
    if (role && role !== 'all') {
      whereClause += ' AND r.name = ?';
      bindParams.push(role);
    }
    if (company && company !== 'all') {
      whereClause += ' AND c.name = ?';
      bindParams.push(company);
    }
    if (workplaceType && workplaceType !== 'all') {
      whereClause += ' AND j.workplace_type = ?';
      bindParams.push(workplaceType);
    }
    if (location && location !== 'all') {
      whereClause += ' AND (j.location LIKE ? OR j.city LIKE ? OR j.region LIKE ? OR j.country LIKE ?)';
      const locPattern = `%${location}%`;
      bindParams.push(locPattern, locPattern, locPattern, locPattern);
    }

    // Run only 2 queries (count + jobs)
    const [totalResult, jobsResult] = await Promise.all([
      DB.prepare(`
        SELECT COUNT(*) as total 
        FROM jobs j
        JOIN roles r ON j.role_id = r.id
        JOIN companies c ON j.company_id = c.id
        ${whereClause}
      `).bind(...bindParams).all(),
      
      DB.prepare(`
        SELECT 
          j.id, j.title, j.job_category, j.employment_type, 
          j.workplace_type, j.salary_min, j.salary_max, 
          j.salary_currency, j.city, j.region, j.country,
          j.posted_at, j.expires_at, j.is_active, 
          j.location, j.salary, j.apply_url,
          j.whatsapp_number, j.application_instructions,
          j.canonical_url, j.street_address, j.postcode,
          r.name as role,
          c.name as company, c.id as company_id, 
          c.logo_url, c.website
        FROM jobs j
        JOIN roles r ON j.role_id = r.id
        JOIN companies c ON j.company_id = c.id
        ${whereClause}
        ORDER BY j.posted_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindParams, limit, offset).all()
    ]);

    const totalActiveJobs = totalResult.results[0]?.total || 0;

    // Map jobs - no need for separate image query for listing
    const jobs = jobsResult.results.map((job: any) => ({
      id: job.id,
      title: job.title,
      role: job.role,
      company: job.company,
      companyId: job.company_id,
      logoUrl: job.logo_url || '',
      companyWebsite: job.website || '',
      location: job.location || 'Remote',
      url: job.apply_url,
      salary: formatSalary(job),
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'TZS',
      job_category: job.job_category || 'Other',
      employment_type: job.employment_type || 'FULL_TIME',
      workplace_type: job.workplace_type || 'Onsite',
      slug: job.canonical_url ? 
        job.canonical_url.split('/').pop() : 
        `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      active: job.is_active === 1,
      whatsapp_number: job.whatsapp_number || '',
      application_instructions: job.application_instructions || '',
      city: job.city || '',
      region: job.region || '',
      country: job.country || 'Tanzania'
    }));

    return new Response(JSON.stringify({
      jobs,
      activeJobs: jobs,
      stats: {
        totalJobs: totalActiveJobs,
        activeJobs: jobs.length,
        page,
        totalPages: Math.ceil(totalActiveJobs / limit),
        hasMore: offset + jobs.length < totalActiveJobs
      }
    }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (err) {
    console.error('Market API Error:', err);
    return new Response(JSON.stringify({
      jobs: [],
      activeJobs: [],
      stats: { totalJobs: 0, activeJobs: 0 },
      error: err instanceof Error ? err.message : 'Failed to load market data'
    }), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      } 
    });
  }
};
