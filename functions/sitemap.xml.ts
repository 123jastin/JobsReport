// /functions/sitemap.xml.ts

// Server-side cache
let sitemapCache = {
  data: null as string | null,
  timestamp: 0
};

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours cache

export const onRequestGet = async (context: any) => {
  const { DB } = context.env;
  const baseUrl = "https://jobsreport.online";
  
  // Return cached sitemap if fresh
  if (sitemapCache.data && (Date.now() - sitemapCache.timestamp) < CACHE_TTL) {
    return new Response(sitemapCache.data, {
      headers: { 
        "Content-Type": "application/xml; charset=utf-8", 
        "Cache-Control": "public, max-age=43200",
        "X-Cache": "HIT"
      }
    });
  }
  
  let urls: string[] = [];

  // ========== STATIC PAGES ==========
  urls.push(`<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/market</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/reports</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/companies</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/regions</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

  // ========== LEGAL & INFO PAGES ==========
  urls.push(`<url><loc>${baseUrl}/about-us</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/contact-us</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/privacy-policy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/terms-of-service</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/disclaimer</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);

  // ========== COUNTRY PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT DISTINCT country FROM jobs WHERE country IS NOT NULL AND country != '' AND is_active = 1`).all();
    for (const item of results || []) {
      const slug = (item.country as string).toLowerCase().replace(/\s+/g, '-');
      urls.push(`<url><loc>${baseUrl}/country/${slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/jobs-in/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/reports/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== CATEGORY PAGES ==========
  try {
    const { results } = await DB.prepare(`
      SELECT DISTINCT job_category as name FROM jobs 
      WHERE job_category != '' AND job_category != 'Other' AND is_active = 1
    `).all();
    
    const countries = ['tanzania', 'kenya', 'uganda', 'rwanda'];
    
    for (const cat of results || []) {
      const slug = (cat.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      urls.push(`<url><loc>${baseUrl}/category/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
      
      for (const country of countries) {
        urls.push(`<url><loc>${baseUrl}/category/${slug}/${country}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
      }
    }
  } catch (err) {}

  // ========== JOB PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT id, title FROM jobs WHERE is_active = 1 LIMIT 5000`).all();
    for (const job of results || []) {
      const slug = (job.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/market/${slug}-${job.id}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err) {}

  // ========== REPORT PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT id, slug FROM reports LIMIT 1000`).all();
    for (const r of results || []) {
      const reportSlug = (r.slug as string) || r.id;
      urls.push(`<url><loc>${baseUrl}/report/${reportSlug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== REGION PAGES (FIXED - No more LIKE '%...%') ==========
  try {
    // ✅ Use direct job_id JOIN instead of LIKE pattern
    const { results } = await DB.prepare(`
      SELECT DISTINCT 
        LOWER(REPLACE(l.name,' ','-')) as rs, 
        LOWER(REPLACE(l.country,' ','-')) as cs
      FROM locations l 
      INNER JOIN jobs j ON l.job_id = j.id
      WHERE j.is_active = 1
    `).all();
    
    for (const r of results || []) {
      urls.push(`<url><loc>${baseUrl}/country/${r.cs}/region/${r.rs}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err) {}

  // ========== ROLE PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT slug FROM roles LIMIT 500`).all();
    for (const r of results || []) {
      const roleSlug = (r.slug as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/role/${roleSlug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== BUILD XML ==========
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  // Cache the sitemap
  sitemapCache = {
    data: sitemap,
    timestamp: Date.now()
  };

  return new Response(sitemap, {
    headers: { 
      "Content-Type": "application/xml; charset=utf-8", 
      "Cache-Control": "public, max-age=43200",
      "X-Cache": "MISS"
    }
  });
};
