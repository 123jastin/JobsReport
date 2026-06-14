// /functions/sitemap.xml.ts
export const onRequestGet = async (context: any) => {
  const { DB } = context.env;
  const baseUrl = "https://jobsreport.online";
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
    const { results } = await DB.prepare(`SELECT DISTINCT country FROM jobs WHERE country IS NOT NULL AND country != ''`).all();
    for (const item of results || []) {
      const slug = (item.country as string).toLowerCase().replace(/\s+/g, '-');
      urls.push(`<url><loc>${baseUrl}/country/${slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/jobs-in/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/reports/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== JOB PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT id, title FROM jobs`).all();
    for (const job of results || []) {
      const slug = (job.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/market/${slug}-${job.id}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err) {}

  // ========== REPORT PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT id, slug FROM reports`).all();
    for (const r of results || []) {
      const reportSlug = (r.slug as string) || r.id;
      urls.push(`<url><loc>${baseUrl}/report/${reportSlug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== REGION PAGES ==========
  try {
    const { results } = await DB.prepare(`
      SELECT DISTINCT LOWER(REPLACE(l.name,' ','-')) as rs, LOWER(REPLACE(l.country,' ','-')) as cs
      FROM locations l INNER JOIN jobs j ON LOWER(j.location) LIKE '%' || LOWER(l.name) || '%'
    `).all();
    for (const r of results || []) {
      urls.push(`<url><loc>${baseUrl}/country/${r.cs}/region/${r.rs}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err) {}

  // ========== ROLE PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT slug FROM roles`).all();
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

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
};
