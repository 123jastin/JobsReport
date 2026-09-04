import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Building2, Briefcase, ArrowLeft, Globe, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { useCountry } from '../context/CountryContext';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  role: string;
  salary: string;
  active: boolean;
  logoUrl?: string;
  expiresAt?: string;
  postedAt?: string;
  slug?: string;
  city?: string;
  region?: string;
  country?: string;
  workplace_type?: string;
}

const getJobSlug = (job: Job): string => {
  if (job.slug) return `/market/${job.slug}`;
  
  const titleSlug = job.title
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `/market/${titleSlug}-job-${job.id}`;
};

const JOBS_PER_PAGE = 5;

export default function RegionPage() {
  const { countrySlug, regionSlug } = useParams();
  const { selectedCountry, setSelectedCountry } = useCountry();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobPage, setJobPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const regionName = regionSlug
    ? regionSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  const countryFromSlug = countrySlug
    ? countrySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : selectedCountry;

  useEffect(() => {
    if (countryFromSlug && countryFromSlug !== 'Worldwide') {
      setSelectedCountry(countryFromSlug);
    }
  }, [countryFromSlug]);

  useEffect(() => {
    const fetchRegionData = async () => {
      if (!regionName) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch region jobs with pagination
        const response = await fetch(
          `/api/market?location=${encodeURIComponent(regionName)}&limit=${JOBS_PER_PAGE}&page=${jobPage}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const regionJobs = data.jobs || [];
          
          setLocationInfo({
            name: regionName,
            country: countryFromSlug,
            postcode: regionJobs[0]?.postcode || ''
          });
          
          setJobs(regionJobs);
          setTotalJobs(data.stats?.totalJobs || 0);
          
          setLoading(false);
        } else {
          throw new Error('Failed to fetch region jobs');
        }
      } catch (err) {
        console.error('Failed to load region data:', err);
        setError('Failed to load jobs for this region. Please try again later.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegionData();
  }, [regionName, regionSlug, countryFromSlug, jobPage]);

  const activeJobs = jobs.filter(j => j.active !== false);
  const expiredJobs = jobs.filter(j => j.active === false);
  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Region</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">{error}</p>
        <div className="flex gap-3">
          <Link to="/regions" className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-colors">
            ← Browse All Regions
          </Link>
          <Link to="/market" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-sm uppercase tracking-wider transition-colors">
            View All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Jobs in ${regionName}, ${countryFromSlug} | Latest ${regionName} Vacancies | JobsReport`}
        description={`Find the latest jobs and career opportunities in ${regionName}, ${countryFromSlug}. Browse ${activeJobs.length} verified job listings from top employers in ${regionName}.`}
        keywords={`jobs in ${regionName}, ${regionName} jobs, ${regionName} vacancies, ${regionName} careers, find jobs ${regionName}`}
        canonicalUrl={`https://jobsreport.online/country/${countrySlug}/region/${regionSlug}`}
      />

      <div className="min-h-screen space-y-8 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/country/${countrySlug}`} className="hover:text-white transition-colors">{countryFromSlug}</Link>
          <span>/</span>
          <Link to="/regions" className="hover:text-white transition-colors">Regions</Link>
          <span>/</span>
          <span className="text-amber-400">{regionName}</span>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-4">
            <MapPin size={14} />
            <span>Regional Job Market</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tighter">
            Jobs in {regionName}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Browse <span className="text-white font-bold">{totalJobs}</span> active job opportunities in {regionName}, {countryFromSlug}.
            {locationInfo?.postcode && <span className="text-gray-500"> Postcode: {locationInfo.postcode}</span>}
          </p>
          
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={16} className="text-amber-500" />
              <span className="text-gray-400"><span className="text-white font-bold">{totalJobs}</span> Active Jobs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-blue-500" />
              <span className="text-gray-400"><span className="text-white font-bold">{new Set(jobs.map(j => j.company)).size}</span> Companies Hiring</span>
            </div>
            {expiredJobs.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500"><span className="text-white font-bold">{expiredJobs.length}</span> Expired</span>
              </div>
            )}
          </div>
        </div>

        {/* Ad removed */}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Jobs in {regionName}</h3>
            <p className="text-gray-500 text-sm mb-6">No job listings available for this region yet.</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/regions" className="text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider text-sm">← Browse Other Regions</Link>
              <Link to="/market" className="text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider text-sm">View All Jobs →</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500"></div>
                  Active Jobs in {regionName} ({totalJobs})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeJobs.map((job: Job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Link
                        to={getJobSlug(job)}
                        className="block p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] hover:border-amber-500/30 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {job.logoUrl ? (
                              <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                                {job.company?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-amber-500/10 text-amber-400 uppercase">{job.role || 'General'}</span>
                              {job.workplace_type && (
                                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-blue-500/10 text-blue-400 uppercase">{job.workplace_type}</span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">{job.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1"><Building2 size={10} />{job.company}</span>
                              <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                            </div>
                            {job.salary && <span className="text-[9px] text-emerald-400 font-mono mt-1 block">{job.salary}</span>}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Jobs Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                      onClick={() => setJobPage(Math.max(1, jobPage - 1))}
                      disabled={jobPage === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button 
                          key={p}
                          onClick={() => setJobPage(p)}
                          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                            jobPage === p 
                              ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20' 
                              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setJobPage(Math.min(totalPages, jobPage + 1))}
                      disabled={jobPage === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Expired Jobs - Hidden by default since we only fetch active jobs */}
          </>
        )}

        {/* Ad removed */}
      </div>
    </>
  );
}
