import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare('SELECT * FROM roles ORDER BY name').all();
    
    const roles = result.results.map((r: any) => ({
      id: r.id,
      title: r.name,
      mappedTitles: [r.name.toLowerCase()],
      growth: 15
    }));

    return new Response(JSON.stringify(roles), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const id = 'role-' + Date.now().toString(36);

    await DB.prepare('INSERT INTO roles (id, name) VALUES (?, ?)')
      .bind(id, body.title)
      .run();

    return new Response(JSON.stringify({
      id,
      title: body.title,
      mappedTitles: body.mappedTitles || [body.title.toLowerCase()],
      growth: body.growth || 15
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
