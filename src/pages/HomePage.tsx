import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, RefreshCw, ArrowRight, Zap, BarChart3, Building2, Globe, Clock, MapPin, Briefcase, ChevronRight, Search, Code, Calculator, Palette, Headphones, Users, Shield, Truck, Stethoscope, BookOpen, Scale, Leaf, Settings, Utensils, ChevronDown, ChevronLeft, FileText, MessageCircle, Flag, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import TrendingCard from '../components/TrendingCard';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';
import { useAuth } from '../context/AuthContext';
import { getIconForRole } from '../lib/roleIcons';
import {
  StoryViewer,
  CreateStoryModal,
  type StoryType,
  type StoryUser,
  type CreateStoryPayload,
} from './Story';

const ICON_COMPONENTS: Record<string, any> = {
  'code': Code, 'bar-chart': BarChart3, 'calculator': Calculator, 'palette': Palette,
  'headphones': Headphones, 'users': Users, 'shield': Shield, 'truck': Truck,
  'stethoscope': Stethoscope, 'trending-up': TrendingUp, 'briefcase': Briefcase,
  'book-open': BookOpen, 'building': Building2, 'zap': Zap, 'settings': Settings,
  'scale': Scale, 'leaf': Leaf, 'utensils': Utensils,
};

// ============================================================
// Instagram-style Story Bar (JobsReport blue → purple)
// ============================================================
const DEFAULT_AVATAR = (name: string, id: number) => {
  const colors = ['1877F2', '45BD62', 'F3425F', 'F7B928', '9360F7'];
  const c = colors[Math.abs(id) % colors.length];
  const init = (name || 'U').slice(0, 1).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(init)}&background=${c}&color=fff&size=128&bold=true&rounded=true`;
};

interface InstagramStoryBarProps {
  stories: StoryType[];
  currentUser: StoryUser | null;
  onViewStory: (s: StoryType) => void;
  onCreateStory: () => void;
  onRequestLogin: () => void;
  seenIds: Set<number>;
}

const InstagramStoryBar: React.FC<InstagramStoryBarProps> = ({
  stories,
  currentUser,
  onViewStory,
  onCreateStory,
  onRequestLogin,
  seenIds,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Deduplicate by user — keep latest story per user, current user first
  const perUser = (() => {
    const sorted = [...stories].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const seen = new Set<number>();
    const out: StoryType[] = [];
    const meId = Number(currentUser?.id || 0);
    const mine = sorted.filter((s) => Number(s.user_id) === meId);
    const others = sorted.filter((s) => Number(s.user_id) !== meId);
    for (const s of others) {
      if (seen.has(Number(s.user_id))) continue;
      seen.add(Number(s.user_id));
      out.push(s);
    }
    return { mine: mine[0], others: out };
  })();

  const hasStories = perUser.mine || perUser.others.length > 0;
  if (!hasStories && !currentUser) return null;

  return (
    <section className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* ── Your Story bubble — only for logged-in users ── */}
        {currentUser && (
          <button
            onClick={onCreateStory}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
            aria-label="Create your story"
          >
            <div className="relative">
              {/* Avatar circle */}
              <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-white/5">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#0B1120]">
                  <img
                    src={
                      currentUser.profile_image_url ||
                      DEFAULT_AVATAR(currentUser.name || 'User', currentUser.id || 0)
                    }
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* + badge — JobsReport blue→purple */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-[#0B1120]"
                style={{
                  background:
                    'linear-gradient(135deg, #1877F2 0%, #7B4DFF 60%, #A033FF 100%)',
                }}
              >
                <Plus size={12} strokeWidth={3.5} className="text-white" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-300 max-w-[72px] truncate">
              Your Story
            </span>
          </button>
        )}

        {/* ── Other users' stories ── */}
        {perUser.others.map((s) => {
          const u = s.user || {
            id: s.user_id,
            name: 'User',
            profile_image_url: DEFAULT_AVATAR('User', s.user_id),
          };
          const isSeen = seenIds.has(s.id);
          const thumb = s.media_thumb || s.media_url || '';

          return (
            <button
              key={s.id}
              onClick={() => onViewStory(s)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              aria-label={`View ${u.name}'s story`}
            >
              <div
                className="w-[68px] h-[68px] rounded-full p-[2.5px] transition-transform group-active:scale-95"
                style={
                  isSeen
                    ? { background: 'rgba(255,255,255,0.18)' }
                    : {
                        background:
                          'linear-gradient(135deg, #1877F2 0%, #7B4DFF 50%, #A033FF 100%)',
                      }
                }
              >
                <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-[#0B1120] bg-[#0B1120]">
                  {s.type === 'text' && !thumb ? (
                    <div
                      className="w-full h-full flex items-center justify-center text-[8px] font-black text-white px-1 text-center leading-tight"
                      style={{ background: s.background_style || '#0B1120' }}
                    >
                      {(s.text_content || '').slice(0, 12)}
                    </div>
                  ) : (
                    <img
                      src={u.profile_image_url || DEFAULT_AVATAR(u.name, u.id)}
                      alt={u.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR(u.name, u.id);
                      }}
                    />
                  )}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-gray-300 max-w-[72px] truncate">
                {u.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default function HomePage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [displayJobs, setDisplayJobs] = useState<any[]>([]);
  const [allActiveJobs, setAllActiveJobs] = useState<any[]>([]);
  const [spotlightCompanies, setSpotlightCompanies] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [workplaceTypes, setWorkplaceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const { selectedCountry, setSelectedCountry, currentFlag, countriesList } = useCountry();
  const { user: authUser } = useAuth() as any;
  const navigate = useNavigate();

  // Stories state
  const [stories, setStories] = useState<StoryType[]>([]);
  const [seenStoryIds, setSeenStoryIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('jobsreport_seen_stories');
      if (raw) return new Set<number>(JSON.parse(raw));
    } catch {}
    return new Set<number>();
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<StoryType | null>(null);

  const currentUser: StoryUser | null = authUser
    ? {
        id: authUser.id,
        name: authUser.name || authUser.username || 'User',
        username: authUser.username,
        email: authUser.email,
        profile_image_url: authUser.profile_image_url || authUser.avatar_url,
      }
    : null;

  const INITIAL_CATEGORIES_COUNT = 4;
  const CATEGORIES_PER_PAGE = 5;

  const countrySlug = selectedCountry === 'Worldwide' 
    ? '' 
    : selectedCountry.toLowerCase().replace(/\s+/g, '-');
  
  const seoTitle = selectedCountry === 'Worldwide'
    ? 'Jobs Worldwide | Find Latest Job Vacancies & Career Opportunities | JobsReport'
    : `Jobs in ${selectedCountry} | Latest ${selectedCountry} Vacancies & Careers | JobsReport`;
  
  const seoDescription = selectedCountry === 'Worldwide'
    ? 'Discover the latest job vacancies, trending roles, and career opportunities worldwide. Real-time job market intelligence with verified listings from top employers.'
    : `Find the latest jobs, vacancies, and career opportunities in ${selectedCountry}. Browse verified job listings from top employers hiring in ${selectedCountry}. Real-time market intelligence.`;
  
  const seoKeywords = selectedCountry === 'Worldwide'
    ? 'jobs worldwide, global jobs, international careers, find jobs, job vacancies, career opportunities'
    : `jobs in ${selectedCountry}, ${selectedCountry} jobs, ${selectedCountry} vacancies, ${selectedCountry} careers, find jobs in ${selectedCountry}`;
  
  const canonicalUrl = selectedCountry === 'Worldwide'
    ? 'https://jobsreport.online'
    : `https://jobsreport.online/country/${countrySlug}`;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const countryParam = selectedCountry === 'Worldwide' ? '' : selectedCountry;
        
        const [homeRes, marketRes, filtersRes] = await Promise.all([
          fetch(`/api/home?country=${encodeURIComponent(countryParam)}`),
          fetch(`/api/market?limit=5&country=${encodeURIComponent(countryParam)}`),
          fetch('/api/filters')
        ]);
        
        if (homeRes.ok) {
          const data = await homeRes.json();
          setTrends(Array.isArray(data.trends) ? data.trends : []);
          setReports(Array.isArray(data.reports) ? data.reports : []);
          setSpotlightCompanies(Array.isArray(data.spotlightCompanies) ? data.spotlightCompanies : []);
        }

        if (marketRes.ok) {
          const marketData = await marketRes.json();
          const activeJobs = (marketData.jobs || []).filter((j: any) => j.active !== false);
          setAllActiveJobs(activeJobs);
          setDisplayJobs(activeJobs.slice(0, 5));
        }

        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          setCategories(Array.isArray(filtersData.categories) ? filtersData.categories : []);
          setWorkplaceTypes(Array.isArray(filtersData.workplaceTypes) ? filtersData.workplaceTypes : []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedCountry]);

  // Fetch stories
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list: StoryType[] = Array.isArray(data?.stories)
          ? data.stories
          : Array.isArray(data)
          ? data
          : [];
        const now = Date.now();
        const active = list.filter((s) => {
          if (s.is_active === false) return false;
          if (!s.expires_at) return true;
          return new Date(s.expires_at).getTime() > now;
        });
        setStories(active);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const persistSeen = (set: Set<number>) => {
    try {
      localStorage.setItem('jobsreport_seen_stories', JSON.stringify([...set]));
    } catch {}
  };

  const markStorySeen = (id: number) => {
    setSeenStoryIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistSeen(next);
      return next;
    });
  };

  const refreshStories = async () => {
    try {
      const res = await fetch('/api/stories');
      if (!res.ok) return;
      const data = await res.json();
      const list: StoryType[] = Array.isArray(data?.stories)
        ? data.stories
        : Array.isArray(data)
        ? data
        : [];
      const now = Date.now();
      setStories(
        list.filter((s) => {
          if (s.is_active === false) return false;
          if (!s.expires_at) return true;
          return new Date(s.expires_at).getTime() > now;
        })
      );
    } catch {}
  };

  const handleCreateStory = async (payload: CreateStoryPayload) => {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshStories();
  };

  const handleDeleteStory = async (storyId: number) => {
    await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  const getVisibleCategories = () => {
    if (!showAllCategories) {
      return categories.slice(0, INITIAL_CATEGORIES_COUNT);
    }
    
    const startIndex = (categoryPage - 1) * CATEGORIES_PER_PAGE;
    const endIndex = startIndex + CATEGORIES_PER_PAGE;
    return categories.slice(startIndex, endIndex);
  };

  const visibleCategories = getVisibleCategories();
  const totalCategoryPages = Math.ceil(categories.length / CATEGORIES_PER_PAGE);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": seoTitle,
    "description": seoDescription,
    "url": canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "JobsReport",
      "url": "https://jobsreport.online",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://jobsreport.online/market/search/{search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "JobsReport",
    "alternateName": "JobsReport.online",
    "url": "https://jobsreport.online",
    "logo": {
      "@type": "ImageObject",
      "url": "https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png",
      "width": 112, "height": 112
    },
    "description": "JobsReport aggregates real-time job market data to help you find the best career opportunities.",
    "foundingDate": "2025",
    "areaServed": "Worldwide",
    "sameAs": ["https://www.facebook.com/J2Accessories"],
    "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "email": "jjovinatha@gmail.com", "telephone": "+255616069692" }
  };

  const topReports = reports.slice(0, 3);

  if (loading) {
    return (
      <>
        <SEO title={seoTitle} description={seoDescription} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCw size={24} className="text-blue-500 animate-spin" />
          <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Compiling Live Market Intelligence...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} keywords={seoKeywords} canonicalUrl={canonicalUrl}
        ogTitle={seoTitle} ogDescription={seoDescription} ogUrl={canonicalUrl}
        structuredData={[structuredData, organizationSchema]} />

      <div className="space-y-12">
        {/* Hero */}
        <section className="py-8 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Real-time Talent Intelligence
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
              {selectedCountry === 'Worldwide' ? (
                <>Find Your Next<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500">Career Opportunity.</span></>
              ) : (
                <>Jobs in {selectedCountry}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500">{currentFlag} Latest Vacancies.</span></>
              )}
            </h1>
            <p className="text-gray-400 text-lg md:text-2xl leading-relaxed max-w-2xl">
              {selectedCountry === 'Worldwide'
                ? 'Insight-first job discovery. We aggregate real-time market data to show you where the demand is actually shifting.'
                : `Find the latest jobs and career opportunities in ${selectedCountry}. Browse verified vacancies from top employers hiring in ${selectedCountry}.`}
            </p>
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm"><Zap size={16} className="text-blue-500" /><span className="text-gray-400"><span className="text-white font-bold">{categories.length}</span> Job Categories</span></div>
              <div className="flex items-center gap-2 text-sm"><BarChart3 size={16} className="text-emerald-500" /><span className="text-gray-400"><span className="text-white font-bold">{reports.length}</span> Market Reports</span></div>
              <div className="flex items-center gap-2 text-sm"><Building2 size={16} className="text-violet-500" /><span className="text-gray-400"><span className="text-white font-bold">{allActiveJobs.length}</span> Active Jobs</span></div>
            </div>
          </motion.div>
        </section>

        {/* 🔹 Instagram-style Story Bar */}
        <InstagramStoryBar
          stories={stories}
          currentUser={currentUser}
          onViewStory={(s) => {
            markStorySeen(s.id);
            setViewingStory(s);
          }}
          onCreateStory={() => setCreateOpen(true)}
          onRequestLogin={() => navigate('/')}
          seenIds={seenStoryIds}
        />

        {/* Job Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-violet-500"></div>Job Categories
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {showAllCategories 
                  ? `Showing ${visibleCategories.length} of ${categories.length} categories (Page ${categoryPage} of ${totalCategoryPages})` 
                  : `Top ${INITIAL_CATEGORIES_COUNT} categories`}
              </p>
            </div>
            {categories.length > INITIAL_CATEGORIES_COUNT && (
              <button onClick={() => {
                setShowAllCategories(!showAllCategories);
                setCategoryPage(1);
              }}
                className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors group">
                {showAllCategories ? (
                  <><span>Show Less</span><ChevronDown size={14} className="rotate-180" /></>
                ) : (
                  <><span>See All ({categories.length})</span><ChevronDown size={14} /></>
                )}
              </button>
            )}
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm font-mono">No job categories available yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleCategories.map((cat, index) => {
                  const iconName = getIconForRole(cat.name, cat.slug);
                  const IconComponent = ICON_COMPONENTS[iconName] || Briefcase;
                  return (
                    <motion.div key={cat.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}>
                      <Link to={`/category/${cat.slug}`}
                        className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all h-full flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <IconComponent size={20} className="text-blue-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{cat.name}</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-auto">
                          <span><span className="text-white font-bold">{cat.activeCount || 0}</span> active job{(cat.activeCount || 0) !== 1 ? 's' : ''}</span>
                        </p>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {showAllCategories && totalCategoryPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button 
                    onClick={() => setCategoryPage(Math.max(1, categoryPage - 1))}
                    disabled={categoryPage === 1}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map((p) => (
                      <button 
                        key={p}
                        onClick={() => setCategoryPage(p)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                          categoryPage === p 
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setCategoryPage(Math.min(totalCategoryPages, categoryPage + 1))}
                    disabled={categoryPage === totalCategoryPages}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Ad removed */}

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>Latest Opportunities
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {selectedCountry === 'Worldwide'
                  ? 'Top active job listings from the market telemetry stream'
                  : `Latest job vacancies in ${selectedCountry} — updated in real-time`}
              </p>
            </div>
            <Link to="/market" className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors group">
              View All Jobs <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {displayJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm font-mono">No active job listings yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayJobs.map((job: any) => (
                <Link 
                  key={job.id} 
                  to={`/market/${job.slug || `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}`}
                  className="block p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {job.logoUrl ? <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" />
                        : <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">{job.company?.charAt(0)?.toUpperCase()||'?'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-blue-500/10 text-blue-400 uppercase">{job.role||'General'}</span>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate mt-1">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><Building2 size={10} />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{job.location||'Remote'}</span>
                      </div>
                      {job.salary && <span className="text-[9px] text-emerald-400 font-mono mt-1 block">{job.salary}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {topReports.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-violet-500"></div>Latest Reports
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-mono">Market intelligence reports and sector analysis</p>
              </div>
              <Link to="/reports" className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors group">
                View All Reports <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topReports.map((report: any) => <ReportCard key={report.id} report={report} />)}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500"></div>Explore Jobs by Country
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">Find job opportunities in your country</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCountry==='Worldwide'?'bg-blue-500/20 text-blue-400 border border-blue-500/30':'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}>🌍 Worldwide</Link>
            {countriesList.map((country) => {
              const cSlug = country.name.toLowerCase().replace(/\s+/g, '-');
              const isActive = selectedCountry.toLowerCase() === country.name.toLowerCase();
              return (
                <Link key={country.code} to={`/country/${cSlug}`} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isActive?'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}>
                  {country.flag} {country.name}
                </Link>
              );
            })}
          </div>
          <div className="mt-4">
            <Link to="/regions" className="inline-flex items-center gap-2 text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-wider transition-colors group">
              <MapPin size={12} /><span>Browse Jobs by City & Region</span><ArrowRight size={12} />
            </Link>
          </div>
        </section>

        <section id="companies-section">
          <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/10 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Sparkles size={20} className="text-blue-500" />Weekly Spotlight</h3>
                  <p className="text-gray-400 text-sm">Top companies actively shifting their hiring strategy based on market telemetry.</p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Live Market Data</span>
              </div>
              {spotlightCompanies.length === 0 ? (
                <div className="text-gray-500 text-sm font-mono py-4">Computing employer activity metrics...</div>
              ) : (
                <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                  {spotlightCompanies.map((company: string, idx: number) => (
                    <motion.span key={company} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="text-lg md:text-xl font-black text-gray-300 hover:text-white uppercase tracking-tighter transition-colors cursor-default relative group">
                      {company}<span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          </div>
        </section>

        {/* Ad removed */}

        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about-us" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact-us" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/companies" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Companies</Link></li>
                <li><Link to="/regions" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Job Regions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Connect</h4>
              <ul className="space-y-2">
                <li><a href="https://whatsapp.com/channel/0029VaEGsli6LwHnfhKhO81k" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5"><MessageCircle size={10} /> WhatsApp Channel</a></li>
                <li><a href="https://www.facebook.com/J2Accessories" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1.5"><Flag size={10} /> Facebook Page</a></li>
                <li><a href="mailto:jjovinatha@gmail.com" className="text-[10px] text-gray-500 hover:text-violet-400 transition-colors flex items-center gap-1.5"><FileText size={10} /> Email Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">JobsReport.online</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">Real-time job market intelligence platform. Helping job seekers discover employment opportunities across Tanzania and beyond.</p>
              <p className="text-[9px] text-gray-600 mt-2 font-mono">© 2026 JobsReport</p>
            </div>
          </div>
        </section>
      </div>

      {/* Story modals */}
      {createOpen && currentUser && (
        <CreateStoryModal
          currentUser={currentUser}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateStory}
        />
      )}

      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          user={
            viewingStory.user || {
              id: viewingStory.user_id,
              name: 'User',
              profile_image_url: DEFAULT_AVATAR('User', viewingStory.user_id),
            }
          }
          currentUser={currentUser}
          allStories={stories}
          onClose={() => setViewingStory(null)}
          onNext={() => {
            const idx = stories.findIndex((s) => s.id === viewingStory.id);
            if (stories[idx + 1]) {
              markStorySeen(stories[idx + 1].id);
              setViewingStory(stories[idx + 1]);
            } else {
              setViewingStory(null);
            }
          }}
          onPrev={() => {
            const idx = stories.findIndex((s) => s.id === viewingStory.id);
            if (stories[idx - 1]) {
              markStorySeen(stories[idx - 1].id);
              setViewingStory(stories[idx - 1]);
            } else {
              setViewingStory(null);
            }
          }}
          onProfileClick={(id) => navigate(`/companies/${id}`)}
          onDeleteStory={handleDeleteStory}
          onViewRecorded={(id) => {
            setStories((prev) =>
              prev.map((s) =>
                s.id === id ? { ...s, views_count: (s.views_count || 0) + 1 } : s
              )
            );
          }}
        />
      )}
    </>
  );
}
