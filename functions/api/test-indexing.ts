import { notifyGoogleIndexing } from './notify-google';

export const onRequestGet = async () => {
  const result = await notifyGoogleIndexing('https://jobsreport.online/', 'URL_UPDATED');
  
  return new Response(JSON.stringify({ success: true, result }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
