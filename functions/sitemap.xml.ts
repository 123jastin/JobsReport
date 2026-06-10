// /functions/sitemap.xml.ts
export const onRequestGet = async (context: any) => {
  const { DB } = context.env;
  
  let urls: string[] = [];
  let dbStatus = "";
  
  urls.push(`<url><loc>https://jobsreport.online/</loc></url>`);
  urls.push(`<url><loc>https://jobsreport.online/market</loc></url>`);
  urls.push(`<url><loc>https://jobsreport.online/reports</loc></url>`);

  // Test DB connection
  try {
    const { results } = await DB.prepare(`SELECT COUNT(*) as count FROM jobs`).all();
    const count = results?.[0]?.count || 0;
    dbStatus = `Jobs: ${count}`;
    
    // If jobs exist, add them
    if (count > 0) {
      const { results: jobs } = await DB.prepare(
        `SELECT id, title FROM jobs LIMIT 3`
      ).all();
      
      for (const job of jobs || []) {
        urls.push(`<url><loc>https://jobsreport.online/market/${job.id}</loc></url>`);
      }
    }
  } catch (err: any) {
    dbStatus = `Error: ${err.message}`;
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- DB Status: ${dbStatus} -->
    ${urls.join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
};
