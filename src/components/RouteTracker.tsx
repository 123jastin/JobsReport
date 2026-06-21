// src/components/RouteTracker.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // 🔥 Send pageview to Google Analytics on every route change
    if (window.gtag) {
      window.gtag('config', 'G-KMM0JJEPZ5', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
      console.log('📊 GA pageview:', location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  return null; // This component renders nothing
}
