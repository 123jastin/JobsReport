import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, RefreshCw, ArrowRight, Zap, BarChart3, Building2, Globe, Clock, MapPin, Briefcase, ChevronRight, Search, Code, Calculator, Palette, Headphones, Users, Shield, Truck, Stethoscope, BookOpen, Scale, Leaf, Settings, Utensils, ChevronDown, FileText, MessageCircle, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import TrendingCard from '../components/TrendingCard';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';
import { getIconForRole } from '../lib/roleIcons';

// Icon mapping
const ICON_COMPONENTS: Record<string, any> = {
  'code': Code,
  'bar-chart': BarChart3,
  'calculator': Calculator,
  'palette': Palette,
  'headphones': Headphones,
  'users': Users,
  'shield': Shield,
  'truck': Truck,
  'stethoscope': Stethoscope,
  'trending-up': TrendingUp,
  'briefcase': Briefcase,
  'book-open': BookOpen,
  'building': Building2,
  'zap': Zap,
  'settings': Settings,
  'scale': Scale,
  'leaf': Leaf,
  'utensils': Utensils,
};

interface Role {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function HomePage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [displayJobs, setDisplayJobs] = useState<any[]>([]);
  const [allActiveJobs, setAllActiveJobs] = useState<any[]>([]);
  const [spotlightCompanies, setSpotlightCompanies] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { selectedCountry, setSelectedCountry, currentFlag, countriesList } = useCountry();

  const INITIAL_CATEGORIES_COUNT = 10;

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
        const [homeRes, marketRes, rolesRes] = await Promise.all([
          fetch(`/api/home?country=${encodeURIComponent(countryParam)}`),
          fetch(`/api/market?country=${encodeURIComponent(countryParam)}`),
          fetch('/api/roles')
        ]);
        
        if (homeRes.ok) {
          const data = await homeRes.json();
          setTrends(Array.isArray(data.trends) ? data.trends : []);
          setReports(Array.isArray(data.reports) ? data.reports : []);
          setSpotlightCompanies(Array.isArray(data.spotlightCompanies) ? data.spotlightCompanies : []);
        }

        if (marketRes.ok) {
          const marketData = await marketRes.json();
          const activeJobs = (marketData.activeJobs || marketData.jobs || []).filter((j: any) => j.active !== false);
          setAllActiveJobs(activeJobs);
          setDisplayJobs(activeJobs.slice(0, 5));
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setRoles(Array.isArray(rolesData) ? rolesData : []);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedCountry]);

  const rolesWithCounts = roles.map(role => {
    const jobCount = allActiveJobs.filter((j: any) => 
      j.role?.toLowerCase() === role.name.toLowerCase()
    ).length;
    return { ...role, jobCount };
  }).sort((a, b) => b.jobCount - a.jobCount);

  const visibleCategories = showAllCategories 
    ? rolesWithCounts 
    : rolesWithCounts.slice(0, INITIAL_CATEGORIES_COUNT);
  
  const hiddenCount = rolesWithCounts.length - INITIAL_CATEGORIES_COUNT;

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
      "width": 112,
      "height": 112
    },
    "description": "JobsReport aggregates real-time job market data to help you find the best career opportunities.",
    "foundingDate": "2025",
    "areaServed": "Worldwide",
    "sameAs": ["https://www.facebook.com/J2Accessories"],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "jjovinatha@gmail.com",
      "telephone": "+255616069692"
    }
  };

  const topReports = reports.slice(0, 3);

  if (loading) {
    return (
      <>
        <SEO title={seoTitle} description={seoDescription} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCw size={24} className="text-blue-500 animate-spin" />
          <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
            Compiling Live Market Intelligence...
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogUrl={canonicalUrl}
        structuredData={[structuredData, organizationSchema]}
      />

      <div className="space-y-12">
        {/* Hero Section */}
        <section className="py-8 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Real-time Talent Intelligence
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
              {selectedCountry === 'Worldwide' ? (
                <>
                  Find Your Next<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500">
                    Career Opportunity.
                  </span>
                </>
              ) : (
                <>
                  Jobs in {selectedCountry}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500">
                    {currentFlag} Latest Vacancies.
                  </span>
                </>
              )}
            </h1>
            
            <p className="text-gray-400 text-lg md:text-2xl leading-relaxed max-w-2xl">
              {selectedCountry === 'Worldwide'
                ? 'Insight-first job discovery. We aggregate real-time market data to show you where the demand is actually shifting.'
                : `Find the latest jobs and career opportunities in ${selectedCountry}. Browse verified vacancies from top employers hiring in ${selectedCountry}.`}
            </p>
            
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm">
                <Zap size={16} className="text-blue-500" />
                <span className="text-gray-400">
                  <span className="text-white font-bold">{roles.length}</span> Job Categories
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 size={16} className="text-emerald-500" />
                <span className="text-gray-400">
                  <span className="text-white font-bold">{reports.length}</span> Market Reports
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={16} className="text-violet-500" />
                <span className="text-gray-400">
                  <span className="text-white font-bold">{allActiveJobs.length}</span> Active Jobs
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Job Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-violet-500"></div>
                Job Categories
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {showAllCategories 
                  ? `Showing all ${rolesWithCounts.length} categories` 
                  : `Top ${Math.min(INITIAL_CATEGORIES_COUNT, rolesWithCounts.length)} of ${rolesWithCounts.length} categories`}
              </p>
            </div>
            {rolesWithCounts.length > INITIAL_CATEGORIES_COUNT && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors group"
              >
                {showAllCategories ? (
                  <>
                    Show Less
                    <ChevronDown size={14} className="rotate-180 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                ) : (
                  <>
                    See More ({hiddenCount} more)
                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            )}
          </div>
          
          {rolesWithCounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm font-mono">No job categories available yet.</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={showAllCategories ? 'expanded' : 'collapsed'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {visibleCategories.map((role, index) => {
                  const iconName = getIconForRole(role.name, role.slug);
                  const IconComponent = ICON_COMPONENTS[iconName] || Briefcase;
                  const roleSlug = role.slug || role.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  
                  return (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                    >
                      <Link
                        to={`/role/${roleSlug}`}
                        className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all h-full flex flex-col"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <IconComponent size={20} className="text-blue-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
                          {role.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-auto">
                          {role.jobCount > 0 ? (
                            <span><span className="text-white font-bold">{role.jobCount}</span> job{role.jobCount !== 1 ? 's' : ''}</span>
                          ) : 'View jobs'}
                        </p>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {rolesWithCounts.length > INITIAL_CATEGORIES_COUNT && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-blue-500/30 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-all group"
              >
                {showAllCategories ? (
                  <><span>Show Less</span><ChevronDown size={14} className="rotate-180" /></>
                ) : (
                  <><span>See All {rolesWithCounts.length} Categories</span><ChevronDown size={14} /></>
                )}
              </button>
            </div>
          )}
        </section>

        {/* AD #1 - After Categories */}
        <AdBanner key="home-ad-1" slot="4550717155" />

        {/* Top 5 Jobs */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>
                Latest Opportunities
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
                <Link key={job.id} to={`/market/${job.slug || job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`}
                  className="block p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {job.logoUrl ? <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" /> :
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">{job.company?.charAt(0)?.toUpperCase()||'?'}</div>}
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

        {/* Top 3 Reports */}
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

        {/* Explore Jobs by Country */}
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

        {/* Weekly Spotlight */}
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

        {/* AD #2 - After Spotlight */}
        <AdBanner key="home-ad-2" slot="1373889473" />

        {/* 🔥 Footer Links Section - Below Weekly Spotlight */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about-us" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact-us" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/companies" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Companies</Link></li>
                <li><Link to="/regions" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Job Regions</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Disclaimer</Link></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Connect</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://whatsapp.com/channel/0029VaEGsli6LwHnfhKhO81k" target="_blank" rel="noopener noreferrer" 
                    className="text-[10px] text-gray-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    <MessageCircle size={10} /> WhatsApp Channel
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/J2Accessories" target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    <Flag size={10} /> Facebook Page
                  </a>
                </li>
                <li>
                  <a href="mailto:jjovinatha@gmail.com"
                    className="text-[10px] text-gray-500 hover:text-violet-400 transition-colors flex items-center gap-1.5">
                    <FileText size={10} /> Email Us
                  </a>
                </li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">JobsReport.online</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Real-time job market intelligence platform. Helping job seekers discover employment opportunities across Tanzania and beyond.
              </p>
              <p className="text-[9px] text-gray-600 mt-2 font-mono">© 2026 JobsReport</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
