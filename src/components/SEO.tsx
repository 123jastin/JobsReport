import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  structuredData?: object | object[]; // 🔥 Now supports single object OR array of objects
}

export default function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogUrl,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to set meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Set all meta tags
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    if (ogTitle) setMeta('og:title', ogTitle, true);
    if (ogDescription) setMeta('og:description', ogDescription, true);
    if (ogUrl) setMeta('og:url', ogUrl, true);
    setMeta('twitter:title', ogTitle || title);
    setMeta('twitter:description', ogDescription || description);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('og:type', 'website', true);
    setMeta('robots', 'index, follow');
    setMeta('googlebot', 'index, follow');

    // Set canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // 🔥 FIX: Handle structured data - supports single object OR array of objects
    if (structuredData) {
      // Remove all existing structured data scripts
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-schema]');
      existingScripts.forEach(el => el.remove());

      // Convert to array if single object
      const schemas = Array.isArray(structuredData) ? structuredData : [structuredData];

      // Add each schema as a separate script tag
      schemas.forEach((schema, index) => {
        const script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-schema', `schema-${index}`); // Track for cleanup
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }
  }, [title, description, keywords, canonicalUrl, ogTitle, ogDescription, ogUrl, structuredData]);

  return null;
}
