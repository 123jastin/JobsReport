import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const body: any = await context.request.json();

    const title = String(body.title || '').trim();
    const companyName = String(body.company || '').trim();
    const roleTitle = String(body.role || '').trim();
    const expiresAt = String(body.expiresAt || '').trim();

    if (!title) return jsonResponse({ error: 'Job title is required' }, 400);
    if (!companyName) return jsonResponse({ error: 'Company is required' }, 400);
    if (!roleTitle) return jsonResponse({ error: 'Role is required' }, 400);
    if (!expiresAt) return jsonResponse({ error: 'Expiry date is required' }, 400);

    const expiryDate = new Date(expiresAt);
    if (!Number.isFinite(expiryDate.getTime()) || expiryDate < new Date()) {
      return jsonResponse({ error: 'Expiry date must be in the future' }, 400);
    }

    // Resolve company_id (create if missing)
    let companyId: string;
    const existingCompany: any = await DB.prepare(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER(?)'
    ).bind(companyName).first();

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      companyId = `comp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      await DB.prepare(`
        INSERT INTO companies (id, name, country, created_at)
        VALUES (?, ?, 'TZ', datetime('now'))
      `).bind(companyId, companyName).run();
    }

    // Resolve role_id (create if missing)
    let roleId: string;
    const existingRole: any = await DB.prepare(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER(?)'
    ).bind(roleTitle).first();

    if (existingRole) {
      roleId = existingRole.id;
    } else {
      roleId = `role-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const roleSlug = roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await DB.prepare(`
        INSERT INTO roles (id, name, slug, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(roleId, roleTitle, roleSlug).run();
    }

    // Application
    let applyUrl = '';
    let whatsapp_number = '';
    let application_instructions = '';
    const appType = String(body.applicationType || 'url');
    const appValue = String(body.applicationValue || body.url || '');

    if (appType === 'url') applyUrl = appValue;
    else if (appType === 'email') applyUrl = appValue.startsWith('mailto:') ? appValue : `mailto:${appValue}`;
    else if (appType === 'whatsapp') {
      whatsapp_number = appValue;
      applyUrl = `https://wa.me/${appValue.replace(/[^0-9]/g, '')}`;
    } else if (appType === 'instructions') {
      application_instructions = appValue;
      applyUrl = 'https://jobsreport.online/contact-us';
    }
    if (!applyUrl) applyUrl = 'https://jobsreport.online/contact-us';

    const id = `job-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const hash = `job-${id}-${Date.now()}`;

    // ── INSERT with user_id = payload.sub ──
    await DB.prepare(`
      INSERT INTO jobs (
        id, title, role_id, company_id, location, apply_url, salary,
        posted_at, expires_at, is_active, hash, description,
        job_category, industry, employment_type, workplace_type,
        education_level, experience_months, skills, benefits,
        salary_min, salary_max, salary_currency, city, region, postcode,
        canonical_url, street_address, country,
        whatsapp_number, application_instructions, user_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        datetime('now'), ?, 1, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `).bind(
      id,
      title,
      roleId,
      companyId,
      body.location || 'Remote',
      applyUrl,
      body.salary || 'Not Disclosed',
      expiryDate.toISOString(),
      hash,
      body.description || '',
      body.job_category || 'Other',
      body.industry || '',
      body.employment_type || 'FULL_TIME',
      body.workplace_type || 'Onsite',
      body.education_level || 'Any',
      Number(body.experience_months) || 0,
      JSON.stringify(body.skills || []),
      JSON.stringify(body.benefits || []),
      body.salary_min || null,
      body.salary_max || null,
      body.salary_currency || 'TZS',
      body.city || '',
      body.region || '',
      body.postcode || '',
      body.canonical_url || '',
      body.street_address || '',
      body.country || 'Tanzania',
      whatsapp_number,
      application_instructions,
      payload.sub
    ).run();

    // ─────────────────────────────────────────────
    // 🔔 FAN OUT NOTIFICATIONS TO FOLLOWERS
    // Non-blocking: failures here don't fail the job creation
    // ─────────────────────────────────────────────
    try {
      const titleSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const jobLink = `/market/${titleSlug}-${id}`;

      // Fetch followers of the posting user
      const followersRes: any = await DB.prepare(
        'SELECT follower_id FROM follows WHERE following_id = ?'
      ).bind(payload.sub).all();

      const followerIds = (followersRes.results || [])
        .map((r: any) => r.follower_id)
        .filter((uid: string) => uid && uid !== payload.sub); // exclude self

      if (followerIds.length > 0) {
        const now = new Date().toISOString();
        const notifTitle = `posted a new job: ${title}`;
        const notifBody = companyName;

        const stmts = followerIds.map((uid: string) => {
          const notifId = `notif-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
          return DB.prepare(`
            INSERT INTO notifications (
              id, user_id, actor_id, type, title, body, link, image_url,
              entity_type, entity_id, is_read, created_at
            ) VALUES (?, ?, ?, 'job_created', ?, ?, ?, NULL, 'job', ?, 0, ?)
          `).bind(
            notifId,
            uid,
            payload.sub,
            notifTitle,
            notifBody,
            jobLink,
            id,
            now
          );
        });

        await DB.batch(stmts);
        console.log(`[jobs] Fan-out notifications sent to ${followerIds.length} followers`);
      }
    } catch (notifErr) {
      // Log but don't fail the job creation
      console.warn('[jobs] Notification fan-out failed:', notifErr);
    }

    return jsonResponse({ success: true, id }, 201);
  } catch (err: any) {
    console.error('User job post error:', err);
    return jsonResponse({
      error: 'Failed to post job',
      details: err?.message || String(err),
    }, 500);
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
