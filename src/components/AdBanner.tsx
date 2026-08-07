import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

export default function AdBanner({ slot, format = 'auto', style }: AdBannerProps) {
  const location = useLocation();
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Only push if element exists and hasn't already been filled
    if (insRef.current && !insRef.current.getAttribute('data-adsbygoogle-status')) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense initialization error:', err);
      }
    }
  }, [location.pathname, slot]);

  return (
    <div
      style={{
        minHeight: '280px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '16px auto',
        maxWidth: '728px',
        padding: '0 16px',
        overflow: 'hidden',
        ...style
      }}
    >
      <ins
        // 🔥 Key forces React to cleanly unmount/remount on route change
        key={`${location.pathname}-${slot}`}
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '280px' }}
        data-ad-client="ca-pub-8155064094205693"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
