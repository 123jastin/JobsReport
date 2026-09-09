// functions/api/market.ts
import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

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

// Server-side caches
let marketCountCache = { data: null as any, timestamp: 0 };
let auxiliaryDataCache = { data: null as any, timestamp: 0 };

const COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const AUX_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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

    // Get total count (cached for unfiltered)
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
        marketCountCache = { data: totalResult, timestamp: Date.now() };
      }
    }

    // Get jobs with ALL fields
    const jobsResult = await DB.prepare(`
      SELECT 
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits,
        j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.canonical_url,
        j.whatsapp_number, j.application_instructions,
        r.name as role,
        c.name as company, c.id as company_id, c.logo_url, c.website,
        j.location, j.apply_url, j.salary,
        j.posted_at, j.expires_at, j.is_active
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      ${whereClause}
      ORDER BY j.posted_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindParams, limit, offset).all();

    const totalActiveJobsCount = totalResult.results[0]?.total || 0;

    // Get auxiliary data (cached 30 min)
    let auxiliaryData;
    
    if (auxiliaryDataCache.data && (Date.now() - auxiliaryDataCache.timestamp) < AUX_CACHE_TTL) {
      auxiliaryData = auxiliaryDataCache.data;
    } else {
      const [currenciesResult, rolesResult, companiesResult, categoriesResult, workplaceResult] = await Promise.all([
        DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all(),
        DB.prepare('SELECT name FROM roles ORDER BY name').all(),
        DB.prepare('SELECT id, name, logo_url, website FROM companies ORDER BY name').all(),
        DB.prepare("SELECT DISTINCT job_category FROM jobs WHERE job_category != '' AND job_category != 'Other' AND is_active = 1").all(),
        DB.prepare("SELECT DISTINCT workplace_type FROM jobs WHERE workplace_type != '' AND is_active = 1").all()
      ]);
      
      const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
      const currenciesList: any[] = [];
      
      for (const c of currenciesResult.results) {
        currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
        currenciesList.push({ code: c.code, symbol: c.symbol, name: c.name, flag: c.flag || '' });
      }
      
      auxiliaryData = {
        currenciesMap,
        currenciesList,
        roles: rolesResult.results.map((r: any) => r.name),
        companies: companiesResult.results.map((c: any) => ({
          id: c.id,
          name: c.name,
          logoUrl: c.logo_url || '',
          url: c.website || ''
        })),
        jobCategories: categoriesResult.results.map((c: any) => c.job_category),
        workplaceTypes: workplaceResult.results.map((w: any) => w.workplace_type)
      };
      
      auxiliaryDataCache = { data: auxiliaryData, timestamp: Date.now() };
    }

    // Get images for jobs (batch query)
    const jobIds = jobsResult.results.map((j: any) => j.id);
    let allImages: Record<string, any[]> = {};
    
    if (jobIds.length > 0) {
      const placeholders = jobIds.map(() => '?').join(',');
      const imagesResult = await DB.prepare(
        `SELECT job_id, url, thumbnail_url, name, type, seo_title, seo_description 
         FROM job_images 
         WHERE job_id IN (${placeholders}) 
         ORDER BY sort_order`
      ).bind(...jobIds).all();
      
      for (const img of imagesResult.results) {
        if (!allImages[img.job_id]) allImages[img.job_id] = [];
        allImages[img.job_id].push({
          url: img.url,
          thumbnail: img.thumbnail_url || img.url,
          name: img.name,
          type: img.type || 'image',
          seoTitle: img.seo_title || img.name || '',
          seoDescription: img.seo_description || ''
        });
      }
    }

    // Map jobs with ALL fields
    const jobs = jobsResult.results.map((job: any) => {
      const currencyCode = job.salary_currency || 'TZS';
      const currencyInfo = auxiliaryData.currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };
      const titleSlug = job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      return {
        id: job.id,
        title: job.title,
        description: job.description || '',
        role: job.role,
        company: job.company,
        companyId: job.company_id,
        logoUrl: job.logo_url || '',
        companyWebsite: job.website || '',
        location: job.location || 'Remote',
        url: job.apply_url,
        salary: formatSalary(job, auxiliaryData.currenciesMap),
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: currencyCode,
        salary_currency_symbol: currencyInfo.symbol,
        salary_currency_name: currencyInfo.name,
        salary_currency_flag: currencyInfo.flag || '',
        job_category: job.job_category || 'Other',
        industry: job.industry || '',
        employment_type: job.employment_type || 'FULL_TIME',
        workplace_type: job.workplace_type || 'Onsite',
        education_level: job.education_level || 'Any',
        experience_months: job.experience_months || 0,
        skills: (() => { try { return JSON.parse(job.skills || '[]'); } catch { return []; } })(),
        benefits: (() => { try { return JSON.parse(job.benefits || '[]'); } catch { return []; } })(),
        canonical_url: job.canonical_url || `https://jobsreport.online/market/${titleSlug}-${job.id}`,
        slug: `${titleSlug}-${job.id}`,
        postedAt: job.posted_at,
        expiresAt: job.expires_at,
        active: job.is_active === 1,
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || '',
        city: job.city || '',
        region: job.region || '',
        country: job.country || 'Tanzania',
        images: allImages[job.id] || []
      };
    });

    const activeJobs = jobs.filter(j => j.active);

    return new Response(JSON.stringify({
      jobs,
      activeJobs,
      roles: auxiliaryData.roles,
      companies: auxiliaryData.companies,
      currencies: auxiliaryData.currenciesList,
      jobCategories: auxiliaryData.jobCategories,
      workplaceTypes: auxiliaryData.workplaceTypes,
      stats: {
        totalJobs: totalActiveJobsCount,
        activeJobs: activeJobs.length,
        totalCompanies: auxiliaryData.companies.length,
        totalRoles: auxiliaryData.roles.length
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
      jobs: [], activeJobs: [], roles: [], companies: [], 
      jobCategories: [], workplaceTypes: [], currencies: [],
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
