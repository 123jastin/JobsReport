export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Social media crawlers and bots
  const botPattern = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot/i;
  
  // Only modify response for social media crawlers
  if (botPattern.test(userAgent)) {
    try {
      // Fetch jobs data from your API
      const apiUrl = `${url.origin}/api/market`;
      const apiResponse = await fetch(apiUrl);
      
      if (!apiResponse.ok) {
        throw new Error(`API returned ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      
      // Get slug from URL path
      // Example: /market/job-title-slug or /market/job-abc123
      const pathParts = url.pathname.split('/market/')[1];
      
      if (!pathParts) {
        // No slug, return original response
        return fetch(request);
      }
      
      // Find matching job
      let job = data.jobs?.find(j => {
        return j.slug === pathParts || 
               pathParts.includes(j.id) || 
               j.id === pathParts ||
               j.id === `job-${pathParts}`;
      });
      
      // If not found, try matching by ID from URL
      if (!job) {
        const jobIdMatch = pathParts.match(/(job-[a-z0-9]+)/i);
        if (jobIdMatch) {
          job = data.jobs?.find(j => j.id === jobIdMatch[1]);
        }
      }
      
      if (job) {
        // Build job URL
        const jobUrl = job.slug 
          ? `https://jobsreport.online/market/${job.slug}`
          : `https://jobsreport.online/market/${job.id}`;
        
        // Get image URL
        const imageUrl = job.logoUrl || 'https://jobsreport.online/og-image.jpg';
        
        // Build description
        const salaryText = job.salary ? ` Salary: ${job.salary}.` : '';
        const description = `${job.title} at ${job.company} in ${job.location || 'Worldwide'}.${salaryText} Apply now on JobsReport!`;
        
        // Build title
        const title = `${job.title} - ${job.company} | JobsReport`;
        
        // Return static HTML for crawlers
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(job.title + ' - ' + job.company)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(job.title + ' at ' + job.company)}">
  <meta property="og:url" content="${escapeHtml(jobUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="JobsReport">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(job.title + ' - ' + job.company)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(job.title + ' at ' + job.company)}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${escapeHtml(jobUrl)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": (job.description || '').replace(/<[^>]*>/g, '').substring(0, 5000),
      "datePosted": job.postedAt,
      "employmentType": job.employment_type || 'FULL_TIME',
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": job.companyWebsite || ''
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.city || job.location || '',
          "addressRegion": job.region || '',
          "addressCountry": "TZ"
        }
      },
      "url": jobUrl
    })}
  </script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #0a0a0a;
      color: #fff;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .logo {
      font-size: 14px;
      font-weight: bold;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 32px;
    }
    .job-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #fff;
    }
    .company {
      font-size: 18px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .location {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .salary {
      font-size: 16px;
      color: #10b981;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .redirect {
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">JobsReport</div>
    <div class="job-title">${escapeHtml(job.title)}</div>
    <div class="company">${escapeHtml(job.company)}</div>
    <div class="location">📍 ${escapeHtml(job.location || 'Worldwide')}</div>
    ${job.salary ? `<div class="salary">💰 ${escapeHtml(job.salary)}</div>` : ''}
    <div class="redirect">Redirecting to job listing...</div>
  </div>
  <script>
    // Redirect real users to the actual React app
    window.location.href = '${escapeHtml(jobUrl)}';
  </script>
</body>
</html>`;
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    } catch (error) {
      console.error('Function error:', error);
      // If error, fall through to normal response
    }
  }
  
  // For normal users and non-matching URLs, return the regular page
  return fetch(request);
}

// Helper function to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
