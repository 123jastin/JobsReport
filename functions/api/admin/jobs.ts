import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, MEDIA_BUCKET } = context.env;

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

    // ✅ SAVE JOB IMAGES - Upload base64 to R2, save URLs to DB
    const savedImages: any[] = [];
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      console.log(`Processing ${body.images.length} images for job ${id}`);
      
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        const imageId = 'img-' + Date.now().toString(36) + '-' + i;
        
        let originalUrl = img.url;
        let thumbnailUrl = img.thumbnail || img.url;
        
        // Upload original to R2 if it's base64
        if (img.url && img.url.startsWith('data:image')) {
          try {
            const base64Data = img.url.split(',')[1] || img.url;
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const filename = `job-original-${Date.now()}-${i}.webp`;
            await MEDIA_BUCKET.put(filename, binaryData, {
              httpMetadata: { contentType: 'image/webp' }
            });
            originalUrl = `https://media.jobsreport.online/${filename}`;
            console.log(`Uploaded original to R2: ${filename}`);
          } catch (r2Err) {
            console.error('R2 original upload failed:', r2Err);
          }
        }
        
        // Upload thumbnail to R2 if it's base64
        if (img.thumbnail && img.thumbnail.startsWith('data:image')) {
          try {
            const thumbData = img.thumbnail.split(',')[1] || img.thumbnail;
            const thumbBinary = Uint8Array.from(atob(thumbData), c => c.charCodeAt(0));
            const thumbFilename = `job-thumb-${Date.now()}-${i}.webp`;
            await MEDIA_BUCKET.put(thumbFilename, thumbBinary, {
              httpMetadata: { contentType: 'image/webp' }
            });
            thumbnailUrl = `https://media.jobsreport.online/${thumbFilename}`;
            console.log(`Uploaded thumbnail to R2: ${thumbFilename}`);
          } catch (r2Err) {
            console.error('R2 thumbnail upload failed:', r2Err);
          }
        }
        
        // Save to database
        try {
          await DB.prepare(`
            INSERT INTO job_images (id, job_id, url, thumbnail_url, name, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(imageId, id, originalUrl, thumbnailUrl, img.name, i).run();
          
          savedImages.push({ url: originalUrl, thumbnail: thumbnailUrl, name: img.name });
          console.log(`Saved image ${i + 1} to DB: ${img.name}`);
        } catch (dbErr) {
          console.error(`Failed to save image ${i}:`, dbErr);
        }
      }
    }

    const createdJob = {
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
    };

    return new Response(JSON.stringify(createdJob), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Job creation error:', err);
    return new Response(JSON.stringify({ 
      message: 'Failed to create job',
      error: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
