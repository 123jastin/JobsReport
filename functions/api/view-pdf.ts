import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  MEDIA_BUCKET: R2Bucket;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { MEDIA_BUCKET } = context.env;
  const url = new URL(context.request.url);
  const fileParam = url.searchParams.get('file');

  if (!fileParam) {
    return new Response(JSON.stringify({ error: 'No file specified' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Extract filename from the R2 URL
    const filename = fileParam.split('/').pop() || fileParam;
    
    // Get from R2
    const object = await MEDIA_BUCKET.get(filename);
    
    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Force inline display (not download)
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + filename + '"',  // inline = display, attachment = download
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('PDF view error:', err);
    return new Response(JSON.stringify({ error: 'Error serving file' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
