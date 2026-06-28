// src/components/AnchorAd.tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function AnchorAd() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'inline-block';
        ins.style.width = '320px';
        ins.style.height = '150px';
        ins.setAttribute('data-ad-client', 'ca-pub-8155064094205693');
        ins.setAttribute('data-ad-slot', '6727401898');
        
        containerRef.current.appendChild(ins);
        
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [location.pathname]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '320px',
      height: '150px',
      zIndex: -1,
      opacity: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div ref={containerRef} style={{ width: '320px', height: '150px', overflow: 'hidden' }} />
    </div>
  );
}
