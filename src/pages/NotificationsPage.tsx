import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useUserAuth, getUserToken } from '../context/UserAuthContext';
import {
  ArrowLeft, Bell, BellOff, Check, CheckCheck, Search, X,
  MoreVertical, Trash2, Loader2, Briefcase, Sparkles,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
interface NotificationActor {
  id: string;
  name: string;
  username?: string | null;
  profileImageUrl?: string | null;
}

interface Notification {
  id: string;
  type: 'job_created' | 'story_created' | 'job_daily' | string;
  title: string;
  body?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  actorId?: string | null;
  actor?: NotificationActor | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

// ============================================================
// HELPERS
// ============================================================
const DEFAULT_AVATAR = (name: string, seed: string | number) => {
  const colors = ['1877F2', '45BD62', 'F3425F', 'F7B928', '9360F7'];
  const hash = String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const c = colors[Math.abs(hash) % colors.length];
  const init = (name || 'U').slice(0, 1).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(init)}&background=${c}&color=fff&size=128&bold=true&rounded=true`;
};

const parseTime = (value?: string): number => {
  if (!value) return 0;
  const t = Date.parse(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'));
  return Number.isFinite(t) ? t : Date.now();
};

const formatRelative = (iso?: string): string => {
  const t = parseTime(iso);
  const diff = Date.now() - t;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'job_created': return { icon: <Briefcase size={12} />, bg: '#1877F2' };
    case 'story_created': return { icon: <Sparkles size={12} />, bg: '#A033FF' };
    case 'job_daily': return { icon: <Briefcase size={12} />, bg: '#10B981' };
    default: return { icon: <Bell size={12} />, bg: '#1877F2' };
  }
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function NotificationsPage() {
  const { user: authUser, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auth guard
  useEffect(() => {
    if (!authLoading && !authUser) navigate('/login');
  }, [authUser, authLoading, navigate]);

  // ────────────────────────────────────────────────────────
  // LOAD NOTIFICATIONS
  // ────────────────────────────────────────────────────────
  const loadNotifications = async (offset = 0) => {
    const token = getUserToken();
    if (!token) return;

    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/notifications?limit=30&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { notifications: [] };
      }

      if (res.ok) {
        const list: Notification[] = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications((prev) => offset === 0 ? list : [...prev, ...list]);
        setUnreadCount(data.unread || 0);
        setTotal(data.total || 0);
        setHasMore(!!data.hasMore);
      }
    } catch (err) {
      console.error('Load notifications failed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authUser) loadNotifications(0);
  }, [authUser?.id]);

  // Poll every 60s
  useEffect(() => {
    if (!authUser) return;
    const interval = setInterval(() => loadNotifications(0), 60_000);
    return () => clearInterval(interval);
  }, [authUser?.id]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpenId == null) return;
      const el = menuRefs.current[menuOpenId];
      if (el && !el.contains(e.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  // ────────────────────────────────────────────────────────
  // ACTIONS
  // ────────────────────────────────────────────────────────
  const showMsg = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2500);
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    const token = getUserToken();
    if (!token) return;

    setMarkingAll(true);
    const snapshot = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ all: true }),
      });
      showMsg('success', 'All marked as read');
    } catch {
      setNotifications(snapshot);
      setUnreadCount(snapshot.filter((n) => !n.isRead).length);
      showMsg('error', 'Failed');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string, read: boolean) => {
    setMenuOpenId(null);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: read } : n));
    setUnreadCount((prev) => Math.max(0, prev + (read ? -1 : 1)));

    const token = getUserToken();
    if (!token) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {}
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    setDeletingId(id);
    const snapshot = notifications;
    const item = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));

    const token = getUserToken();
    if (!token) return;
    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showMsg('success', 'Removed');
    } catch {
      setNotifications(snapshot);
      showMsg('error', 'Failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenNotification = (n: Notification) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const token = getUserToken();
      if (token) {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: [n.id] }),
        }).catch(() => {});
      }
    }

    if (n.link) navigate(n.link);
  };

  // ────────────────────────────────────────────────────────
  // FILTERED + SORTED + SECTIONS
  // ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      (n.body || '').toLowerCase().includes(q) ||
      (n.actor?.name || '').toLowerCase().includes(q)
    );
  }, [notifications, searchQuery]);

  const { newList, todayList, earlierList } = useMemo(() => {
    const newN: Notification[] = [];
    const todayN: Notification[] = [];
    const earlierN: Notification[] = [];

    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    filtered.forEach((n) => {
      const t = parseTime(n.createdAt);
      if (!n.isRead || t >= twoHoursAgo) newN.push(n);
      else if (t >= startOfToday.getTime()) todayN.push(n);
      else earlierN.push(n);
    });

    return { newList: newN, todayList: todayN, earlierList: earlierN };
  }, [filtered]);

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={24} className="text-[#4A9EFF] animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Loading notifications...
        </span>
      </div>
    );
  }

  if (!authUser) return null;

  const renderRow = (n: Notification) => {
    const icon = getNotificationIcon(n.type);
    const actorName = n.actor?.name || 'Someone';
    const avatar = n.actor?.profileImageUrl || DEFAULT_AVATAR(actorName, n.actor?.id || n.id);
    const isUnread = !n.isRead;

    return (
      <div
        key={n.id}
        onClick={() => handleOpenNotification(n)}
        className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.03] ${
          isUnread
            ? 'bg-[#1877F2]/[0.06] hover:bg-[#1877F2]/[0.1]'
            : 'hover:bg-white/[0.02]'
        }`}
      >
        {/* Avatar + badge */}
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt={actorName}
            className="w-12 h-12 rounded-full object-cover border border-white/10"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR(actorName, n.id); }}
          />
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#050B18]"
            style={{ background: icon.bg }}
          >
            <span className="text-white">{icon.icon}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] leading-snug break-words ${isUnread ? 'text-white font-medium' : 'text-gray-300'}`}>
            {n.actor && (
              <span className="font-bold text-white">{actorName}{' '}</span>
            )}
            {n.title}
          </p>
          {n.body && (
            <p className="text-[12.5px] text-gray-500 mt-0.5 break-words line-clamp-2">
              {n.body}
            </p>
          )}
          <p className={`text-[11px] mt-1 font-mono ${isUnread ? 'text-[#4A9EFF]' : 'text-gray-600'}`}>
            {formatRelative(n.createdAt)}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {isUnread && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] shadow-[0_0_6px_rgba(24,119,242,0.6)]" />
          )}

          <div
            ref={(el) => { menuRefs.current[n.id] = el; }}
            className="relative"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId((prev) => prev === n.id ? null : n.id);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Options"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpenId === n.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-9 w-44 bg-[#0B1120] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <button
                  onClick={() => handleMarkRead(n.id, !isUnread)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-white hover:bg-white/5 text-left transition-colors"
                >
                  <Check size={12} className="text-[#4A9EFF]" />
                  {isUnread ? 'Mark as read' : 'Mark as unread'}
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={deletingId === n.id}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 text-left transition-colors disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  {deletingId === n.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SEO
        title="Notifications | JobsReport"
        description="Your latest notifications from JobsReport."
      />

      <div className="max-w-2xl mx-auto pb-16">
        {/* HEADER */}
        <div className="sticky top-14 z-20 bg-[#050B18]/95 backdrop-blur border-b border-white/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-xl md:text-2xl font-black text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1877F2] text-white">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll || unreadCount === 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  markingAll || unreadCount === 0
                    ? 'text-gray-700 cursor-not-allowed'
                    : 'text-[#4A9EFF] hover:bg-white/5'
                }`}
                aria-label="Mark all as read"
                title="Mark all as read"
              >
                {markingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={18} />}
              </button>
              <button
                onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearchQuery(''); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  searchOpen ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="mt-3 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                autoFocus
                className="w-full bg-white/[0.03] border border-white/10 focus:border-[#1877F2] rounded-xl py-2 pl-9 pr-8 text-sm text-white placeholder-gray-600 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTIONS */}
        <div>
          {newList.length > 0 && (
            <div className="pt-2">
              <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">New</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1877F2]/20 text-[#4A9EFF]">
                  {newList.length}
                </span>
              </div>
              {newList.map(renderRow)}
            </div>
          )}

          {todayList.length > 0 && (
            <div className="pt-2">
              <div className="px-4 pt-3 pb-2">
                <h2 className="text-lg font-bold text-white">Today</h2>
              </div>
              {todayList.map(renderRow)}
            </div>
          )}

          {earlierList.length > 0 && (
            <div className="pt-2">
              <div className="px-4 pt-3 pb-2">
                <h2 className="text-lg font-bold text-white">Earlier</h2>
              </div>
              {earlierList.map(renderRow)}
            </div>
          )}

          {hasMore && (
            <div className="p-4">
              <button
                onClick={() => loadNotifications(notifications.length)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>See previous notifications</>
                )}
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#4A9EFF]">
                <BellOff size={24} />
              </div>
              <p className="text-white font-bold text-base">
                {searchQuery ? 'No notifications matching search' : 'No notifications yet'}
              </p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Try a different keyword.'
                  : 'When something happens on JobsReport, you\'ll see it here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl border ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-200'
              : 'bg-[#0B1120] border-[#4A9EFF]/40 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}
