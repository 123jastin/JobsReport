// src/components/AnchorAd.tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AnchorAd() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Reset and refresh on route change
    setIsDismissed(false);
    
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // 🔥 Clear previous ad
        containerRef.current.innerHTML = '';
        
        // 🔥 Fixed size - no responsive
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'inline-block';
        ins.style.width = '320px';   // 🔥 Fixed width
        ins.style.height = '50px';    // 🔥 Fixed height - smallest allowed
        ins.style.margin = '0 auto';
        ins.setAttribute('data-ad-client', 'ca-pub-8155064094205693');
        ins.setAttribute('data-ad-slot', '6727401898');
        // ❌ No data-ad-format
        // ❌ No data-full-width-responsive
        
        containerRef.current.appendChild(ins);
        
        // 🔥 Push the ad
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('✅ Anchor ad refreshed for:', location.pathname);
        } catch (e) {
          console.log('⚠️ Anchor ad error:', e);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [location.pathname]);

  if (isDismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      background: 'rgba(0,0,0,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '2px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '54px',
    }}>
      {/* Close button */}
      <button 
        onClick={() => setIsDismissed(true)}
        style={{
          position: 'absolute',
          top: '0px',
          right: '6px',
          padding: '2px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: 'pointer',
          color: '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 41,
        }}
        aria-label="Close ad"
      >
        <X size={10} />
      </button>

      {/* 🔥 Fixed size anchor ad - 320x50 */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '320px',
          height: '50px',
          overflow: 'hidden',
        }} 
      />
    </div>
  );
}
