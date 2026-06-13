import { useState, useEffect } from 'react';
import { Bell, BellOff, Globe, Check, X } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';

const COUNTRIES = [
  { name: 'Worldwide', flag: '🌍' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Burundi', flag: '🇧🇮' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'United Arab Emirates', flag: '🇦🇪' }
];

export default function NotificationBell() {
  const [subscribed, setSubscribed] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Worldwide');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    
    // Close panel first to clear any overlays
    setShowPanel(false);

    // Wait for panel to close
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = await requestNotificationPermission();

    if (token) {
      localStorage.setItem('fcm_token', token);
      localStorage.setItem('fcm_country', country);
      setSubscribed(true);
      setSuccessMessage(`✅ Alerts enabled for ${country}`);

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, country })
      });

      setTimeout(() => setSuccessMessage(''), 3000);
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
      setSuccessMessage('Alerts disabled');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const handleBellClick = () => {
    if (subscribed) {
      handleUnsubscribe();
    } else {
      setShowPanel(!showPanel);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={handleBellClick}
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

      {/* Success Message Toast */}
      {successMessage && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold whitespace-nowrap z-50">
          {successMessage}
        </div>
      )}

      {/* Country Panel - Below Header */}
      {showPanel && !subscribed && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowPanel(false)}
          />
          
          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-56 bg-black border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-blue-400" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Job Alerts</span>
              </div>
              <button 
                onClick={() => setShowPanel(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Description */}
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Tap a country to get notified when new jobs are posted
              </p>
            </div>

            {/* Country List */}
            <div className="max-h-[240px] overflow-y-auto py-1">
              {COUNTRIES.map(country => (
                <button
                  key={country.name}
                  onClick={() => handleCountrySelect(country.name)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all ${
                    loading ? 'opacity-50 cursor-wait' :
                    selectedCountry === country.name 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{country.flag}</span>
                    <span>{country.name}</span>
                  </span>
                  {selectedCountry === country.name && (
                    <Check size={14} className="text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
