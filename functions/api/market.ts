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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  
  // 🔥 Pagination support — max 200 for full job list
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 200);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;

  try {
    // 🔥 Run ALL queries in parallel — includes total count
    const [
      totalResult,
      currenciesResult,
      jobsResult,
      rolesResult,
      companiesResult,
      categoriesResult,
      workplaceResult
    ] = await Promise.all([
      DB.prepare('SELECT COUNT(*) as total FROM jobs WHERE is_active = 1').all(),
      DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all(),
      DB.prepare(`
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
        ORDER BY j.posted_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all(),
      DB.prepare('SELECT name FROM roles ORDER BY name').all(),
      DB.prepare('SELECT id, name, logo_url, website FROM companies ORDER BY name').all(),
      DB.prepare("SELECT DISTINCT job_category FROM jobs WHERE job_category != '' AND job_category != 'Other' AND is_active = 1").all(),
      DB.prepare("SELECT DISTINCT workplace_type FROM jobs WHERE workplace_type != '' AND is_active = 1").all()
    ]);

    // 🔥 Get total active jobs count
    const totalActiveJobsCount = totalResult.results[0]?.total || 0;

    // 🔥 Build currencies map
    const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
    const currenciesList: any[] = [];
    
    for (const c of currenciesResult.results) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
      currenciesList.push({ code: c.code, symbol: c.symbol, name: c.name, flag: c.flag || '' });
    }

    // 🔥 Get all job IDs for image batch query
    const jobIds = jobsResult.results.map((j: any) => j.id);
    
    // 🔥 Single query for ALL images — no loop!
    let allImages: Record<number, any[]> = {};
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

    // 🔥 Map jobs without N+1 queries
    const jobs = jobsResult.results.map((job: any) => {
      const currencyCode = job.salary_currency || 'TZS';
      const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };

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
        salary: formatSalary(job, currenciesMap),
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: currencyCode,
        salary_currency_symbol: currencyInfo.symbol,
        salary_currency_name: currencyInfo.name,
        salary_currency_flag: currencyInfo.flag || '',
        job_category: job.job_category || 'Other',
        employment_type: job.employment_type || 'FULL_TIME',
        workplace_type: job.workplace_type || 'Onsite',
        skills: (() => { try { return JSON.parse(job.skills || '[]'); } catch { return []; } })(),
        benefits: (() => { try { return JSON.parse(job.benefits || '[]'); } catch { return []; } })(),
        canonical_url: job.canonical_url || `https://jobsreport.online/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
        slug: `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`,
        postedAt: job.posted_at,
        expiresAt: job.expires_at,
        active: job.is_active === 1,
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || '',
        images: allImages[job.id] || []
      };
    });

    const activeJobs = jobs.filter(j => j.active);
    const roles = rolesResult.results.map((r: any) => r.name);
    
    const companies = companiesResult.results.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logo_url || '',
      url: c.website || ''
    }));

    const jobCategories = categoriesResult.results.map((c: any) => c.job_category);
    const workplaceTypes = workplaceResult.results.map((w: any) => w.workplace_type);

    // 🔥 Cache for 30 seconds
    const response = new Response(JSON.stringify({
      jobs,
      activeJobs,
      roles,
      companies,
      currencies: currenciesList,
      jobCategories,
      workplaceTypes,
      stats: {
        totalJobs: totalActiveJobsCount,
        activeJobs: activeJobs.length,
        totalCompanies: companies.length,
        totalRoles: roles.length
      }
    }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30'
      }
    });

    return response;

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
