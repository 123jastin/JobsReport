import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useUserAuth, getUserToken } from '../context/UserAuthContext';
import {
  X, Plus, Share2, Eye, Calendar, Clock,
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  MapPin, Briefcase, GraduationCap, Link as LinkIcon, BadgeCheck,
  Instagram, Linkedin, Globe, Pencil, Settings, ExternalLink,
  Image as ImageIcon, MessageCircle, UserPlus, UserCheck
} from 'lucide-react';
import {
  StoryViewer,
  CreateStoryModal,
  type StoryType,
  type StoryUser,
  type CreateStoryPayload,
} from './Story';

// ============================================================
// TYPES
// ============================================================
export interface ProfileUser {
  id: string;
  name: string;
  username?: string | null;
  email?: string;
  profile_image_url?: string | null;
  cover_image_url?: string | null;
  bio?: string | null;
  headline?: string | null;
  work?: string | null;
  education?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  country?: string | null;
  role?: string;
  is_verified?: number;
  followers_count?: number;
  jobs_count?: number;
  stories_count?: number;
  is_following?: boolean;
  created_at?: string | null;
}

interface JobItem {
  id: string;
  title: string;
  company: string;
  company_logo?: string | null;
  location?: string | null;
  role?: string | null;
  salary?: string | null;
  employment_type?: string | null;
  posted_at?: string | null;
  slug?: string | null;
}

// ============================================================
// HELPERS
// ============================================================
const DEFAULT_AVATAR = (name: string, seed: string | number) => {
  const colors = ['1877F2', '45BD62', 'F3425F', 'F7B928', '9360F7'];
  const hash = String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const c = colors[Math.abs(hash) % colors.length];
  const init = (name || 'U').slice(0, 1).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(init)}&background=${c}&color=fff&size=200&bold=true&rounded=true`;
};

const fmtCount = (n: number) => {
  const num = Number(n || 0);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
};

const parseServerTime = (value?: string): number => {
  const s = String(value ?? '').trim();
  if (!s) return Date.now();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : Date.now();
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    const iso = s.replace(' ', 'T') + 'Z';
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : Date.now();
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : Date.now();
};

const formatRelative = (iso?: string): string => {
  const t = parseServerTime(iso);
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isExpired = (story: StoryType): boolean => {
  if (story.is_active === 0 || story.is_active === (false as any)) return true;
  if (!story.expires_at) return false;
  return parseServerTime(story.expires_at) < Date.now();
};

// ============================================================
// API
// ============================================================
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getUserToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`);
  return data;
};

// ============================================================
// EDIT PROFILE MODAL
// ============================================================
interface EditProfileModalProps {
  user: ProfileUser;
  onClose: () => void;
  onSave: (updates: Partial<ProfileUser>) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [headline, setHeadline] = useState(user.headline || '');
  const [bio, setBio] = useState(user.bio || '');
  const [work, setWork] = useState(user.work || '');
  const [education, setEducation] = useState(user.education || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [linkedin, setLinkedin] = useState(user.linkedin_url || '');
  const [avatarUrl, setAvatarUrl] = useState(user.profile_image_url || '');
  const [coverUrl, setCoverUrl] = useState(user.cover_image_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, setter: (url: string) => void, setBusy: (v: boolean) => void) => {
    if (!file.type.startsWith('image/')) { setError('Only images allowed'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Max 8MB'); return; }
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed');
      setter(data.url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        work: work.trim() || null,
        education: education.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        linkedin_url: linkedin.trim() || null,
        profile_image_url: avatarUrl || null,
        cover_image_url: coverUrl || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] bg-[#0B1120] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Edit Profile</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Cover */}
          <div className="relative h-[140px] bg-gradient-to-br from-[#1877F2]/30 via-[#7B4DFF]/20 to-[#A033FF]/30">
            {coverUrl && (
              <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur"
            >
              {uploadingCover ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
              Change cover
            </button>
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f, setCoverUrl, setUploadingCover);
                e.currentTarget.value = '';
              }}
            />
          </div>

          {/* Avatar */}
          <div className="px-5 -mt-12 relative z-10">
            <div className="relative w-24 h-24 rounded-full border-4 border-[#0B1120] overflow-hidden bg-[#1E293B]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                  {name.slice(0, 1).toUpperCase() || '?'}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingAvatar ? <Loader2 size={20} className="text-white animate-spin" /> : <ImageIcon size={20} className="text-white" />}
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, setAvatarUrl, setUploadingAvatar);
                  e.currentTarget.value = '';
                }}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="p-5 space-y-4">
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" required />
            <Field label="Headline" value={headline} onChange={setHeadline} placeholder="e.g. Software Engineer • Nairobi" maxLength={80} />
            <Field label="Bio" value={bio} onChange={setBio} placeholder="Short bio" textarea maxLength={200} />
            <Field label="Work" value={work} onChange={setWork} placeholder="Current company" icon={<Briefcase size={14} />} />
            <Field label="Education" value={education} onChange={setEducation} placeholder="School or university" icon={<GraduationCap size={14} />} />
            <Field label="Location" value={location} onChange={setLocation} placeholder="City, Country" icon={<MapPin size={14} />} />
            <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." icon={<Globe size={14} />} />
            <Field label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/..." icon={<Linkedin size={14} />} />
          </div>
        </div>

        {error && (
          <div className="px-5 py-3 bg-red-500/10 border-t border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="p-4 border-t border-white/5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  maxLength?: number;
  required?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, onChange, placeholder, textarea, maxLength, required, icon }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm resize-none"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
      />
    )}
  </div>
);

// ============================================================
// JOB CARD (matches HomePage style)
// ============================================================
const JobCard: React.FC<{ job: JobItem }> = ({ job }) => {
  const href = `/market/${job.slug || `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}`;
  return (
    <Link
      to={href}
      className="block p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-[#1877F2]/30 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
          {job.company_logo ? (
            <img src={job.company_logo} alt={job.company} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
              {job.company?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {job.role && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1877F2]/10 text-[#4A9EFF] uppercase tracking-wider">
              {job.role}
            </span>
          )}
          <h3 className="text-sm font-bold text-white group-hover:text-[#4A9EFF] transition-colors truncate mt-1">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Briefcase size={10} />{job.company}
            </span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />{job.location}
              </span>
            )}
          </div>
          {job.salary && (
            <span className="text-[10px] text-emerald-400 font-mono mt-1.5 block">{job.salary}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useUserAuth();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [stories, setStories] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'stories' | 'about'>('jobs');
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Story viewing
  const [viewingStory, setViewingStory] = useState<StoryType | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);

  const currentUser: StoryUser | null = authUser
    ? {
        id: String(authUser.id),
        name: authUser.name || authUser.username || 'User',
        username: authUser.username || null,
        email: authUser.email,
        profile_image_url: authUser.profile_image_url || null,
      }
    : null;

  const isOwnProfile = authUser && user && String(authUser.id) === String(user.id);

  // ────────────────────────────────────────────────────────
  // LOAD PROFILE
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) { setNotFound(true); return; }
      setLoading(true);
      try {
        const data = await apiFetch(`/api/users/${encodeURIComponent(id)}`);
        if (cancelled) return;
        if (!data?.user) { setNotFound(true); return; }

        setUser(data.user);
        setFollowing(!!data.user.is_following);

        // Jobs posted by this user
        const jobsData = await apiFetch(`/api/users/${encodeURIComponent(id)}/jobs`).catch(() => ({ jobs: [] }));
        if (!cancelled) setJobs(Array.isArray(jobsData?.jobs) ? jobsData.jobs : []);

        // Stories by this user
        const storiesData = await apiFetch(`/api/users/${encodeURIComponent(id)}/stories`).catch(() => ({ stories: [] }));
        if (!cancelled) {
          const list: StoryType[] = Array.isArray(storiesData?.stories) ? storiesData.stories : [];
          setStories(list.filter((s) => !isExpired(s)));
        }
      } catch (err) {
        if (!cancelled) setNotfoundDebug(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Helper (declared inside for closure over setNotFound)
    function setNotfoundDebug(_err: any) { setNotFound(true); }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // ────────────────────────────────────────────────────────
  // FOLLOW
  // ────────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!authUser) { navigate('/login'); return; }
    if (!user || followLoading) return;

    setFollowLoading(true);
    const next = !following;
    setFollowing(next);

    try {
      await apiFetch(`/api/users/${encodeURIComponent(user.id)}/follow`, {
        method: next ? 'POST' : 'DELETE',
      });
      setUser((prev) =>
        prev ? {
          ...prev,
          followers_count: (prev.followers_count || 0) + (next ? 1 : -1),
          is_following: next,
        } : prev
      );
    } catch (err) {
      setFollowing(!next); // rollback
    } finally {
      setFollowLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // SAVE PROFILE
  // ────────────────────────────────────────────────────────
  const handleSaveProfile = async (updates: Partial<ProfileUser>) => {
    await apiFetch('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  // ────────────────────────────────────────────────────────
  // SHARE
  // ────────────────────────────────────────────────────────
  const handleShareProfile = async () => {
    const url = `${window.location.origin}/u/${user?.username || user?.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: user?.name || 'JobsReport Profile', url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Profile link copied!');
    } catch {
      window.prompt('Copy link:', url);
    }
  };

  // ────────────────────────────────────────────────────────
  // CREATESTORY / DELETE
  // ────────────────────────────────────────────────────────
  const handleCreateStory = async (payload: CreateStoryPayload) => {
    await apiFetch('/api/stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const storiesData = await apiFetch(`/api/users/${encodeURIComponent(id!)}/stories`).catch(() => ({ stories: [] }));
    const list: StoryType[] = Array.isArray(storiesData?.stories) ? storiesData.stories : [];
    setStories(list.filter((s) => !isExpired(s)));
    setUser((prev) => prev ? { ...prev, stories_count: (prev.stories_count || 0) + 1 } : prev);
  };

  const handleDeleteStory = async (storyId: string) => {
    await apiFetch(`/api/stories/${encodeURIComponent(storyId)}`, { method: 'DELETE' });
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    setUser((prev) => prev ? { ...prev, stories_count: Math.max(0, (prev.stories_count || 0) - 1) } : prev);
  };

  // ────────────────────────────────────────────────────────
  // RENDER STATES
  // ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw size={24} className="text-[#4A9EFF] animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Loading profile...
        </span>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <>
        <SEO title="Profile Not Found | JobsReport" description="This profile does not exist." />
        <div className="text-center py-24 px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <X size={24} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6 text-sm">This user doesn't exist or the profile was removed.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] rounded-xl text-white font-bold text-sm"
          >
            <ChevronLeft size={16} /> Back Home
          </Link>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────────────────
  const handle = user.username ? `@${user.username}` : (user.email || '').split('@')[0];
  const avatar = user.profile_image_url || DEFAULT_AVATAR(user.name, user.id);
  const isVerified = user.is_verified === 1 || user.is_verified === true as any;

  return (
    <>
      <SEO
        title={`${user.name}${user.headline ? ' — ' + user.headline : ''} | JobsReport`}
        description={user.bio || `${user.name} on JobsReport — job listings and career stories.`}
        ogTitle={user.name}
        ogDescription={user.bio || ''}
        ogImage={user.profile_image_url || undefined}
      />

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* ───────────────────────────────────────────────── */}
        {/* HEADER                                            */}
        {/* ───────────────────────────────────────────────── */}
        <div className="pt-6 pb-4">
          {/* Cover */}
          <div className="relative w-full h-[140px] sm:h-[180px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#1877F2]/30 via-[#7B4DFF]/20 to-[#A033FF]/30 mb-4">
            {user.cover_image_url && (
              <img src={user.cover_image_url} alt="cover" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B18]/60 via-transparent to-transparent" />
          </div>

          {/* Avatar + name row */}
          <div className="flex items-start gap-4 -mt-[60px] px-1 sm:px-2 relative z-10">
            <div className="relative shrink-0">
              <div className="w-[92px] h-[92px] sm:w-[110px] sm:h-[110px] rounded-full p-[3px] bg-gradient-to-br from-[#1877F2] via-[#7B4DFF] to-[#A033FF]">
                <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-[#050B18] bg-[#0B1120]">
                  <img
                    src={avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR(user.name, user.id); }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-14 sm:pt-16">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                  {user.name}
                </h1>
                {isVerified && (
                  <BadgeCheck size={18} className="text-[#4A9EFF] shrink-0" />
                )}
              </div>
              {handle && (
                <p className="text-[13px] text-gray-500 font-medium mt-0.5 truncate">{handle}</p>
              )}
            </div>
          </div>

          {/* Headline */}
          {user.headline && (
            <p className="text-white text-[15px] font-semibold mt-4 leading-snug">
              {user.headline}
            </p>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-300 text-[14px] leading-relaxed mt-2 whitespace-pre-wrap">
              {user.bio}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[12.5px] text-gray-500">
            {user.work && (
              <span className="flex items-center gap-1.5">
                <Briefcase size={12} className="text-gray-400" />
                {user.work}
              </span>
            )}
            {user.education && (
              <span className="flex items-center gap-1.5">
                <GraduationCap size={12} className="text-gray-400" />
                {user.education}
              </span>
            )}
            {user.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-gray-400" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#4A9EFF] hover:underline"
              >
                <Globe size={12} />
                {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {user.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#4A9EFF] hover:underline"
              >
                <Linkedin size={12} />
                LinkedIn
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 mt-4 text-[13px]">
            <div>
              <span className="font-bold text-white">{fmtCount(user.followers_count || 0)}</span>
              <span className="text-gray-500 ml-1">followers</span>
            </div>
            <div>
              <span className="font-bold text-white">{fmtCount(user.jobs_count || jobs.length)}</span>
              <span className="text-gray-500 ml-1">job adverts</span>
            </div>
            <div>
              <span className="font-bold text-white">{fmtCount(user.stories_count || stories.length)}</span>
              <span className="text-gray-500 ml-1">stories</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-colors"
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
                <button
                  onClick={() => setCreateStoryOpen(true)}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#7B4DFF] hover:opacity-90 text-white font-bold text-[13px] flex items-center justify-center gap-1.5 transition-opacity"
                >
                  <Plus size={14} />
                  New Story
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-1 h-10 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                    following
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white'
                      : 'bg-[#1877F2] hover:bg-[#166FE5] text-white'
                  }`}
                >
                  {followLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : following ? (
                    <UserCheck size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {following ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleShareProfile}
                  className="h-10 w-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white flex items-center justify-center transition-colors"
                  aria-label="Share profile"
                >
                  <Share2 size={14} />
                </button>
              </>
            )}
          </div>

          {/* ───────────────────────────────────────────────── */}
          {/* STORIES ROW (mini)                                */}
          {/* ───────────────────────────────────────────────── */}
          {stories.length > 0 && (
            <div className="mt-6">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
                {stories.map((s) => {
                  const thumb = s.media_thumb || '';
                  return (
                    <button
                      key={s.id}
                      onClick={() => setViewingStory(s)}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                      <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-br from-[#1877F2] via-[#7B4DFF] to-[#A033FF]">
                        <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-[#050B18] bg-[#0B1120]">
                          {s.type === 'text' && !thumb ? (
                            <div
                              className="w-full h-full flex items-center justify-center text-[8px] font-black text-white px-1 text-center leading-tight"
                              style={{ background: s.background_style || '#0B1120' }}
                            >
                              {(s.text_content || '').slice(0, 12)}
                            </div>
                          ) : (
                            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 max-w-[64px] truncate">
                        {formatRelative(s.created_at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────── */}
          {/* TABS                                              */}
          {/* ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-6 mt-6 border-b border-white/[0.06]">
            {[
              { key: 'jobs' as const, label: 'Job Adverts', icon: <Briefcase size={14} />, count: jobs.length },
              { key: 'stories' as const, label: 'Stories', icon: <Instagram size={14} />, count: stories.length },
              { key: 'about' as const, label: 'About', icon: <MessageCircle size={14} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-3 text-[13px] font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-[#1877F2]/20 text-[#4A9EFF]' : 'bg-white/5 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1877F2] to-[#A033FF] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ───────────────────────────────────────────────── */}
        {/* TAB CONTENT                                       */}
        {/* ───────────────────────────────────────────────── */}
        <div className="mt-4">
          {/* JOB ADVERTS */}
          {activeTab === 'jobs' && (
            <div>
              {jobs.length === 0 ? (
                <EmptyState
                  icon={<Briefcase size={28} />}
                  title="No job adverts yet"
                  subtitle={isOwnProfile ? 'Post a job to attract candidates' : "This user hasn't posted any jobs yet"}
                  action={isOwnProfile ? { label: 'Post a Job', onClick: () => navigate('/admin') } : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {jobs.map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              )}
            </div>
          )}

          {/* STORIES */}
          {activeTab === 'stories' && (
            <div>
              {stories.length === 0 ? (
                <EmptyState
                  icon={<Instagram size={28} />}
                  title="No stories yet"
                  subtitle={isOwnProfile ? 'Share your first story — job wins, tips, updates' : "This user hasn't shared any stories yet"}
                  action={isOwnProfile ? { label: 'Create Story', onClick: () => setCreateStoryOpen(true) } : undefined}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stories.map((s) => {
                    const thumb = s.media_thumb || '';
                    return (
                      <button
                        key={s.id}
                        onClick={() => setViewingStory(s)}
                        className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] hover:border-[#1877F2]/30 transition-all text-left"
                      >
                        {s.type === 'text' ? (
                          <div
                            className="absolute inset-0 p-3 flex items-center justify-center text-center"
                            style={{ background: s.background_style || '#0B1120' }}
                          >
                            <span className="text-white text-xs font-bold line-clamp-6">
                              {s.text_content}
                            </span>
                          </div>
                        ) : thumb ? (
                          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1877F2] to-[#7B4DFF]">
                            <ImageIcon size={28} className="text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white/80 text-[10px] flex items-center gap-1">
                            <Eye size={9} /> {fmtCount(s.views_count || 0)} · {formatRelative(s.created_at)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-3">
              <AboutCard
                icon={<MessageCircle size={16} />}
                title="Bio"
                value={user.bio || (isOwnProfile ? 'Add a short bio' : 'No bio available')}
                muted={!user.bio}
                onClick={isOwnProfile && !user.bio ? () => setEditing(true) : undefined}
              />
              <AboutCard
                icon={<Briefcase size={16} />}
                title="Work"
                value={user.work || (isOwnProfile ? 'Add current company' : 'Not specified')}
                muted={!user.work}
                onClick={isOwnProfile && !user.work ? () => setEditing(true) : undefined}
              />
              <AboutCard
                icon={<GraduationCap size={16} />}
                title="Education"
                value={user.education || (isOwnProfile ? 'Add education' : 'Not specified')}
                muted={!user.education}
                onClick={isOwnProfile && !user.education ? () => setEditing(true) : undefined}
              />
              <AboutCard
                icon={<MapPin size={16} />}
                title="Location"
                value={user.location || (isOwnProfile ? 'Add location' : 'Not specified')}
                muted={!user.location}
                onClick={isOwnProfile && !user.location ? () => setEditing(true) : undefined}
              />
              {user.website && (
                <AboutCard
                  icon={<Globe size={16} />}
                  title="Website"
                  value={user.website}
                  link={user.website}
                />
              )}
              {user.linkedin_url && (
                <AboutCard
                  icon={<Linkedin size={16} />}
                  title="LinkedIn"
                  value={user.linkedin_url}
                  link={user.linkedin_url}
                />
              )}
              <AboutCard
                icon={<Calendar size={16} />}
                title="Joined"
                value={user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              />
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────── */}
      {/* MODALS                                            */}
      {/* ───────────────────────────────────────────────── */}
      {editing && isOwnProfile && user && (
        <EditProfileModal
          user={user}
          onClose={() => setEditing(false)}
          onSave={handleSaveProfile}
        />
      )}

      {createStoryOpen && currentUser && (
        <CreateStoryModal
          currentUser={currentUser}
          onClose={() => setCreateStoryOpen(false)}
          onCreate={handleCreateStory}
        />
      )}

      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          user={
            viewingStory.user || {
              id: viewingStory.user_id,
              name: user.name,
              profile_image_url: user.profile_image_url,
            }
          }
          currentUser={currentUser}
          allStories={stories}
          onClose={() => setViewingStory(null)}
          onNext={() => {
            const idx = stories.findIndex((s) => s.id === viewingStory.id);
            const next = stories[idx + 1];
            if (next) setViewingStory(next); else setViewingStory(null);
          }}
          onPrev={() => {
            const idx = stories.findIndex((s) => s.id === viewingStory.id);
            const prev = stories[idx - 1];
            if (prev) setViewingStory(prev); else setViewingStory(null);
          }}
          onDeleteStory={isOwnProfile ? handleDeleteStory : undefined}
        />
      )}
    </>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, subtitle, action }) => (
  <div className="text-center py-16 px-4 rounded-3xl border border-white/5 bg-white/[0.01]">
    <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3 text-gray-500">
      {icon}
    </div>
    <p className="text-white font-bold text-sm mb-1">{title}</p>
    <p className="text-gray-500 text-xs mb-4 max-w-xs mx-auto">{subtitle}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold"
      >
        <Plus size={12} /> {action.label}
      </button>
    )}
  </div>
);

const AboutCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  muted?: boolean;
  link?: string;
  onClick?: () => void;
}> = ({ icon, title, value, muted, link, onClick }) => (
  <div
    className={`flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] ${onClick ? 'cursor-pointer hover:bg-white/[0.04] hover:border-[#1877F2]/30 transition-all' : ''}`}
    onClick={onClick}
  >
    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-gray-400 shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      {link ? (
        <a
          href={link.startsWith('http') ? link : `https://${link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-[#4A9EFF] hover:underline break-all flex items-center gap-1"
        >
          {value}
          <ExternalLink size={11} />
        </a>
      ) : (
        <p className={`text-[13px] break-words ${muted ? 'text-gray-500 italic' : 'text-white'}`}>
          {value}
        </p>
      )}
    </div>
  </div>
);
