import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// GET /api/locations - List all locations
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare(
      'SELECT * FROM locations ORDER BY name'
    ).all();
    
    return new Response(JSON.stringify(result.results), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/locations - Add new location
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const id = 'loc-' + Date.now().toString(36);

    await DB.prepare(
      'INSERT INTO locations (id, name, region, country, postcode) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, body.name, body.region || '', body.country || 'Tanzania', body.postcode || '').run();

    return new Response(JSON.stringify({ id, ...body }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to add location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
