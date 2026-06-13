import { useState, useEffect } from 'react';
import { Bell, BellOff, Globe, Check } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';

const COUNTRIES = [
  'Worldwide',
  'Tanzania',
  'Kenya',
  'Uganda',
  'Rwanda',
  'Burundi',
  'South Africa',
  'Nigeria',
  'Ghana',
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'United Arab Emirates'
];

export default function NotificationBell() {
  const [subscribed, setSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Worldwide');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fcm_token');
    if (token) {
      setSubscribed(true);
      const savedCountry = localStorage.getItem('fcm_country') || 'Worldwide';
      setSelectedCountry(savedCountry);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/logo-192.png'
        });
      }
    });

    return () => unsubscribe?.();
  }, []);

  const handleCountrySelect = async (country: string) => {
    setSelectedCountry(country);
    setLoading(true);

    const token = await requestNotificationPermission();
    
    if (token) {
      localStorage.setItem('fcm_token', token);
      localStorage.setItem('fcm_country', country);
      setSubscribed(true);
      setShowPrompt(false);

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, country })
      });
    }
    
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    const token = localStorage.getItem('fcm_token');
    if (token) {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      localStorage.removeItem('fcm_token');
      localStorage.removeItem('fcm_country');
      setSubscribed(false);
      setSelectedCountry('Worldwide');
    }
  };

  return (
    <>
      <button
        onClick={() => subscribed ? handleUnsubscribe() : setShowPrompt(true)}
        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all relative"
        title={subscribed ? `Alerts: ${selectedCountry} (click to unsubscribe)` : 'Enable job alerts'}
      >
        {subscribed ? (
          <Bell size={18} className="text-green-400" />
        ) : (
          <BellOff size={18} />
        )}
        {subscribed && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {showPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 max-w-xs w-full space-y-3">
            <div className="text-center">
              <Bell size={28} className="text-blue-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">Job Alerts</h3>
              <p className="text-[10px] text-gray-400 mt-1">Tap a country to enable alerts</p>
            </div>
            
            {/* Country List - One tap enables */}
            <div className="space-y-1 max-h-[220px] overflow-y-auto">
              {COUNTRIES.map(country => (
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                    selectedCountry === country 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Globe size={12} />
                    {country}
                  </span>
                  {selectedCountry === country && subscribed && (
                    <Check size={14} className="text-green-400" />
                  )}
                  {loading && selectedCountry === country && (
                    <span className="text-[9px] text-blue-400">Enabling...</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPrompt(false)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
