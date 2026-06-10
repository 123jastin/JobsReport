export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { DB } = context.env;

  const baseUrl = "https://jobsreport.online";

  let urls: string[] = [];

  // Static Pages
  urls.push(`
    <url>
      <loc>${baseUrl}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
  `);

  urls.push(`
    <url>
      <loc>${baseUrl}/market</loc>
      <changefreq>hourly</changefreq>
      <priority>0.9</priority>
    </url>
  `);

  urls.push(`
    <url>
      <loc>${baseUrl}/reports</loc>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
  `);

  urls.push(`
    <url>
      <loc>${baseUrl}/companies</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
  `);

  urls.push(`
    <url>
      <loc>${baseUrl}/regions</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `);

  // Reports
  try {
    const reports = await DB.prepare(`
      SELECT slug, updatedAt
      FROM reports
      WHERE slug IS NOT NULL
    `).all();

    for (const report of reports.results || []) {
      urls.push(`
        <url>
          <loc>${baseUrl}/report/${report.slug}</loc>
          <lastmod>${new Date(
            report.updatedAt || Date.now()
          ).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Reports sitemap error", err);
  }

  // Country Pages
  try {
    const countries = await DB.prepare(`
      SELECT DISTINCT country
      FROM jobs
      WHERE country IS NOT NULL
      AND country != ''
    `).all();

    for (const item of countries.results || []) {
      const slug = item.country
        .toLowerCase()
        .replace(/\s+/g, '-');

      urls.push(`
        <url>
          <loc>${baseUrl}/country/${slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
      `);

      urls.push(`
        <url>
          <loc>${baseUrl}/jobs-in/${slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `);

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

  // Job Pages
  try {
    const jobs = await DB.prepare(`
      SELECT id, updatedAt
      FROM jobs
      WHERE id IS NOT NULL
    `).all();

    for (const job of jobs.results || []) {
      urls.push(`
        <url>
          <loc>${baseUrl}/market/${job.id}</loc>
          <lastmod>${new Date(
            job.updatedAt || Date.now()
          ).toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    }
  } catch (err) {
    console.error("Jobs sitemap error", err);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
