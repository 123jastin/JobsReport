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

    // ─── Resolve company_id (create if missing) ───
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

    // ─── Resolve role_id (create if missing) ───
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

    // ─── Build apply URL ───
    let applyUrl = '';
    let whatsapp_number = '';
    let application_instructions = '';

    const appType = String(body.applicationType || 'url');
    const appValue = String(body.applicationValue || body.url || '');

    if (appType === 'url') applyUrl = appValue;
    else if (appType === 'email') applyUrl = appValue.startsWith('mailto:') ? appValue : `mailto:${appValue}`;
    else if (appType === 'whatsapp') whatsapp_number = appValue;
    else if (appType === 'instructions') application_instructions = appValue;

    // apply_url is NOT NULL — fall back to a placeholder if empty
    if (!applyUrl) applyUrl = `https://jobsreport.online/contact-us`;

    // ─── Generate id + hash (hash is UNIQUE) ───
    const id = `job-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const hash = `job-${id}-${Date.now()}`;

    // ─── Insert job ───
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
      payload.sub          // ← user_id (the poster)
    ).run();

    // ─── Notify Google (fire-and-forget) ───
    try {
      const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const jobUrl = `https://jobsreport.online/market/${slugBase}-${id}`;
      context.waitUntil(
        fetch('https://jobsreport.online/api/test-indexing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: jobUrl }),
        }).catch(() => {})
      );
    } catch {}

    return jsonResponse({
      success: true,
      id,
      message: 'Job posted successfully',
    }, 201);
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
