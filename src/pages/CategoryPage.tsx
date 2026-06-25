import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, MapPin, Clock, ArrowLeft, Briefcase, Globe } from 'lucide-react';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';

const JOBS_PER_PAGE = 10;

export default function CategoryPage() {
  const { categorySlug, countrySlug } = useParams<{ categorySlug: string; countrySlug?: string }>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const categoryName = categorySlug?.replace(/-/g, ' ') || '';
  const countryName = countrySlug ? countrySlug.replace(/-/g, ' ') : '';

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setPage(1);
      try {
        const res = await fetch(`/api/category-jobs?category=${encodeURIComponent(categoryName)}`);
        if (res.ok) {
          const data = await res.json();
          let filtered = data.jobs || [];
          
          if (countryName) {
            filtered = filtered.filter((j: any) => {
              const loc = (j.location || '').toLowerCase();
              const ctry = countryName.toLowerCase();
              return loc.includes(ctry);
            });
          }
          
          setJobs(filtered);
        }
      } catch (err) {} finally { setLoading(false); }
    }
    if (categorySlug) loadJobs();
  }, [categorySlug, countrySlug]);

  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const paginatedJobs = jobs.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);

  const seoTitle = countryName
    ? `${categoryName} Jobs in ${countryName} | Browse ${categoryName} Vacancies ${countryName} | JobsReport`
    : `${categoryName} Jobs | Browse ${categoryName} Vacancies | JobsReport`;

  const seoDescription = countryName
    ? `Browse ${jobs.length} ${categoryName.toLowerCase()} job listings in ${countryName}. Find the latest ${categoryName.toLowerCase()} vacancies and career opportunities in ${countryName} on JobsReport.`
    : `Browse ${jobs.length} ${categoryName.toLowerCase()} job listings worldwide. Find the latest ${categoryName.toLowerCase()} vacancies and career opportunities on JobsReport.`;

  const canonicalUrl = countryName
    ? `https://jobsreport.online/category/${categorySlug}/${countrySlug}`
    : `https://jobsreport.online/category/${categorySlug}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} canonicalUrl={canonicalUrl}
        ogTitle={seoTitle} ogDescription={seoDescription} ogUrl={canonicalUrl} />

      <div className="min-h-screen bg-black text-white space-y-6 pb-12">
        <div className="flex items-center gap-2 pt-6">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Home</span>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
            {countryName ? `${categoryName} Jobs in ${countryName}` : `${categoryName} Jobs`}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {countryName 
              ? `Browse ${jobs.length} ${categoryName.toLowerCase()} jobs in ${countryName}`
              : `Browse ${jobs.length} ${categoryName.toLowerCase()} jobs worldwide`}
          </p>
          
          {/* Country quick filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <Link to={`/category/${categorySlug}`}
              className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all ${!countryName ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              🌍 All
            </Link>
            {['Tanzania', 'Kenya', 'Uganda', 'Rwanda'].map(country => {
              const cSlug = country.toLowerCase().replace(/\s+/g, '-');
              const flag = country === 'Tanzania' ? '🇹🇿' : country === 'Kenya' ? '🇰🇪' : country === 'Uganda' ? '🇺🇬' : '🇷🇼';
              return (
                <Link key={country} to={`/category/${categorySlug}/${cSlug}`}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all ${countryName.toLowerCase() === country.toLowerCase() ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {flag} {country}
                </Link>
              );
            })}
          </div>
        </div>

        <AdBanner key={`cat-top-${categorySlug}-${countrySlug || 'all'}`} slot="4550717155" />

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Globe size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-white font-bold text-sm">No jobs found</p>
            <p className="text-xs mt-1">
              {countryName 
                ? `No ${categoryName.toLowerCase()} jobs available in ${countryName}.` 
                : `No ${categoryName.toLowerCase()} jobs available.`}
            </p>
            {countryName && (
              <Link to={`/category/${categorySlug}`} className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-xs font-bold">
                View all {categoryName} jobs worldwide →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedJobs.map((job, idx) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.03 } }}>
                <Link to={`/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`}
                  className="block p-5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {job.logoUrl ? <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" />
                        : <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">{job.company?.charAt(0)?.toUpperCase()||'?'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-blue-500/10 text-blue-400 uppercase">{job.role||'General'}</span>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 truncate mt-1">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><Building2 size={10} />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{job.location||'Remote'}</span>
                      </div>
                      {job.salary && <span className="text-[9px] text-emerald-400 font-mono mt-1 block">{job.salary}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-3 pt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30">
              ← Prev
            </button>
            <span className="text-xs text-gray-500 py-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30">
              Next →
            </button>
          </div>
        )}

        <AdBanner key={`cat-bottom-${categorySlug}-${countrySlug || 'all'}`} slot="1373889473" />
      </div>
    </>
  );
}
