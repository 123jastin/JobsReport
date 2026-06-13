import { useState, useEffect } from 'react';
import { Bell, BellOff, Globe } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';
import { useCountry } from '../context/CountryContext';

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
  const { selectedCountry: currentCountry } = useCountry();

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

  const handleSubscribe = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      localStorage.setItem('fcm_token', token);
      localStorage.setItem('fcm_country', selectedCountry);
      setSubscribed(true);
      setShowPrompt(false);

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, country: selectedCountry })
      });
    }
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
        title={subscribed ? `Notifications: ${selectedCountry} (click to unsubscribe)` : 'Enable notifications'}
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
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <Bell size={32} className="text-blue-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Get Job Alerts</h3>
            <p className="text-xs text-gray-400">
              Receive notifications for new jobs in your selected country.
            </p>
            
            {/* Country Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">
                <Globe size={12} className="inline mr-1" />
                Select Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <p className="text-[9px] text-gray-500">
                You'll receive notifications for jobs in {selectedCountry === 'Worldwide' ? 'all countries' : selectedCountry}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Enable Alerts
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
