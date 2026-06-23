// functions/api/job/[id].ts
import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/');
  const id = parts[parts.length - 1];

  try {
    const jobResult = await DB.prepare(`
      SELECT 
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode,
        j.whatsapp_number, j.application_instructions,
        r.name as role,
        c.name as company, c.logo_url, c.website,
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

    return new Response(JSON.stringify({
      id: job.id,
      title: job.title,
      description: job.description || '',
      role: job.role,
      company: job.company,
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
      street_address: job.street_address || '',
      city: job.city || '',
      region: job.region || '',
      postcode: job.postcode || '',
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      active: job.is_active === 1,
      whatsapp_number: job.whatsapp_number || '',
      application_instructions: job.application_instructions || ''
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to load job' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
