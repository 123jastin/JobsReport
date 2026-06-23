import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import {
  Building2, MapPin, Clock, ExternalLink, ArrowLeft,
  FileText, Briefcase, Calendar, Globe, Share2, AlertCircle
} from 'lucide-react';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();

  useEffect(() => {
    async function loadJob() {
      try {
        // Extract job ID from URL: "workshop-superintendent-kinondoni-job-mqng36f30mvo"
        // Find "job-" pattern
        const idMatch = jobId?.match(/(job-[a-z0-9]+)/i);
        const extractedId = idMatch ? idMatch[1] : jobId;
        
        // Try direct job API first
        const directRes = await fetch(`/api/job/${extractedId}`);
        if (directRes.ok) {
          const jobData = await directRes.json();
          if (jobData && !jobData.error) {
            setJob(jobData);
            document.title = `${jobData.title} - ${jobData.company} | JobsReport`;
            setLoading(false);
            return;
          }
        }
        
        // Fallback: search in market API
        const res = await fetch('/api/market?limit=200');
        if (res.ok) {
          const data = await res.json();
          const allJobs = data.jobs || data.activeJobs || [];
          
          const found = allJobs.find((j: any) => {
            return j.slug === jobId ||
                   jobId?.includes(j.id) ||
                   j.id === extractedId ||
                   jobId?.endsWith(j.id);
          });
          
          setJob(found || null);
          if (found) {
            document.title = `${found.title} - ${found.company} | JobsReport`;
          }
        }
      } catch (err) {} finally { setLoading(false); }
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
        <SEO title="Job Not Found | JobsReport" description="This job listing may have been removed or expired." />
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

  const isExpired = job.active === false || (job.expiresAt && new Date(job.expiresAt) < new Date());
  const salaryDisplay = job.salary || null;
  const isEmailLink = job.url && job.url.startsWith('mailto:');
  const hasWhatsApp = job.whatsapp_number && job.whatsapp_number.trim().length > 6;
  const jobUrl = job.slug ? `https://jobsreport.online/market/${job.slug}` : window.location.href;

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title={`${job.title} - ${job.company} | JobsReport`}
        description={`${job.title} at ${job.company} in ${job.location || 'Tanzania'}.`}
        canonicalUrl={jobUrl}
      />

      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center px-4 h-14">
          <Link to="/market" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft size={18} /><span className="text-xs font-bold uppercase tracking-wider">Market</span>
          </Link>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {job.logoUrl ? <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" />
              : <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg">{job.company?.charAt(0)?.toUpperCase() || '?'}</div>}
          </div>
          <div>
            <span className="text-sm font-bold text-white">{job.company}</span>
            {job.companyWebsite && <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 block">Website <ExternalLink size={10} className="inline" /></a>}
          </div>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 mt-3">
          <span className="flex items-center gap-1.5"><MapPin size={13} />{job.location || 'Remote'}</span>
          {salaryDisplay && <span className="flex items-center gap-1.5 text-emerald-400 font-bold">💰 {salaryDisplay}</span>}
          <span className="flex items-center gap-1.5"><Briefcase size={13} />{job.role}</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} />{job.postedAt || 'Recent'}</span>
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-black/95 backdrop-blur border-t border-white/5 px-4 py-3">
        {hasWhatsApp && !isExpired ? (
          <a href={`https://wa.me/${job.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I am interested in the ${job.title} position`)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white">💬 Apply via WhatsApp</a>
        ) : isExpired ? (
          <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm bg-red-500/10 text-red-400 cursor-not-allowed">🚫 Application Closed</button>
        ) : job.url ? (
          <button onClick={() => triggerRedirect(job.url, job.company, job.title)}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white">
            {isEmailLink ? '✉️ Send Application' : 'Apply Now'} <ExternalLink size={16} /></button>
        ) : null}
      </div>

      {job.description && (
        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4"><FileText size={16} className="text-blue-400 inline mr-2" />Job Description</h3>
          <div className="text-stone-300 text-sm leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: job.description }} />
        </div>
      )}

      <AdBanner key={`ad1-${jobId}`} slot="4550717155" />
      <AdBanner key={`ad2-${jobId}`} slot="1373889473" />
    </div>
  );
}
