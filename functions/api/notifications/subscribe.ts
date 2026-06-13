import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const { token } = await context.request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if token already exists
    const existing = await DB.prepare(
      'SELECT id FROM push_subscribers WHERE token = ?'
    ).bind(token).first();

    if (!existing) {
      await DB.prepare(
        'INSERT INTO push_subscribers (token) VALUES (?)'
      ).bind(token).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Subscribed to notifications' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
