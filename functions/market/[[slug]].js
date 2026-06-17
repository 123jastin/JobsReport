export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Social media crawlers
  const botPattern = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot/i;
  
  // Only modify response for social media crawlers
  if (botPattern.test(userAgent)) {
    try {
      // Option 1: Fetch from your API (if you have /api/market endpoint)
      const apiUrl = `${url.origin}/api/market`;
      const apiResponse = await fetch(apiUrl);
      
      if (!apiResponse.ok) {
        throw new Error(`API returned ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      
      // Get slug from URL
      const slug = url.pathname.split('/market/')[1];
      
      if (!slug) {
        return fetch(request);
      }
      
      // Find matching job
      let job = null;
      
      // Try direct slug match first
      job = data.jobs?.find(j => j.slug === slug);
      
      // Try matching by ID
      if (!job) {
        job = data.jobs?.find(j => j.id === slug || slug.includes(j.id));
      }
      
      // Try extracting job ID from URL
      if (!job) {
        const jobIdMatch = slug.match(/(job-[a-z0-9]+)/i);
        if (jobIdMatch) {
          job = data.jobs?.find(j => j.id === jobIdMatch[1]);
        }
      }
      
      if (job) {
        return serveJobHtml(job, url);
      }
      
      // If job found, serve it
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
        
        // Return static HTML
        const html = generateJobHtml(job, jobUrl, imageUrl, description);
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    } catch (error) {
      console.error('Function error:', error);
    }
  }
  
  // For normal users, return the regular page
  return fetch(request);
}

// Generate the complete HTML for job listings
function generateJobHtml(job, jobUrl, imageUrl, description) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": (job.description || '').replace(/<[^>]*>/g, '').substring(0, 5000),
    "identifier": {
      "@type": "PropertyValue",
      "name": "JobsReport",
      "value": job.id
    },
    "datePosted": job.postedAt || new Date().toISOString().split('T')[0],
    "validThrough": job.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    "employmentType": job.employment_type || 'FULL_TIME',
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
      "sameAs": job.companyWebsite || '',
      "logo": job.logoUrl || ''
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
  };

  // Add salary if available
  if (job.salary_min || job.salary_max) {
    structuredData.baseSalary = {
      "@type": "MonetaryAmount",
      "currency": (job.salary_currency || 'TZS').toUpperCase(),
      "value": {
        "@type": "QuantitativeValue",
        "minValue": Number(job.salary_min || job.salary_max),
        "maxValue": Number(job.salary_max || job.salary_min),
        "unitText": "MONTH"
      }
    };
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://jobsreport.online"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Market",
        "item": "https://jobsreport.online/market"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": job.title,
        "item": jobUrl
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(job.title + ' - ' + job.company + ' | JobsReport')}</title>
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
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  
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
    window.location.href = '${escapeHtml(jobUrl)}';
  </script>
</body>
</html>`;
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
