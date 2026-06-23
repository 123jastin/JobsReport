import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Search, TrendingUp, Clock, Globe,
  RefreshCw, Filter, ArrowUpRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { RawJob, Company } from '../types';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import { useCountry } from '../context/CountryContext';

const getJobSlug = (job: RawJob): string => {
  if ((job as any).slug) return `/market/${(job as any).slug}`;
  const titleSlug = job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/market/${titleSlug}-${job.id}`;
};

const JOBS_PER_PAGE = 15;

export default function MarketPage() {
  const navigate = useNavigate();
  const { page: pageParam, query, categorySlug, roleSlug } = useParams<{ 
    page?: string; query?: string; categorySlug?: string; roleSlug?: string;
  }>();
  
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const categoryFromPath = categorySlug ? categorySlug.replace(/-/g, ' ') : '';
  const roleFromPath = roleSlug ? roleSlug.replace(/-/g, ' ') : '';
  
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalActiveJobs, setTotalActiveJobs] = useState(0);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'All';
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  useEffect(() => {
    if (query) {
      setSearchQuery(decodeURIComponent(query).replace(/-/g, ' '));
    }
  }, [query]);

  useEffect(() => {
    async function loadMarketData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/market?limit=${JOBS_PER_PAGE}&page=${currentPage}`);
        if (response.ok) {
          const data = await response.json();
          setJobs(Array.isArray(data.activeJobs) ? data.activeJobs : (Array.isArray(data.jobs) ? data.jobs : []));
          setCompanies(Array.isArray(data.companies) ? data.companies : []);
          setRoles(['All', ...(Array.isArray(data.roles) ? data.roles : [])]);
          setTotalJobs(data.stats?.totalJobs || 0);
          setTotalActiveJobs(data.stats?.totalJobs || 0);
        }
      } catch (err) {} finally { setLoading(false); }
    }
    loadMarketData();
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    if (currentPage !== 1 && (searchQuery || selectedRole !== 'All' || selectedCountry !== 'Worldwide')) {
      navigate('/market', { replace: true });
    }
  }, [searchQuery, selectedRole, selectedCountry]);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    setSelectedRole(roleParam || 'All');
  }, [searchParams]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    const newParams = new URLSearchParams(searchParams);
    if (role === 'All') newParams.delete('role');
    else newParams.set('role', role);
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const basePath = categoryFromPath ? `/category/${categorySlug}` : roleFromPath ? `/role/${roleSlug}` : '/market';
    if (page === 1) navigate(basePath);
    else navigate(`${basePath}/page/${page}`);
  };

  const getCompanyLogo = (companyName: string) => {
    return companies.find(c => c.name.toLowerCase() === companyName.toLowerCase())?.logoUrl;
  };

  // 🔥 Filter: category/role from URL + search + role dropdown + country
  const activeJobs = jobs.filter(j => {
    if (j.active === false) return false;
    if (categoryFromPath && !(j.job_category || '').toLowerCase().includes(categoryFromPath.toLowerCase())) return false;
    if (roleFromPath && !(j.role || '').toLowerCase().includes(roleFromPath.toLowerCase())) return false;
    if (searchQuery && !j.title.toLowerCase().includes(searchQuery.toLowerCase()) && !j.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedRole !== 'All' && j.role !== selectedRole) return false;
    if (selectedCountry !== 'Worldwide' && (j.country || '').toLowerCase() !== selectedCountry.toLowerCase()) return false;
    return true;
  });

  const uniqueCompanies = Array.from(new Set(activeJobs.map(j => j.company))).length;
  const uniqueRoles = roles.filter(r => r !== 'All').length;

  const countryText = selectedCountry === 'Worldwide' ? '' : selectedCountry;
  const roleText = selectedRole !== 'All' ? selectedRole : '';

  const pageTitle = categoryFromPath
    ? `${categoryFromPath} Jobs | Browse ${categoryFromPath} Vacancies | JobsReport`
    : roleFromPath
      ? `${roleFromPath} Jobs | Find ${roleFromPath} Vacancies | JobsReport`
      : currentPage > 1
        ? `Browse Jobs - Page ${currentPage} | JobsReport`
        : selectedCountry === 'Worldwide'
          ? roleText ? `${roleText} Jobs | Find ${roleText} Vacancies Worldwide | JobsReport` : 'Browse All Jobs | Latest Job Vacancies & Opportunities | JobsReport'
          : roleText ? `${roleText} Jobs in ${countryText} | ${roleText} Vacancies ${countryText} | JobsReport` : `Jobs in ${countryText} | Latest ${countryText} Vacancies & Careers | JobsReport`;

  const pageDescription = `Browse ${activeJobs.length} active ${categoryFromPath || roleFromPath || ''} job listings${currentPage > 1 ? ` (Page ${currentPage})` : ''} across ${uniqueRoles} categories from ${uniqueCompanies} companies.`;

  const pageKeywords = categoryFromPath
    ? `${categoryFromPath.toLowerCase()} jobs, ${categoryFromPath.toLowerCase()} vacancies, ${categoryFromPath.toLowerCase()} careers`
    : roleFromPath
      ? `${roleFromPath.toLowerCase()} jobs, ${roleFromPath.toLowerCase()} vacancies`
      : selectedCountry === 'Worldwide'
        ? `jobs, job vacancies, career opportunities, find jobs, ${roleText || 'all'} jobs, latest jobs`
        : `jobs in ${countryText}, ${countryText} jobs, ${countryText} vacancies`;

  const canonicalUrl = categoryFromPath
    ? `https://jobsreport.online/category/${categorySlug}`
    : roleFromPath
      ? `https://jobsreport.online/role/${roleSlug}`
      : currentPage > 1
        ? `https://jobsreport.online/market/page/${currentPage}`
        : 'https://jobsreport.online/market';

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle, "description": pageDescription, "url": canonicalUrl,
    "isPartOf": { "@type": "WebSite", "name": "JobsReport", "url": "https://jobsreport.online" },
    "about": categoryFromPath ? { "@type": "Thing", "name": categoryFromPath } : selectedCountry !== 'Worldwide' ? { "@type": "Place", "name": selectedCountry } : undefined,
    "mainEntity": {
      "@type": "ItemList", "numberOfItems": activeJobs.length,
      "itemListElement": activeJobs.slice(0, 20).map((job, index) => ({
        "@type": "ListItem", "position": index + 1,
        "url": `https://jobsreport.online${getJobSlug(job)}`, "name": job.title
      }))
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jobsreport.online" },
      ...(categoryFromPath ? [{ "@type": "ListItem", "position": 2, "name": `${categoryFromPath} Jobs`, "item": canonicalUrl }]
        : roleFromPath ? [{ "@type": "ListItem", "position": 2, "name": `${roleFromPath} Jobs`, "item": canonicalUrl }]
        : selectedCountry !== 'Worldwide' ? [{ "@type": "ListItem", "position": 2, "name": `Jobs in ${selectedCountry}`, "item": `https://jobsreport.online/country/${selectedCountry.toLowerCase().replace(/\s+/g, '-')}` }] : []),
      ...(currentPage > 1 && !categoryFromPath && !roleFromPath ? [{ "@type": "ListItem", "position": selectedCountry !== 'Worldwide' ? 3 : 2, "name": `Page ${currentPage}`, "item": canonicalUrl }] : [])
    ]
  };

  const InFeedAd = ({ slot, layoutKey, index }: { slot: string; layoutKey: string; index: number }) => {
    const adRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const timer = setTimeout(() => {
        if (adRef.current) {
          adRef.current.innerHTML = '';
          const ins = document.createElement('ins');
          ins.className = 'adsbygoogle';
          ins.style.display = 'block';
          ins.style.background = 'transparent';
          ins.setAttribute('data-ad-format', 'fluid');
          ins.setAttribute('data-ad-layout-key', layoutKey);
          ins.setAttribute('data-ad-client', 'ca-pub-8155064094205693');
          ins.setAttribute('data-ad-slot', slot);
          adRef.current.appendChild(ins);
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        }
      }, 200);
      return () => clearTimeout(timer);
    }, [slot, layoutKey]);
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index * 0.04, 0.4) } }}
        className="p-4 rounded-3xl border border-white/5 transition-all duration-300" style={{ background: 'transparent' }}>
        <div ref={adRef} />
      </motion.div>
    );
  };

  const JobCard = ({ job, idx }: { job: RawJob; idx: number }) => {
    const companyLogo = getCompanyLogo(job.company);
    return (
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(idx * 0.04, 0.4) } }}
        exit={{ opacity: 0, scale: 0.95 }} key={job.id || idx}
        className="group p-5 bg-white/[0.01] border hover:bg-white/[0.03] border-white/5 rounded-3xl transition-all duration-300">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center p-0.5 mt-0.5">
            {companyLogo ? <img src={companyLogo} alt={`${job.company} logo`} className="w-full h-full object-cover rounded-xl" />
              : <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 font-mono">{job.company?.charAt(0)?.toUpperCase() || '?'}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 font-mono uppercase">{job.role || 'Unknown'}</span>
              <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Clock size={11} />{job.postedAt || 'Recent'}</span>
            </div>
            <Link to={getJobSlug(job)}>
              <h3 className="font-bold text-white text-base leading-tight hover:text-blue-400 transition-colors cursor-pointer">{job.title}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400 font-medium">{job.company}</span>
              {job.location && <><span className="text-gray-600 font-mono">•</span><span className="text-xs text-gray-500 font-medium">{job.location}</span></>}
            </div>
            {job.salary && <span className="text-[10px] text-emerald-400 font-mono mt-1 block">{job.salary}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">SIGNAL: JR-{job.id?.toString().slice(0, 4).toUpperCase() || '????'}</span>
          {job.expiresAt && <span className="text-[9px] text-gray-500 font-mono">Expires: {job.expiresAt}</span>}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <>
        <SEO title={pageTitle} description={pageDescription} />
        <div className="flex items-center justify-center min-h-[50vh]"><RefreshCw size={24} className="text-blue-500 animate-spin" /></div>
      </>
    );
  }

  return (
    <>
      <SEO title={pageTitle} description={pageDescription} keywords={pageKeywords} canonicalUrl={canonicalUrl}
        ogTitle={pageTitle} ogDescription={pageDescription} ogUrl={canonicalUrl}
        structuredData={[collectionPageSchema, breadcrumbSchema]} />

      <div className="space-y-8 pb-12">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-2 font-mono">
            <TrendingUp size={14} /> {categoryFromPath ? `${categoryFromPath.toUpperCase()} CATEGORY` : selectedCountry === 'Worldwide' ? 'GLOBAL' : `${selectedCountry.toUpperCase()} REGIONAL`} MARKET TELEMETRY
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest leading-none uppercase">
            {categoryFromPath ? `${categoryFromPath} Jobs` : roleFromPath ? `${roleFromPath} Jobs` : selectedCountry === 'Worldwide' ? roleText ? `${roleText} Jobs` : 'Live Job Market' : roleText ? `${roleText} Jobs in ${countryText}` : `Jobs in ${countryText}`} {currentFlag}
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mt-2">
            Browse {activeJobs.length} active {categoryFromPath || roleFromPath || ''} job listings across {uniqueCompanies} companies.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Signals</p>
            <p className="text-2xl font-mono text-white mt-1">{activeJobs.length}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">on this page</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Hiring Entities</p>
            <p className="text-2xl font-mono text-white mt-1">{uniqueCompanies}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Market Sectors</p>
            <p className="text-2xl font-mono text-white mt-1">{uniqueRoles}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold">Signal Integrity</p>
            <p className="text-2xl font-mono text-green-400 mt-1">100%</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search title or company..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {roles.map(role => (
              <button key={role} onClick={() => handleRoleSelect(role)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${selectedRole === role ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'text-gray-500 hover:text-white bg-white/5 hover:bg-white/10'}`}>
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span className="flex items-center gap-2"><Filter size={12} className="text-blue-500" />STREAMING {activeJobs.length} VERIFIED MARKET SIGNALS</span>
            {totalPages > 1 && <span className="text-[10px] font-mono">Page {currentPage} of {totalPages}</span>}
          </div>

          <AnimatePresence mode="popLayout">
            {activeJobs.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10">
                <Globe size={32} className="text-gray-600 mx-auto mb-4" />
                <p className="text-white font-bold text-sm">No Active Market Signals Found</p>
                <p className="text-xs text-gray-500 mt-1">No verified job listings matching your filters.</p>
                <button onClick={() => { setSearchQuery(''); setSelectedRole('All'); setSelectedCountry('Worldwide'); navigate(categoryFromPath ? `/category/${categorySlug}` : roleFromPath ? `/role/${roleSlug}` : '/market'); }}
                  className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">Reset Filters</button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeJobs.map((job, idx) => {
                  const elements = [];
                  elements.push(<JobCard key={job.id || idx} job={job} idx={idx} />);
                  if ((idx + 1) % 3 === 0 && idx < activeJobs.length - 1) {
                    const adNumber = Math.floor((idx + 1) / 3);
                    const adKey = `infeed-${idx}-${currentPage}`;
                    elements.push(<InFeedAd key={adKey} slot={adNumber % 2 === 1 ? "1805968460" : "9872160747"} layoutKey={adNumber % 2 === 1 ? "-h0-1a+31-4t+7z" : "-gh-1o+14-67+ka"} index={idx + 1} />);
                  }
                  return elements;
                }).flat()}
              </div>
            )}
          </AnimatePresence>
        </div>

        {currentPage < totalPages && (
          <div className="pt-4 space-y-4">
            <button onClick={() => handlePageChange(currentPage + 1)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/30 hover:border-blue-500/50 hover:from-blue-600/30 hover:to-violet-600/30 text-white font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 group">
              <span>See More Jobs</span><ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[10px] text-gray-500 font-mono">Showing page {currentPage} of {totalPages} • {activeJobs.length} jobs on this page</p>
          </div>
        )}

        {currentPage < totalPages && <AdBanner key={`load-more-ad-${currentPage}`} slot="5466053430" />}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1">
              <ChevronLeft size={14} /> Prev</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2).map((p, idx, arr) => (
                <div key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-600 px-1">...</span>}
                  <button onClick={() => handlePageChange(p)} className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>{p}</button>
                </div>
              ))}
            </div>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1">
              Next <ChevronRight size={14} /></button>
          </div>
        )}

        <AdBanner key={`market-footer-${currentPage}`} slot="5466053430" />

        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/20 to-violet-950/20 border border-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div><h4 className="font-bold text-white text-sm">Ingest new market signals?</h4><p className="text-xs text-gray-400 mt-1">Access the Admin Studio to add raw market data.</p></div>
          <Link to="/admin" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2">Admin Studio <ArrowUpRight size={12} /></Link>
        </div>
      </div>
    </>
  );
}
