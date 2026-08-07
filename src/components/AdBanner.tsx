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
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // Clear previous ad completely
        containerRef.current.innerHTML = '';
        
        // Create fresh ins element
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
        
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          console.error('AdSense error:', err);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [slot, location.pathname]); // 🔥 Re-initialize on route change

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
