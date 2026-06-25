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
  const category = url.searchParams.get('category') || '';

  if (!category) {
    return new Response(JSON.stringify({ error: 'Category required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const currenciesResult = await DB.prepare('SELECT code, name, symbol, flag FROM currencies ORDER BY name').all();
    const currenciesMap: Record<string, {symbol: string, name: string, flag: string}> = {};
    for (const c of currenciesResult.results) {
      currenciesMap[c.code] = { symbol: c.symbol, name: c.name, flag: c.flag || '' };
    }

    const jobsResult = await DB.prepare(`
      SELECT j.id, j.title, j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.salary_min, j.salary_max, j.salary_currency,
        j.whatsapp_number, j.application_instructions,
        r.name as role, c.name as company, c.logo_url, c.website,
        j.location, j.apply_url, j.salary, j.posted_at, j.expires_at, j.is_active
      FROM jobs j JOIN roles r ON j.role_id = r.id JOIN companies c ON j.company_id = c.id
      WHERE LOWER(j.job_category) = LOWER(?) AND j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 100
    `).bind(category).all();

    const jobs = jobsResult.results.map((job: any) => {
      const cc = job.salary_currency || 'TZS';
      const ci = currenciesMap[cc] || { symbol: cc, name: cc, flag: '' };
      return {
        id: job.id, title: job.title, role: job.role, company: job.company,
        logoUrl: job.logo_url || '', companyWebsite: job.website || '',
        location: job.location || 'Remote', url: job.apply_url,
        salary: formatSalary(job, currenciesMap),
        salary_min: job.salary_min, salary_max: job.salary_max,
        salary_currency: cc, salary_currency_symbol: ci.symbol,
        salary_currency_name: ci.name, salary_currency_flag: ci.flag || '',
        job_category: job.job_category || 'Other', employment_type: job.employment_type || 'FULL_TIME',
        workplace_type: job.workplace_type || 'Onsite',
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || '',
        slug: `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`,
        postedAt: job.posted_at, expiresAt: job.expires_at, active: job.is_active === 1
      };
    });

    return new Response(JSON.stringify({ jobs, total: jobs.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
