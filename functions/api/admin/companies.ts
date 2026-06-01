import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// GET /api/admin/companies
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare('SELECT * FROM companies ORDER BY name').all();
    
    const companies = result.results.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logo_url || '',
      url: c.website_url || ''
    }));

    return new Response(JSON.stringify(companies), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// POST /api/admin/companies
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const name = body.name?.trim();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Check for duplicate
    const existing = await DB.prepare(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER(?)'
    ).bind(name).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Company already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = 'comp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4);

    await DB.prepare(
      'INSERT INTO companies (id, name, logo_url, website_url) VALUES (?, ?, ?, ?)'
    ).bind(id, name, body.logoUrl || '', body.url || '').run();

    return new Response(JSON.stringify({
      id,
      name,
      logoUrl: body.logoUrl || '',
      url: body.url || ''
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Company creation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create company' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
