import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const { token, country } = await context.request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete existing token if present (to update country)
    await DB.prepare('DELETE FROM push_subscribers WHERE token = ?').bind(token).run();

    // Insert with country
    await DB.prepare(
      'INSERT INTO push_subscribers (token, country) VALUES (?, ?)'
    ).bind(token, country || 'Worldwide').run();

    return new Response(JSON.stringify({ success: true, message: `Subscribed to ${country || 'Worldwide'} notifications` }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
