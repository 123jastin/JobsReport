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
    // 🔥 Get currencies (same as old market.ts)
    const currenciesResult = await DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all();
    const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
    
    for (const c of currenciesResult.results) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
    }

    // 🔥 Get the job (EXACT same query as old market.ts)
    const jobResult = await DB.prepare(`
      SELECT 
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits,
        j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.canonical_url,
        j.whatsapp_number, j.application_instructions,
        r.name as role,
        c.name as company, c.logo_url, c.website,
        c.description as company_description,
        c.street_address as company_street_address,
        c.area as company_area,
        c.locality as company_locality,
        c.district as company_district,
        c.postal_code as company_postal_code,
        c.postal_area as company_postal_area,
        c.country as company_country,
        c.industry as company_industry,
        c.founded_year as company_founded_year,
        c.employee_count as company_employee_count,
        j.location, j.apply_url, j.salary,
        j.posted_at, j.expires_at, j.is_active
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
    `).bind(id).all();

    if (jobResult.results.length === 0) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const job = jobResult.results[0] as any;

    // 🔥 Get images (EXACT same as old market.ts)
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

    // 🔥 Get related jobs (same role or company)
    const relatedResult = await DB.prepare(`
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
      WHERE j.id != ? AND (r.name = ? OR c.name = ?) AND j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 6
    `).bind(job.id, job.role, job.company).all();

    // 🔥 Get images for related jobs (batch query)
    const relatedIds = relatedResult.results.map((rj: any) => rj.id);
    let relatedImages: Record<string, any[]> = {};
    
    if (relatedIds.length > 0) {
      const placeholders = relatedIds.map(() => '?').join(',');
      const relatedImagesResult = await DB.prepare(
        `SELECT job_id, url, thumbnail_url, name, type, seo_title, seo_description 
         FROM job_images 
         WHERE job_id IN (${placeholders}) 
         ORDER BY sort_order`
      ).bind(...relatedIds).all();
      
      for (const img of relatedImagesResult.results) {
        const imgJobId = (img as any).job_id;
        if (!relatedImages[imgJobId]) relatedImages[imgJobId] = [];
        relatedImages[imgJobId].push({
          url: (img as any).url,
          thumbnail: (img as any).thumbnail_url || (img as any).url,
          name: (img as any).name,
          type: (img as any).type || 'image',
          seoTitle: (img as any).seo_title || (img as any).name || '',
          seoDescription: (img as any).seo_description || ''
        });
      }
    }

    // 🔥 Map related jobs (EXACT same structure as old market.ts)
    const relatedJobs = relatedResult.results.map((rj: any) => {
      const currencyCode = rj.salary_currency || 'TZS';
      const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };
      
      return {
        id: rj.id,
        title: rj.title,
        description: rj.description || '',
        role: rj.role,
        company: rj.company,
        logoUrl: rj.logo_url || '',
        companyWebsite: rj.website || '',
        location: rj.location || 'Remote',
        url: rj.apply_url,
        salary: formatSalary(rj, currenciesMap),
        salary_min: rj.salary_min,
        salary_max: rj.salary_max,
        salary_currency: currencyCode,
        salary_currency_symbol: currencyInfo.symbol,
        salary_currency_name: currencyInfo.name,
        salary_currency_flag: currencyInfo.flag || '',
        job_category: rj.job_category || 'Other',
        industry: rj.industry || '',
        employment_type: rj.employment_type || 'FULL_TIME',
        workplace_type: rj.workplace_type || 'Onsite',
        education_level: rj.education_level || 'Any',
        experience_months: rj.experience_months || 0,
        skills: (() => { try { return JSON.parse(rj.skills || '[]'); } catch { return []; } })(),
        benefits: (() => { try { return JSON.parse(rj.benefits || '[]'); } catch { return []; } })(),
        canonical_url: rj.canonical_url || '',
        slug: `${rj.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${rj.id}`,
        postedAt: rj.posted_at,
        expiresAt: rj.expires_at,
        active: rj.is_active === 1,
        whatsapp_number: rj.whatsapp_number || '',
        application_instructions: rj.application_instructions || '',
        images: relatedImages[rj.id] || []
      };
    });

    const currencyCode = job.salary_currency || 'TZS';
    const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };

    // 🔥 Return EXACT same structure as old market.ts
    return new Response(JSON.stringify({
      id: job.id,
      title: job.title,
      description: job.description || '',
      role: job.role,
      company: job.company,
      logoUrl: job.logo_url || '',
      companyWebsite: job.website || '',
      companyDescription: job.company_description || '',
      companyStreetAddress: job.company_street_address || '',
      companyArea: job.company_area || '',
      companyLocality: job.company_locality || '',
      companyDistrict: job.company_district || '',
      companyPostalCode: job.company_postal_code || '',
      companyPostalArea: job.company_postal_area || '',
      companyCountry: job.company_country || 'TZ',
      companyIndustry: job.company_industry || '',
      companyFoundedYear: job.company_founded_year || '',
      companyEmployeeCount: job.company_employee_count || '',
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
      images: images,
      relatedJobs: relatedJobs
    }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to load job' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
