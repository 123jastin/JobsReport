import { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { DB } = context.env;
  const baseUrl = "https://jobsreport.online";
  let urls: string[] = [];

  // ========== STATIC PAGES ==========
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/market', changefreq: 'hourly', priority: '0.9' },
    { url: '/reports', changefreq: 'daily', priority: '0.9' },
    { url: '/companies', changefreq: 'daily', priority: '0.8' },
    { url: '/regions', changefreq: 'weekly', priority: '0.8' },
  ];

  staticPages.forEach(page => {
    urls.push(`
      <url>
        <loc>${baseUrl}${page.url}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
      </url>
    `);
  });

  // ========== COUNTRY PAGES ==========
  try {
    const countries = await DB.prepare(`
      SELECT DISTINCT country
      FROM jobs
      WHERE country IS NOT NULL AND country != '' AND active = 1
    `).all();

    for (const item of countries.results || []) {
      const slug = (item.country as string).toLowerCase().replace(/\s+/g, '-');

      // Country page
      urls.push(`
        <url>
          <loc>${baseUrl}/country/${slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
      `);

      // Jobs in country
      urls.push(`
        <url>
          <loc>${baseUrl}/jobs-in/${slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `);

      // Reports by country
      urls.push(`
        <url>
          <loc>${baseUrl}/reports/${slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Country sitemap error", err);
  }

  // ========== REGION PAGES ==========
  try {
    const regions = await DB.prepare(`
      SELECT DISTINCT 
        LOWER(REPLACE(l.name, ' ', '-')) as region_slug,
        LOWER(REPLACE(l.country, ' ', '-')) as country_slug
      FROM locations l
      INNER JOIN jobs j ON (
        LOWER(j.location) LIKE '%' || LOWER(l.name) || '%'
        OR LOWER(j.location) LIKE '%' || LOWER(l.region) || '%'
      )
      WHERE j.active = 1
      LIMIT 200
    `).all();

    for (const region of regions.results || []) {
      urls.push(`
        <url>
          <loc>${baseUrl}/country/${region.country_slug}/region/${region.region_slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Region sitemap error", err);
  }

  // ========== REPORT PAGES ==========
  // URL pattern: /report/{slug}-{id}
  try {
    const reports = await DB.prepare(`
      SELECT id, title, slug, updatedAt
      FROM reports
      WHERE id IS NOT NULL
      ORDER BY updatedAt DESC
      LIMIT 500
    `).all();

    for (const report of reports.results || []) {
      const reportSlug = (report.slug as string) || 
        (report.title as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      
      const reportUrl = `${baseUrl}/report/${reportSlug}-${report.id}`;

      urls.push(`
        <url>
          <loc>${reportUrl}</loc>
          <lastmod>${new Date(report.updatedAt || Date.now()).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Reports sitemap error", err);
  }

  // ========== JOB PAGES ==========
  // URL pattern: /market/{title-slug}-{id}
  try {
    const jobs = await DB.prepare(`
      SELECT id, title, updatedAt
      FROM jobs
      WHERE id IS NOT NULL AND active = 1
      ORDER BY updatedAt DESC
      LIMIT 1000
    `).all();

    for (const job of jobs.results || []) {
      const titleSlug = (job.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const jobUrl = `${baseUrl}/market/${titleSlug}-${job.id}`;

      urls.push(`
        <url>
          <loc>${jobUrl}</loc>
          <lastmod>${new Date(job.updatedAt || Date.now()).toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Jobs sitemap error", err);
  }

  // ========== ROLE/CATEGORY PAGES (Clean URLs) ==========
  // ✅ URL pattern: /role/{role-slug} (NOT /market?role=)
  try {
    const roles = await DB.prepare(`
      SELECT DISTINCT role
      FROM jobs
      WHERE role IS NOT NULL AND role != '' AND active = 1
      LIMIT 50
    `).all();

    for (const role of roles.results || []) {
      const roleSlug = (role.role as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      urls.push(`
        <url>
          <loc>${baseUrl}/role/${roleSlug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Role sitemap error", err);
  }

  // ========== BUILD SITEMAP XML ==========
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    ${urls.join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex"
    }
  });
};
