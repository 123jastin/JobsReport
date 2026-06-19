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
    const response = await fetch(`${url.origin}/api/market`);
    if (!response.ok) return context.next();
    
    const data = await response.json();
    const slug = url.pathname.split('/market/')[1];
    if (!slug) return context.next();
    
    let job = data.jobs?.find(j => j.slug === slug || j.id === slug || slug.includes(j.id));
    if (!job) {
      const match = slug.match(/(job-[a-z0-9]+)/i);
      if (match) job = data.jobs?.find(j => j.id === match[1]);
    }
    
    if (job) {
      const imageUrl = job.logoUrl || 'https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png';
      const jobUrl = `https://jobsreport.online/market/${job.slug || job.id}`;
      const desc = `${job.title} at ${job.company} in ${job.location || 'Worldwide'}. Apply now on JobsReport!`;
      
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${job.title} - ${job.company} | JobsReport</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${job.title} - ${job.company}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${jobUrl}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${job.title} - ${job.company}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${imageUrl}">
<link rel="canonical" href="${jobUrl}">
</head>
<body>
<h1>${job.title}</h1>
<p>${job.company}</p>
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
