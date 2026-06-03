import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  MEDIA_BUCKET: R2Bucket;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { MEDIA_BUCKET } = context.env;
  const url = new URL(context.request.url);
  const fileParam = url.searchParams.get('file');

  if (!fileParam) {
    return new Response('No file specified', { status: 400 });
  }

  try {
    // Extract filename from R2 URL
    const filename = fileParam.split('/').pop() || fileParam;
    
    // Get from R2
    const object = await MEDIA_BUCKET.get(filename);
    
    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Serve with inline content-disposition (shows in browser, doesn't download)
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + filename + '"',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response('Error serving file', { status: 500 });
  }
};
