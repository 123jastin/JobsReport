import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const id = context.params.id as string;

  try {
    if (!id) {
      return new Response(JSON.stringify({ error: 'Role ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if role exists
    const existing = await DB.prepare('SELECT id, name FROM roles WHERE id = ?').bind(id).first();
    
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
        error: `Cannot delete "${(existing as any).name}". ${(jobsUsing as any).count} job(s) are using this role.` 
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
