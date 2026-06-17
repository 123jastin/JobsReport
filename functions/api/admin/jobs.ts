import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// POST - Create job with full schema
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    
    console.log('Creating job:', body.title);

    const id = 'job-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

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

    // Find or create company
    let companyResult = await DB.prepare('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)')
      .bind(body.company?.trim())
      .first();
    
    if (!companyResult) {
      const companyId = 'comp-' + Date.now().toString(36);
      await DB.prepare('INSERT INTO companies (id, name, logo_url, website) VALUES (?, ?, ?, ?)')
        .bind(companyId, body.company?.trim(), body.logoUrl || '', body.url || '')
        .run();
      companyResult = { id: companyId };
    }

    // Save location
    const locationName = body.city?.trim() || body.location?.trim() || '';
    if (locationName && locationName !== 'Remote') {
      const locationId = 'loc-' + id;
      await DB.prepare(
        `INSERT OR REPLACE INTO locations (id, name, region, country, postcode, street_address) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(locationId, locationName, body.region?.trim() || '', body.country?.trim() || 'Tanzania', body.postcode?.trim() || '', body.street_address?.trim() || '').run();
      console.log(`📍 Location saved for job ${id}: ${locationName}`);
    }

    const canonicalUrl = body.canonical_url || 
      `https://jobsreport.online/market/${body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${id}`;

    // Insert job (29 columns - added whatsapp_number + application_instructions)
    await DB.prepare(`
      INSERT INTO jobs (
        id, title, role_id, company_id, location, apply_url, salary,
        posted_at, expires_at, is_active, description,
        job_category, industry, employment_type, workplace_type,
        education_level, experience_months, skills, benefits,
        salary_min, salary_max, salary_currency,
        street_address, city, region, postcode, canonical_url,
        whatsapp_number, application_instructions
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.title?.trim(), roleResult.id, companyResult.id,
      body.location || 'Remote', body.url || '', body.salary || '',
      new Date().toISOString().split('T')[0],
      body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      body.is_active !== undefined ? body.is_active : 1,
      body.description || '',
      body.job_category || 'Other', body.industry || '',
      body.employment_type || 'FULL_TIME', body.workplace_type || 'Onsite',
      body.education_level || 'Any', body.experience_months || 0,
      JSON.stringify(body.skills || []), JSON.stringify(body.benefits || []),
      body.salary_min || null, body.salary_max || null,
      body.salary_currency || 'TZS',
      body.street_address || '', body.city || '', body.region || '',
      body.postcode || '', canonicalUrl,
      body.whatsapp_number || '', body.application_instructions || ''
    ).run();

    // Save files
    const savedFiles: any[] = [];
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      for (let i = 0; i < body.images.length; i++) {
        const file = body.images[i];
        const imageId = 'img-' + Date.now().toString(36) + '-' + i + '-' + Math.random().toString(36).substring(2, 4);
        const fileType = file.type || 'image';
        try {
          await DB.prepare(`
            INSERT INTO job_images (id, job_id, url, thumbnail_url, name, sort_order, type, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(imageId, id, file.url || '', file.thumbnail || file.url || '', file.name || 'file', i, fileType, file.seoTitle || file.name || '', file.seoDescription || '').run();
          savedFiles.push({ url: file.url, thumbnail: file.thumbnail || file.url, name: file.name, type: fileType, seoTitle: file.seoTitle, seoDescription: file.seoDescription });
        } catch (dbErr) { console.error(`Failed to save file ${i}:`, dbErr); }
      }
    }

    return new Response(JSON.stringify({
      id, title: body.title?.trim(), role: body.role?.trim(), company: body.company?.trim(),
      location: body.location || 'Remote', url: body.url || '', salary: body.salary || '',
      description: body.description || '',
      job_category: body.job_category || 'Other', employment_type: body.employment_type || 'FULL_TIME',
      workplace_type: body.workplace_type || 'Onsite', education_level: body.education_level || 'Any',
      experience_months: body.experience_months || 0,
      skills: body.skills || [], benefits: body.benefits || [],
      salary_min: body.salary_min || null, salary_max: body.salary_max || null,
      salary_currency: body.salary_currency || 'TZS',
      street_address: body.street_address || '',
      city: body.city || '', region: body.region || '',
      country: body.country || 'Tanzania', postcode: body.postcode || '',
      canonical_url: canonicalUrl,
      whatsapp_number: body.whatsapp_number || '',
      application_instructions: body.application_instructions || '',
      postedAt: new Date().toISOString().split('T')[0], expiresAt: body.expiresAt || '',
      active: body.is_active !== undefined ? body.is_active === 1 : true,
      images: savedFiles
    }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    console.error('Job creation error:', err);
    return new Response(JSON.stringify({ message: 'Failed to create job', error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// PUT - Update job
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    const body: any = await context.request.json();

    let roleResult = await DB.prepare('SELECT id FROM roles WHERE LOWER(name) = LOWER(?)').bind(body.role?.trim()).first();
    if (!roleResult) {
      const roleId = 'role-' + Date.now().toString(36);
      await DB.prepare('INSERT INTO roles (id, name) VALUES (?, ?)').bind(roleId, body.role?.trim()).run();
      roleResult = { id: roleId };
    }

    let companyResult = await DB.prepare('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)').bind(body.company?.trim()).first();
    if (!companyResult) {
      const companyId = 'comp-' + Date.now().toString(36);
      await DB.prepare('INSERT INTO companies (id, name, logo_url, website) VALUES (?, ?, ?, ?)').bind(companyId, body.company?.trim(), body.logoUrl || '', body.url || '').run();
      companyResult = { id: companyId };
    }

    const locationName = body.city?.trim() || body.location?.trim() || '';
    if (locationName && locationName !== 'Remote') {
      const locationId = 'loc-' + id;
      await DB.prepare(
        `INSERT OR REPLACE INTO locations (id, name, region, country, postcode, street_address) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(locationId, locationName, body.region?.trim() || '', body.country?.trim() || 'Tanzania', body.postcode?.trim() || '', body.street_address?.trim() || '').run();
      console.log(`📍 Location updated for job ${id}: ${locationName}`);
    }

    await DB.prepare(`
      UPDATE jobs SET 
        title = ?, role_id = ?, company_id = ?, location = ?, apply_url = ?, salary = ?,
        expires_at = ?, is_active = ?, description = ?,
        job_category = ?, industry = ?, employment_type = ?, workplace_type = ?,
        education_level = ?, experience_months = ?, skills = ?, benefits = ?,
        salary_min = ?, salary_max = ?, salary_currency = ?,
        street_address = ?, city = ?, region = ?, postcode = ?, canonical_url = ?,
        whatsapp_number = ?, application_instructions = ?
      WHERE id = ?
    `).bind(
      body.title?.trim(), roleResult.id, companyResult.id,
      body.location || 'Remote', body.url || '', body.salary || '',
      body.expiresAt || '', body.is_active !== undefined ? body.is_active : 1,
      body.description || '',
      body.job_category || 'Other', body.industry || '',
      body.employment_type || 'FULL_TIME', body.workplace_type || 'Onsite',
      body.education_level || 'Any', body.experience_months || 0,
      JSON.stringify(body.skills || []), JSON.stringify(body.benefits || []),
      body.salary_min || null, body.salary_max || null,
      body.salary_currency || 'TZS',
      body.street_address || '', body.city || '', body.region || '',
      body.postcode || '', body.canonical_url || '',
      body.whatsapp_number || '', body.application_instructions || '',
      id
    ).run();

    await DB.prepare('DELETE FROM job_images WHERE job_id = ?').bind(id).run();
    const savedFiles: any[] = [];
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      for (let i = 0; i < body.images.length; i++) {
        const file = body.images[i];
        const imageId = 'img-' + Date.now().toString(36) + '-' + i;
        await DB.prepare(`INSERT INTO job_images (id, job_id, url, thumbnail_url, name, sort_order, type, seo_title, seo_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(imageId, id, file.url || '', file.thumbnail || file.url || '', file.name || 'file', i, file.type || 'image', file.seoTitle || file.name || '', file.seoDescription || '').run();
        savedFiles.push({ url: file.url, thumbnail: file.thumbnail || file.url, name: file.name, type: file.type || 'image' });
      }
    }

    return new Response(JSON.stringify({
      id, title: body.title?.trim(), role: body.role?.trim(), company: body.company?.trim(),
      location: body.location || 'Remote', url: body.url || '', salary: body.salary || '',
      description: body.description || '',
      job_category: body.job_category || 'Other', employment_type: body.employment_type || 'FULL_TIME',
      workplace_type: body.workplace_type || 'Onsite', education_level: body.education_level || 'Any',
      experience_months: body.experience_months || 0,
      skills: body.skills || [], benefits: body.benefits || [],
      salary_min: body.salary_min || null, salary_max: body.salary_max || null,
      salary_currency: body.salary_currency || 'TZS',
      street_address: body.street_address || '',
      city: body.city || '', region: body.region || '',
      postcode: body.postcode || '', canonical_url: body.canonical_url || '',
      whatsapp_number: body.whatsapp_number || '',
      application_instructions: body.application_instructions || '',
      postedAt: new Date().toISOString().split('T')[0], expiresAt: body.expiresAt || '',
      active: body.is_active !== undefined ? body.is_active === 1 : true, images: savedFiles
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    console.error('Job update error:', err);
    return new Response(JSON.stringify({ message: 'Failed to update job' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// DELETE
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  try {
    await DB.prepare('DELETE FROM locations WHERE id = ?').bind('loc-' + id).run();
    await DB.prepare('DELETE FROM job_images WHERE job_id = ?').bind(id).run();
    await DB.prepare('DELETE FROM jobs WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Failed to delete job' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
};
