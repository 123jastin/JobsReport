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
  const companyId = parts[parts.length - 1];

  try {
    const currenciesResult = await DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all();
    const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
    for (const c of currenciesResult.results) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
    }

    const jobsResult = await DB.prepare(`
      SELECT j.id, j.title, j.description, j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits, j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.whatsapp_number, j.application_instructions,
        r.name as role, c.name as company, c.logo_url, c.website,
        c.description as company_description, c.street_address as company_street_address,
        c.area as company_area, c.locality as company_locality, c.district as company_district,
        c.postal_code as company_postal_code, c.postal_area as company_postal_area,
        c.country as company_country, c.industry as company_industry,
        c.founded_year as company_founded_year, c.employee_count as company_employee_count,
        j.location, j.apply_url, j.salary, j.posted_at, j.expires_at, j.is_active
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.company_id = ?
      ORDER BY j.is_active DESC, j.posted_at DESC
    `).bind(companyId).all();

    const jobs = jobsResult.results.map((job: any) => {
      const currencyCode = job.salary_currency || 'TZS';
      const currencyInfo = currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode, flag: '' };
      
      return {
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
        slug: `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`,
        postedAt: job.posted_at,
        expiresAt: job.expires_at,
        active: job.is_active === 1,
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || ''
      };
    });

    return new Response(JSON.stringify(jobs), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
