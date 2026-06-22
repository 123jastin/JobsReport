import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, Globe, MapPin, Briefcase, ExternalLink, ArrowRight, Search, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';

interface Company {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  description?: string;
  streetAddress?: string;
  area?: string;
  locality?: string;
  district?: string;
  postalCode?: string;
  postalArea?: string;
  country?: string;
  industry?: string;
  foundedYear?: string;
  employeeCount?: string;
  totalJobs?: number;
  activeJobs?: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  role: string;
  salary: string;
  active: boolean;
  expiresAt?: string;
}

const COMPANIES_PER_PAGE = 12;

export default function CompaniesPage() {
  const { companyName } = useParams<{ companyName?: string }>();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActiveJobs, setTotalActiveJobs] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, marketRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/market?limit=200')
        ]);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          const companiesList = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
          setCompanies(companiesList);
          
          // 🔥 Calculate total active jobs from companies data directly
          const totalActive = companiesList.reduce((sum: number, c: Company) => sum + (c.activeJobs || 0), 0);
          setTotalActiveJobs(totalActive);
          
          console.log('📊 Companies loaded:', companiesList.length);
          console.log('📊 Total active jobs from companies:', totalActive);
          console.log('📊 Sample company:', companiesList[0]);
        }

        if (marketRes.ok) {
          const marketData = await marketRes.json();
          const allJobs = marketData.jobs || marketData.activeJobs || [];
          setJobs(allJobs);
          console.log('📊 Jobs loaded for detail view:', allJobs.length);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (companyName && companies.length > 0) {
      const found = companies.find(c => 
        c.name.toLowerCase().replace(/\s+/g, '-') === companyName.toLowerCase()
      );
      if (found) {
        setSelectedCompany(found);
        setTimeout(() => {
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [companyName, companies]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getCompanyJobs = (companyName: string) => {
    if (!companyName || jobs.length === 0) return [];
    
    const normalizedName = companyName.toLowerCase().trim();
    
    return jobs.filter(job => {
      const jobCompany = (job.company || '').toLowerCase().trim();
      
      return (
        jobCompany === normalizedName ||
        jobCompany.includes(normalizedName) ||
        normalizedName.includes(jobCompany) ||
        jobCompany.replace(/[^a-z0-9]/g, '') === normalizedName.replace(/[^a-z0-9]/g, '')
      );
    }).sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return 0;
    });
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * COMPANIES_PER_PAGE,
    currentPage * COMPANIES_PER_PAGE
  );

  const getCompanySlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  const pageTitle = selectedCompany 
    ? `${selectedCompany.name} Jobs & Careers | Browse ${selectedCompany.name} Vacancies | JobsReport`
    : 'Companies & Employers | Browse Top Hiring Companies | JobsReport';

  const pageDescription = selectedCompany
    ? `Browse ${selectedCompany.activeJobs || getCompanyJobs(selectedCompany.name).length} job listings from ${selectedCompany.name}. Find career opportunities and vacancies at ${selectedCompany.name}.`
    : 'Browse top companies and employers actively hiring. Find job opportunities from leading organizations across various industries.';

  const canonicalUrl = selectedCompany
    ? `https://jobsreport.online/companies/${getCompanySlug(selectedCompany.name)}`
    : 'https://jobsreport.online/companies';

  const structuredData = selectedCompany ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": selectedCompany.name,
    "url": selectedCompany.url || canonicalUrl,
    "logo": selectedCompany.logoUrl || undefined,
    "image": selectedCompany.logoUrl || undefined,
    "description": selectedCompany.description || undefined,
    "foundingDate": selectedCompany.foundedYear || undefined,
    "numberOfEmployees": selectedCompany.employeeCount ? {
      "@type": "QuantitativeValue",
      "value": selectedCompany.employeeCount
    } : undefined,
    "address": (selectedCompany.streetAddress || selectedCompany.locality) ? {
      "@type": "PostalAddress",
      "streetAddress": selectedCompany.streetAddress || undefined,
      "addressLocality": selectedCompany.locality || undefined,
      "addressRegion": selectedCompany.district || undefined,
      "postalCode": selectedCompany.postalCode || undefined,
      "addressCountry": selectedCompany.country || undefined
    } : undefined,
    "areaServed": selectedCompany.country ? {
      "@type": "Country",
      "name": selectedCompany.country === 'TZ' ? 'Tanzania' : 
             selectedCompany.country === 'KE' ? 'Kenya' :
             selectedCompany.country === 'UG' ? 'Uganda' :
             selectedCompany.country === 'RW' ? 'Rwanda' :
             selectedCompany.country
    } : undefined,
    "knowsAbout": selectedCompany.industry || undefined,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  } : {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": pageTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": companies.length,
    "itemListElement": companies.slice(0, 20).map((company, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Organization",
        "name": company.name,
        "url": company.url || `https://jobsreport.online/companies/${getCompanySlug(company.name)}`,
        "logo": company.logoUrl || undefined,
        "image": company.logoUrl || undefined,
        "description": `${company.name} - ${company.activeJobs || 0} active job(s) in ${company.industry || 'various industries'}.`
      }
    }))
  };

  // 🔥 In-Feed Ad with proper initialization
  const InFeedAd = ({ slot, layoutKey, idx }: { slot: string; layoutKey: string; idx: number }) => {
    const adRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (adRef.current) {
          adRef.current.innerHTML = '';
          const ins = document.createElement('ins');
          ins.className = 'adsbygoogle';
          ins.style.display = 'block';
          ins.style.background = 'transparent';
          ins.setAttribute('data-ad-format', 'fluid');
          ins.setAttribute('data-ad-layout-key', layoutKey);
          ins.setAttribute('data-ad-client', 'ca-pub-8155064094205693');
          ins.setAttribute('data-ad-slot', slot);
          adRef.current.appendChild(ins);
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.log('In-feed ad error:', e);
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }, [slot, layoutKey]);

    return (
      <div className="p-4 rounded-3xl border border-white/5" style={{ background: 'transparent' }}>
        <div ref={adRef} />
      </div>
    );
  };

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
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={selectedCompany 
          ? `${selectedCompany.name} jobs, ${selectedCompany.name} careers, ${selectedCompany.name} vacancies, work at ${selectedCompany.name}`
          : 'companies hiring, top employers, company jobs, employer directory, find companies, hiring organizations'}
        canonicalUrl={canonicalUrl}
        ogTitle={pageTitle}
        ogDescription={pageDescription}
        ogUrl={canonicalUrl}
        structuredData={structuredData}
      />

      <div className="min-h-screen space-y-8">
        {/* Header */}
        <div className="pt-8">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-4">
            <Building2 size={14} />
            <span>Employer Directory</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tighter">
            {selectedCompany ? selectedCompany.name : 'Companies & Employers'}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {selectedCompany 
              ? `Browse job opportunities and career vacancies at ${selectedCompany.name}.`
              : 'Browse top companies actively hiring. Find job opportunities from leading organizations.'}
          </p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-blue-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">{selectedCompany ? 1 : companies.length}</span>
                {selectedCompany ? ' Company' : ' Companies'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={16} className="text-emerald-500" />
              <span className="text-gray-400">
                <span className="text-white font-bold">
                  {selectedCompany 
                    ? (selectedCompany.activeJobs || 0)
                    : totalActiveJobs}
                </span>
                {' Active Jobs'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Display Ad */}
        <AdBanner key="companies-top" slot="4550717155" />

        {/* Search */}
        {!selectedCompany && (
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text" value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
              placeholder={`Search ${companies.length} companies...`}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        )}

        {/* Selected Company Detail View */}
        {selectedCompany ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button 
              onClick={() => {
                setSelectedCompany(null);
                window.history.pushState(null, '', '/companies');
              }} 
              className="text-sm text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2"
            >
              ← Back to All Companies
            </button>

            {/* Company Header */}
            <div className="p-8 bg-white/[0.01] border border-white/10 rounded-3xl">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedCompany.logoUrl ? (
                    <img src={selectedCompany.logoUrl} alt={selectedCompany.name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">{selectedCompany.name.charAt(0)?.toUpperCase()}</div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedCompany.name}</h2>
                    {selectedCompany.industry && (
                      <span className="text-sm text-violet-400 font-bold">{selectedCompany.industry}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span>
                      <span className="text-white font-bold">{selectedCompany.activeJobs || 0}</span> active jobs
                    </span>
                    <span>
                      <span className="text-white font-bold">{selectedCompany.totalJobs || 0}</span> total listings
                    </span>
                    {selectedCompany.foundedYear && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-500" />
                        Founded <span className="text-white font-bold">{selectedCompany.foundedYear}</span>
                      </span>
                    )}
                    {selectedCompany.employeeCount && (
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-gray-500" />
                        <span className="text-white font-bold">{selectedCompany.employeeCount}</span> employees
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Company Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              {(selectedCompany.streetAddress || selectedCompany.area || selectedCompany.locality || 
                selectedCompany.district || selectedCompany.postalCode || selectedCompany.country) && (
                <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                  <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <MapPin size={14} /> Location
                  </h3>
                  <div className="space-y-2.5">
                    {selectedCompany.streetAddress && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0 mt-0.5">Street</span>
                        <span className="text-stone-300">{selectedCompany.streetAddress}</span>
                      </div>
                    )}
                    {selectedCompany.area && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Area</span>
                        <span className="text-stone-300">{selectedCompany.area}</span>
                      </div>
                    )}
                    {selectedCompany.locality && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">City</span>
                        <span className="text-stone-300">{selectedCompany.locality}</span>
                      </div>
                    )}
                    {selectedCompany.district && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">District</span>
                        <span className="text-stone-300">{selectedCompany.district}</span>
                      </div>
                    )}
                    {selectedCompany.postalCode && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Postal</span>
                        <span className="text-stone-300">
                          {selectedCompany.postalCode}
                          {selectedCompany.postalArea && (
                            <span className="text-gray-500 text-xs"> ({selectedCompany.postalArea})</span>
                          )}
                        </span>
                      </div>
                    )}
                    {selectedCompany.country && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Country</span>
                        <span className="text-emerald-400 font-bold">
                          {selectedCompany.country === 'TZ' ? '🇹🇿 Tanzania' :
                           selectedCompany.country === 'KE' ? '🇰🇪 Kenya' :
                           selectedCompany.country === 'UG' ? '🇺🇬 Uganda' :
                           selectedCompany.country === 'RW' ? '🇷🇼 Rwanda' :
                           selectedCompany.country}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Info */}
              {(selectedCompany.url || selectedCompany.industry || selectedCompany.foundedYear || 
                selectedCompany.employeeCount) && (
                <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                  <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Briefcase size={14} /> Business Info
                  </h3>
                  <div className="space-y-2.5">
                    {selectedCompany.url && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Website</span>
                        <a 
                          href={selectedCompany.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                        >
                          <Globe size={14} />
                          {(() => { try { return new URL(selectedCompany.url).hostname.replace('www.', ''); } catch { return 'Company Website'; } })()}
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {selectedCompany.industry && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0 mt-0.5">Industry</span>
                        <span className="text-violet-400 font-bold">{selectedCompany.industry}</span>
                      </div>
                    )}
                    {selectedCompany.foundedYear && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Founded</span>
                        <span className="text-stone-300">{selectedCompany.foundedYear}</span>
                      </div>
                    )}
                    {selectedCompany.employeeCount && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Employees</span>
                        <span className="text-stone-300">{selectedCompany.employeeCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Company Description */}
            {selectedCompany.description && (
              <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  About {selectedCompany.name}
                </h3>
                <div className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">
                  {selectedCompany.description}
                </div>
              </div>
            )}

            {/* Ad */}
            <AdBanner key={`company-${selectedCompany.id}`} slot="1373889473" />

            {/* Company Jobs */}
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>
                Job Openings ({getCompanyJobs(selectedCompany.name).length})
              </h3>

              {getCompanyJobs(selectedCompany.name).length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm font-mono">
                  {jobs.length === 0 
                    ? 'Loading job listings...' 
                    : 'No job listings available for this company.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCompanyJobs(selectedCompany.name).map((job, idx: number) => {
                    const elements = [];
                    elements.push(
                      <Link
                        key={job.id}
                        to={`/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}
                        className={`block p-5 rounded-2xl border transition-all group ${job.active ? 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-blue-500/30' : 'bg-white/[0.005] border-white/5 opacity-60'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${job.active ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{job.active ? 'Active' : 'Expired'}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{job.role}</span>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{job.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1"><MapPin size={11} />{job.location || 'Remote'}</span>
                          {job.salary && <span className="flex items-center gap-1 text-emerald-400 font-bold">{job.salary}</span>}
                        </div>
                        {job.expiresAt && !job.active && <div className="mt-2 text-[9px] text-amber-400 font-mono">Expired: {job.expiresAt}</div>}
                      </Link>
                    );
                    
                    if ((idx + 1) % 3 === 0 && idx < getCompanyJobs(selectedCompany.name).length - 1) {
                      const adNum = Math.floor((idx + 1) / 3) % 3;
                      elements.push(
                        adNum === 1 
                          ? <InFeedAd key={`ad1-${idx}`} slot="1805968460" layoutKey="-h0-1a+31-4t+7z" idx={idx} />
                          : adNum === 2 
                            ? <InFeedAd key={`ad2-${idx}`} slot="9872160747" layoutKey="-gh-1o+14-67+ka" idx={idx} />
                            : <InFeedAd key={`ad3-${idx}`} slot="5598749525" layoutKey="-gm-l+1-46+ex" idx={idx} />
                      );
                    }
                    return elements;
                  }).flat()}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Companies Grid with Pagination */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCompanies.map((company, idx: number) => {
                const elements = [];
                const activeJobs = company.activeJobs || 0;
                const totalJobs = company.totalJobs || 0;
                const companySlug = getCompanySlug(company.name);
                
                elements.push(
                  <motion.div key={company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Link
                      to={`/companies/${companySlug}`}
                      className="p-6 bg-white/[0.01] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] rounded-3xl transition-all text-left group block"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {company.logoUrl ? (
                            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl">{company.name.charAt(0)?.toUpperCase()}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">{company.name}</h3>
                          {company.url && (
                            <span className="text-[10px] text-gray-500 font-mono truncate block mt-1">
                              {(() => { try { return new URL(company.url).hostname.replace('www.', ''); } catch { return ''; } })()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-blue-400" />
                          <span className="text-xs text-gray-400">
                            <span className="text-white font-bold">{activeJobs}</span> active jobs
                            {totalJobs > activeJobs && (
                              <span className="text-gray-600 ml-1">({totalJobs} total)</span>
                            )}
                          </span>
                        </div>
                        <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                );
                
                if ((idx + 1) % 3 === 0 && idx < paginatedCompanies.length - 1) {
                  const adNum = Math.floor((idx + 1) / 3) % 3;
                  elements.push(
                    adNum === 1 
                      ? <InFeedAd key={`ad1-${idx}-${currentPage}`} slot="1805968460" layoutKey="-h0-1a+31-4t+7z" idx={idx} />
                      : adNum === 2 
                        ? <InFeedAd key={`ad2-${idx}-${currentPage}`} slot="9872160747" layoutKey="-gh-1o+14-67+ka" idx={idx} />
                        : <InFeedAd key={`ad3-${idx}-${currentPage}`} slot="5598749525" layoutKey="-gm-l+1-46+ex" idx={idx} />
                  );
                }
                return elements;
              }).flat()}

              {filteredCompanies.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Building2 size={32} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-mono">{searchTerm ? 'No companies found matching your search.' : 'No companies listed yet.'}</p>
                </div>
              )}
            </div>

            {/* 🔥 Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((p, idx, arr) => (
                      <div key={p} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="text-gray-600 px-1">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                            currentPage === p
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    ))
                  }
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  Next <ChevronRight size={14} />
                </button>
                
                <span className="text-[10px] text-gray-500 font-mono ml-4">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Ad */}
        <AdBanner key="companies-footer" slot="5466053430" />
      </div>
    </>
  );
}
