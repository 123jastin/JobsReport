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
    
    const slug = body.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    await DB.prepare('INSERT INTO roles (id, name, slug) VALUES (?, ?, ?)')
      .bind(id, body.title, slug)
      .run();

    return new Response(JSON.stringify({
      id,
      title: body.title,
      slug,
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

// 🔥 ADD THIS - DELETE handler
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  
  // Extract ID from URL: /api/admin/roles/{id}
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    if (!id || id === 'roles') {
      return new Response(JSON.stringify({ error: 'Role ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if role exists
    const existing = await DB.prepare('SELECT id FROM roles WHERE id = ?').bind(id).first();
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Role not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if any jobs are using this role
    const jobsUsing = await DB.prepare('SELECT COUNT(*) as count FROM jobs WHERE role_id = ?').bind(id).first();
    
    if (jobsUsing && (jobsUsing as any).count > 0) {
      return new Response(JSON.stringify({ 
        error: `Cannot delete role. ${(jobsUsing as any).count} job(s) are using this role. Reassign them first.` 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the role
    await DB.prepare('DELETE FROM roles WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, message: 'Role deleted successfully' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to delete role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
