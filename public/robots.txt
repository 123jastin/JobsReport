# JobsReport.online - Robots Configuration

User-agent: *
Content-Signal: search=yes,ai-train=no
Allow: /

# Block AI training but allow search indexing
User-agent: Google-Extended
Allow: /
# Google-Extended respects Content-Signal ai-train=no

User-agent: GPTBot
Allow: /
# GPTBot respects Content-Signal for training vs search

# Block ONLY the most aggressive scrapers
User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

# Sitemap
Sitemap: https://jobsreport.online/sitemap.xml
