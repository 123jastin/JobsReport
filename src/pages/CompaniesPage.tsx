import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName?: string }>();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActiveJobs, setTotalActiveJobs] = useState(0);

  // Fetch companies with job counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/companies-jobs');
        if (res.ok) {
          const companiesList = await res.json();
          setCompanies(Array.isArray(companiesList) ? companiesList : []);
          const totalActive = companiesList.reduce((sum: number, c: Company) => sum + (c.activeJobs || 0), 0);
          setTotalActiveJobs(totalActive);
        }
      } catch (err) {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Fetch company jobs when selecting a company
  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyJobs(selectedCompany.id);
    }
  }, [selectedCompany]);

  // Find selected company from URL
  useEffect(() => {
    if (companyName && companies.length > 0) {
      const found = companies.find(c => 
        c.name.toLowerCase().replace(/\s+/g, '-') === companyName.toLowerCase()
      );
      if (found) {
        setSelectedCompany(found);
        setTimeout(() => window.scrollTo({ top: 300, behavior: 'smooth' }), 100);
      }
    }
  }, [companyName, companies]);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const fetchCompanyJobs = async (companyId: string) => {
    try {
      const res = await fetch(`/api/company-jobs/${companyId}`);
      if (res.ok) {
        const companyJobs = await res.json();
        setJobs(Array.isArray(companyJobs) ? companyJobs : []);
      }
    } catch (err) {}
  };

  const getCompanyJobs = (companyName: string) => {
    if (!companyName || jobs.length === 0) return [];
    return jobs.filter(j => j.company?.toLowerCase() === companyName.toLowerCase());
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
    ? `Browse ${selectedCompany.activeJobs || 0} job listings from ${selectedCompany.name}.`
    : 'Browse top companies actively hiring.';

  const canonicalUrl = selectedCompany
    ? `https://jobsreport.online/companies/${getCompanySlug(selectedCompany.name)}`
    : 'https://jobsreport.online/companies';

  const InFeedAd = ({ slot, layoutKey }: { slot: string; layoutKey: string; idx: number }) => {
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
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        }
      }, 200);
      return () => clearTimeout(timer);
    }, [slot, layoutKey]);
    return <div className="p-4 rounded-3xl border border-white/5" style={{ background: 'transparent' }}><div ref={adRef} /></div>;
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
      <SEO title={pageTitle} description={pageDescription} canonicalUrl={canonicalUrl}
        ogTitle={pageTitle} ogDescription={pageDescription} ogUrl={canonicalUrl} />

      <div className="min-h-screen space-y-8">
        <div className="pt-8">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-4">
            <Building2 size={14} /><span>Employer Directory</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            {selectedCompany ? selectedCompany.name : 'Companies & Employers'}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {selectedCompany ? `Browse jobs at ${selectedCompany.name}.` : 'Browse top companies actively hiring.'}
          </p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-blue-500" />
              <span className="text-gray-400"><span className="text-white font-bold">{selectedCompany ? 1 : companies.length}</span> Companies</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={16} className="text-emerald-500" />
              <span className="text-gray-400"><span className="text-white font-bold">{totalActiveJobs}</span> Active Jobs</span>
            </div>
          </div>
        </div>

        <AdBanner key="companies-top" slot="4550717155" />

        {!selectedCompany && (
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${companies.length} companies...`}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
        )}

        {selectedCompany ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button onClick={() => { setSelectedCompany(null); setJobs([]); window.history.pushState(null, '', '/companies'); }}
              className="text-sm text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2">
              ← Back to All Companies
            </button>

            <div className="p-8 bg-white/[0.01] border border-white/10 rounded-3xl">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedCompany.logoUrl ? <img src={selectedCompany.logoUrl} alt={selectedCompany.name} className="w-full h-full object-cover rounded-2xl" />
                    : <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">{selectedCompany.name.charAt(0)}</div>}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCompany.name}</h2>
                  {selectedCompany.industry && <span className="text-sm text-violet-400 font-bold">{selectedCompany.industry}</span>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span><span className="text-white font-bold">{selectedCompany.activeJobs || 0}</span> active jobs</span>
                    <span><span className="text-white font-bold">{selectedCompany.totalJobs || 0}</span> total</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedCompany.description && (
              <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest mb-3">About</h3>
                <div className="text-gray-400 text-sm whitespace-pre-line">{selectedCompany.description}</div>
              </div>
            )}

            <AdBanner key={`company-${selectedCompany.id}`} slot="1373889473" />

            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>
                Job Openings ({jobs.length})
              </h3>

              {jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No job listings available for this company.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((job) => (
                    <Link key={job.id} to={`/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}
                      className={`block p-5 rounded-2xl border transition-all group ${job.active ? 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-blue-500/30' : 'opacity-60'}`}>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${job.active ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {job.active ? 'Active' : 'Expired'}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 mt-2">{job.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin size={11} />{job.location || 'Remote'}</span>
                        {job.salary && <span className="text-emerald-400 font-bold">{job.salary}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCompanies.map((company) => {
                const activeJobs = company.activeJobs || 0;
                const totalJobs = company.totalJobs || 0;
                
                return (
                  <motion.div key={company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Link to={`/companies/${getCompanySlug(company.name)}`}
                      className="p-6 bg-white/[0.01] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] rounded-3xl transition-all text-left group block">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover rounded-2xl" />
                            : <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl">{company.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 truncate">{company.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-blue-400" />
                          <span className="text-xs text-gray-400">
                            <span className="text-white font-bold">{activeJobs}</span> active jobs
                            {totalJobs > activeJobs && <span className="text-gray-600 ml-1">({totalJobs} total)</span>}
                          </span>
                        </div>
                        <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30">
                  <ChevronLeft size={14} /> Prev</button>
                <span className="text-[10px] text-gray-500 font-mono">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30">
                  Next <ChevronRight size={14} /></button>
              </div>
            )}
          </div>
        )}

        <AdBanner key="companies-footer" slot="5466053430" />
      </div>
    </>
  );
}
