// /functions/sitemap.xml.ts
export const onRequestGet = async (context: any) => {
  // Return simple XML to test if function works
  const testSitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://jobsreport.online/</loc>
    </url>
    <url>
      <loc>https://jobsreport.online/market</loc>
    </url>
    <url>
      <loc>https://jobsreport.online/reports</loc>
    </url>
  </urlset>`;

  return new Response(testSitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
};
