import { PagesFunction } from '@cloudflare/workers-types';
import { jsonResponse } from '../../../_lib/userAuth';

type Env = { DB: D1Database };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const parts = new URL(context.request.url).pathname.split('/').filter(Boolean);
    // /api/stories/:id/view → ['api','stories',':id','view']
    const id = parts[parts.length - 2];
    if (!id) return jsonResponse({ error: 'Missing story id' }, 400);

    const story: any = await DB.prepare(
      'SELECT id FROM stories WHERE id = ? OR slug = ?'
    ).bind(id, id).first();
    if (!story) return jsonResponse({ error: 'Story not found' }, 404);

    await DB.prepare('UPDATE stories SET views_count = views_count + 1 WHERE id = ?')
      .bind(story.id).run();

    const updated: any = await DB.prepare('SELECT views_count FROM stories WHERE id = ?')
      .bind(story.id).first();

    return jsonResponse({ success: true, views_count: updated?.views_count || 0 });
  } catch (err) {
    console.error('View error:', err);
    return jsonResponse({ error: 'Failed to record view' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
