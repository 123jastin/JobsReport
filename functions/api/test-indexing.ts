import { notifyGoogleIndexing } from './notify-google';

export const onRequestPost = async (context: any) => {
  try {
    const { url } = await context.request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'No URL provided' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 🔍 Debug: Check what's in context.env
    console.log('🔍 test-indexing - context.env keys:', Object.keys(context.env || {}));
    console.log('🔍 Has GOOGLE_SERVICE_ACCOUNT?', !!context.env?.GOOGLE_SERVICE_ACCOUNT);
    console.log('🔍 Has GOOGLE_SERVICE_ACCOUNT_KEY?', !!context.env?.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    // 🔥 Pass context.env to the function
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
