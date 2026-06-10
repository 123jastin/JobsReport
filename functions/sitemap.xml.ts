// /functions/sitemap.xml.ts
export const onRequestGet = async (context: any) => {
  const { DB } = context.env;
  const baseUrl = "https://jobsreport.online";
  let urls: string[] = [];
  let debug: string[] = [];

  // ========== STATIC PAGES ==========
  urls.push(`<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/market</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/reports</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/companies</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/regions</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

  // ========== COUNTRY PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT DISTINCT country FROM jobs WHERE country IS NOT NULL AND country != ''`).all();
    debug.push(`Countries: ${results?.length || 0}`);
    for (const item of results || []) {
      const slug = (item.country as string).toLowerCase().replace(/\s+/g, '-');
      urls.push(`<url><loc>${baseUrl}/country/${slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/jobs-in/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/reports/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err: any) { debug.push(`Countries: ${err.message}`); }

  // ========== JOB PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT id, title FROM jobs`).all();
    debug.push(`Jobs: ${results?.length || 0}`);
    for (const job of results || []) {
      const slug = (job.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/market/${slug}-${job.id}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err: any) { debug.push(`Jobs: ${err.message}`); }

  // ========== REPORT PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT id, title, slug FROM reports`).all();
    debug.push(`Reports: ${results?.length || 0}`);
    for (const r of results || []) {
      const rSlug = (r.slug as string) || (r.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/report/${rSlug}-${r.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err: any) { debug.push(`Reports: ${err.message}`); }

  // ========== REGION PAGES ==========
  try {
    const { results } = await DB.prepare(`
      SELECT DISTINCT LOWER(REPLACE(l.name,' ','-')) as rs, LOWER(REPLACE(l.country,' ','-')) as cs
      FROM locations l INNER JOIN jobs j ON LOWER(j.location) LIKE '%' || LOWER(l.name) || '%'
    `).all();
    debug.push(`Regions: ${results?.length || 0}`);
    for (const r of results || []) {
      urls.push(`<url><loc>${baseUrl}/country/${r.cs}/region/${r.rs}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err: any) { debug.push(`Regions: ${err.message}`); }

  // ========== ROLE PAGES ==========
  try {
    const { results } = await DB.prepare(`SELECT slug, name FROM roles`).all();
    debug.push(`Roles: ${results?.length || 0}`);
    for (const r of results || []) {
      const rSlug = (r.slug as string) || (r.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      urls.push(`<url><loc>${baseUrl}/role/${rSlug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err: any) { debug.push(`Roles: ${err.message}`); }

  // ========== BUILD XML ==========
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- ${debug.join(" | ")} -->
    ${urls.join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-cache" }
  });
};
