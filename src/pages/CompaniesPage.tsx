import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, Globe, MapPin, Briefcase, ExternalLink, ArrowRight, Search, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';

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
  logoUrl?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyStreetAddress?: string;
  companyArea?: string;
  companyLocality?: string;
  companyDistrict?: string;
  companyPostalCode?: string;
  companyPostalArea?: string;
  companyCountry?: string;
  companyIndustry?: string;
  companyFoundedYear?: string;
  companyEmployeeCount?: string;
  slug?: string;
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

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyJobs(selectedCompany.id);
    }
  }, [selectedCompany]);

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

        {/* Ad removed */}

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
                    {selectedCompany.industry && <span className="text-sm text-violet-400 font-bold">{selectedCompany.industry}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span><span className="text-white font-bold">{selectedCompany.activeJobs || 0}</span> active jobs</span>
                    <span><span className="text-white font-bold">{selectedCompany.totalJobs || 0}</span> total listings</span>
                    {selectedCompany.foundedYear && (
                      <span className="flex items-center gap-1"><Clock size={12} className="text-gray-500" />Founded <span className="text-white font-bold">{selectedCompany.foundedYear}</span></span>
                    )}
                    {selectedCompany.employeeCount && (
                      <span className="flex items-center gap-1"><Users size={12} className="text-gray-500" /><span className="text-white font-bold">{selectedCompany.employeeCount}</span> employees</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {jobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(jobs[0].companyStreetAddress || jobs[0].companyArea || jobs[0].companyLocality || 
                  jobs[0].companyDistrict || jobs[0].companyPostalCode || jobs[0].companyCountry) && (
                  <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <MapPin size={14} /> Location
                    </h3>
                    <div className="space-y-2.5">
                      {jobs[0].companyStreetAddress && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0 mt-0.5">Street</span>
                          <span className="text-stone-300">{jobs[0].companyStreetAddress}</span>
                        </div>
                      )}
                      {jobs[0].companyArea && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Area</span>
                          <span className="text-stone-300">{jobs[0].companyArea}</span>
                        </div>
                      )}
                      {jobs[0].companyLocality && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">City</span>
                          <span className="text-stone-300">{jobs[0].companyLocality}</span>
                        </div>
                      )}
                      {jobs[0].companyDistrict && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">District</span>
                          <span className="text-stone-300">{jobs[0].companyDistrict}</span>
                        </div>
                      )}
                      {jobs[0].companyPostalCode && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Postal</span>
                          <span className="text-stone-300">{jobs[0].companyPostalCode}{jobs[0].companyPostalArea && <span className="text-gray-500 text-xs"> ({jobs[0].companyPostalArea})</span>}</span>
                        </div>
                      )}
                      {jobs[0].companyCountry && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Country</span>
                          <span className="text-emerald-400 font-bold">
                            {jobs[0].companyCountry === 'TZ' ? '🇹🇿 Tanzania' : jobs[0].companyCountry}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(selectedCompany.url || jobs[0].companyIndustry || jobs[0].companyFoundedYear || jobs[0].companyEmployeeCount) && (
                  <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                    <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Briefcase size={14} /> Business Info
                    </h3>
                    <div className="space-y-2.5">
                      {selectedCompany.url && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Website</span>
                          <a href={selectedCompany.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5">
                            <Globe size={14} />{(() => { try { return new URL(selectedCompany.url).hostname.replace('www.', ''); } catch { return 'Website'; } })()}<ExternalLink size={12} /></a>
                        </div>
                      )}
                      {jobs[0].companyIndustry && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0 mt-0.5">Industry</span>
                          <span className="text-violet-400 font-bold">{jobs[0].companyIndustry}</span>
                        </div>
                      )}
                      {jobs[0].companyFoundedYear && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Founded</span>
                          <span className="text-stone-300">{jobs[0].companyFoundedYear}</span>
                        </div>
                      )}
                      {jobs[0].companyEmployeeCount && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 text-xs font-mono uppercase w-16 shrink-0">Employees</span>
                          <span className="text-stone-300">{jobs[0].companyEmployeeCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {jobs.length > 0 && jobs[0].companyDescription && (
              <div className="p-6 bg-white/[0.01] border border-white/10 rounded-3xl">
                <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  About {selectedCompany.name}
                </h3>
                <div className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{jobs[0].companyDescription}</div>
              </div>
            )}

            {/* Ad removed */}

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
                    <Link key={job.id} to={`/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}
                      className={`block p-5 rounded-2xl border transition-all group ${job.active ? 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-blue-500/30' : 'opacity-60'}`}>
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
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCompanies.map((company) => (
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
                          <span className="text-white font-bold">{company.activeJobs || 0}</span> active jobs
                          {(company.totalJobs || 0) > (company.activeJobs || 0) && <span className="text-gray-600 ml-1">({company.totalJobs} total)</span>}
                        </span>
                      </div>
                      <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
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

        {/* Ad removed */}
      </div>
    </>
  );
}
