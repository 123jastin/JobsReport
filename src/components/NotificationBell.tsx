import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';

export default function NotificationBell() {
  const [subscribed, setSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fcm_token');
    if (token) setSubscribed(true);

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
      setSubscribed(true);
      setShowPrompt(false);

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
    }
  };

  return (
    <>
      <button
        onClick={() => subscribed ? null : setShowPrompt(true)}
        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all relative"
        title={subscribed ? 'Notifications active' : 'Enable notifications'}
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
              Receive instant notifications when new jobs matching your interests are posted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Enable
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
