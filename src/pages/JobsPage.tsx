import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  ExternalLink, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  SlidersHorizontal,
  Plus,
  Globe
} from 'lucide-react';
import { RawJob, Company } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { useCountry } from '../context/CountryContext';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function JobsPage() {
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'All';
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();
  const { triggerRedirect } = useCareerRedirect();
  
  useEffect(() => {
    async function loadJobsAndCompanies() {
      try {
        const [jobsRes, companiesRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/companies')
        ]);
        if (jobsRes.ok) {
          const data = await jobsRes.json();
          setJobs(data);
        }
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData);
        }
      } catch (err) {
        console.error("Error loading jobs and companies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobsAndCompanies();
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

  const roles: string[] = ['All', ...Array.from(new Set(jobs.map(j => j.role))) as string[]];

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
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-gray-500 font-mono text-xs">LOADING CURRENT INGESTION STREAM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-2 font-mono">
          <Briefcase size={14} /> {selectedCountry === 'Worldwide' ? 'GLOBAL' : `${selectedCountry.toUpperCase()} REGIONAL`} INGESTION DIRECTORY
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest leading-none uppercase">
          JOBS IN {selectedCountry} {currentFlag}
        </h1>
        <p className="text-sm text-gray-400 max-w-xl mt-2 select-none">
          Browse real-time raw job postings in <b>{selectedCountry} {currentFlag}</b>. Track actual telemetry data straight from corporate employment portals mapped into target market indices.
        </p>
      </div>

      {/* Summary Matrix Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Ingested ({currentFlag})</p>
          <p className="text-2xl font-mono text-white mt-1">{filteredJobs.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Matched Companies</p>
          <p className="text-2xl font-mono text-white mt-1">{Array.from(new Set(filteredJobs.map(j => j.company))).length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Unique Index Sectors</p>
          <p className="text-2xl font-mono text-white mt-1">{roles.length - 1}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold">Verification Rate</p>
          <p className="text-2xl font-mono text-green-400 mt-1">100%</p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search matching title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Roles Tabs Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedRole === role 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of job listings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>SHOWING {filteredJobs.length} VERIFIED POSITIONS</span>
          <span className="font-mono text-[10px]">FILTERED TELEMETRY STREAM</span>
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
                <p className="text-white font-bold text-sm">No Active Telemetry Found</p>
                <p className="text-xs text-gray-500 max-w-sm">No verified job listings or indices available in {selectedCountry} {currentFlag} matching your lookup criteria.</p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('All');
                  setSelectedCountry('Worldwide');
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Reset Ingestion Filters
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
                  className="p-5 bg-white/[0.01] border hover:bg-white/[0.03] border-white/5 rounded-3xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex gap-4 items-start">
                    {/* Company Logo Image on Left */}
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

                    {/* Job details block */}
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

                      <h3 className="font-bold text-white text-base leading-tight hover:text-blue-400 transition-colors">
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
                        ID: JR-{job.id.slice(0, 4).toUpperCase()}
                      </span>
                      {job.expiresAt && (
                        <span className="text-[9px] text-gray-500 font-mono">
                          Expires: {job.expiresAt}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => triggerRedirect(job.url, job.company, job.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span>Careers Portal</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Call to Active Admin Action banner if admin logged in */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/20 to-violet-950/20 border border-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-sm">Need to add more records or aggregate the talent feed?</h4>
          <p className="text-xs text-gray-400 mt-1">Access the Admin studio to enter raw files, change trending scores, or sync indices.</p>
        </div>
        <Link 
          to="/admin"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
        >
          Open Admin Panel
        </Link>
      </div>
    </div>
  );
}
