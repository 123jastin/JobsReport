import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// GET /api/companies - Used by HomePage, MarketPage, and other pages
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/companies - Used by AdminPage for creating companies
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
      return new Response(JSON.stringify({ error: `Company "${name}" already exists` }), {
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Company creation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create company' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/companies/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'companies') {
    return new Response(JSON.stringify({ error: 'No company ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
