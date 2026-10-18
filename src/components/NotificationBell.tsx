import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useUserAuth, getUserToken } from '../context/UserAuthContext';

export default function NotificationBell() {
  const { user } = useUserAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const token = getUserToken();
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch('/api/notifications?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setUnreadCount(Number(data?.unread) || 0);
      }
    } catch {
      // silent
    }
  }, []);

  // Only poll when logged in
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnread();

    // Poll every 45s
    const interval = setInterval(fetchUnread, 45_000);

    // Refetch on tab focus
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);

    // Refetch when notifications page updates (mark-all-read, delete, etc.)
    const onUpdate = () => fetchUnread();
    window.addEventListener('notifications:updated', onUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('notifications:updated', onUpdate);
    };
  }, [user?.id, fetchUnread]);

  // Hide entirely for logged-out users
  if (!user) return null;

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Link
      to="/notifications"
      className="relative p-2 text-gray-400 hover:text-white transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      title={
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
          : 'Notifications'
      }
      id="notification-bell-btn"
    >
      <Bell size={18} />

      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F3425F] text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-bg-surface"
          style={{
            boxShadow: '0 0 8px rgba(243, 66, 95, 0.5)',
          }}
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}
