import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // Get companies with job counts
    const companiesResult = await DB.prepare(`
      SELECT 
        c.id, c.name, c.logo_url, c.website,
        c.description, c.street_address, c.area, c.locality, c.district,
        c.postal_code, c.postal_area, c.country, c.industry,
        c.founded_year, c.employee_count,
        COUNT(j.id) as total_jobs,
        SUM(CASE WHEN j.is_active = 1 THEN 1 ELSE 0 END) as active_jobs
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id
      GROUP BY c.id
      ORDER BY c.name
    `).all();

    const companies = companiesResult.results.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logo_url || '',
      url: c.website || '',
      description: c.description || '',
      streetAddress: c.street_address || '',
      area: c.area || '',
      locality: c.locality || '',
      district: c.district || '',
      postalCode: c.postal_code || '',
      postalArea: c.postal_area || '',
      country: c.country || 'TZ',
      industry: c.industry || '',
      foundedYear: c.founded_year || '',
      employeeCount: c.employee_count || '',
      totalJobs: c.total_jobs || 0,
      activeJobs: c.active_jobs || 0
    }));

    return new Response(JSON.stringify(companies), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
