import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// PUT /api/jobs/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const { id } = context.params;

  try {
    const body: any = await context.request.json();
    
    await DB.prepare('UPDATE jobs SET is_active = ? WHERE id = ?')
      .bind(body.active ? 1 : 0, id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/jobs/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const { id } = context.params;

  try {
    await DB.prepare('DELETE FROM jobs WHERE id = ?').bind(id).run();
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
