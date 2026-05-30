
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  ExternalLink, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  Globe,
  RefreshCw,
  Filter
} from 'lucide-react';
import { RawJob, Company } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { useCountry } from '../context/CountryContext';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function MarketPage() {
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'All';
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();
  const { triggerRedirect } = useCareerRedirect();
  
  useEffect(() => {
    async function loadMarketData() {
      try {
        // ✅ SINGLE API CALL: Fetches jobs + companies + roles
        const response = await fetch('/api/market');
        
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
          setCompanies(data.companies || []);
          // ✅ Use backend-provided roles list
          setRoles(['All', ...(data.roles || [])]);
        }
      } catch (err) {
        console.error("Error loading market telemetry:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMarketData();
  }, []);

  // Sync selectedRole if URL search param changes
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) {
      setSelectedRole(roleParam);
    } else {
      setSelectedRole('All');
    }
  }, [searchParams]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    const newParams = new URLSearchParams(searchParams);
    if (role === 'All') {
      newParams.delete('role');
    } else {
      newParams.set('role', role);
    }
    setSearchParams(newParams);
  };

  const getCompanyLogo = (companyName: string) => {
    const foundCo = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    return foundCo?.logoUrl;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'All' || job.role === selectedRole;
    const matchesCountry = selectedCountry === 'Worldwide' || 
                           job.country?.toLowerCase() === selectedCountry.toLowerCase();
    return matchesSearch && matchesRole && matchesCountry;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Loading Live Market Telemetry Stream...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header - Updated Messaging */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-2 font-mono">
          <TrendingUp size={14} /> 
          {selectedCountry === 'Worldwide' ? 'GLOBAL' : `${selectedCountry.toUpperCase()} REGIONAL`} MARKET TELEMETRY
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest leading-none uppercase">
          Live Job Market {currentFlag}
        </h1>
        <p className="text-sm text-gray-400 max-w-xl mt-2 select-none">
          Live job market telemetry stream for <b>{selectedCountry} {currentFlag}</b>. Real-time aggregation of active placements, demand signals, and employer hiring patterns extracted from corporate career portals.
        </p>
      </div>

      {/* Summary Matrix Grid - Market Intelligence Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Signals ({currentFlag})</p>
          <p className="text-2xl font-mono text-white mt-1">{filteredJobs.length}</p>
          <p className="text-[9px] text-gray-600 mt-1 font-mono uppercase">Live positions</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Hiring Entities</p>
          <p className="text-2xl font-mono text-white mt-1">
            {Array.from(new Set(filteredJobs.map(j => j.company))).length}
          </p>
          <p className="text-[9px] text-gray-600 mt-1 font-mono uppercase">Active employers</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Market Sectors</p>
          <p className="text-2xl font-mono text-white mt-1">{roles.length - 1}</p>
          <p className="text-[9px] text-gray-600 mt-1 font-mono uppercase">Role categories</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold">Signal Integrity</p>
          <p className="text-2xl font-mono text-green-400 mt-1">100%</p>
          <p className="text-[9px] text-gray-600 mt-1 font-mono uppercase">Verified sources</p>
        </div>
      </div>

      {/* Filters Area - Market Intelligence Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search title, company, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>

        {/* Role Sector Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedRole === role 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                  : 'text-gray-500 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Market Telemetry Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="flex items-center gap-2">
            <Filter size={12} className="text-blue-500" />
            STREAMING {filteredJobs.length} VERIFIED MARKET SIGNALS
          </span>
          <span className="font-mono text-[10px]">LIVE TELEMETRY FEED</span>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredJobs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-12 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10 text-gray-500 text-sm flex flex-col items-center justify-center space-y-4"
            >
              <Globe size={32} className="text-gray-600 animate-[pulse_2.5s_infinite]" />
              <div className="space-y-1">
                <p className="text-white font-bold text-sm">No Active Market Signals Found</p>
                <p className="text-xs text-gray-500 max-w-sm">
                  No verified job listings or market indices available in {selectedCountry} {currentFlag} matching your telemetry filters.
                </p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('All');
                  setSelectedCountry('Worldwide');
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Reset Telemetry Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(idx * 0.04, 0.4) } }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={job.id}
                  className="group p-5 bg-white/[0.01] border hover:bg-white/[0.03] border-white/5 rounded-3xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex gap-4 items-start">
                    {/* Company Logo */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center p-0.5 mt-0.5">
                      {getCompanyLogo(job.company) ? (
                        <img 
                          src={getCompanyLogo(job.company)} 
                          alt={`${job.company} logo`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 font-mono">
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Job Signal Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 font-mono tracking-widest uppercase">
                          {job.role}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                          <Clock size={11} />
                          {job.postedAt}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base leading-tight group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 font-medium">{job.company}</span>
                        <span className="text-gray-600 font-mono">•</span>
                        <span className="text-xs text-gray-500 font-medium">{job.location}</span>
                      </div>

                      {job.salary && (
                        <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                          {job.salary}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                        SIGNAL: JR-{job.id.slice(0, 4).toUpperCase()}
                      </span>
                      {job.expiresAt && (
                        <span className="text-[9px] text-gray-500 font-mono">
                          Expires: {job.expiresAt}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => triggerRedirect(job.url, job.company, job.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-500/20 hover:border-blue-500"
                    >
                      <span>View Signal</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Market Intelligence Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/20 to-violet-950/20 border border-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-sm">Ingest new market signals or adjust telemetry parameters?</h4>
          <p className="text-xs text-gray-400 mt-1">Access the Admin Studio to add raw market data, update trending indices, or sync employer feeds.</p>
        </div>
        <Link 
          to="/admin"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2"
        >
          <span>Admin Studio</span>
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}
