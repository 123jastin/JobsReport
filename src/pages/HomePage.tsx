import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, RefreshCw, ArrowRight, Zap, BarChart3, Building2, Globe, Clock, MapPin, Briefcase, ChevronRight, Search, Code, Calculator, Palette, Headphones, Users, Shield, Truck, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TrendingCard from '../components/TrendingCard';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';

// Role categories with icons and SEO-friendly slugs
const ROLE_CATEGORIES = [
  { name: 'Software Engineer', icon: Code, slug: 'software-engineer', color: 'blue' },
  { name: 'Data Analyst', icon: BarChart3, slug: 'data-analyst', color: 'violet' },
  { name: 'Accountant', icon: Calculator, slug: 'accountant', color: 'emerald' },
  { name: 'UI/UX Designer', icon: Palette, slug: 'ui-ux-designer', color: 'pink' },
  { name: 'Customer Support', icon: Headphones, slug: 'customer-support', color: 'orange' },
  { name: 'Project Manager', icon: Users, slug: 'project-manager', color: 'cyan' },
  { name: 'Cybersecurity', icon: Shield, slug: 'cybersecurity', color: 'red' },
  { name: 'Logistics', icon: Truck, slug: 'logistics', color: 'yellow' },
  { name: 'Healthcare', icon: Stethoscope, slug: 'healthcare', color: 'green' },
  { name: 'Marketing', icon: TrendingUp, slug: 'marketing', color: 'purple' },
  { name: 'Sales', icon: Briefcase, slug: 'sales', color: 'indigo' },
  { name: 'HR & Recruiting', icon: Users, slug: 'hr-recruiting', color: 'teal' },
];

export default function HomePage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [spotlightCompanies, setSpotlightCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCountry, setSelectedCountry, currentFlag, countriesList } = useCountry();

  // SEO metadata state
  const [pageMetadata, setPageMetadata] = useState({
    title: 'Jobs Worldwide | Find Latest Job Vacancies & Career Opportunities | JobsReport',
    description: 'Discover the latest job vacancies, trending roles, and career opportunities worldwide. Real-time job market intelligence with verified listings from top employers.',
    keywords: 'jobs worldwide, global jobs, international careers, find jobs, job vacancies, career opportunities',
    canonicalUrl: 'https://jobsreport.online',
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const countryParam = selectedCountry === 'Worldwide' ? '' : selectedCountry;
        const [homeRes, marketRes] = await Promise.all([
          fetch(`/api/home?country=${encodeURIComponent(countryParam)}`),
          fetch(`/api/market?country=${encodeURIComponent(countryParam)}`)
        ]);
        
        if (homeRes.ok) {
          const data = await homeRes.json();
          console.log('Home data loaded:', data);
          setTrends(Array.isArray(data.trends) ? data.trends : []);
          setReports(Array.isArray(data.reports) ? data.reports : []);
          setSpotlightCompanies(Array.isArray(data.spotlightCompanies) ? data.spotlightCompanies : []);
        }

        if (marketRes.ok) {
          const marketData = await marketRes.json();
          const activeJobs = (marketData.jobs || []).filter((j: any) => j.active !== false);
          setJobs(activeJobs.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedCountry]);

  // Update metadata when country changes
  useEffect(() => {
    const countryName = selectedCountry;
    const countrySlug = selectedCountry === 'Worldwide' 
      ? '' 
      : selectedCountry.toLowerCase().replace(/\s+/g, '-');
    
    setPageMetadata({
      title: selectedCountry === 'Worldwide'
        ? 'Jobs Worldwide | Find Latest Job Vacancies & Career Opportunities | JobsReport'
        : `Jobs in ${countryName} | Latest ${countryName} Vacancies & Careers | JobsReport`,
      description: selectedCountry === 'Worldwide'
        ? 'Discover the latest job vacancies, trending roles, and career opportunities worldwide. Real-time job market intelligence with verified listings.'
        : `Find the latest jobs, vacancies, and career opportunities in ${countryName}. Browse verified job listings from top employers in ${countryName}. Real-time market intelligence.`,
      keywords: selectedCountry === 'Worldwide'
        ? 'jobs worldwide, global jobs, international careers, find jobs, job vacancies'
        : `jobs in ${countryName}, ${countryName} jobs, ${countryName} vacancies, ${countryName} careers, find jobs in ${countryName}, ${countryName} employment`,
      canonicalUrl: selectedCountry === 'Worldwide'
        ? 'https://jobsreport.online'
        : `https://jobsreport.online/country/${countrySlug}`,
    });
  }, [selectedCountry]);

  const topReports = reports.slice(0, 3);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{pageMetadata.title}</title>
          <meta name="description" content={pageMetadata.description} />
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCw size={24} className="text-blue-500 animate-spin" />
          <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
            Compiling Live Market Intelligence...
          </span>
        </div>
      </>
    );
  }

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageMetadata.title,
    "description": pageMetadata.description,
    "url": pageMetadata.canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "JobsReport",
      "url": "https://jobsreport.online",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://jobsreport.online/market/search/{search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": jobs.map((job, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "JobPosting",
          "title": job.title,
          "hiringOrganization": {
            "@type": "Organization",
            "name": job.company
          },
          "jobLocation": {
            "@type": "Place",
            "address": job.location || 'Remote'
          }
        }
      }))
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords} />
        <link rel="canonical" href={pageMetadata.canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageMetadata.title} />
        <meta property="og:description" content={pageMetadata.description} />
        <meta property="og:url" content={pageMetadata.canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JobsReport" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageMetadata.title} />
        <meta name="twitter:description" content={pageMetadata.description} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="JobsReport" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="space-y-16">
        {/* Hero Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
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
            
            <p className="text-gray-400 text-lg md:text-2xl leading-relaxed max-w-2xl mb-8">
              {selectedCountry === 'Worldwide'
                ? 'Insight-first job discovery. We aggregate real-time market data to show you where the demand is actually shifting across the globe.'
                : `Find the latest jobs and career opportunities in ${selectedCountry}. Browse verified vacancies from top employers hiring in ${selectedCountry}.`}
            </p>
            
            {/* Search CTA */}
            <Link
              to="/market"
              className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all group"
            >
              <Search size={18} />
              <span>Browse All Jobs</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mt-10">
              <div className="flex items-center gap-2 text-sm">
                <Zap size={16} className="text-blue-500" />
                <span className="text-gray-400">
                  <span className="text-white font-bold">{trends.length}</span> Trending Roles
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
                  <span className="text-white font-bold">{jobs.length}</span> Active Jobs
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 🔥 Role Categories Section - SEO Gold */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-violet-500"></div>
                Popular Job Categories
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Browse jobs by role — find opportunities in your field
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ROLE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const countryPath = selectedCountry === 'Worldwide' ? '' : `/country/${selectedCountry.toLowerCase().replace(/\s+/g, '-')}`;
              
              return (
                <Link
                  key={category.slug}
                  to={`/market?role=${category.slug}`}
                  className={`group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-${category.color}-500/30 transition-all`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-${category.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={`text-${category.color}-400`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                    {category.name} Jobs
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 🔥 Top 5 Jobs Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>
                Latest Opportunities
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {selectedCountry === 'Worldwide'
                  ? 'Top active job listings from the global market telemetry stream'
                  : `Latest job vacancies in ${selectedCountry} — updated in real-time`}
              </p>
            </div>
            <Link 
              to="/market" 
              className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors group"
            >
              View All Jobs
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm font-mono">
              No active job listings yet. Market signals incoming...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job: any, idx: number) => (
                <article key={job.id}>
                  <Link 
                    to={`/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}
                    className="block p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all group h-full"
                  >
                    <div className="flex items-start gap-3">
                      {/* Company Logo */}
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {job.logoUrl ? (
                          <img src={job.logoUrl} alt={`${job.company} logo`} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                            {job.company?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-blue-500/10 text-blue-400 uppercase">
                            {job.role || 'General'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Building2 size={10} />{job.company}</span>
                          <span className="flex items-center gap-1"><MapPin size={10} />{job.location || 'Remote'}</span>
                        </div>
                        {job.salary && (
                          <span className="text-[9px] text-emerald-400 font-mono mt-1 block">{job.salary}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 🔥 Trending Section */}
        <section id="trending-section">
          <div className="flex items-center justify-between mb-8 px-1">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                Trending Roles
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {selectedCountry === 'Worldwide'
                  ? 'Real-time demand signals from active job market telemetry'
                  : `Most in-demand job roles in ${selectedCountry} right now`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">LIVE FEED</span>
            </div>
          </div>
          
          <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-1 px-1">
            {trends.length === 0 ? (
              <div className="flex items-center justify-center w-full py-12 text-gray-500 text-sm font-mono">
                No trending data available yet. Market signals incoming...
              </div>
            ) : (
              trends.map((trend: any, index: number) => (
                <TrendingCard key={trend.id} trend={trend} index={index} />
              ))
            )}
          </div>
        </section>

        {/* 📰 Top 3 Reports Section */}
        {topReports.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-violet-500"></div>
                  Market Intelligence Reports
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {selectedCountry === 'Worldwide'
                    ? 'In-depth analysis of global job market trends and sector insights'
                    : `Latest job market analysis and employment trends for ${selectedCountry}`}
                </p>
              </div>
              <Link 
                to="/reports" 
                className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors group"
              >
                View All Reports
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topReports.map((report: any) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </section>
        )}

        {/* 🌍 Explore Jobs by Country - SEO Internal Linking */}
        <section>
          <div className="flex items-center mb-8">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500"></div>
                Explore Jobs by Country
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Find job opportunities in your region 
              </p>
            </div>
          </div>
          
          <nav aria-label="Country navigation" className="flex flex-wrap gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCountry === 'Worldwide'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              🌍 Worldwide
            </Link>
            
            {countriesList.slice(0, 30).map((country) => {
              const countrySlug = country.name.toLowerCase().replace(/\s+/g, '-');
              const isActive = selectedCountry.toLowerCase() === country.name.toLowerCase();
              
              return (
                <Link
                  key={country.code}
                  to={`/country/${countrySlug}`}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {country.flag} {country.name}
                </Link>
              );
            })}
          </nav>
        </section>

        {/* 🏢 Weekly Spotlight */}
        <section id="companies-section">
          <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/10 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles size={20} className="text-blue-500" />
                    Weekly Spotlight
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedCountry === 'Worldwide'
                      ? 'Top companies actively shifting their hiring strategy based on market telemetry.'
                      : `Leading employers hiring in ${selectedCountry} — based on live market data.`}
                  </p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                  Live Market Data
                </span>
              </div>
              
              {spotlightCompanies.length === 0 ? (
                <div className="text-gray-500 text-sm font-mono py-4">
                  Computing employer activity metrics...
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                  {spotlightCompanies.map((company: string, idx: number) => (
                    <motion.span
                      key={company}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-lg md:text-xl font-black text-gray-300 hover:text-white uppercase tracking-tighter transition-colors cursor-default relative group"
                    >
                      {company}
                      <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          </div>
        </section>

        {/* SEO Footer Section */}
        <footer className="border-t border-white/5 pt-8 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Roles</h4>
              <ul className="space-y-2">
                {ROLE_CATEGORIES.slice(0, 6).map(cat => (
                  <li key={cat.slug}>
                    <Link 
                      to={`/market?role=${cat.slug}`}
                      className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      {cat.name} Jobs
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Top Countries</h4>
              <ul className="space-y-2">
                {countriesList.slice(0, 6).map(country => (
                  <li key={country.code}>
                    <Link 
                      to={`/country/${country.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      Jobs in {country.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/market" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Browse Jobs</Link></li>
                <li><Link to="/reports" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Market Reports</Link></li>
                <li><Link to="/" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">Worldwide Jobs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">About JobsReport</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                JobsReport shows real-time job market data to help job seekers to find the best career opportunities across different locations. 
                We track hiring trends across industries and locations worldwide and also helping companies hire various professionals from different backgrounds
              </p>
            </div>
          </div>
          <div className="text-center text-[10px] text-gray-600 font-mono">
            © {new Date().getFullYear()} JobsReport. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
