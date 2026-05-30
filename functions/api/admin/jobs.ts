import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const id = 'job-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Find or create role
    let roleResult = await DB.prepare('SELECT id FROM roles WHERE name = ?').bind(body.role).first();
    if (!roleResult) {
      const roleId = 'role-' + Date.now().toString(36);
      await DB.prepare('INSERT INTO roles (id, name) VALUES (?, ?)').bind(roleId, body.role).run();
      roleResult = { id: roleId };
    }

    // Find or create company
    let companyResult = await DB.prepare('SELECT id FROM companies WHERE name = ?').bind(body.company).first();
    if (!companyResult) {
      const companyId = 'comp-' + Date.now().toString(36);
      await DB.prepare('INSERT INTO companies (id, name, logo_url, website_url) VALUES (?, ?, ?, ?)')
        .bind(companyId, body.company, '', body.url || '')
        .run();
      companyResult = { id: companyId };
    }

    await DB.prepare(`
      INSERT INTO jobs (id, title, role_id, company_id, location, apply_url, salary, posted_at, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      id,
      body.title,
      roleResult.id,
      companyResult.id,
      body.location || 'Remote',
      body.url || '',
      body.salary || '',
      new Date().toISOString().split('T')[0],
      body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ).run();

    return new Response(JSON.stringify({
      id,
      title: body.title,
      role: body.role,
      company: body.company,
      location: body.location,
      url: body.url,
      salary: body.salary,
      postedAt: new Date().toISOString().split('T')[0],
      expiresAt: body.expiresAt,
      active: true
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Job creation error:', err);
    return new Response(JSON.stringify({ 
      message: 'Failed to create job',
      error: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
