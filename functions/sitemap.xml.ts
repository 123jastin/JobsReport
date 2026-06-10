// /functions/sitemap.xml.ts
export const onRequestGet = async (context: any) => {
  const { DB } = context.env;
  const baseUrl = "https://jobsreport.online";
  let urls: string[] = [];
  let debug: string[] = [];

  // Static pages always
  urls.push(`<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/market</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/reports</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/companies</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/regions</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

  // Test 1: Jobs without active filter
  try {
    const { results } = await DB.prepare(`SELECT COUNT(*) as c FROM jobs`).all();
    debug.push(`Total jobs (no filter): ${results?.[0]?.c || 0}`);
  } catch (err: any) {
    debug.push(`Jobs count error: ${err.message}`);
  }

  // Test 2: Active column check
  try {
    const { results } = await DB.prepare(`SELECT DISTINCT active FROM jobs`).all();
    debug.push(`Active values: ${JSON.stringify(results?.map((r: any) => r.active))}`);
  } catch (err: any) {
    debug.push(`Active check error: ${err.message}`);
  }

  // Test 3: Jobs WITHOUT active filter
  try {
    const { results: jobs } = await DB.prepare(`SELECT id, title FROM jobs LIMIT 5`).all();
    debug.push(`Jobs found (no filter): ${jobs?.length || 0}`);
    
    for (const job of jobs || []) {
      const titleSlug = (job.title as string)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push(`<url><loc>${baseUrl}/market/${titleSlug}-${job.id}</loc></url>`);
    }
  } catch (err: any) {
    debug.push(`Jobs error: ${err.message}`);
  }

  // Test 4: Countries
  try {
    const { results } = await DB.prepare(`SELECT DISTINCT country FROM jobs LIMIT 5`).all();
    debug.push(`Countries: ${JSON.stringify(results?.map((r: any) => r.country))}`);
    
    for (const item of results || []) {
      if (item.country) {
        const slug = (item.country as string).toLowerCase().replace(/\s+/g, '-');
        urls.push(`<url><loc>${baseUrl}/country/${slug}</loc></url>`);
      }
    }
  } catch (err: any) {
    debug.push(`Countries error: ${err.message}`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- ${debug.join(" | ")} -->
    ${urls.join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
};
