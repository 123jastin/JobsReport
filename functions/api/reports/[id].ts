import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// GET /api/reports/:id (single report)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const slug = pathParts[pathParts.length - 1];

  try {
    const result = await DB.prepare(`
      SELECT r.*, roles.name as role 
      FROM reports r 
      JOIN roles ON r.role_id = roles.id 
      WHERE r.slug = ? OR r.id = ?
    `).bind(slug, slug).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const report = {
      id: result.id,
      title: result.title,
      slug: result.slug,
      role: result.role,
      excerpt: result.content ? extractExcerpt(result.content) : '',
      content: result.content,
      country: result.country || 'Tanzania',
      updatedAt: result.updated_at || result.created_at,
      monthYear: result.month && result.year ? `${monthNames[result.month - 1]} ${result.year}` : 'Unknown'
    };

    return new Response(JSON.stringify(report), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/reports/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    const body: any = await context.request.json();

    // Parse month and year
    const monthYearParts = body.monthYear?.split(' ') || [];
    const month = monthNames.indexOf(monthYearParts[0]) + 1 || 6;
    const year = parseInt(monthYearParts[1]) || new Date().getFullYear();
    const now = new Date().toISOString();

    await DB.prepare(`
      UPDATE reports 
      SET title = ?, content = ?, month = ?, year = ?, country = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.title?.trim(),
      body.content || '',
      month,
      year,
      body.country || 'Tanzania',
      now,
      id
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/reports/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    await DB.prepare('DELETE FROM reports WHERE id = ?').bind(id).run();
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

function extractExcerpt(html: string) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>?/gm, '');
  return text.substring(0, 120) + '...';
}
