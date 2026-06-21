// src/components/AutoAdsRefresh.tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function AutoAdsRefresh() {
  const location = useLocation();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // 🔥 Skip initial page load — Auto Ads already initialized in index.html
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // 🔥 Wait for new page content to render
    const timer = setTimeout(() => {
      try {
        // 🔥 Only refresh vignette auto ads — don't touch manual <ins> elements
        // Don't reset adsbygoogle.loaded — it breaks manual ads
        
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({
          google_ad_client: 'ca-pub-8155064094205693',
          enable_page_level_ads: true
        });
        
        console.log('🔄 Vignette Auto Ads refreshed for:', location.pathname);
      } catch (e) {
        console.log('⚠️ Vignette refresh error:', e);
      }
    }, 500); // 500ms delay to let DOM settle

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null; // This component renders nothing
}
