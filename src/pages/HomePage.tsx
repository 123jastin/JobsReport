import { Sparkles, TrendingUp, ChevronRight, Globe, RefreshCw, ArrowRight, Zap, BarChart3, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trend, Report } from '../types';
import TrendingCard from '../components/TrendingCard';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [spotlightCompanies, setSpotlightCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ SINGLE API CALL: Real-time market intelligence
        const response = await fetch('/api/home');
        
        if (response.ok) {
          const data = await response.json();
          setTrends(data.trends || []);
          setReports(data.reports || []);
          setSpotlightCompanies(data.spotlightCompanies || []);
        }
      } catch (err) {
        console.error("Failed to load market intelligence dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // ✅ Filter AND sort reports by country & date
  const displayedReports = reports
    .filter(report => {
      if (selectedCountry === 'Worldwide') return true;
      return report.country?.toLowerCase() === selectedCountry.toLowerCase();
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6); // Show latest 6

  // ✅ Compute trending badges
  const getTrendBadge = (growth: number) => {
    if (growth > 30) return { label: 'HOT', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (growth > 15) return { label: 'RISING', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    return { label: 'STEADY', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Compiling Live Market Intelligence...
        </span>
      </div>
    );
  }

  return (
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
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tighter">
            Market Analysis & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500">
              Discovery Engine.
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-2xl leading-relaxed max-w-2xl">
            Insight-first job discovery. We aggregate real-time market data to show you where the demand is actually shifting.
          </p>
          
          {/* Quick Stats */}
          <div className="flex gap-6 mt-8">
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
                <span className="text-white font-bold">{spotlightCompanies.length}</span> Active Employers
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 🔥 Trending Section */}
      <section id="trending-section">
        <div className="flex items-center justify-between mb-8 px-1">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500"></div>
              Trending Roles
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Real-time demand signals from active job market telemetry
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="status-text text-[10px] font-mono">LIVE FEED</span>
          </div>
        </div>
        
        <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-1 px-1">
          {trends.length === 0 ? (
            <div className="flex items-center justify-center w-full py-12 text-gray-500 text-sm font-mono">
              No trending data available yet. Market signals incoming...
            </div>
          ) : (
            trends.map((trend, index) => {
              const badge = getTrendBadge(trend.growth);
              return (
                <TrendingCard key={trend.id} trend={trend} index={index}>
                  {/* ✅ Trending badge */}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${badge.color} ${badge.bg} border ${badge.border}`}>
                    {badge.label}
                  </span>
                </TrendingCard>
              );
            })
          )}
        </div>
      </section>

      {/* 📰 Latest Reports Section */}
      <section id="reports-section" className="grid grid-cols-1 lg:grid-cols-4 gap-12 font-sans">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <span>{currentFlag}</span>
              <span>{selectedCountry === 'Worldwide' ? 'Global' : selectedCountry} Reports</span>
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
              Deep-dive sectoral growth analysis and telemetry in <b>{selectedCountry}</b>.
            </p>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest font-bold">Local Stream</p>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              </div>
              <div className="text-stone-300 font-mono text-xs">
                {displayedReports.length} Intelligence Report{displayedReports.length !== 1 ? 's' : ''} Active
              </div>
              <Link 
                to="/reports" 
                className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors"
              >
                View All Reports
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {displayedReports.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
              <Globe size={32} className="text-gray-600 animate-[pulse_3s_infinite]" />
              <div>
                <p className="text-white font-bold text-sm">No Local Intelligence Documents Available</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
                  We are compiling local telemetry reports for {selectedCountry} {currentFlag}. In the meantime, you can access the full Worldwide grid context.
                </p>
              </div>
              <button 
                onClick={() => setSelectedCountry('Worldwide')}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Show All Global Reports
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 🏢 Weekly Spotlight - Now with REAL data */}
      <section id="companies-section">
        <div className="p-8 rounded-3xl glass border-brand-primary/10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-500" />
                  Weekly Spotlight
                </h3>
                <p className="text-gray-400 text-sm">
                  Top companies actively shifting their hiring strategy based on market telemetry.
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
                {spotlightCompanies.map((company, idx) => (
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
          
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
        </div>
      </section>
      
      {/* Structured Data (ItemList) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": trends.map((t, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": t.role,
            "description": `Job role with ${t.growth}% growth across ${t.companies} companies.`
          }))
        })}
      </script>
    </div>
  );
}


