import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, Globe, MapPin, Briefcase, ExternalLink, ArrowRight, Search } from 'lucide-react';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';

interface Company {
  id: string;
  name: string;
  url: string;
  logoUrl: string;
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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, marketRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/market')
        ]);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData || []);
        }

        if (marketRes.ok) {
          const marketData = await marketRes.json();
          setJobs(marketData.jobs || []);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCompanyJobs = (companyName: string) => {
    return jobs.filter(job => 
      job.company.toLowerCase() === companyName.toLowerCase()
    ).sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return 0;
    });
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Companies & Employers | Browse Top Hiring Companies | JobsReport",
    "description": "Browse top companies and employers actively hiring in your Regions. Find available job opportunities from leading organizations across various industries.",
    "url": "https://jobsreport.online/companies",
    "isPartOf": { "@type": "WebSite", "name": "JobsReport", "url": "https://jobsreport.online" },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": companies.length,
      "itemListElement": companies.map((company, index) => ({
        "@type": "ListItem", "position": index + 1,
        "item": {
          "@type": "Organization", "name": company.name,
          "url": company.url || `https://jobsreport.online/companies`,
          "logo": company.logoUrl || undefined,
          "description": `${company.name} - Hiring ${getCompanyJobs(company.name).filter(j => j.active).length} active job(s).`
        }
      }))
    }
  };

  // 🔥 In-Feed Ad #1
  const InFeedAd1 = () => (
    <div className="p-4 rounded-3xl border border-white/5" style={{ background: 'transparent' }}>
      <ins className="adsbygoogle"
        style={{ display: 'block', background: 'transparent' }}
        data-ad-format="fluid"
        data-ad-layout-key="-h0-1a+31-4t+7z"
        data-ad-client="ca-pub-8155064094205693"
        data-ad-slot="1805968460" />
    </div>
  );

  // 🔥 In-Feed Ad #2
  const InFeedAd2 = () => (
    <div className="p-4 rounded-3xl border border-white/5" style={{ background: 'transparent' }}>
      <ins className="adsbygoogle"
        style={{ display: 'block', background: 'transparent' }}
        data-ad-format="fluid"
        data-ad-layout-key="-gh-1o+14-67+ka"
        data-ad-client="ca-pub-8155064094205693"
        data-ad-slot="9872160747" />
    </div>
  );

  // 🔥 In-Feed Ad #3
  const InFeedAd3 = () => (
    <div className="p-4 rounded-3xl border border-white/5" style={{ background: 'transparent' }}>
      <ins className="adsbygoogle"
        style={{ display: 'block', background: 'transparent' }}
        data-ad-format="fluid"
        data-ad-layout-key="-gm-l+1-46+ex"
        data-ad-client="ca-pub-8155064094205693"
        data-ad-slot="5598749525" />
    </div>
  );

  if (loading) {
    return (
      <>
        <SEO title="Companies & Employers | Browse Top Hiring Companies | JobsReport" description="Browse top companies and employers actively hiring." />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Companies & Employers | Browse Top Hiring Companies | JobsReport"
        description="Browse top companies and employers actively hiring. Find job opportunities from leading organizations across various industries."
        keywords="companies hiring, top employers, company jobs, employer directory, find companies, hiring organizations"
        canonicalUrl="https://jobsreport.online/companies"
        ogTitle="Companies & Employers | Browse Top Hiring Companies | JobsReport"
        ogDescription="Browse top companies and employers actively hiring. Find job opportunities from leading organizations."
        ogUrl="https://jobsreport.online/companies"
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
            Companies & Employers
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Browse top companies actively hiring in your Regions. Find available job opportunities from leading organizations.
          </p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-blue-500" />
              <span className="text-gray-400"><span className="text-white font-bold">{companies.length}</span> Companies</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={16} className="text-emerald-500" />
              <span className="text-gray-400"><span className="text-white font-bold">{jobs.filter(j => j.active !== false).length}</span> Active Jobs</span>
            </div>
          </div>
        </div>

        {/* 🔥 Top Display Ad */}
        <AdBanner key="companies-top" slot="4550717155" />

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text" value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedCompany(null); }}
            placeholder={`Search ${companies.length} companies...`}
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Selected Company Detail View */}
        {selectedCompany ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button onClick={() => setSelectedCompany(null)} className="text-sm text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2">
              ← Back to All Companies
            </button>

            <div className="p-8 bg-white/[0.01] border border-white/10 rounded-3xl">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedCompany.logoUrl ? (
                    <img src={selectedCompany.logoUrl} alt={selectedCompany.name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">{selectedCompany.name.charAt(0)?.toUpperCase()}</div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedCompany.name}</h2>
                  {selectedCompany.url && (
                    <a href={selectedCompany.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors">
                      <Globe size={14} />
                      {(() => { try { return new URL(selectedCompany.url).hostname.replace('www.', ''); } catch { return 'Company Website'; } })()}
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <div className="flex gap-4 mt-3">
                    <span className="text-[10px] text-gray-400"><span className="text-white font-bold">{getCompanyJobs(selectedCompany.name).filter(j => j.active).length}</span> active jobs</span>
                    <span className="text-[10px] text-gray-400"><span className="text-white font-bold">{getCompanyJobs(selectedCompany.name).length}</span> total listings</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 🔥 Ad inside company view */}
            <AdBanner key={`company-${selectedCompany.id}`} slot="1373889473" />

            {/* Company Jobs with in-feed ads */}
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>
                Job Openings ({getCompanyJobs(selectedCompany.name).length})
              </h3>

              {getCompanyJobs(selectedCompany.name).length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm font-mono">No job listings available for this company.</div>
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
                    
                    // 🔥 In-feed ads every 3 jobs inside company view
                    if ((idx + 1) % 3 === 0 && idx < getCompanyJobs(selectedCompany.name).length - 1) {
                      const adNum = Math.floor((idx + 1) / 3) % 3;
                      elements.push(
                        adNum === 1 ? <InFeedAd1 key={`ad1-${idx}`} /> :
                        adNum === 2 ? <InFeedAd2 key={`ad2-${idx}`} /> :
                        <InFeedAd3 key={`ad3-${idx}`} />
                      );
                    }
                    return elements;
                  }).flat()}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Companies Grid with In-Feed Ads */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company, idx: number) => {
              const elements = [];
              const companyJobs = getCompanyJobs(company.name);
              const activeJobs = companyJobs.filter(j => j.active).length;
              
              elements.push(
                <motion.button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white/[0.01] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] rounded-3xl transition-all text-left group"
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
                      {company.url && <span className="text-[10px] text-gray-500 font-mono truncate block mt-1">{(() => { try { return new URL(company.url).hostname.replace('www.', ''); } catch { return ''; } })()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-blue-400" />
                      <span className="text-xs text-gray-400"><span className="text-white font-bold">{activeJobs}</span> active jobs{companyJobs.length > activeJobs && <span className="text-gray-600 ml-1">({companyJobs.length} total)</span>}</span>
                    </div>
                    <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              );
              
              // 🔥 In-feed ads every 3 companies on the list
              if ((idx + 1) % 3 === 0 && idx < filteredCompanies.length - 1) {
                const adNum = Math.floor((idx + 1) / 3) % 3;
                elements.push(
                  adNum === 1 ? <InFeedAd1 key={`ad1-${idx}`} /> :
                  adNum === 2 ? <InFeedAd2 key={`ad2-${idx}`} /> :
                  <InFeedAd3 key={`ad3-${idx}`} />
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
        )}

        {/* 🔥 Footer Display Ad */}
        <AdBanner key="companies-footer" slot="5466053430" />
      </div>
    </>
  );
}
