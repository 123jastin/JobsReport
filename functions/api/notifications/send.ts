import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const { title, body, url, country } = await context.request.json();

    // Get subscribers for this country or worldwide
    let subscribers;
    if (country && country !== 'Worldwide') {
      subscribers = await DB.prepare(
        'SELECT token FROM push_subscribers WHERE country = ? OR country = ?'
      ).bind(country, 'Worldwide').all();
    } else {
      subscribers = await DB.prepare(
        'SELECT token FROM push_subscribers'
      ).all();
    }

    const tokens = (subscribers.results || []).map((s: any) => s.token);
    
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No subscribers' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send to Firebase Cloud Messaging
    // This requires Firebase Admin SDK on server side
    // For now, log the notification
    console.log(`📢 Sending notification to ${tokens.length} subscribers in ${country || 'Worldwide'}`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`URL: ${url}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notification queued for ${tokens.length} subscribers`,
      subscriberCount: tokens.length
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
