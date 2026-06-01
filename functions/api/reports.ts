import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// GET /api/reports
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const { results } = await DB.prepare(`
      SELECT r.*, roles.name as role 
      FROM reports r 
      JOIN roles ON r.role_id = roles.id 
      ORDER BY r.updated_at DESC
    `).all();

    const formatted = results.map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      role: r.role,
      excerpt: r.content ? extractExcerpt(r.content) : '',
      content: r.content,
      country: r.country || "Tanzania",
      updatedAt: r.updated_at || r.created_at,
      monthYear: r.month && r.year ? `${monthNames[r.month - 1]} ${r.year}` : 'Unknown'
    }));

    return new Response(JSON.stringify(formatted), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Reports API Error:', err);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/reports
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    
    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    
    const id = 'report-' + Date.now().toString(36);

    // Find or create role
    let roleResult = await DB.prepare('SELECT id FROM roles WHERE LOWER(name) = LOWER(?)')
      .bind(body.role?.trim())
      .first();
    
    if (!roleResult) {
      const roleId = 'role-' + Date.now().toString(36);
      await DB.prepare('INSERT INTO roles (id, name) VALUES (?, ?)')
        .bind(roleId, body.role?.trim())
        .run();
      roleResult = { id: roleId };
    }

    // Parse month and year from monthYear string (e.g., "June 2026")
    const monthYearParts = body.monthYear?.split(' ') || [];
    const month = monthNames.indexOf(monthYearParts[0]) + 1 || 6;
    const year = parseInt(monthYearParts[1]) || new Date().getFullYear();
    const now = new Date().toISOString();

    await DB.prepare(`
      INSERT INTO reports (id, role_id, title, slug, content, month, year, country, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      roleResult.id,
      body.title?.trim(),
      slug,
      body.content || '',
      month,
      year,
      body.country || 'Tanzania',
      now,
      now
    ).run();

    return new Response(JSON.stringify({
      id,
      title: body.title,
      slug,
      role: body.role,
      excerpt: body.excerpt || extractExcerpt(body.content),
      content: body.content,
      monthYear: body.monthYear,
      country: body.country || 'Tanzania',
      updatedAt: now
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Report creation error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to create report',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function extractExcerpt(html: string) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>?/gm, '');
  return text.substring(0, 120) + '...';
}
