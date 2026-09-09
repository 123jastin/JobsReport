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

// Server-side cache for unfiltered count
let marketCountCache = {
  data: null as any,
  timestamp: 0
};

// Server-side cache for auxiliary data (roles, companies, categories, etc.)
let auxiliaryDataCache = {
  data: null as any,
  timestamp: 0
};

const COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const AUX_CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for auxiliary data

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
  const search = url.searchParams.get('search');

  const isUnfiltered = !category && !company && !role && !location && !workplaceType && !search;

  try {
    // Build WHERE clause
    let whereClause = 'WHERE j.is_active = 1';
    const bindParams: any[] = [];
    
    if (category && category !== 'all' && category !== '') {
      whereClause += ' AND LOWER(j.job_category) = LOWER(?)';
      bindParams.push(category);
    }
    if (role && role !== 'all' && role !== '') {
      whereClause += ' AND LOWER(r.name) = LOWER(?)';
      bindParams.push(role);
    }
    if (company && company !== 'all' && company !== '') {
      whereClause += ' AND LOWER(c.name) = LOWER(?)';
      bindParams.push(company);
    }
    if (workplaceType && workplaceType !== 'all' && workplaceType !== '') {
      whereClause += ' AND j.workplace_type = ?';
      bindParams.push(workplaceType);
    }
    if (location && location !== 'all' && location !== '') {
      whereClause += ' AND (j.location LIKE ? OR j.city LIKE ? OR j.region LIKE ? OR j.country LIKE ?)';
      const locPattern = `%${location}%`;
      bindParams.push(locPattern, locPattern, locPattern, locPattern);
    }
    if (search && search.trim() !== '') {
      whereClause += ' AND (j.title LIKE ? OR c.name LIKE ?)';
      const searchPattern = `%${search.trim()}%`;
      bindParams.push(searchPattern, searchPattern);
    }

    // Get total count (use cache for unfiltered requests)
    let totalResult;
    
    if (isUnfiltered && marketCountCache.data && (Date.now() - marketCountCache.timestamp) < COUNT_CACHE_TTL) {
      totalResult = marketCountCache.data;
    } else {
      totalResult = await DB.prepare(`
        SELECT COUNT(*) as total 
        FROM jobs j
        JOIN roles r ON j.role_id = r.id
        JOIN companies c ON j.company_id = c.id
        ${whereClause}
      `).bind(...bindParams).all();
      
      if (isUnfiltered) {
        marketCountCache = {
          data: totalResult,
          timestamp: Date.now()
        };
      }
    }

    // Get jobs
    const jobsResult = await DB.prepare(`
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
    `).bind(...bindParams, limit, offset).all();

    const totalActiveJobs = totalResult.results[0]?.total || 0;

    // Map jobs
    const jobs = jobsResult.results.map((job: any) => {
      const titleSlug = job.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      return {
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
        slug: `${titleSlug}-${job.id}`,
        postedAt: job.posted_at,
        expiresAt: job.expires_at,
        active: job.is_active === 1,
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || '',
        city: job.city || '',
        region: job.region || '',
        country: job.country || 'Tanzania'
      };
    });

    // Get auxiliary data (cached for 30 minutes)
    let auxiliaryData;
    
    if (auxiliaryDataCache.data && (Date.now() - auxiliaryDataCache.timestamp) < AUX_CACHE_TTL) {
      auxiliaryData = auxiliaryDataCache.data;
    } else {
      const [rolesResult, companiesResult, categoriesResult, workplaceResult, currenciesResult] = await Promise.all([
        DB.prepare('SELECT name FROM roles ORDER BY name').all(),
        DB.prepare('SELECT id, name, logo_url, website FROM companies ORDER BY name').all(),
        DB.prepare("SELECT DISTINCT job_category FROM jobs WHERE job_category != '' AND job_category != 'Other' AND is_active = 1").all(),
        DB.prepare("SELECT DISTINCT workplace_type FROM jobs WHERE workplace_type != '' AND is_active = 1").all(),
        DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all()
      ]);
      
      auxiliaryData = {
        roles: rolesResult.results.map((r: any) => r.name),
        companies: companiesResult.results.map((c: any) => ({
          id: c.id,
          name: c.name,
          logoUrl: c.logo_url || '',
          url: c.website || ''
        })),
        jobCategories: categoriesResult.results.map((c: any) => c.job_category),
        workplaceTypes: workplaceResult.results.map((w: any) => w.workplace_type),
        currencies: currenciesResult.results.map((c: any) => ({
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          flag: c.flag || ''
        }))
      };
      
      auxiliaryDataCache = {
        data: auxiliaryData,
        timestamp: Date.now()
      };
    }

    return new Response(JSON.stringify({
      jobs,
      activeJobs: jobs,
      roles: auxiliaryData.roles,
      companies: auxiliaryData.companies,
      jobCategories: auxiliaryData.jobCategories,
      workplaceTypes: auxiliaryData.workplaceTypes,
      currencies: auxiliaryData.currencies,
      stats: {
        totalJobs: totalActiveJobs,
        activeJobs: jobs.length,
        totalCompanies: auxiliaryData.companies.length,
        totalRoles: auxiliaryData.roles.length,
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
      roles: [],
      companies: [],
      jobCategories: [],
      workplaceTypes: [],
      currencies: [],
      stats: { totalJobs: 0, activeJobs: 0, totalCompanies: 0, totalRoles: 0 },
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
