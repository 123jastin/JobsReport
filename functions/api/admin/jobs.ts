import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// POST - Create job
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
        .bind(companyId, body.company?.trim(), '', body.url || '')
        .run();
      companyResult = { id: companyId };
    }

    // Insert job
    await DB.prepare(`
      INSERT INTO jobs (id, title, role_id, company_id, location, apply_url, salary, posted_at, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      id,
      body.title?.trim(),
      roleResult.id,
      companyResult.id,
      body.location || 'Remote',
      body.url || '',
      body.salary || '',
      new Date().toISOString().split('T')[0],
      body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ).run();

    // Save images
    const savedImages: any[] = [];
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        const imageId = 'img-' + Date.now().toString(36) + '-' + i + '-' + Math.random().toString(36).substring(2, 4);
        
        try {
          await DB.prepare(`
            INSERT INTO job_images (id, job_id, url, thumbnail_url, name, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(imageId, id, img.url || '', img.thumbnail || img.url || '', img.name || 'image', i).run();
          
          savedImages.push({ url: img.url, thumbnail: img.thumbnail || img.url, name: img.name });
        } catch (dbErr) {
          console.error(`Failed to save image ${i}:`, dbErr);
        }
      }
    }

    return new Response(JSON.stringify({
      id,
      title: body.title?.trim(),
      role: body.role?.trim(),
      company: body.company?.trim(),
      location: body.location || 'Remote',
      url: body.url || '',
      salary: body.salary || '',
      postedAt: new Date().toISOString().split('T')[0],
      expiresAt: body.expiresAt || '',
      active: true,
      images: savedImages
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Job creation error:', err);
    return new Response(JSON.stringify({ message: 'Failed to create job' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
        .bind(companyId, body.company?.trim(), '', body.url || '')
        .run();
      companyResult = { id: companyId };
    }

    // Update job
    await DB.prepare(`
      UPDATE jobs 
      SET title = ?, role_id = ?, company_id = ?, location = ?, apply_url = ?, salary = ?, expires_at = ?
      WHERE id = ?
    `).bind(
      body.title?.trim(),
      roleResult.id,
      companyResult.id,
      body.location || 'Remote',
      body.url || '',
      body.salary || '',
      body.expiresAt || '',
      id
    ).run();

    // ✅ Delete old images, then save new ones
    await DB.prepare('DELETE FROM job_images WHERE job_id = ?').bind(id).run();

    const savedImages: any[] = [];
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        const imageId = 'img-' + Date.now().toString(36) + '-' + i;
        await DB.prepare(`
          INSERT INTO job_images (id, job_id, url, thumbnail_url, name, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(imageId, id, img.url || '', img.thumbnail || img.url || '', img.name || 'image', i).run();
        savedImages.push({ url: img.url, thumbnail: img.thumbnail || img.url, name: img.name });
      }
    }

    return new Response(JSON.stringify({
      id,
      title: body.title?.trim(),
      role: body.role?.trim(),
      company: body.company?.trim(),
      location: body.location || 'Remote',
      url: body.url || '',
      salary: body.salary || '',
      postedAt: new Date().toISOString().split('T')[0],
      expiresAt: body.expiresAt || '',
      active: true,
      images: savedImages
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Job update error:', err);
    return new Response(JSON.stringify({ message: 'Failed to update job' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// DELETE - Delete job (and its images)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    // ✅ Delete images first (foreign key)
    await DB.prepare('DELETE FROM job_images WHERE job_id = ?').bind(id).run();
    
    // Then delete job
    await DB.prepare('DELETE FROM jobs WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Job delete error:', err);
    return new Response(JSON.stringify({ message: 'Failed to delete job' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
