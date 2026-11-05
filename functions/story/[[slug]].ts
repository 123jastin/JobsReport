export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';

  // ONLY intercept crawlers (WhatsApp, Facebook, etc.)
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot/i.test(userAgent);

  if (!isCrawler) {
    return context.next();
  }

  const SITE_URL = 'https://jobsreport.online';
  const OG_FALLBACK = 'https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png';

  // Extract slug: /story/<slug>
  const slug = url.pathname.split('/story/')[1]?.split('?')[0]?.split('/')[0];
  if (!slug) return context.next();

  try {
    // Fetch the story from your existing API
    const response = await fetch(`${url.origin}/api/stories/${encodeURIComponent(slug)}`);
    if (!response.ok) return context.next();

    const data = await response.json();
    const story = data?.story || data;
    if (!story || story.error) return context.next();

    const storyUrl = `${SITE_URL}/story/${story.slug || slug}`;
    const authorName = story.user?.name || 'User';

    // Build title/description
    const title = story.text_content
      ? `${story.text_content.slice(0, 70)} | Story by ${authorName}`
      : `${authorName}'s Story | JobsReport`;
    const description = story.text_content
      ? story.text_content.slice(0, 160)
      : `Job story shared by ${authorName} on JobsReport.`;

    // Pick OG image — prefer the thumbnail, fall back to original, then to brand image.
    // Force absolute URL in case DB has a relative path.
    const rawImage = story.media_thumb || story.media_url;
    let imageUrl = OG_FALLBACK;
    if (rawImage) {
      if (/^https?:\/\//i.test(rawImage)) imageUrl = rawImage;
      else if (rawImage.startsWith('//')) imageUrl = `https:${rawImage}`;
      else if (rawImage.startsWith('/')) imageUrl = `${SITE_URL}${rawImage}`;
      else imageUrl = `${SITE_URL}/${rawImage}`;
    }

    // Escape HTML to avoid broken tags if text has quotes/angle brackets
    const esc = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:image:secure_url" content="${esc(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:url" content="${esc(storyUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="JobsReport">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(imageUrl)}">
<link rel="canonical" href="${esc(storyUrl)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<img src="${esc(imageUrl)}" alt="Story by ${esc(authorName)}" />
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  } catch (e) {
    console.error('[story-og] error:', e);
  }

  return context.next();
}
