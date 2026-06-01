import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, TrendingUp, Search, RefreshCw, Star, ArrowUpRight, Globe, Filter } from 'lucide-react';
import { Report } from '../types';
import ReportCard from '../components/ReportCard';
import { useCountry } from '../context/CountryContext';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // ✅ Add error state
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setError(null);
        const response = await fetch('/api/reports');
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Reports loaded:', data); // Debug log
        
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Compiling market intelligence...
        </span>
      </div>
    );
  }

  // ✅ Show error state
  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <section className="py-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-3">
          <BookOpen size={14} />
          Market Intelligence Archives
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight mb-4 uppercase">
          Job Target Reports
        </h1>
        <p className="text-stone-400 text-sm md:text-base max-w-2xl leading-relaxed">
          Aggregated regional analysis reports mapping market growth telemetry, demand spikes, and active employer placements. Sorted chronologically.
        </p>
      </section>

      {/* Modern Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search report titles, tags, roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 pl-2">
            <Filter size={11} className="text-blue-500" />
            <span>Feed Target:</span>
            <span className="font-mono text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
              <span>{currentFlag}</span>
              <span>{selectedCountry}</span>
            </span>
          </div>

          {(searchQuery || selectedCountry !== 'Worldwide') && (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2 hover:bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              Reset Target
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">
              Report Highlights
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
              Ingestion Stream
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
              Our automated system continually cross-references external company postings quarterly. Secure full system access via the Admin Portal to ingest custom telemetry schemas.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.01] rounded-3xl border border-white/5 flex flex-col items-center justify-center space-y-4">
              <Globe size={32} className="text-gray-600 animate-pulse" />
              <div>
                <p className="text-white font-bold text-sm">No Matching Intelligence Reports Found</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Try clearing your search query or switching your active country context filter.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Clear Filters
              </button>
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
  );
}
