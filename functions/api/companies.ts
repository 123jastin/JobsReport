import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare(`
      SELECT 
        id, name, logo_url, website,
        description, street_address, area, locality, district,
        postal_code, postal_area, country, industry,
        founded_year, employee_count
      FROM companies 
      ORDER BY name
    `).all();
    
    const companies = result.results.map((c: any) => ({
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
      employeeCount: c.employee_count || ''
    }));

    return new Response(JSON.stringify(companies), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    console.error('Companies API Error:', err);
    return new Response(JSON.stringify([]), {
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
      INSERT INTO companies (
        id, name, logo_url, website,
        description, street_address, area, locality, district,
        postal_code, postal_area, country, industry,
        founded_year, employee_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      name, 
      body.logoUrl || '', 
      body.url || '',
      body.description || '',
      body.streetAddress || '',
      body.area || '',
      body.locality || '',
      body.district || '',
      body.postalCode || '',
      body.postalArea || '',
      body.country || 'TZ',
      body.industry || '',
      body.foundedYear || '',
      body.employeeCount || ''
    ).run();

    return new Response(JSON.stringify({
      id,
      name,
      logoUrl: body.logoUrl || '',
      url: body.url || '',
      description: body.description || '',
      streetAddress: body.streetAddress || '',
      area: body.area || '',
      locality: body.locality || '',
      district: body.district || '',
      postalCode: body.postalCode || '',
      postalArea: body.postalArea || '',
      country: body.country || 'TZ',
      industry: body.industry || '',
      foundedYear: body.foundedYear || '',
      employeeCount: body.employeeCount || ''
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Company creation error:', err);
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

    // Check if company exists
    const existing = await DB.prepare(
      'SELECT id FROM companies WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Update company with all fields
    await DB.prepare(`
      UPDATE companies SET
        name = ?,
        logo_url = ?,
        website = ?,
        description = ?,
        street_address = ?,
        area = ?,
        locality = ?,
        district = ?,
        postal_code = ?,
        postal_area = ?,
        country = ?,
        industry = ?,
        founded_year = ?,
        employee_count = ?
      WHERE id = ?
    `).bind(
      name,
      body.logoUrl || '',
      body.url || '',
      body.description || '',
      body.streetAddress || '',
      body.area || '',
      body.locality || '',
      body.district || '',
      body.postalCode || '',
      body.postalArea || '',
      body.country || 'TZ',
      body.industry || '',
      body.foundedYear || '',
      body.employeeCount || '',
      id
    ).run();

    return new Response(JSON.stringify({
      id,
      name,
      logoUrl: body.logoUrl || '',
      url: body.url || '',
      description: body.description || '',
      streetAddress: body.streetAddress || '',
      area: body.area || '',
      locality: body.locality || '',
      district: body.district || '',
      postalCode: body.postalCode || '',
      postalArea: body.postalArea || '',
      country: body.country || 'TZ',
      industry: body.industry || '',
      foundedYear: body.foundedYear || '',
      employeeCount: body.employeeCount || ''
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Company update error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to update company',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
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
    // Check for associated jobs before deleting
    const jobsResult = await DB.prepare(
      'SELECT COUNT(*) as count FROM jobs WHERE company_id = ?'
    ).bind(id).first();

    if (jobsResult && (jobsResult as any).count > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete company with existing jobs',
        details: `This company has ${(jobsResult as any).count} job(s) associated with it. Delete or reassign the jobs first.`
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    await DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      deleted: id,
      message: 'Company deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Company delete error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete company',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
