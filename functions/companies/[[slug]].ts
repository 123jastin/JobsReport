export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // ONLY intercept crawlers
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot/i.test(userAgent);
  
  if (!isCrawler) {
    return context.next();
  }
  
  try {
    const [companiesRes, marketRes] = await Promise.all([
      fetch(`${url.origin}/api/companies`),
      fetch(`${url.origin}/api/market`)
    ]);
    
    if (!companiesRes.ok || !marketRes.ok) return context.next();
    
    const companies = await companiesRes.json();
    const marketData = await marketRes.json();
    const jobs = marketData.jobs || [];
    
    const slug = url.pathname.split('/companies/')[1];
    if (!slug) return context.next();
    
    // Find company by slug
    const company = companies?.find(c => 
      c.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    );
    
    if (company) {
      const companyJobs = jobs.filter(j => j.company.toLowerCase() === company.name.toLowerCase());
      const activeJobs = companyJobs.filter(j => j.active).length;
      
      const imageUrl = company.logoUrl || 'https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png';
      const companyUrl = `https://jobsreport.online/companies/${slug}`;
      const title = `${company.name} Jobs & Careers | JobsReport`;
      const desc = company.description 
        ? `${company.name} - ${company.description.substring(0, 150)}... ${activeJobs} active jobs.`
        : `Browse ${activeJobs} job opportunities at ${company.name}. Find careers and vacancies at ${company.name} on JobsReport.`;
      
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta property="og:title" content="${escapeHtml(company.name + ' Jobs & Careers')}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(companyUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="JobsReport">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(company.name + ' Jobs & Careers')}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${escapeHtml(imageUrl)}">
<link rel="canonical" href="${escapeHtml(companyUrl)}">
</head>
<body>
<h1>${escapeHtml(company.name)}</h1>
<p>${activeJobs} active jobs</p>
</body>
</html>`;
      
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
  } catch (e) {
    console.error(e);
  }
  
  return context.next();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
