import { notifyGoogleIndexing } from './notify-google';

export const onRequestPost = async (context: any) => {
  try {
    const { url } = await context.request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'No URL provided' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await notifyGoogleIndexing(url, 'URL_UPDATED');
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
