import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

// POST /api/upload - Upload image (with optional separate thumbnail)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, MEDIA_BUCKET } = context.env;

  try {
    const contentType = context.request.headers.get('content-type') || '';

    // ──────────────────────────────────────────────────────────
    // Multipart form-data (real files, plus optional thumbnail)
    // ──────────────────────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await context.request.formData();
      const file = formData.get('file') as File | null;
      const thumbnail = formData.get('thumbnail') as File | null;

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const altText = (formData.get('altText') as string) || '';
      const name = (formData.get('name') as string) || file.name;

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'png';
      const filename = `${timestamp}-${randomString}.${extension}`;
      const id = `media-${timestamp}-${randomString}`;

      // ── Upload original ──
      const arrayBuffer = await file.arrayBuffer();
      await MEDIA_BUCKET.put(filename, arrayBuffer, {
        httpMetadata: { contentType: file.type },
      });
      const publicUrl = `https://media.jobsreport.online/${filename}`;
      const sizeInKB = Math.round(file.size / 1024);
      const size = sizeInKB > 1024 ? `${Math.round(sizeInKB / 1024)}MB` : `${sizeInKB}KB`;

      // ── Upload thumbnail (if provided) ──
      let thumbnailUrl: string | null = null;
      let thumbSize: string | null = null;
      if (thumbnail) {
        const thumbExt = thumbnail.type.includes('webp')
          ? 'webp'
          : thumbnail.type.includes('png')
          ? 'png'
          : thumbnail.name.split('.').pop() || 'webp';
        const thumbFilename = `${timestamp}-${randomString}-thumb.${thumbExt}`;
        const thumbBuf = await thumbnail.arrayBuffer();
        await MEDIA_BUCKET.put(thumbFilename, thumbBuf, {
          httpMetadata: { contentType: thumbnail.type || 'image/webp' },
        });
        thumbnailUrl = `https://media.jobsreport.online/${thumbFilename}`;
        const thumbKb = Math.round(thumbnail.size / 1024);
        thumbSize = thumbKb > 1024 ? `${Math.round(thumbKb / 1024)}MB` : `${thumbKb}KB`;
      }

      // Save metadata to D1 (stores original URL in `url`, thumbnail URL in `alt_text` marker)
      // NOTE: `alt_text` will hold the thumbnail URL for stories, and remain descriptive for jobs
      const altTextValue = thumbnailUrl ? `thumb:${thumbnailUrl}|${altText || name}` : (altText || name);

      await DB.prepare(`
        INSERT INTO media (id, name, type, url, size, alt_text, storage_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'r2', ?)
      `).bind(
        id,
        name,
        file.type,
        publicUrl,
        size,
        altTextValue,
        new Date().toISOString()
      ).run();

      return new Response(JSON.stringify({
        id,
        name,
        type: file.type,
        dataUrl: publicUrl,
        url: publicUrl,
        thumbnail_url: thumbnailUrl,       // ← new
        thumb_size: thumbSize,             // ← new
        size,
        altText: altText || name,
        storageType: 'r2',
        uploadedAt: new Date().toISOString().split('T')[0],
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ──────────────────────────────────────────────────────────
    // JSON fallback (base64) — no thumbnail support
    // ──────────────────────────────────────────────────────────
    const body: any = await context.request.json();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const id = `media-${timestamp}-${randomString}`;
    const filename = `${timestamp}-${randomString}.png`;

    let publicUrl = body.dataUrl;

    if (MEDIA_BUCKET && body.dataUrl && body.dataUrl.includes('base64')) {
      try {
        const base64Data = body.dataUrl.split(',')[1] || body.dataUrl;
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        await MEDIA_BUCKET.put(filename, binaryData, {
          httpMetadata: { contentType: 'image/png' },
        });
        publicUrl = `https://media.jobsreport.online/${filename}`;
      } catch (r2Err) {
        console.log('R2 upload failed, using base64 fallback');
      }
    }

    await DB.prepare(`
      INSERT INTO media (id, name, type, url, size, alt_text, storage_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.name || 'image.png',
      body.type || 'image/png',
      publicUrl,
      body.size || 'Unknown',
      body.altText || body.name || 'Image',
      MEDIA_BUCKET ? 'r2' : 'base64',
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      id,
      name: body.name,
      type: body.type || 'image/png',
      dataUrl: publicUrl,
      url: publicUrl,
      thumbnail_url: null,
      thumb_size: null,
      size: body.size || 'Unknown',
      altText: body.altText || body.name,
      storageType: MEDIA_BUCKET ? 'r2' : 'base64',
      uploadedAt: new Date().toISOString().split('T')[0],
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error('Upload Error:', err);
    return new Response(JSON.stringify({
      error: 'Failed to upload file',
      details: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

// GET /api/upload - List all media
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const result = await DB.prepare(`
      SELECT * FROM media
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    const media = result.results.map((m: any) => {
      // Decode thumbnail URL if stored as marker
      const alt = String(m.alt_text || '');
      const thumbMatch = alt.match(/^thumb:([^|]+)\|(.*)$/);
      const thumbnailUrl = thumbMatch ? thumbMatch[1] : null;
      const cleanAlt = thumbMatch ? thumbMatch[2] : alt;

      return {
        id: m.id,
        name: m.name,
        type: m.type,
        dataUrl: m.url,
        url: m.url,
        thumbnail_url: thumbnailUrl,
        size: m.size,
        altText: cleanAlt,
        storageType: m.storage_type,
        uploadedAt: m.created_at?.split('T')[0] || 'Unknown',
      };
    });

    return new Response(JSON.stringify(media), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('Media List Error:', err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

// DELETE /api/upload/[id] - Delete media (and its thumbnail)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB, MEDIA_BUCKET } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'upload') {
    return new Response(JSON.stringify({ error: 'No media ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const media: any = await DB.prepare('SELECT * FROM media WHERE id = ?').bind(id).first();

    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (media.storage_type === 'r2') {
      // Delete original from R2
      const filename = media.url.split('/').pop();
      if (filename) {
        try { await MEDIA_BUCKET.delete(filename); } catch (e) { console.error('R2 delete:', e); }
      }

      // Delete thumbnail from R2 too (if present)
      const alt = String(media.alt_text || '');
      const thumbMatch = alt.match(/^thumb:([^|]+)\|/);
      if (thumbMatch) {
        const thumbFilename = thumbMatch[1].split('/').pop();
        if (thumbFilename) {
          try { await MEDIA_BUCKET.delete(thumbFilename); } catch (e) { console.error('R2 thumb delete:', e); }
        }
      }
    }

    await DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, deleted: id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('Media Delete Error:', err);
    return new Response(JSON.stringify({
      error: 'Failed to delete media',
      details: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

// OPTIONS - CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
