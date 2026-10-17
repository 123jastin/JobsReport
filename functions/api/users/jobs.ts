import { PagesFunction } from '@cloudflare/workers-types';
import { getUserFromRequest, jsonResponse } from '../../_lib/userAuth';

type Env = { DB: D1Database; USER_JWT_SECRET: string };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, USER_JWT_SECRET } = context.env;

  try {
    const payload = await getUserFromRequest(context.request, USER_JWT_SECRET);
    if (!payload) return jsonResponse({ error: 'Please log in' }, 401);

    const body: any = await context.request.json();

    // Validate required fields
    const title = String(body.title || '').trim();
    const company = String(body.company || '').trim();
    const role = String(body.role || '').trim();
    const expiresAt = String(body.expiresAt || '').trim();

    if (!title) return jsonResponse({ error: 'Job title is required' }, 400);
    if (!company) return jsonResponse({ error: 'Company is required' }, 400);
    if (!role) return jsonResponse({ error: 'Role is required' }, 400);
    if (!expiresAt) return jsonResponse({ error: 'Expiry date is required' }, 400);

    const expiryDate = new Date(expiresAt);
    if (!Number.isFinite(expiryDate.getTime()) || expiryDate < new Date()) {
      return jsonResponse({ error: 'Expiry date must be in the future' }, 400);
    }

    // Generate ID + slug
    const id = `job-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const slug = `${slugBase}-${id.split('-').pop()}`;

    // Get company ID if it exists
    const companyRow: any = await DB.prepare(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER(?)'
    ).bind(company).first();

    await DB.prepare(`
      INSERT INTO jobs (
        id, title, company_id, company_name, role, location, url, salary,
        description, active, expires_at, posted_at, user_id, slug,
        job_category, industry, employment_type, workplace_type,
        education_level, experience_months, skills, benefits,
        salary_min, salary_max, salary_currency,
        street_address, city, region, country, postcode,
        whatsapp_number, application_instructions, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      title,
      companyRow?.id || null,
      company,
      role,
      body.location || 'Remote',
      body.url || '',
      body.salary || 'Not Disclosed',
      body.description || '',
      expiryDate.toISOString(),
      new Date().toISOString(),
      payload.sub,          // ← author = logged-in user
      slug,
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
      body.street_address || '',
      body.city || '',
      body.region || '',
      body.country || 'Tanzania',
      body.postcode || '',
      body.whatsapp_number || '',
      body.application_instructions || '',
      JSON.stringify(body.images || [])
    ).run();

    return jsonResponse({
      success: true,
      id,
      slug,
      message: 'Job posted successfully',
    }, 201);
  } catch (err) {
    console.error('User job post error:', err);
    return jsonResponse({ error: 'Failed to post job' }, 500);
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
