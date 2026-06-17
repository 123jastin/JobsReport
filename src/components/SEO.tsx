import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  twitterCard?: string;
  twitterImage?: string;
  twitterCreator?: string;
  structuredData?: object | object[];
}

export default function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  ogSiteName = 'JobsReport',
  ogLocale = 'en_TZ',
  twitterCard = 'summary_large_image',
  twitterImage,
  twitterCreator,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to set meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return; // Skip if no content
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to remove meta tags
    const removeMeta = (name: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      const el = document.querySelector(`meta[${attr}="${name}"]`);
      if (el) el.remove();
    };

    // Basic SEO
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    
    // Open Graph tags
    setMeta('og:title', ogTitle || title, true);
    setMeta('og:description', ogDescription || description, true);
    if (ogUrl) setMeta('og:url', ogUrl, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', ogSiteName, true);
    if (ogLocale) setMeta('og:locale', ogLocale, true);
    
    // Open Graph Image (CRITICAL FIX)
    if (ogImage) {
      setMeta('og:image', ogImage, true);
      setMeta('og:image:secure_url', ogImage, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
      setMeta('og:image:alt', ogTitle || title, true);
      setMeta('og:image:type', 'image/jpeg', true);
    } else {
      // Remove og:image tags if no image provided (fallback to default in index.html)
      removeMeta('og:image', true);
      removeMeta('og:image:secure_url', true);
      removeMeta('og:image:width', true);
      removeMeta('og:image:height', true);
      removeMeta('og:image:alt', true);
      removeMeta('og:image:type', true);
    }
    
    // Twitter Card tags
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', ogTitle || title);
    setMeta('twitter:description', ogDescription || description);
    if (twitterCreator) setMeta('twitter:creator', twitterCreator);
    
    // Twitter Image (CRITICAL FIX)
    if (twitterImage || ogImage) {
      setMeta('twitter:image', twitterImage || ogImage);
      setMeta('twitter:image:alt', ogTitle || title);
    } else {
      removeMeta('twitter:image');
      removeMeta('twitter:image:alt');
    }
    
    // Robots
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
    } else {
      // Remove canonical if no URL provided
      const existingCanonical = document.querySelector('link[rel="canonical"]');
      if (existingCanonical) existingCanonical.remove();
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data scripts
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
    } else {
      // Remove all structured data if not provided
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-schema]');
      existingScripts.forEach(el => el.remove());
    }

    // Cleanup on unmount or re-run
    return () => {
      // Only cleanup if component unmounts (not on re-render)
      // The next effect run will handle updates
    };

  }, [
    title, 
    description, 
    keywords, 
    canonicalUrl, 
    ogTitle, 
    ogDescription, 
    ogImage, 
    ogUrl, 
    ogType, 
    ogSiteName, 
    ogLocale, 
    twitterCard, 
    twitterImage, 
    twitterCreator, 
    structuredData
  ]);

  // Component doesn't render anything visible
  return null;
}
