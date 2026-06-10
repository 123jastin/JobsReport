import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Building2, Briefcase, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import SEO from '../components/SEO';
import { useCountry } from '../context/CountryContext';

export default function RegionPage() {
  const { countrySlug, regionSlug } = useParams();
  const { selectedCountry, setSelectedCountry } = useCountry();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive region name from slug
  const regionName = regionSlug
    ? regionSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  // Derive country from slug
  const countryFromSlug = countrySlug
    ? countrySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : selectedCountry;

  useEffect(() => {
    // Set country context if different
    if (countryFromSlug && countryFromSlug !== 'Worldwide') {
      setSelectedCountry(countryFromSlug);
    }
  }, [countryFromSlug]);

  useEffect(() => {
    const fetchRegionJobs = async () => {
      try {
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          const allJobs = data.jobs || [];
          
          // Filter jobs matching this region
          const regionJobs = allJobs.filter((job: any) => {
            if (!job.location) return false;
            const loc = job.location.toLowerCase();
            const regionNameLower = regionName.toLowerCase();
            const regionSlugLower = regionSlug?.toLowerCase() || '';
            
            return loc.includes(regionNameLower) || 
                   loc.includes(regionSlugLower.replace(/-/g, ' '));
          });
          
          // Sort: active first, then by date
          const sorted = regionJobs.sort((a: any, b: any) => {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return 0;
          });
          
          setJobs(sorted);
        }
      } catch (err) {
        console.error('Failed to load region jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (regionName) fetchRegionJobs();
  }, [regionName, regionSlug]);

  const activeJobs = jobs.filter(j => j.active !== false);
  const expiredJobs = jobs.filter(j => j.active === false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Jobs in ${regionName}, ${countryFromSlug} | Latest ${regionName} Vacancies | JobsReport`}
        description={`Find the latest jobs and career opportunities in ${regionName}, ${countryFromSlug}. Browse ${jobs.length} verified job listings from top employers in ${regionName}.`}
        keywords={`jobs in ${regionName}, ${regionName} jobs, ${regionName} vacancies, ${regionName} careers, find jobs ${regionName}`}
        canonicalUrl={`https://jobsreport.online/country/${countrySlug}/region/${regionSlug}`}
      />

      <div className="min-h-screen space-y-8 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/country/${countrySlug}`} className="hover:text-white transition-colors">
            {countryFromSlug}
          </Link>
          <span>/</span>
          <Link to="/regions" className="hover:text-white transition-colors">Regions</Link>
          <span>/</span>
          <span className="text-emerald-400">{regionName}</span>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-4">
            <MapPin size={14} />
            <span>Regional Job Market</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tighter">
            Jobs in {regionName}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Browse <span className="text-white font-bold">{activeJobs.length}</span> active job opportunities in {regionName}, {countryFromSlug}.
            Find verified vacancies from top employers hiring in this region.
          </p>
          
          {/* Quick Stats */}
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={16} className="text-emerald-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">{activeJobs.length}</span> Active Jobs
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-blue-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">
                  {new Set(jobs.map(j => j.company)).size}
                </span> Companies Hiring
              </span>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Jobs in {regionName}</h3>
            <p className="text-gray-500 text-sm mb-6">
              No job listings available for this region yet.
            </p>
            <Link 
              to="/regions" 
              className="text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider text-sm"
            >
              ← Browse Other Regions
            </Link>
          </div>
        ) : (
          <>
            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500"></div>
                  Active Jobs in {regionName} ({activeJobs.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeJobs.map((job: any) => (
                    <Link
                      key={job.id}
                      to={`/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}
                      className="block p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all group"
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
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">
                              {job.role || 'General'}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><Building2 size={10} />{job.company}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                          </div>
                          {job.salary && (
                            <span className="text-[9px] text-emerald-400 font-mono mt-1 block">{job.salary}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Expired Jobs */}
            {expiredJobs.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Expired Listings ({expiredJobs.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                  {expiredJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="block p-4 bg-white/[0.005] border border-white/5 rounded-2xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-600">
                            {job.company?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-amber-500/10 text-amber-400 uppercase">
                              EXPIRED
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-500 truncate">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-600">
                            <span>{job.company}</span>
                            <span>{job.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
