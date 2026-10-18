import { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

// Called by a cron trigger
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // 1. Count jobs posted in the last 24 hours
    const countRes: any = await DB.prepare(`
      SELECT COUNT(*) as c FROM jobs
      WHERE is_active = 1
        AND created_at >= datetime('now', '-1 day')
    `).first();

    const jobCount = countRes?.c || 0;
    if (jobCount === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, jobs: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Get all users
    const usersRes: any = await DB.prepare('SELECT id FROM users').all();
    const userIds = (usersRes.results || []).map((u: any) => u.id);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, jobs: jobCount }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Build notification for each user
    const now = new Date().toISOString();
    const title = `${jobCount} new job${jobCount !== 1 ? 's' : ''} available today`;
    const body = `Check out the latest opportunities on JobsReport`;
    const link = 'https://jobsreport.online/market';

    const stmts = userIds.map((uid: string) => {
      const notifId = `notif-daily-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      return DB.prepare(`
        INSERT INTO notifications (
          id, user_id, actor_id, type, title, body, link, image_url,
          entity_type, entity_id, is_read, created_at
        ) VALUES (?, ?, NULL, 'job_daily', ?, ?, ?, NULL, 'job', NULL, 0, ?)
      `).bind(notifId, uid, title, body, link, now);
    });

    await DB.batch(stmts);

    return new Response(JSON.stringify({ success: true, sent: stmts.length, jobs: jobCount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
