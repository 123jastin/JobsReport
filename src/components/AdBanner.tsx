import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

export default function AdBanner({ slot, format = 'auto', style }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // 🔥 Clear any existing ad content completely
        containerRef.current.innerHTML = '';
        
        // 🔥 Create fresh ins element
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.style.width = '100%';
        ins.style.minHeight = '280px';
        ins.setAttribute('data-ad-client', 'ca-pub-8155064094205693');
        ins.setAttribute('data-ad-slot', slot);
        ins.setAttribute('data-ad-format', format);
        ins.setAttribute('data-full-width-responsive', 'true');
        
        containerRef.current.appendChild(ins);
        
        // 🔥 Push new ad
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log(`✅ Manual ad pushed for slot: ${slot} on ${location.pathname}`);
        } catch (err: any) {
          console.log(`⚠️ Ad push error for ${slot}:`, err.message);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      // 🔥 Clean up on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [slot, location.pathname]); // 🔥 Re-run on route change

  return (
    <div 
      ref={containerRef}
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
    />
  );
}
