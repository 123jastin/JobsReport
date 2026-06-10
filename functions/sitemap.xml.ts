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

  // ========== COUNTRY PAGES ==========
  try {
    const { results: countries } = await DB.prepare(`
      SELECT DISTINCT country FROM jobs 
      WHERE country IS NOT NULL AND country != '' AND active = 1
    `).all();

    for (const item of countries || []) {
      const slug = (item.country as string).toLowerCase().replace(/\s+/g, '-');
      urls.push(`<url><loc>${baseUrl}/country/${slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/jobs-in/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
      urls.push(`<url><loc>${baseUrl}/reports/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== JOB PAGES (with SEO slugs) ==========
  try {
    const { results: jobs } = await DB.prepare(`
      SELECT id, title FROM jobs WHERE active = 1 ORDER BY updatedAt DESC
    `).all();

    for (const job of jobs || []) {
      const titleSlug = (job.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/market/${titleSlug}-${job.id}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err) {}

  // ========== REPORT PAGES ==========
  try {
    const { results: reports } = await DB.prepare(`
      SELECT id, title, slug FROM reports ORDER BY updatedAt DESC LIMIT 500
    `).all();

    for (const report of reports || []) {
      const reportSlug = (report.slug as string) || (report.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/report/${reportSlug}-${report.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== REGION PAGES ==========
  try {
    const { results: regions } = await DB.prepare(`
      SELECT DISTINCT LOWER(REPLACE(l.name,' ','-')) as rslug, LOWER(REPLACE(l.country,' ','-')) as cslug
      FROM locations l INNER JOIN jobs j ON LOWER(j.location) LIKE '%' || LOWER(l.name) || '%'
      WHERE j.active = 1 LIMIT 200
    `).all();

    for (const r of regions || []) {
      urls.push(`<url><loc>${baseUrl}/country/${r.cslug}/region/${r.rslug}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }
  } catch (err) {}

  // ========== ROLE PAGES ==========
  try {
    const { results: roles } = await DB.prepare(`
      SELECT DISTINCT role FROM jobs WHERE role IS NOT NULL AND role != '' AND active = 1 LIMIT 50
    `).all();

    for (const r of roles || []) {
      const roleSlug = (r.role as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      urls.push(`<url><loc>${baseUrl}/role/${roleSlug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  } catch (err) {}

  // ========== BUILD XML ==========
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
