import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// GET /api/companies
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare('SELECT * FROM companies ORDER BY name').all();
    
    const companies = result.results.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logo_url,
      url: c.website_url || ''
    }));

    return new Response(JSON.stringify(companies), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/companies
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const id = 'comp-' + Date.now().toString(36);

    await DB.prepare('INSERT INTO companies (id, name, logo_url) VALUES (?, ?, ?)')
      .bind(id, body.name, body.logoUrl || '')
      .run();

    return new Response(JSON.stringify({
      id,
      name: body.name,
      logoUrl: body.logoUrl,
      url: body.url || ''
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create company' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
