import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // 🔥 Get all companies
    const companiesResult = await DB.prepare(`
      SELECT 
        id, name, logo_url, website,
        description, street_address, area, locality, district,
        postal_code, postal_area, country, industry,
        founded_year, employee_count
      FROM companies 
      ORDER BY name
    `).all();

    // 🔥 Get ALL jobs (for counting)
    const jobsResult = await DB.prepare(
      'SELECT company, is_active FROM jobs'
    ).all();

    // 🔥 Count jobs per company manually
    const countsMap: Record<string, { total: number; active: number }> = {};
    for (const row of jobsResult.results) {
      const j = row as any;
      const name = (j.company || '').toLowerCase().trim();
      if (!name) continue;
      
      if (!countsMap[name]) {
        countsMap[name] = { total: 0, active: 0 };
      }
      countsMap[name].total++;
      if (j.is_active === 1) {
        countsMap[name].active++;
      }
    }

    // 🔥 Map companies with counts
    const companies = companiesResult.results.map((c: any) => {
      const nameKey = (c.name || '').toLowerCase().trim();
      const counts = countsMap[nameKey] || { total: 0, active: 0 };
      
      return {
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
        totalJobs: counts.total,
        activeJobs: counts.active
      };
    });

    return new Response(JSON.stringify(companies), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to load companies' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const name = body.name?.trim();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const existing = await DB.prepare(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER(?)'
    ).bind(name).first();

    if (existing) {
      return new Response(JSON.stringify({ error: `Company "${name}" already exists` }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const id = 'comp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4);

    await DB.prepare(`
      INSERT INTO companies (id, name, logo_url, website, description, street_address, area, locality, district, postal_code, postal_area, country, industry, founded_year, employee_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, name, body.logoUrl || '', body.url || '',
      body.description || '', body.streetAddress || '',
      body.area || '', body.locality || '', body.district || '',
      body.postalCode || '', body.postalArea || '', body.country || 'TZ',
      body.industry || '', body.foundedYear || '', body.employeeCount || ''
    ).run();

    return new Response(JSON.stringify({
      id, name, logoUrl: body.logoUrl || '', url: body.url || '',
      description: body.description || '', streetAddress: body.streetAddress || '',
      area: body.area || '', locality: body.locality || '',
      district: body.district || '', postalCode: body.postalCode || '',
      postalArea: body.postalArea || '', country: body.country || 'TZ',
      industry: body.industry || '', foundedYear: body.foundedYear || '',
      employeeCount: body.employeeCount || '', totalJobs: 0, activeJobs: 0
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create company' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'companies') {
    return new Response(JSON.stringify({ error: 'No company ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body: any = await context.request.json();
    const name = body.name?.trim();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const existing = await DB.prepare('SELECT id FROM companies WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    await DB.prepare(`
      UPDATE companies SET name = ?, logo_url = ?, website = ?, description = ?,
        street_address = ?, area = ?, locality = ?, district = ?,
        postal_code = ?, postal_area = ?, country = ?, industry = ?,
        founded_year = ?, employee_count = ?
      WHERE id = ?
    `).bind(
      name, body.logoUrl || '', body.url || '', body.description || '',
      body.streetAddress || '', body.area || '', body.locality || '', body.district || '',
      body.postalCode || '', body.postalArea || '', body.country || 'TZ', body.industry || '',
      body.foundedYear || '', body.employeeCount || '', id
    ).run();

    return new Response(JSON.stringify({ id, name, ...body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to update company' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'companies') {
    return new Response(JSON.stringify({ error: 'No company ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    await DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true, deleted: id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to delete company' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
