import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// Server-side cache
let marketCache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL = 60 * 1000; // 60 seconds

function formatSalary(job: any, currencies: Record<string, {symbol: string, name: string}>): string {
  const currency = job.salary_currency || 'TZS';
  const currencyInfo = currencies[currency] || { symbol: currency, name: currency };
  const symbol = currencyInfo.symbol;
  
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
  
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50); // Reduced max
  const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;
  
  // Check for filters
  const category = url.searchParams.get('category');
  const company = url.searchParams.get('company');
  const role = url.searchParams.get('role');
  const location = url.searchParams.get('location');

  // Check cache for unfiltered requests
  const cacheKey = `${limit}-${page}-${category || ''}-${company || ''}-${role || ''}-${location || ''}`;
  
  try {
    // Build WHERE clause dynamically
    let whereClause = 'WHERE j.is_active = 1'; // Only active jobs!
    const bindParams: any[] = [];
    
    if (category) {
      whereClause += ' AND j.job_category = ?';
      bindParams.push(category);
    }
    if (company) {
      whereClause += ' AND c.name = ?';
      bindParams.push(company);
    }
    if (role) {
      whereClause += ' AND r.name = ?';
      bindParams.push(role);
    }
    if (location) {
      whereClause += ' AND (j.location LIKE ? OR j.city LIKE ? OR j.region LIKE ?)';
      const locPattern = `%${location}%`;
      bindParams.push(locPattern, locPattern, locPattern);
    }

    // Optimized queries - only what's needed
    const [totalResult, jobsResult] = await Promise.all([
      DB.prepare(`SELECT COUNT(*) as total FROM jobs j WHERE j.is_active = 1`).all(),
      DB.prepare(`
        SELECT 
          j.id, j.title, j.job_category, j.employment_type, 
          j.workplace_type, j.salary_min, j.salary_max, 
          j.salary_currency, j.city, j.region, j.posted_at, 
          j.expires_at, j.is_active, j.location, j.salary,
          j.slug, j.apply_url, j.whatsapp_number,
          j.application_instructions, j.canonical_url,
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

    const totalActiveJobsCount = totalResult.results[0]?.total || 0;
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
      salary: job.salary || '',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'TZS',
      job_category: job.job_category || 'Other',
      employment_type: job.employment_type || 'FULL_TIME',
      workplace_type: job.workplace_type || 'Onsite',
      slug: job.slug || `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      active: job.is_active === 1,
      whatsapp_number: job.whatsapp_number || '',
      application_instructions: job.application_instructions || ''
    }));

    // Return only what's needed
    return new Response(JSON.stringify({
      jobs,
      activeJobs: jobs,
      stats: {
        totalJobs: totalActiveJobsCount,
        activeJobs: jobs.length,
        page,
        totalPages: Math.ceil(totalActiveJobsCount / limit)
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
