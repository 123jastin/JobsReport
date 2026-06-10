import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Calendar, TrendingUp, Search, RefreshCw, Star, ArrowUpRight, Globe, Filter, ChevronRight } from 'lucide-react';
import { Report } from '../types';
import ReportCard from '../components/ReportCard';
import SEO from '../components/SEO';
import { useCountry } from '../context/CountryContext';

export default function ReportsPage() {
  // 🔥 FIX 1: Read country from URL params for real indexable pages
  const { country: urlCountry } = useParams();
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔥 FIX 1: Set country from URL on mount (creates real indexable pages)
  useEffect(() => {
    if (urlCountry) {
      // Convert slug back to country name
      const countryName = urlCountry
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setSelectedCountry(countryName);
    }
  }, [urlCountry, setSelectedCountry]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setError(null);
        const response = await fetch('/api/reports');
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Reports loaded:', data);
        
        if (Array.isArray(data)) {
          const sorted = data.sort((a: Report, b: Report) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          setReports(sorted);
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
        setError(err instanceof Error ? err.message : 'Failed to load reports');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
    window.scrollTo(0, 0);
  }, []);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('Worldwide');
  };

  const filteredReports = reports.filter(report => {
    try {
      const matchesSearch = 
        (report.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = 
        selectedCountry === 'Worldwide' || 
        (report.country || '').toLowerCase() === selectedCountry.toLowerCase();

      return matchesSearch && matchesCountry;
    } catch (err) {
      console.error('Filter error for report:', report, err);
      return false;
    }
  });

  const countryText = selectedCountry === 'Worldwide' ? '' : selectedCountry;
  
  const pageTitle = selectedCountry === 'Worldwide'
    ? 'Job Market Reports, Hiring Trends & Career Insights | JobsReport'
    : `Job Market Reports in ${countryText} | Hiring Trends & Employment Analysis | JobsReport`;

  const pageDescription = selectedCountry === 'Worldwide'
    ? `Browse ${reports.length} job market reports with hiring trends, salary intelligence, and employment analysis. Explore industry demand, remote work trends, and career insights worldwide.`
    : `Browse job market reports and hiring trends in ${countryText}. Employment analysis, salary intelligence, and career insights for ${countryText}. ${filteredReports.length} reports available.`;

  const canonicalUrl = selectedCountry === 'Worldwide'
    ? 'https://jobsreport.online/reports'
    : `https://jobsreport.online/reports/${countryText.toLowerCase().replace(/\s+/g, '-')}`;

  const seoKeywords = selectedCountry === 'Worldwide'
    ? 'job market reports, hiring trends, employment reports, career insights, salary analysis, industry demand, labor market, workforce trends'
    : `job market reports ${countryText}, ${countryText} hiring trends, ${countryText} employment analysis, ${countryText} career insights, ${countryText} salary report`;

  const countriesWithReports = [...new Set(
    reports.map(r => r.country).filter(Boolean)
  )].sort();

  const recentReports = filteredReports.slice(0, 5);

  // CollectionPage structured data
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "JobsReport",
      "url": "https://jobsreport.online"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filteredReports.length,
      "itemListElement": filteredReports.slice(0, 20).map((report, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "headline": report.title,
          "description": (report.excerpt || '').substring(0, 200),
          "datePublished": report.createdAt || report.updatedAt,
          "dateModified": report.updatedAt,
          "url": `https://jobsreport.online/report/${report.slug || report.id}`,
          "about": report.role || 'Job Market',
          "author": {
            "@type": "Organization",
            "name": "JobsReport",
            "url": "https://jobsreport.online"
          },
          "publisher": {
            "@type": "Organization",
            "name": "JobsReport",
            "url": "https://jobsreport.online"
          }
        }
      }))
    }
  };

  // 🔥 FIX 3: Breadcrumb as separate schema object (passed to SEO component)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://jobsreport.online"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": selectedCountry === 'Worldwide' ? 'Reports' : `Reports in ${countryText}`,
        "item": canonicalUrl
      }
    ]
  };

  if (loading) {
    return (
      <>
        <SEO title={pageTitle} description={pageDescription} />
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <RefreshCw size={24} className="text-blue-500 animate-spin" />
          <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
            Compiling market intelligence...
          </span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO title={pageTitle} description={pageDescription} />
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Globe size={32} className="text-red-500 animate-pulse" />
          <p className="text-white font-bold">Error Loading Reports</p>
          <p className="text-xs text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        ogTitle={pageTitle}
        ogDescription={pageDescription}
        ogUrl={canonicalUrl}
        // 🔥 FIX 3: Pass both schemas through SEO component (no raw script tags)
        structuredData={[collectionPageSchema, breadcrumbSchema]}
      />

      <div className="space-y-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={10} />
          {selectedCountry !== 'Worldwide' ? (
            <>
              <Link to="/reports" className="hover:text-white transition-colors">Reports</Link>
              <ChevronRight size={10} />
              <span className="text-blue-400">{countryText}</span>
            </>
          ) : (
            <span className="text-blue-400">Reports</span>
          )}
        </div>

        {/* Page Header */}
        <section className="py-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-3">
            <BookOpen size={14} />
            Market Intelligence Archives
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight mb-4">
            {selectedCountry === 'Worldwide' 
              ? 'Job Market Reports & Hiring Trend Analysis'
              : `Job Market Reports in ${countryText}`}
          </h1>
          
          <p className="text-stone-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {selectedCountry === 'Worldwide'
              ? 'Aggregated regional analysis reports mapping market growth telemetry, demand spikes, and active employer placements. Sorted chronologically.'
              : `Employment reports, hiring trends, and labor market insights for ${countryText}. Analysis of industry demand, salary benchmarks, and career opportunities across ${countryText}.`}
          </p>
          
          {/* Crawlable intro content for SEO */}
          <div className="mt-4 text-stone-400/80 text-sm leading-relaxed max-w-3xl space-y-2">
            <p>
              JobsReport publishes employment reports, hiring trend analysis, salary intelligence and labor market insights from different employers around the world with the aim of exploring industry demand, emerging careers, remote work trends and country-specific employment patterns.
            </p>
            <p>
              Our market intelligence reports cover software engineering, finance, healthcare, logistics, marketing, and more, by ensuring each report analyzes active job listings, salary ranges, employer demand, and geographic hiring patterns to help you understand where opportunities are growing.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen size={14} className="text-blue-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">{reports.length}</span> Reports
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe size={14} className="text-emerald-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">
                  {countriesWithReports.length}
                </span> Countries Covered
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-violet-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">
                  {[...new Set(reports.map(r => r.role).filter(Boolean))].length}
                </span> Industries Analyzed
              </span>
            </div>
          </div>
        </section>

        {/* Modern Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search report titles, roles, industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 pl-2">
              <Filter size={11} className="text-blue-500" />
              <span>Country Filter:</span>
              <span className="font-mono text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                <span>{currentFlag}</span>
                <span>{selectedCountry}</span>
              </span>
            </div>

            {(searchQuery || selectedCountry !== 'Worldwide') && (
              <Link
                to="/reports"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('Worldwide');
                }}
                className="px-3.5 py-2 hover:bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                Reset Filters
              </Link>
            )}
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* 🔥 FIX 2: Country links use <Link> instead of <button> for crawlability */}
            {countriesWithReports.length > 0 && (
              <nav className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4" aria-label="Reports by country">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">
                  Reports by Country
                </h3>
                <div className="space-y-1.5">
                  {countriesWithReports.slice(0, 10).map(country => {
                    const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
                    const countryReportCount = reports.filter(r => r.country === country).length;
                    const isActive = selectedCountry.toLowerCase() === country.toLowerCase();
                    
                    return (
                      <Link
                        key={country}
                        to={`/reports/${countrySlug}`}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        <span>{country}</span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {countryReportCount}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                {countriesWithReports.length > 10 && (
                  <p className="text-[9px] text-gray-600 font-mono text-center">
                    +{countriesWithReports.length - 10} more countries
                  </p>
                )}
              </nav>
            )}

            {/* Recent Reports */}
            {recentReports.length > 0 && (
              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">
                  Recent Reports
                </h3>
                <div className="space-y-2">
                  {recentReports.map(report => (
                    <Link
                      key={report.id}
                      to={`/report/${report.slug || report.id}`}
                      className="block p-2 rounded-xl hover:bg-white/[0.02] transition-all group"
                    >
                      <p className="text-[11px] text-gray-300 group-hover:text-white truncate font-medium">
                        {report.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-500 font-mono">{report.monthYear}</span>
                        {report.country && (
                          <span className="text-[9px] text-gray-600 font-mono">• {report.country}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Report Highlights */}
            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">
                Market Highlights
              </h3>
              
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-1 px-1.5 rounded bg-emerald-500/10 text-emerald-400 mt-0.5 text-xs font-bold font-mono">
                    +45%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">AI Specialist Surge</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">High demand across deep neural processing and LLM deployment operations.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 px-1.5 rounded bg-blue-500/10 text-blue-400 mt-0.5 text-xs font-bold font-mono">
                    +28%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Dar es Salaam Tech Hub</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">Tanzanian fintech expansion and digital remittance portals driving placements.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 px-1.5 rounded bg-indigo-500/10 text-indigo-400 mt-0.5 text-xs font-bold font-mono">
                    +22%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Software Developer Stacks</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">Increased demand for Senior React frameworks and backend service engineering.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-blue-900/10 border border-blue-500/10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star size={11} />
                Data Sources
              </h3>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                Reports are updated regularly to reflect current market conditions.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredReports.length === 0 ? (
              <div className="p-12 text-center bg-white/[0.01] rounded-3xl border border-white/5 flex flex-col items-center justify-center space-y-4">
                <Globe size={32} className="text-gray-600 animate-pulse" />
                <div>
                  <p className="text-white font-bold text-sm">No Matching Reports Found</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search terms or clearing filters.'
                      : selectedCountry !== 'Worldwide'
                        ? `No reports available for ${selectedCountry} yet. Check back soon or browse worldwide reports.`
                        : 'No reports published yet. Check back for market intelligence reports.'}
                  </p>
                </div>
                <Link
                  to="/reports"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCountry('Worldwide');
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <ReportCard report={report} />
                    <span className="absolute top-3 right-3 text-[8px] font-mono text-gray-500 bg-black/40 px-1.5 py-0.5 rounded pointer-events-none">
                      {report.monthYear || 'Unknown'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
