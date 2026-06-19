export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  const botPattern = /facebookexternalhit|facebook|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot/i;
  
  if (botPattern.test(userAgent)) {
    try {
      const apiUrl = `${url.origin}/api/market`;
      const apiResponse = await fetch(apiUrl);
      
      if (!apiResponse.ok) return fetch(request);
      
      const data = await apiResponse.json();
      const slug = url.pathname.split('/market/')[1];
      if (!slug) return fetch(request);
      
      let job = data.jobs?.find(j => j.slug === slug || j.id === slug || slug.includes(j.id));
      if (!job) {
        const match = slug.match(/(job-[a-z0-9]+)/i);
        if (match) job = data.jobs?.find(j => j.id === match[1]);
      }
      
      if (job) {
        // Use company logo - if it exists and is large enough
        const imageUrl = job.logoUrl || 'https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png';
        
        const jobUrl = `https://jobsreport.online/market/${job.slug || job.id}`;
        const desc = `${job.title} at ${job.company} in ${job.location || 'Worldwide'}.${job.salary ? ' Salary: ' + job.salary + '.' : ''} Apply now on JobsReport!`;
        
        return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${job.title} - ${job.company} | JobsReport</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${job.title} - ${job.company}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:url" content="${jobUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${job.title} - ${job.company}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${imageUrl}">
  <link rel="canonical" href="${jobUrl}">
  <script>window.location.href='${jobUrl}';</script>
</head>
<body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
  <h1>${job.title}</h1>
  <p>${job.company} - ${job.location || 'Worldwide'}</p>
</body>
</html>`, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  return fetch(request);
}
