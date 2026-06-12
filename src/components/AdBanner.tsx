import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

export default function AdBanner({ slot, format = 'auto', style }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only push if not already pushed
    if (pushedRef.current) return;

    const timer = setTimeout(() => {
      try {
        // Reset the ad element
        if (adRef.current) {
          // Clear any existing ad content
          adRef.current.innerHTML = '';
          adRef.current.className = 'adsbygoogle';
        }

        // Push new ad
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushedRef.current = true;
        
        console.log(`✅ Ad pushed for slot: ${slot}`);
      } catch (err: any) {
        console.log(`⚠️ Ad push error for ${slot}:`, err.message);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      pushedRef.current = false;
    };
  }, [slot]);

  return (
    <div style={{ 
      minHeight: '280px', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      margin: '16px auto', 
      maxWidth: '728px', 
      padding: '0 16px', 
      overflow: 'hidden',
      ...style 
    }}>
      <ins
        ref={adRef}
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
