import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Globe, Building2, Search, ArrowRight, TrendingUp, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import { useCountry } from '../context/CountryContext';

interface RegionData {
  name: string;
  slug: string;
  country: string;
  jobCount: number;
  activeJobs: number;
}

export default function RegionsPage() {
  const { selectedCountry } = useCountry();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAndDetectRegions = async () => {
      try {
        const countryParam = selectedCountry === 'Worldwide' ? '' : selectedCountry;
        const res = await fetch(`/api/market?country=${encodeURIComponent(countryParam)}`);
        
        if (res.ok) {
          const data = await res.json();
          const jobs = data.jobs || [];
          
          // Extract unique locations from jobs
          const locationMap = new Map<string, { 
            count: number; 
            active: number;
            country: string;
          }>();
          
          jobs.forEach((job: any) => {
            if (!job.location) return;
            
            // Clean and normalize location
            const loc = job.location.trim();
            
            // Skip generic locations
            const genericTerms = ['remote', 'worldwide', 'global', 'multiple', 'various', 'anywhere'];
            if (genericTerms.some(t => loc.toLowerCase() === t)) return;
            
            // Use location as region name
            const regionName = loc;
            const regionSlug = loc
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            
            // Determine country from job data or context
            const jobCountry = job.country || selectedCountry;
            
            const key = regionSlug;
            const existing = locationMap.get(key);
            
            if (existing) {
              existing.count++;
              if (job.active !== false) existing.active++;
            } else {
              locationMap.set(key, {
                count: 1,
                active: job.active !== false ? 1 : 0,
                country: jobCountry
              });
            }
          });
          
          // Convert to array and sort by job count
          const detectedRegions: RegionData[] = Array.from(locationMap.entries())
            .map(([slug, data]) => ({
              name: slug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              slug,
              country: data.country,
              jobCount: data.count,
              activeJobs: data.active
            }))
            .sort((a, b) => b.jobCount - a.jobCount);
          
          setRegions(detectedRegions);
        }
      } catch (err) {
        console.error('Failed to detect regions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndDetectRegions();
  }, [selectedCountry]);

  // Filter regions by search
  const filteredRegions = regions.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group regions by country for worldwide view
  const groupedByCountry = selectedCountry === 'Worldwide' 
    ? filteredRegions.reduce((acc, region) => {
        const country = region.country || 'Other';
        if (!acc[country]) acc[country] = [];
        acc[country].push(region);
        return acc;
      }, {} as Record<string, RegionData[]>)
    : null;

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
        title={selectedCountry === 'Worldwide'
          ? 'Jobs by Region & City | Browse Job Locations Worldwide | JobsReport'
          : `Jobs by Region in ${selectedCountry} | Browse ${selectedCountry} Cities | JobsReport`}
        description={selectedCountry === 'Worldwide'
          ? `Browse jobs by region and city worldwide. Find job opportunities in ${regions.length} locations across multiple countries.`
          : `Browse jobs by region in ${selectedCountry}. Find job opportunities in ${regions.length} cities and regions across ${selectedCountry}.`}
        keywords={selectedCountry === 'Worldwide'
          ? 'jobs by region, jobs by city, regional jobs, local jobs, find jobs near me'
          : `jobs in ${selectedCountry} regions, ${selectedCountry} cities jobs, regional jobs ${selectedCountry}`}
        canonicalUrl="https://jobsreport.online/regions"
      />

      <div className="min-h-screen space-y-8 pt-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-4">
            <MapPin size={14} />
            <span>Regional Job Explorer</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tighter">
            {selectedCountry === 'Worldwide' 
              ? 'Jobs by Region & City'
              : `Jobs by Region in ${selectedCountry}`}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {selectedCountry === 'Worldwide'
              ? `Discover job opportunities across ${regions.length} cities and regions worldwide. Browse active job listings by location.`
              : `Browse job opportunities across ${regions.length} regions in ${selectedCountry}. Find jobs in your preferred city or area.`}
          </p>
          
          {/* Quick Stats */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-emerald-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">{regions.length}</span> Active Regions
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={16} className="text-blue-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">
                  {regions.reduce((sum, r) => sum + r.activeJobs, 0)}
                </span> Active Jobs
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={selectedCountry === 'Worldwide' 
              ? "Search regions or countries..." 
              : `Search regions in ${selectedCountry}...`}
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Regions Display */}
        {filteredRegions.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Regions Found</h3>
            <p className="text-gray-500 text-sm">
              {searchTerm 
                ? 'No regions match your search. Try different keywords.'
                : 'No job locations detected yet. Jobs with locations will appear here automatically.'}
            </p>
          </div>
        ) : selectedCountry === 'Worldwide' && groupedByCountry ? (
          /* Worldwide View - Grouped by Country */
          <div className="space-y-12">
            {Object.entries(groupedByCountry)
              .sort(([, a], [, b]) => 
                b.reduce((sum, r) => sum + r.jobCount, 0) - a.reduce((sum, r) => sum + r.jobCount, 0)
              )
              .map(([country, countryRegions]) => (
                <section key={country}>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe size={18} className="text-blue-400" />
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest">
                      {country}
                    </h2>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {countryRegions.length} region{countryRegions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {countryRegions.map((region) => (
                      <Link
                        key={region.slug}
                        to={`/country/${country.toLowerCase().replace(/\s+/g, '-')}/region/${region.slug}`}
                        className="group p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-emerald-500" />
                            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {region.name}
                            </h3>
                          </div>
                          <ArrowRight size={14} className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Briefcase size={10} />
                            {region.activeJobs} active job{region.activeJobs !== 1 ? 's' : ''}
                          </span>
                          {region.jobCount > region.activeJobs && (
                            <span className="text-gray-600">
                              ({region.jobCount} total)
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ) : (
          /* Single Country View - Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegions.map((region) => (
              <Link
                key={region.slug}
                to={`/country/${selectedCountry.toLowerCase().replace(/\s+/g, '-')}/region/${region.slug}`}
                className="group p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <MapPin size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {region.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {region.country}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Briefcase size={12} className="text-emerald-500" />
                    <span className="text-white font-bold">{region.activeJobs}</span> active
                  </div>
                  {region.jobCount > region.activeJobs && (
                    <span className="text-[10px] text-gray-600">
                      {region.jobCount} total
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
