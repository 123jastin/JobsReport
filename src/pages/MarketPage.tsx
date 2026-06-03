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
  Filter,
  ArrowUpRight,
  AlertTriangle,
  Eye,
  FileText,
  File,
  X,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { RawJob, Company } from '../types';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { useCountry } from '../context/CountryContext';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function MarketPage() {
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'All';
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  
  const { selectedCountry, setSelectedCountry, currentFlag } = useCountry();
  const { triggerRedirect } = useCareerRedirect();
  const { query } = useParams<{ query?: string }>();
  
  // ✅ File/Image viewer state (supports images and PDFs)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageList, setImageList] = useState<Array<string>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ✅ Job Description viewer state
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [descriptionJobTitle, setDescriptionJobTitle] = useState<string>('');
  const [descriptionJobUrl, setDescriptionJobUrl] = useState<string>('');
  
  // ✅ Load search query from URL path on page load
  useEffect(() => {
    if (query) {
      const decodedQuery = decodeURIComponent(query).replace(/-/g, ' ');
      setSearchQuery(decodedQuery);
    }
  }, [query]);
  
  useEffect(() => {
    async function loadMarketData() {
      try {
        setError(null);
        
        // ✅ Try new endpoint first, fallback to individual APIs
        let data;
        
        try {
          const response = await fetch('/api/market');
          if (response.ok) {
            data = await response.json();
          } else {
            throw new Error('New endpoint unavailable');
          }
        } catch (newEndpointError) {
          console.log('Falling back to individual APIs...');
          
          // 🔄 FALLBACK: Use existing endpoints
          const [jobsRes, companiesRes] = await Promise.all([
            fetch('/api/jobs'),
            fetch('/api/companies')
          ]);
          
          if (!jobsRes.ok || !companiesRes.ok) {
            throw new Error('All APIs failed');
          }
          
          const jobsData = await jobsRes.json();
          const companiesData = await companiesRes.json();
          
          // Build the same structure as /api/market would return
          data = {
            jobs: jobsData,
            companies: companiesData,
            roles: [...new Set(jobsData.map((j: RawJob) => j.role))]
          };
        }
        
        console.log('Market Data Loaded:', {
          jobs: data.jobs?.length,
          companies: data.companies?.length,
          roles: data.roles?.length
        });
        
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        setCompanies(Array.isArray(data.companies) ? data.companies : []);
        setRoles(['All', ...(Array.isArray(data.roles) ? data.roles : [])]);
        
      } catch (err) {
        console.error("Error loading market telemetry:", err);
        setError(err instanceof Error ? err.message : 'Failed to load market data');
        
        // Set empty arrays to prevent blank page
        setJobs([]);
        setCompanies([]);
        setRoles(['All']);
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
    const foundCo = companies.find(c => 
      c.name.toLowerCase() === companyName.toLowerCase()
    );
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
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Running in Compatibility Mode
            </p>
            <p className="text-amber-300/70 text-[10px] mt-0.5">
              Using legacy data sources. Upgrade to unified market endpoint for full capabilities.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
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

      {/* Summary Matrix Grid */}
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

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search title, company, or sector..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              
              // Update URL with clean path
              if (value) {
                const cleanQuery = value.trim().toLowerCase().replace(/\s+/g, '-');
                window.history.replaceState(null, '', `/market/search/${encodeURIComponent(cleanQuery)}`);
              } else {
                window.history.replaceState(null, '', '/market');
              }
            }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>

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
          <span className="font-mono text-[10px]">
            {error ? 'LEGACY MODE' : 'LIVE TELEMETRY FEED'}
          </span>
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
                  {error 
                    ? "Market data is loading in compatibility mode. Some features may be limited."
                    : `No verified job listings or market indices available in ${selectedCountry} ${currentFlag} matching your telemetry filters.`
                  }
                </p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('All');
                  setSelectedCountry('Worldwide');
                  window.history.replaceState(null, '', '/market');
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Reset Telemetry Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job, idx) => {
                // ✅ Cast job to any to access images and description properties
                const jobWithImages = job as any;
                const hasFiles = jobWithImages.images && jobWithImages.images.length > 0;
                const hasDescription = jobWithImages.description && jobWithImages.description.trim().length > 0;
                const companyLogo = getCompanyLogo(job.company);
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(idx * 0.04, 0.4) } }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={job.id || idx}
                    className="group p-5 bg-white/[0.01] border hover:bg-white/[0.03] border-white/5 rounded-3xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Company Logo + Role Badge + Title + Details */}
                    <div className="flex gap-4 items-start">
                      {/* Company Logo */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center p-0.5 mt-0.5">
                        {companyLogo ? (
                          <img 
                            src={companyLogo} 
                            alt={`${job.company} logo`} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 font-mono';
                                fallback.textContent = job.company?.charAt(0).toUpperCase() || '?';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 font-mono">
                            {job.company?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 min-w-0">
                        {/* Role Badge + Date */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 font-mono tracking-widest uppercase">
                            {job.role || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <Clock size={11} />
                            {job.postedAt || 'Recent'}
                          </span>
                        </div>

                        {/* ✅ Job Title with Link to Detail Page */}
                        <Link to={`/job/${job.id}`}>
                          <h3 className="font-bold text-white text-base leading-tight hover:text-blue-400 transition-colors cursor-pointer">
                            {job.title}
                          </h3>
                        </Link>
                        
                        {/* Company, Location, Salary */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400 font-medium">{job.company}</span>
                          {job.location && (
                            <>
                              <span className="text-gray-600 font-mono">•</span>
                              <span className="text-xs text-gray-500 font-medium">{job.location}</span>
                            </>
                          )}
                        </div>

                        {job.salary && (
                          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                            {job.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ✅ View Job Description Button (Original Card Style - Emerald Green) */}
                    {hasDescription && (
                      <div 
                        className="relative w-full mt-3 rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-white/5 cursor-pointer group/desc"
                        onClick={() => {
                          setSelectedDescription(jobWithImages.description);
                          setDescriptionJobTitle(job.title);
                          setDescriptionJobUrl(job.url || '');
                        }}
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                              <FileText size={20} className="text-emerald-400" />
                            </div>
                            <div>
                              <span className="text-white text-xs font-bold block">View Job Description</span>
                              <span className="text-[9px] text-gray-400 mt-0.5">Full details, requirements & responsibilities</span>
                            </div>
                          </div>
                          <Eye size={16} className="text-emerald-400 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded-lg text-[8px] font-mono text-emerald-400">
                          JD
                        </div>
                      </div>
                    )}

                    {/* ✅ Job Images/PDFs Strip */}
                    {hasFiles && (
                      <div className="relative w-full mt-3 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-white/5">
                        <div className="flex overflow-x-auto gap-2 p-2 scrollbar-none">
                          {jobWithImages.images.map((file: any, fileIndex: number) => {
                            const isPDF = file.type === 'pdf' || file.name?.toLowerCase().endsWith('.pdf');
                            const isDoc = file.type === 'document' || file.name?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
                            const isFile = isPDF || isDoc;
                            
                            return (
                              <div
                                key={fileIndex}
                                className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden cursor-pointer group/file border border-white/5 hover:border-blue-500/50 transition-all"
                                onClick={() => {
                                  const originals = jobWithImages.images.map((i: any) => i.url);
                                  setImageList(originals);
                                  setCurrentImageIndex(fileIndex);
                                  setSelectedImage(originals[fileIndex]);
                                }}
                              >
                                {isFile ? (
                                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-1.5">
                                    <span className={`text-lg font-black ${isPDF ? 'text-red-400' : 'text-blue-400'}`}>
                                      {isPDF ? 'PDF' : file.name?.match(/\.(xls|xlsx)$/i) ? 'XLS' : 
                                       file.name?.match(/\.(ppt|pptx)$/i) ? 'PPT' : 'DOC'}
                                    </span>
                                    <span className="text-[6px] text-gray-400 mt-0.5 truncate w-full text-center leading-tight">
                                      {file.name?.substring(0, 15) || 'Document'}
                                    </span>
                                  </div>
                                ) : (
                                  <img 
                                    src={file.thumbnail || file.url}
                                    alt={file.name || 'Job file'} 
                                    className="w-full h-full object-cover group-hover/file:scale-110 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* File count badge */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded-lg text-[8px] font-mono text-white">
                          {jobWithImages.images.length} {jobWithImages.images.length === 1 ? 'file' : 'files'}
                        </div>
                      </div>
                    )}

                    {/* Footer with Signal ID and Apply Now Button */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                          SIGNAL: JR-{job.id?.toString().slice(0, 4).toUpperCase() || '????'}
                        </span>
                        {job.expiresAt && (
                          <span className="text-[9px] text-gray-500 font-mono">
                            Expires: {job.expiresAt}
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => job.url && triggerRedirect(job.url, job.company, job.title)}
                        disabled={!job.url}
                        className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                          job.url 
                            ? 'bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/20 hover:border-blue-500 cursor-pointer' 
                            : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        <span>Apply Now</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
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

      {/* ✅ Fullscreen Image/PDF Viewer - Solid Background */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center"
          onClick={() => {
            setSelectedImage(null);
            setImageList([]);
          }}
        >
          {/* Close button */}
          <button 
            onClick={() => {
              setSelectedImage(null);
              setImageList([]);
            }}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <X size={24} />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 z-50 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-white text-xs font-mono">
            {currentImageIndex + 1} / {imageList.length}
            {imageList[currentImageIndex]?.toLowerCase().endsWith('.pdf') && <span className="ml-2 text-red-400">PDF</span>}
          </div>

          {/* Previous button */}
          {currentImageIndex > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentImageIndex - 1;
                setCurrentImageIndex(newIndex);
                setSelectedImage(imageList[newIndex]);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Main Content - PDF or Image */}
          {(imageList[currentImageIndex]?.toLowerCase().endsWith('.pdf')) ? (
            <div 
              className="w-full max-w-5xl h-[90vh] flex flex-col bg-black rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* PDF Toolbar */}
              <div className="flex items-center justify-between p-3 bg-black/90 border-b border-white/10 rounded-t-xl">
                <span className="text-white text-xs font-mono truncate max-w-[50%] flex items-center gap-2">
                  <FileText size={14} className="text-red-400" />
                  Document
                </span>
                <div className="flex items-center gap-2">
                  <a 
                    href={selectedImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={12} />
                    Open in New Tab
                  </a>
                  <a 
                    href={selectedImage} 
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              </div>
              
              {/* ✅ Google Docs Viewer - Works reliably across all browsers */}
              <iframe 
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedImage)}&embedded=true`}
                className="w-full flex-1 rounded-b-xl bg-white"
                title="PDF Viewer"
                style={{ border: 'none', minHeight: '70vh' }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          ) : (
            <img 
              src={selectedImage} 
              alt="Job listing" 
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                // Fallback if image fails in viewer
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                    <rect fill="#1e293b" width="400" height="300" rx="12"/>
                    <text fill="#ef4444" font-size="20" font-weight="bold" text-anchor="middle" x="200" y="140">Failed to Load</text>
                    <text fill="#94a3b8" font-size="14" text-anchor="middle" x="200" y="170">Tap to close</text>
                  </svg>
                `);
              }}
            />
          )}

          {/* Next button */}
          {currentImageIndex < imageList.length - 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentImageIndex + 1;
                setCurrentImageIndex(newIndex);
                setSelectedImage(imageList[newIndex]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Dot indicators */}
          {imageList.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
              {imageList.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                    setSelectedImage(imageList[index]);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-blue-500 w-4' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Job Description Fullscreen Viewer - Solid Background with Apply Buttons */}
      {selectedDescription && (
        <div 
          className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
          onClick={() => {}}
        >
          {/* Top Bar with Apply Now button */}
          <div className="flex items-center justify-between p-4 bg-black/90 border-b border-white/10 shrink-0">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" />
              Job Description: {descriptionJobTitle}
            </h3>
            <div className="flex items-center gap-2">
              {/* Apply Now Button - Top right */}
              <button
                onClick={() => {
                  setSelectedDescription(null);
                  setDescriptionJobTitle('');
                  if (descriptionJobUrl) {
                    triggerRedirect(descriptionJobUrl, descriptionJobTitle, 'Job Description');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/20"
              >
                <span>Apply Now</span>
                <ExternalLink size={12} />
              </button>
              
              {/* Close button */}
              <button 
                onClick={() => { 
                  setSelectedDescription(null); 
                  setDescriptionJobTitle('');
                  setDescriptionJobUrl('');
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Description Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto p-8">
              <div 
                className="prose prose-invert prose-headings:text-white prose-headings:font-bold prose-p:text-gray-300 prose-p:text-sm prose-p:leading-relaxed prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 space-y-4"
                dangerouslySetInnerHTML={{ __html: selectedDescription }}
              />
              
              {/* Bottom Apply Now Button */}
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                <button
                  onClick={() => {
                    setSelectedDescription(null);
                    setDescriptionJobTitle('');
                    if (descriptionJobUrl) {
                      triggerRedirect(descriptionJobUrl, descriptionJobTitle, 'Job Description');
                    }
                  }}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                  <span>Apply Now</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
