import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import {
  Building2, MapPin, Clock, ExternalLink, ArrowLeft,
  FileText, Eye, ChevronLeft, ChevronRight, X, Download,
  Briefcase, Calendar, Globe, Share2, AlertCircle, Flag
} from 'lucide-react';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();
  const navigate = useNavigate();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerFiles, setViewerFiles] = useState<any[]>([]);

  const isExpired = job ? (
    job.active === false || 
    (job.expiresAt && new Date(job.expiresAt) < new Date())
  ) : false;

  useEffect(() => {
    async function loadJob() {
      try {
        // 🔥 Fetch all jobs to find the matching one
        const res = await fetch('/api/market?limit=200');
        if (res.ok) {
          const data = await res.json();
          const allJobs = data.jobs || data.activeJobs || [];
          
          // 🔥 Find job by matching the URL slug
          let found = allJobs.find((j: any) => {
            const slug = j.slug || `${j.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${j.id}`;
            return slug === jobId || jobId?.includes(j.id) || j.id === jobId;
          });
          
          setJob(found || null);
          if (found) {
            document.title = `${found.title} - ${found.company} | JobsReport`;
          }
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadJob();
    window.scrollTo(0, 0);
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <SEO 
          title="Job Not Found | JobsReport"
          description="This job listing may have been removed or expired."
        />
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Job Not Found</h2>
        <p className="text-gray-400 mb-6">This listing may have been removed or expired.</p>
        <Link to="/market" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm uppercase tracking-wider">
          ← Back to Market
        </Link>
      </div>
    );
  }

  const hasFiles = job.images && job.images.length > 0;
  const hasDescription = job.description && job.description.trim() !== '';
  const isEmailLink = job.url && job.url.startsWith('mailto:');
  const salaryDisplay = job.salary || null;
  const currencyFlag = job.salary_currency_flag || '🇹🇿';
  const jobUrl = job.slug ? `https://jobsreport.online/market/${job.slug}` : `https://jobsreport.online/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`;
  const hasWhatsApp = job.whatsapp_number && job.whatsapp_number.trim().length > 6;
  const hasInstructions = job.application_instructions && job.application_instructions.trim().length > 0;

  const seoDescription = `${job.title} at ${job.company} in ${job.location || 'Tanzania'}. ${job.role || ''}. ${job.salary ? 'Salary: ' + job.salary + '. ' : ''}${isExpired ? 'This job has expired. ' : 'Apply now! '}`;

  const jobPostingSchema = isExpired ? null : {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": (job.description || '').replace(/<[^>]*>/g, '').substring(0, 5000),
    "datePosted": job.postedAt || '',
    "validThrough": job.expiresAt || '',
    "employmentType": job.employment_type || 'FULL_TIME',
    "hiringOrganization": { "@type": "Organization", "name": job.company, "logo": job.logoUrl || '' },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.city || job.location || '',
        "addressCountry": "TZ"
      }
    },
    "url": jobUrl
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jobsreport.online" },
      { "@type": "ListItem", "position": 2, "name": "Market", "item": "https://jobsreport.online/market" },
      { "@type": "ListItem", "position": 3, "name": job.title, "item": jobUrl }
    ]
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title={isExpired ? `${job.title} - ${job.company} (Expired) | JobsReport` : `${job.title} - ${job.company} | JobsReport`}
        description={seoDescription}
        canonicalUrl={jobUrl}
        ogTitle={`${job.title} - ${job.company}`}
        ogDescription={seoDescription}
        ogUrl={jobUrl}
        ogImage={job.logoUrl || undefined}
        keywords={`${job.title}, ${job.company}, ${job.location || 'Tanzania'}, ${job.role || ''}`}
        structuredData={[breadcrumbSchema, jobPostingSchema].filter(Boolean)}
      />

      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/market" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Market</span>
          </Link>
          <div className="flex items-center gap-3">
            {isExpired && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">Expired</span>}
            <button onClick={() => { if (navigator.share) navigator.share({ title: job.title, url: window.location.href }); else navigator.clipboard.writeText(window.location.href); }} className="p-2 hover:bg-white/5 rounded-full">
              <Share2 size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {job.logoUrl ? <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" /> :
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg">{job.company?.charAt(0)?.toUpperCase() || '?'}</div>}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-white">{job.company}</span>
            {job.companyWebsite && <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 block"><Globe size={11} className="inline" /> Website <ExternalLink size={10} className="inline" /></a>}
          </div>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{job.title}</h1>
        {isExpired && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10 mt-3"><AlertCircle size={14} className="text-red-400" /><p className="text-[11px] text-red-400/80">This job has expired.</p></div>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 mt-3">
          <span className="flex items-center gap-1.5"><MapPin size={13} /> {job.location || 'Remote'}</span>
          {salaryDisplay && <span className="flex items-center gap-1.5 text-emerald-400 font-bold">💰 {salaryDisplay}</span>}
          <span className="flex items-center gap-1.5"><Briefcase size={13} /> {job.role}</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {job.postedAt || 'Recent'}</span>
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-black/95 backdrop-blur border-t border-white/5 px-4 py-3">
        {hasWhatsApp && !isExpired ? (
          <a href={`https://wa.me/${job.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I am interested in the ${job.title} position`)}`} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white">
            💬 Apply via WhatsApp
          </a>
        ) : isExpired ? (
          <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm bg-red-500/10 text-red-400 cursor-not-allowed">🚫 Application Closed</button>
        ) : job.url ? (
          <button onClick={() => { if (!isExpired && job.url) triggerRedirect(job.url, job.company, job.title); }} className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white">
            {isEmailLink ? '✉️ Send Application' : 'Apply Now'} <ExternalLink size={16} />
          </button>
        ) : (
          <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm bg-white/5 text-gray-600 cursor-not-allowed">No application link</button>
        )}
      </div>

      {hasDescription && (
        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Job Description</h3>
          <div className="text-stone-300 text-sm leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: job.description }} />
        </div>
      )}

      <AdBanner key={`ad1-${jobId}`} slot="4550717155" />

      <div className="px-4 py-6 border-b border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Job Details</h3>
        <div className="space-y-3">
          {[['Status', isExpired ? 'Expired' : 'Active'], ['Company', job.company], ['Location', job.location || 'Remote'], ['Role', job.role], ['Salary', salaryDisplay ? `${currencyFlag} ${salaryDisplay}` : 'Not specified'], ['Category', job.job_category || 'General'], ['Employment Type', job.employment_type || 'Full Time'], ['Posted', job.postedAt || 'Recent']].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-xs font-bold ${label === 'Status' ? (isExpired ? 'text-red-400' : 'text-green-400') : 'text-white'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <AdBanner key={`ad2-${jobId}`} slot="1373889473" />
      <AdBanner key={`ad3-${jobId}`} slot="5466053430" />

      {viewerOpen && viewerFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 bg-black/90 shrink-0">
            <span className="text-white text-xs font-mono">{viewerIndex + 1} / {viewerFiles.length}</span>
            <button onClick={() => setViewerOpen(false)} className="p-1.5 bg-white/10 rounded-full text-white"><X size={18} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={viewerFiles[viewerIndex]?.url} alt={`Attachment ${viewerIndex + 1}`} className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
