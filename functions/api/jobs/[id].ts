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
  const parts = url.pathname.split('/');
  const id = parts[parts.length - 1];

  try {
    const currenciesResult = await DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all();
    const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
    for (const c of currenciesResult.results) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
    }

    const jobResult = await DB.prepare(`
      SELECT j.id, j.title, j.description, j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits, j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.canonical_url, j.whatsapp_number, j.application_instructions,
        r.name as role, c.name as company, c.logo_url, c.website,
        j.location, j.apply_url, j.salary, j.posted_at, j.expires_at, j.is_active
      FROM jobs j JOIN roles r ON j.role_id = r.id JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
    `).bind(id).all();

    if (jobResult.results.length === 0) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const job = jobResult.results[0] as any;

    // 🔥 GET IMAGES
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
    } catch (imgErr) {
      images = [];
    }

    // 🔥 GET RELATED JOBS
    let relatedJobs: any[] = [];
    try {
      const relatedResult = await DB.prepare(`
        SELECT j.id, j.title, r.name as role, c.name as company, c.logo_url, j.location,
          j.salary, j.salary_min, j.salary_max, j.salary_currency, j.posted_at, j.expires_at, j.is_active
        FROM jobs j JOIN roles r ON j.role_id = r.id JOIN companies c ON j.company_id = c.id
        WHERE j.id != ? AND (r.name = ? OR c.name = ?) AND j.is_active = 1
        ORDER BY j.posted_at DESC LIMIT 6
      `).bind(job.id, job.role, job.company).all();

      relatedJobs = relatedResult.results.map((rj: any) => {
        const cc = rj.salary_currency || 'TZS';
        const ci = currenciesMap[cc] || { symbol: cc, name: cc, flag: '' };
        return {
          id: rj.id, title: rj.title, role: rj.role, company: rj.company,
          logoUrl: rj.logo_url || '', location: rj.location || 'Remote',
          salary: formatSalary(rj, currenciesMap),
          slug: `${rj.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${rj.id}`,
          active: rj.is_active === 1, expiresAt: rj.expires_at
        };
      });
    } catch (relErr) {
      relatedJobs = [];
    }

    const currencyCode = job.salary_currency || 'TZS';
    const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode, flag: '' };

    return new Response(JSON.stringify({
      id: job.id, title: job.title, description: job.description || '',
      role: job.role, company: job.company, logoUrl: job.logo_url || '',
      companyWebsite: job.website || '', location: job.location || 'Remote',
      url: job.apply_url, salary: formatSalary(job, currenciesMap),
      salary_min: job.salary_min, salary_max: job.salary_max,
      salary_currency: currencyCode, salary_currency_symbol: currencyInfo.symbol,
      salary_currency_name: currencyInfo.name, salary_currency_flag: currencyInfo.flag || '',
      job_category: job.job_category || 'Other', employment_type: job.employment_type || 'FULL_TIME',
      workplace_type: job.workplace_type || 'Onsite', street_address: job.street_address || '',
      city: job.city || '', region: job.region || '', postcode: job.postcode || '',
      slug: `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`,
      postedAt: job.posted_at, expiresAt: job.expires_at, active: job.is_active === 1,
      whatsapp_number: job.whatsapp_number || '', application_instructions: job.application_instructions || '',
      images: images,
      relatedJobs: relatedJobs
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Failed to load job',
      details: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
