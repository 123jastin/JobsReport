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
const adRef = useRef<HTMLModElement>(null);

useEffect(() => {
const adElement = adRef.current;

if (!adElement) return;

// Prevent initializing the same ad element more than once
if (adElement.getAttribute('data-adsbygoogle-status')) {
  return;
}

const timer = window.setTimeout(() => {
  try {
    // Make sure the element still exists
    if (!adRef.current) return;

    // Prevent duplicate initialization
    if (adRef.current.getAttribute('data-adsbygoogle-status')) {
      return;
    }

    (window.adsbygoogle = window.adsbygoogle || []).push({});

    console.log(`✅ AdSense initialized for slot: ${slot}`);
  } catch (error) {
    console.error(`⚠️ AdSense error for slot ${slot}:`, error);
  }
}, 200);

return () => {
  window.clearTimeout(timer);
};

}, [slot]);

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
ref={adRef}
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
