import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, RefreshCw, ArrowRight, Zap, BarChart3, Building2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';

export default function HomePage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [spotlightCompanies, setSpotlightCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/home');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Home data loaded:', data);
          setTrends(Array.isArray(data.trends) ? data.trends : []);
          setReports(Array.isArray(data.reports) ? data.reports : []);
          setSpotlightCompanies(Array.isArray(data.spotlightCompanies) ? data.spotlightCompanies : []);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const displayedReports = reports
    .filter((report: any) => {
      if (selectedCountry === 'Worldwide') return true;
      return (report.country || '').toLowerCase() === selectedCountry.toLowerCase();
    })
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 uppercase">
          Compiling Live Market Intelligence...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-8 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
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

      {/* Trending Roles Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
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
            <span className="text-[10px] font-mono text-gray-400">LIVE FEED</span>
          </div>
        </div>
        
        <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar">
          {trends.length === 0 ? (
            <div className="flex items-center justify-center w-full py-12 text-gray-500 text-sm font-mono">
              No trending data available yet. Market signals incoming...
            </div>
          ) : (
            trends.map((trend: any) => (
              <div 
                key={trend.id} 
                className="flex-shrink-0 w-64 p-5 bg-white/[0.01] border border-white/5 rounded-3xl hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 font-mono uppercase">
                    {trend.role}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    +{trend.growth}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                  <TrendingUp size={12} />
                  <span>{trend.companies} companies hiring</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reports Section */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <span>{currentFlag}</span>
              <span>{selectedCountry === 'Worldwide' ? 'Global' : selectedCountry} Reports</span>
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Deep-dive sectoral growth analysis in <b>{selectedCountry}</b>.
            </p>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500 font-mono uppercase font-bold">Local Stream</p>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              </div>
              <div className="text-stone-300 font-mono text-xs">
                {displayedReports.length} Report{displayedReports.length !== 1 ? 's' : ''} Active
              </div>
              <Link to="/reports" className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase transition-colors">
                View All Reports <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {displayedReports.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10">
              <Globe size={32} className="text-gray-600 mx-auto mb-4" />
              <p className="text-white font-bold text-sm">No Intelligence Documents Available</p>
              <p className="text-xs text-gray-500 mt-1">
                Compiling local telemetry reports for {selectedCountry} {currentFlag}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedReports.map((report: any) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Spotlight Companies */}
      <section>
        <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/10 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-500" />
              Weekly Spotlight
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Top companies actively hiring based on market telemetry.
            </p>
            
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
                    className="text-lg md:text-xl font-black text-gray-300 hover:text-white uppercase tracking-tighter transition-colors cursor-default"
                  >
                    {company}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  );
}
