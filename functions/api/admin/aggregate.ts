import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const countResult = await DB.prepare('SELECT COUNT(*) as count FROM jobs').first();
    const originalCount = countResult?.count || 0;

    // Deduplication logic
    await DB.prepare(`
      DELETE FROM jobs WHERE id IN (
        SELECT j1.id FROM jobs j1
        INNER JOIN jobs j2 ON 
          j1.title = j2.title AND 
          j1.company_id = j2.company_id AND 
          j1.location = j2.location
        WHERE j1.posted_at < j2.posted_at
      )
    `).run();

    const dedupeResult = await DB.prepare('SELECT COUNT(*) as count FROM jobs').first();
    const deduplicatedCount = dedupeResult?.count || 0;

    return new Response(JSON.stringify({
      originalCount,
      deduplicatedCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ 
      originalCount: 0, 
      deduplicatedCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
