import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Globe, Building2, Search, ArrowRight, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import { useCountry } from '../context/CountryContext';

interface Location {
  id: string;
  name: string;
  region: string;
  country: string;
  postcode: string;
  street_address: string;
  created_at: string;
}

interface RegionData {
  name: string;
  slug: string;
  country: string;
  countrySlug: string;
  jobCount: number;
  activeJobs: number;
}

export default function RegionsPage() {
  const { selectedCountry } = useCountry();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const countryParam = selectedCountry === 'Worldwide' ? '' : selectedCountry;
        const [locationsRes, marketRes] = await Promise.all([
          fetch('/api/locations'),
          fetch(`/api/market?country=${encodeURIComponent(countryParam)}`)
        ]);

        if (!locationsRes.ok || !marketRes.ok) {
          setLoading(false);
          return;
        }

        const locations: Location[] = await locationsRes.json();
        const marketData = await marketRes.json();
        const jobs = marketData.jobs || [];

        const filteredLocations = selectedCountry === 'Worldwide'
          ? locations
          : locations.filter(loc => 
              loc.country.toLowerCase() === selectedCountry.toLowerCase()
            );

        // Remove duplicates by grouping on unique region name
        const uniqueRegions = new Map<string, { name: string; country: string; countrySlug: string }>();
        filteredLocations.forEach(loc => {
          const key = loc.name.toLowerCase().trim();
          if (!uniqueRegions.has(key)) {
            uniqueRegions.set(key, {
              name: loc.name,
              country: loc.country,
              countrySlug: (loc.country || '').toLowerCase().replace(/\s+/g, '-')
            });
          }
        });

        const regionsWithJobs: RegionData[] = Array.from(uniqueRegions.values()).map(region => {
          const regionName = region.name.toLowerCase();
          
          const matchingJobs = jobs.filter((job: any) => {
            if (!job.location) return false;
            const jobLoc = job.location.toLowerCase();
            return jobLoc.includes(regionName);
          });

          return {
            name: region.name,
            slug: region.name.toLowerCase().replace(/\s+/g, '-'),
            country: region.country,
            countrySlug: region.countrySlug,
            jobCount: matchingJobs.length,
            activeJobs: matchingJobs.filter((j: any) => j.active !== false).length
          };
        });

        const sorted = regionsWithJobs.sort((a, b) => {
          if (a.jobCount > 0 && b.jobCount === 0) return -1;
          if (a.jobCount === 0 && b.jobCount > 0) return 1;
          return b.jobCount - a.jobCount;
        });

        setRegions(sorted);
      } catch (err) {} finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCountry]);

  const filteredRegions = regions.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regionsWithJobs = filteredRegions.filter(r => r.jobCount > 0);
  const regionsWithoutJobs = filteredRegions.filter(r => r.jobCount === 0);

  const groupedByCountry = selectedCountry === 'Worldwide'
    ? regionsWithJobs.reduce((acc, region) => {
        const country = region.country || 'Other';
        if (!acc[country]) acc[country] = [];
        acc[country].push(region);
        return acc;
      }, {} as Record<string, RegionData[]>)
    : null;

  const totalActiveJobs = regionsWithJobs.reduce((sum, r) => sum + r.activeJobs, 0);
  const totalLocations = regions.length;
  const locationsWithJobs = regionsWithJobs.length;

  const pageTitle = selectedCountry === 'Worldwide'
    ? 'Jobs by City & Region | Browse Job Locations Worldwide | JobsReport'
    : `Jobs by Region in ${selectedCountry} | Browse ${selectedCountry} Cities | JobsReport`;

  const pageDescription = selectedCountry === 'Worldwide'
    ? `Browse jobs by city and region worldwide. Find opportunities across ${locationsWithJobs} locations with ${totalActiveJobs} active jobs.`
    : `Browse jobs by region in ${selectedCountry}. Find opportunities across ${locationsWithJobs} locations with ${totalActiveJobs} active jobs.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": "https://jobsreport.online/regions",
    "isPartOf": { "@type": "WebSite", "name": "JobsReport", "url": "https://jobsreport.online" },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": regionsWithJobs.length,
      "itemListElement": regionsWithJobs.slice(0, 50).map((region, index) => ({
        "@type": "ListItem", "position": index + 1,
        "item": {
          "@type": "Place", "name": region.name,
          "address": { "@type": "PostalAddress", "addressLocality": region.name, "addressCountry": region.country },
          "url": `https://jobsreport.online/country/${region.countrySlug}/region/${region.slug}`,
          "description": `${region.activeJobs} active job(s) available in ${region.name}, ${region.country}.`
        }
      }))
    }
  };

  const InFeedAd1 = ({ index }: { index: number }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-white/5" style={{ background: 'transparent' }}>
      <ins className="adsbygoogle" style={{ display: 'block', background: 'transparent' }}
        data-ad-format="fluid" data-ad-layout-key="-h0-1a+31-4t+7z"
        data-ad-client="ca-pub-8155064094205693" data-ad-slot="1805968460" />
    </motion.div>
  );

  const InFeedAd2 = ({ index }: { index: number }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-white/5" style={{ background: 'transparent' }}>
      <ins className="adsbygoogle" style={{ display: 'block', background: 'transparent' }}
        data-ad-format="fluid" data-ad-layout-key="-gh-1o+14-67+ka"
        data-ad-client="ca-pub-8155064094205693" data-ad-slot="9872160747" />
    </motion.div>
  );

  const InFeedAd3 = ({ index }: { index: number }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-white/5" style={{ background: 'transparent' }}>
      <ins className="adsbygoogle" style={{ display: 'block', background: 'transparent' }}
        data-ad-format="fluid" data-ad-layout-key="-gm-l+1-46+ex"
        data-ad-client="ca-pub-8155064094205693" data-ad-slot="5598749525" />
    </motion.div>
  );

  if (loading) {
    return (
      <>
        <SEO title={pageTitle} description={pageDescription} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={pageTitle} description={pageDescription}
        keywords={selectedCountry === 'Worldwide'
          ? 'jobs by region, jobs by city, regional jobs, local jobs, find jobs near me'
          : `jobs in ${selectedCountry} regions, ${selectedCountry} cities jobs, regional jobs ${selectedCountry}`}
        canonicalUrl="https://jobsreport.online/regions"
        ogTitle={pageTitle} ogDescription={pageDescription} ogUrl="https://jobsreport.online/regions"
        structuredData={structuredData} />

      <div className="min-h-screen space-y-8 pt-8">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-4">
            <MapPin size={14} /><span>Regional Job Explorer</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tighter">
            {selectedCountry === 'Worldwide' ? 'Jobs by City & Region' : `Jobs by Region in ${selectedCountry}`}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {selectedCountry === 'Worldwide'
              ? `Browse job opportunities across ${locationsWithJobs} cities and regions worldwide. ${totalActiveJobs} active jobs available.`
              : `Browse job opportunities across ${locationsWithJobs} regions in ${selectedCountry}. ${totalActiveJobs} active jobs available.`}
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-amber-500" /><span className="text-gray-400"><span className="text-white font-bold">{locationsWithJobs}</span> Active Regions</span></div>
            <div className="flex items-center gap-2 text-sm"><Briefcase size={16} className="text-blue-500" /><span className="text-gray-400"><span className="text-white font-bold">{totalActiveJobs}</span> Active Jobs</span></div>
            {totalLocations > locationsWithJobs && <div className="flex items-center gap-2 text-sm"><Globe size={16} className="text-gray-500" /><span className="text-gray-500"><span className="text-white font-bold">{totalLocations}</span> Total Locations</span></div>}
          </div>
        </div>

        <AdBanner key="regions-top" slot="4550717155" />

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={selectedCountry === 'Worldwide' ? `Search ${locationsWithJobs} cities or countries...` : `Search ${locationsWithJobs} regions in ${selectedCountry}...`}
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
        </div>

        {filteredRegions.length === 0 && (
          <div className="text-center py-16">
            <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Regions Found</h3>
            <p className="text-gray-500 text-sm">{searchTerm ? 'No regions match your search.' : 'No locations available.'}</p>
          </div>
        )}

        {selectedCountry === 'Worldwide' && groupedByCountry && Object.keys(groupedByCountry).length > 0 && (
          <div className="space-y-12">
            {Object.entries(groupedByCountry).sort(([, a], [, b]) => 
              b.reduce((sum, r) => sum + r.jobCount, 0) - a.reduce((sum, r) => sum + r.jobCount, 0)
            ).map(([country, countryRegions]) => (
              <section key={country}>
                <div className="flex items-center gap-3 mb-4">
                  <Globe size={18} className="text-blue-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-widest">{country}</h2>
                  <span className="text-[10px] text-gray-500 font-mono">{countryRegions.length} region{countryRegions.length > 1 ? 's' : ''}</span>
                  <Link to={`/country/${countryRegions[0]?.countrySlug}`} className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider ml-auto">View Country →</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {countryRegions.map((region, idx: number) => {
                    const elements = [];
                    elements.push(
                      <Link key={region.slug} to={`/country/${region.countrySlug}/region/${region.slug}`}
                        className="group p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-amber-500/30 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2"><MapPin size={14} className="text-amber-500" /><h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{region.name}</h3></div>
                          <ArrowRight size={14} className="text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Briefcase size={10} /><span className="text-white font-bold">{region.activeJobs}</span> active job{region.activeJobs !== 1 ? 's' : ''}</span>
                          {region.jobCount > region.activeJobs && <span className="text-gray-600">({region.jobCount} total)</span>}
                        </div>
                      </Link>
                    );
                    if ((idx + 1) % 3 === 0 && idx < countryRegions.length - 1) {
                      const adNum = Math.floor((idx + 1) / 3) % 3;
                      elements.push(adNum === 1 ? <InFeedAd1 key={`ad1-${country}-${idx}`} index={idx} /> : adNum === 2 ? <InFeedAd2 key={`ad2-${country}-${idx}`} index={idx} /> : <InFeedAd3 key={`ad3-${country}-${idx}`} index={idx} />);
                    }
                    return elements;
                  }).flat()}
                </div>
              </section>
            ))}
          </div>
        )}

        {selectedCountry !== 'Worldwide' && regionsWithJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionsWithJobs.map((region, idx: number) => {
              const elements = [];
              elements.push(
                <Link key={region.slug} to={`/country/${region.countrySlug}/region/${region.slug}`}
                  className="group p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-amber-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><MapPin size={18} className="text-amber-400" /></div>
                      <div><h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{region.name}</h3><span className="text-[10px] text-gray-500 font-mono">{region.country}</span></div>
                    </div>
                    <ArrowRight size={16} className="text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400"><Briefcase size={12} className="text-amber-500" /><span className="text-white font-bold">{region.activeJobs}</span> active</div>
                    {region.jobCount > region.activeJobs && <span className="text-[10px] text-gray-600">{region.jobCount} total</span>}
                  </div>
                </Link>
              );
              if ((idx + 1) % 3 === 0 && idx < regionsWithJobs.length - 1) {
                const adNum = Math.floor((idx + 1) / 3) % 3;
                elements.push(adNum === 1 ? <InFeedAd1 key={`ad1-${idx}`} index={idx} /> : adNum === 2 ? <InFeedAd2 key={`ad2-${idx}`} index={idx} /> : <InFeedAd3 key={`ad3-${idx}`} index={idx} />);
              }
              return elements;
            }).flat()}
          </div>
        )}

        {regionsWithoutJobs.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MapPin size={14} /> Other Locations ({regionsWithoutJobs.length})
              <span className="text-[10px] font-normal text-gray-600 ml-2">No active jobs yet</span>
            </h3>
            <div className="flex flex-wrap gap-2 opacity-40">
              {regionsWithoutJobs.slice(0, 20).map((region) => (
                <span key={region.slug} className="px-3 py-1.5 rounded-full text-[10px] text-gray-500 bg-white/[0.01] border border-white/5">{region.name}</span>
              ))}
              {regionsWithoutJobs.length > 20 && <span className="text-[10px] text-gray-600 self-center ml-2">+{regionsWithoutJobs.length - 20} more</span>}
            </div>
          </section>
        )}

        {selectedCountry !== 'Worldwide' && regionsWithJobs.length === 0 && filteredRegions.length > 0 && (
          <div className="text-center py-16">
            <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Jobs in {selectedCountry} Regions</h3>
            <p className="text-gray-500 text-sm mb-6">We have {filteredRegions.length} location{filteredRegions.length > 1 ? 's' : ''} listed for {selectedCountry}, but no active jobs yet.</p>
            <Link to="/market" className="text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider text-sm">Browse All Jobs in {selectedCountry} →</Link>
          </div>
        )}

        <AdBanner key="regions-footer" slot="5466053430" />
      </div>
    </>
  );
}
