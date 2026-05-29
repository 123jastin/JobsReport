import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, ChevronRight, Globe } from 'lucide-react';
import { Trend, Report } from '../types';
import TrendingCard from '../components/TrendingCard';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';

export default function HomePage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, reportsRes] = await Promise.all([
          fetch('/api/trends'),
          fetch('/api/reports')
        ]);
        const trendsData = await trendsRes.json();
        const reportsData = await reportsRes.json();
        setTrends(trendsData);
        setReports(reportsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayedReports = reports.filter(report => {
    if (selectedCountry === 'Worldwide') return true;
    return report.country?.toLowerCase() === selectedCountry.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
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
        </motion.div>
      </section>

      {/* 🔥 Trending Section */}
      <section id="trending-section">
        <div className="flex items-center justify-between mb-8 px-1">
          <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500"></div>
            Trending Roles
          </h2>
          <span className="status-text">LIVE FEED</span>
        </div>
        
        <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-1 px-1">
          {trends.map((trend, index) => (
            <TrendingCard key={trend.id} trend={trend} index={index} />
          ))}
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
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
              <p className="status-text text-[10px] text-gray-500 font-mono uppercase tracking-widest font-bold">Local Stream</p>
              <div className="text-stone-300 font-mono text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                {displayedReports.length} Document(s) Active
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {displayedReports.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
              <Globe size={32} className="text-gray-600 animate-[pulse_3s_infinite]" />
              <div>
                <p className="text-white font-bold text-sm">No Local Intelligence Documents Available</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">We are compiling local telemetry reports for {selectedCountry} {currentFlag}. In the meantime, you can access the full Worldwide grid context.</p>
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

      {/* 🏢 Top Hiring Companies (Optional) */}
      <section id="companies-section">
        <div className="p-8 rounded-3xl glass border-brand-primary/10 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">Weekly Spotlight</h3>
            <p className="text-gray-400 mb-6">Top companies shifting their hiring strategy.</p>
            <div className="flex flex-wrap gap-4 md:gap-8 items-center opacity-70">
              <span className="text-lg font-black text-gray-500 uppercase tracking-tighter">Google</span>
              <span className="text-lg font-black text-gray-500 uppercase tracking-tighter">Stripe</span>
              <span className="text-lg font-black text-gray-500 uppercase tracking-tighter">Amazon</span>
              <span className="text-lg font-black text-gray-500 uppercase tracking-tighter">Revolut</span>
              <span className="text-lg font-black text-gray-500 uppercase tracking-tighter">OpenAI</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
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
