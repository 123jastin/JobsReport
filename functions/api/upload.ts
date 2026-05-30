import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

// POST /api/upload
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, MEDIA_BUCKET } = context.env;

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('altText') as string || '';
    const name = formData.get('name') as string || file?.name || 'unnamed-image';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${timestamp}-${randomString}.${extension}`;
    const id = `media-${timestamp}-${randomString}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await MEDIA_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        altText: altText,
        uploadedAt: new Date().toISOString()
      }
    });

    // Generate public URL
    const publicUrl = `https://media.jobsreport.online/${filename}`;

    // Calculate file size
    const sizeInKB = Math.round(file.size / 1024);
    const size = sizeInKB > 1024 ? `${Math.round(sizeInKB / 1024)}MB` : `${sizeInKB}KB`;

    // Save metadata to D1
    await DB.prepare(`
      INSERT INTO media (id, name, type, url, size, alt_text, storage_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'r2', ?)
    `).bind(
      id,
      name,
      file.type,
      publicUrl,
      size,
      altText || name,
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      id,
      name,
      type: file.type,
      dataUrl: publicUrl,
      url: publicUrl,
      size,
      altText: altText || name,
      storageType: 'r2',
      uploadedAt: new Date().toISOString().split('T')[0]
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('Upload Error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload file',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// GET /api/upload
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare(`
      SELECT * FROM media 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();

    const media = result.results.map((m: any) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      dataUrl: m.url,
      url: m.url,
      size: m.size,
      altText: m.alt_text,
      storageType: m.storage_type,
      uploadedAt: m.created_at?.split('T')[0] || 'Unknown'
    }));

    return new Response(JSON.stringify(media), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// DELETE /api/upload/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, MEDIA_BUCKET } = context.env;
  const url = new URL(context.request.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return new Response(JSON.stringify({ error: 'No media ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const media = await DB.prepare('SELECT * FROM media WHERE id = ?').bind(id).first();
    
    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from R2
    const filename = media.url.split('/').pop();
    if (filename) {
      await MEDIA_BUCKET.delete(filename);
    }

    // Delete from D1
    await DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to delete media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// CORS OPTIONS
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
};
