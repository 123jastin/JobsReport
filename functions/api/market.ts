import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// ✅ Format salary for display with proper currency symbol
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

  try {
    // ✅ Fetch currencies from database
    const currenciesResult = await DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all();
    const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
    const currenciesList: any[] = [];
    
    for (const c of currenciesResult.results) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
      currenciesList.push({ code: c.code, symbol: c.symbol, name: c.name, flag: c.flag || '' });
    }

    // 🔥 Get ALL jobs (active + expired) - Added whatsapp_number + application_instructions
    const jobsResult = await DB.prepare(`
      SELECT 
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits,
        j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.canonical_url,
        j.whatsapp_number, j.application_instructions,
        r.name as role,
        c.name as company, c.logo_url, c.website,
        j.location, j.apply_url, j.salary,
        j.posted_at, j.expires_at, j.is_active
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY j.posted_at DESC
      LIMIT 200
    `).all();

    // Map jobs with all fields
    const jobs = await Promise.all(
      jobsResult.results.map(async (job: any) => {
        let images: any[] = [];
        try {
          const imagesResult = await DB.prepare(
            'SELECT url, thumbnail_url, name, type, seo_title, seo_description FROM job_images WHERE job_id = ? ORDER BY sort_order'
          ).bind(job.id).all();
          images = (imagesResult.results || []).map((img: any) => ({
            url: img.url,
            thumbnail: img.thumbnail_url || img.url,
            name: img.name,
            type: img.type || 'image',
            seoTitle: img.seo_title || img.name || '',
            seoDescription: img.seo_description || ''
          }));
        } catch (err) { images = []; }

        const currencyCode = job.salary_currency || 'TZS';
        const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };

        return {
          id: job.id,
          title: job.title,
          description: job.description || '',
          role: job.role,
          company: job.company,
          logoUrl: job.logo_url || '',
          companyWebsite: job.website || '',
          street_address: job.street_address || '',
          city: job.city || '',
          region: job.region || '',
          country: 'Tanzania',
          postcode: job.postcode || '',
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
          industry: job.industry || '',
          employment_type: job.employment_type || 'FULL_TIME',
          workplace_type: job.workplace_type || 'Onsite',
          education_level: job.education_level || 'Any',
          experience_months: job.experience_months || 0,
          skills: (() => { try { return JSON.parse(job.skills || '[]'); } catch { return []; } })(),
          benefits: (() => { try { return JSON.parse(job.benefits || '[]'); } catch { return []; } })(),
          canonical_url: job.canonical_url || `https://jobsreport.online/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
          slug: `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`,
          postedAt: job.posted_at,
          expiresAt: job.expires_at,
          active: job.is_active === 1,
          whatsapp_number: job.whatsapp_number || '',
          application_instructions: job.application_instructions || '',
          images: images
        };
      })
    );

    // 🔥 Separate active jobs for listings
    const activeJobs = jobs.filter(j => j.active);

    // Get roles, companies, activity
    const rolesResult = await DB.prepare('SELECT name FROM roles ORDER BY name').all();
    const roles = rolesResult.results.map((r: any) => r.name);

    const companiesResult = await DB.prepare('SELECT id, name, logo_url, website FROM companies ORDER BY name').all();
    const companies = companiesResult.results.map((c: any) => ({
      id: c.id, name: c.name, logoUrl: c.logo_url || '', url: c.website || ''
    }));

    const activityResult = await DB.prepare(`
      SELECT j.id, j.title, c.name as company, j.posted_at
      FROM jobs j JOIN companies c ON j.company_id = c.id
      ORDER BY j.posted_at DESC LIMIT 10
    `).all();
    const recentActivity = activityResult.results.map((a: any) => ({
      id: a.id, action: 'Job Ingested', details: `${a.title} at ${a.company}`, timestamp: a.posted_at
    }));

    const categoriesResult = await DB.prepare(
      "SELECT DISTINCT job_category FROM jobs WHERE job_category != '' AND job_category != 'Other' AND is_active = 1"
    ).all();
    const jobCategories = categoriesResult.results.map((c: any) => c.job_category);

    const workplaceResult = await DB.prepare(
      "SELECT DISTINCT workplace_type FROM jobs WHERE workplace_type != '' AND is_active = 1"
    ).all();
    const workplaceTypes = workplaceResult.results.map((w: any) => w.workplace_type);

    return new Response(JSON.stringify({
      jobs: jobs,
      activeJobs: activeJobs,
      roles, companies, recentActivity, jobCategories, workplaceTypes,
      currencies: currenciesList,
      stats: {
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalCompanies: companies.length,
        totalRoles: roles.length
      }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }
    });

  } catch (err) {
    console.error('Market API Error:', err);
    return new Response(JSON.stringify({
      jobs: [], activeJobs: [], roles: [], companies: [], recentActivity: [], jobCategories: [], workplaceTypes: [], currencies: [],
      stats: { totalJobs: 0, activeJobs: 0, totalCompanies: 0, totalRoles: 0 },
      error: err instanceof Error ? err.message : 'Failed to load market data'
    }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
};
