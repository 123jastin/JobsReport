import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

export default function AdBanner({ slot, format = 'auto', style }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // 🔥 Clear any existing ad content completely
        const existingIns = containerRef.current.querySelector('.adsbygoogle');
        if (existingIns) {
          existingIns.remove();
        }
        
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
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          console.log(`✅ Fresh ad pushed for slot: ${slot}`);
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
  }, [slot]);

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
