import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

export default function AdBanner({
  slot,
  format = 'auto',
  style,
}: AdBannerProps) {
  const insRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!insRef.current || initializedRef.current) return;

    const ins = insRef.current;

    // Don't initialize an already processed AdSense element
    if (ins.getAttribute('data-adsbygoogle-status')) {
      initializedRef.current = true;
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initializedRef.current = true;
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  }, []);

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
        ...style,
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minHeight: '280px',
        }}
        data-ad-client="ca-pub-8155064094205693"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
