import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const { results } = await DB.prepare(`
      SELECT 
        r.id,
        r.title,
        r.slug,
        r.content,
        r.month,
        r.year,
        r.updated_at,
        r.created_at,
        roles.name as role
      FROM reports r
      JOIN roles ON r.role_id = roles.id
      ORDER BY r.updated_at DESC
    `).all();

    const formatted = results.map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      role: r.role,
      excerpt: extractExcerpt(r.content),
      country: "Tanzania", // later make dynamic
      updatedAt: r.updated_at || r.created_at,
      monthYear: `${monthNames[r.month - 1]} ${r.year}`
    }));

    return new Response(JSON.stringify(formatted), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), {
      status: 500
    });
  }
};

function extractExcerpt(html: string) {
  const text = html.replace(/<[^>]*>?/gm, '');
  return text.substring(0, 120) + '...';
}
