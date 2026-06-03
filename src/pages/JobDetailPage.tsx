import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2, MapPin, Clock, ExternalLink, ArrowLeft,
  FileText, Eye, ChevronLeft, ChevronRight, X, Download,
  Briefcase, DollarSign, Calendar, Globe, Share2, Bookmark
} from 'lucide-react';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerFiles, setViewerFiles] = useState<any[]>([]);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          const jobIdMatch = jobId?.match(/job-([a-z0-9]+)$/i);
          const extractedId = jobIdMatch ? `job-${jobIdMatch[1]}` : jobId;
          
          let found = data.jobs?.find((j: any) => j.id === extractedId);
          if (!found && jobId) {
            found = data.jobs?.find((j: any) => 
              jobId.includes(j.id) || j.id.includes(extractedId || '')
            );
          }
          setJob(found || null);
        }
      } catch (err) {
        console.error('Failed to load job:', err);
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
        <h2 className="text-2xl font-bold text-white mb-4">Job Not Found</h2>
        <p className="text-gray-400 mb-6">This listing may have been removed or expired.</p>
        <Link to="/market" className="text-blue-500 hover:underline font-bold uppercase tracking-wider text-sm">
          ← Back to Market
        </Link>
      </div>
    );
  }

  const hasFiles = job.images && job.images.length > 0;
  const hasDescription = job.description && job.description.trim() !== '';
  const isEmailLink = job.url && job.url.startsWith('mailto:');

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* ========== TOP NAVIGATION BAR ========== */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/market" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Market</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: job.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <Share2 size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ========== HERO HEADER - Full Width ========== */}
      <div className="px-4 py-6 border-b border-white/5">
        {/* Company Logo + Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {job.logoUrl ? (
              <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                {job.company?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">{job.company}</h2>
            {job.url && (
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Globe size={11} />
                {(() => {
                  try {
                    if (job.url.startsWith('mailto:')) return job.url.replace('mailto:', '');
                    const url = new URL(job.url);
                    return url.hostname.replace('www.', '');
                  } catch { return 'Website'; }
                })()}
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Job Title */}
        <h1 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight">{job.title}</h1>

        {/* Meta Info Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {job.location || 'Remote'}
          </span>
          {job.salary && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <DollarSign size={13} /> {job.salary}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Briefcase size={13} /> {job.role}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> {job.postedAt || 'Recent'}
          </span>
          {job.expiresAt && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <Clock size={13} /> Expires: {job.expiresAt}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3">
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-wider">
            {job.role || 'General'}
          </span>
          {job.active === false && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 uppercase tracking-wider">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* ========== APPLY BUTTON - Sticky Bottom Bar ========== */}
      <div className="sticky bottom-0 z-40 bg-black/95 backdrop-blur border-t border-white/5 px-4 py-3">
        <button
          onClick={() => job.url && triggerRedirect(job.url, job.company, job.title)}
          disabled={!job.url}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            job.url 
              ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]' 
              : 'bg-white/5 text-gray-600'
          }`}
        >
          {isEmailLink ? '✉️ Send Application' : 'Apply Now'}
          <ExternalLink size={16} />
        </button>
      </div>

      {/* ========== JOB DESCRIPTION - Flat Section ========== */}
      {hasDescription && (
        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            Job Description
          </h3>
          <div 
            className="text-stone-300 text-sm leading-relaxed space-y-4 job-description-content"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>
      )}

      {/* ========== ATTACHMENTS - Flat Section ========== */}
      {hasFiles && (
        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Eye size={16} className="text-blue-400" />
            Attachments ({job.images.length})
          </h3>
          
          {/* Horizontal scroll for mobile, grid for desktop */}
          <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto scrollbar-none">
            {job.images.map((img: any, index: number) => {
              const isPDF = img.type === 'pdf' || img.name?.toLowerCase().endsWith('.pdf');
              const isDoc = img.type === 'document';
              
              return (
                <div
                  key={index}
                  onClick={() => {
                    setViewerFiles(job.images);
                    setViewerIndex(index);
                    setViewerOpen(true);
                  }}
                  className="flex-shrink-0 w-24 h-24 md:w-full md:aspect-square rounded-xl overflow-hidden border border-white/5 bg-slate-900/50 cursor-pointer active:scale-95 transition-transform"
                >
                  {isPDF ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 p-2">
                      <span className="text-lg font-black text-red-400">PDF</span>
                      <span className="text-[7px] text-gray-400 mt-0.5 text-center truncate w-full">{img.name?.substring(0, 12)}</span>
                    </div>
                  ) : isDoc ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 p-2">
                      <span className="text-lg font-black text-blue-400">DOC</span>
                    </div>
                  ) : (
                    <img src={img.thumbnail || img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== JOB DETAILS - Flat Section ========== */}
      <div className="px-4 py-6 border-b border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Job Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
            <span className="text-xs text-gray-500">Company</span>
            <span className="text-xs font-bold text-white">{job.company}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
            <span className="text-xs text-gray-500">Location</span>
            <span className="text-xs font-bold text-white">{job.location || 'Remote'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
            <span className="text-xs text-gray-500">Role</span>
            <span className="text-xs font-bold text-white">{job.role}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
            <span className="text-xs text-gray-500">Salary</span>
            <span className="text-xs font-bold text-emerald-400">{job.salary || 'Not specified'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
            <span className="text-xs text-gray-500">Posted</span>
            <span className="text-xs font-bold text-white">{job.postedAt || 'Recent'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-gray-500">Signal ID</span>
            <span className="text-[10px] font-mono text-gray-400">JR-{job.id?.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ========== SHARE SECTION ========== */}
      <div className="px-4 py-6">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: job.title, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.04] text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Share2 size={14} /> Share This Job
        </button>
      </div>

      {/* Bottom spacer for sticky apply button */}
      <div className="h-20" />

      {/* ========== FULLSCREEN VIEWER ========== */}
      {viewerOpen && viewerFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 bg-black/90 shrink-0">
            <span className="text-white text-xs font-mono">{viewerIndex + 1} / {viewerFiles.length}</span>
            <div className="flex items-center gap-2">
              <a href={viewerFiles[viewerIndex]?.url} download className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg flex items-center gap-1">
                <Download size={12} />
              </a>
              <button onClick={() => setViewerOpen(false)} className="p-1.5 bg-white/10 rounded-full text-white">
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {viewerFiles[viewerIndex]?.type === 'pdf' || viewerFiles[viewerIndex]?.name?.endsWith('.pdf') ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewerFiles[viewerIndex].url)}&embedded=true`}
                className="w-full h-full" style={{ border: 'none' }}
              />
            ) : (
              <img src={viewerFiles[viewerIndex]?.url} alt="" className="max-w-full max-h-full object-contain" />
            )}
          </div>
          <div className="flex justify-center gap-6 px-4 py-4 bg-black/90 shrink-0">
            <button onClick={() => setViewerIndex(Math.max(0, viewerIndex - 1))} disabled={viewerIndex === 0} className="p-2 text-white disabled:opacity-30">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => setViewerIndex(Math.min(viewerFiles.length - 1, viewerIndex + 1))} disabled={viewerIndex === viewerFiles.length - 1} className="p-2 text-white disabled:opacity-30">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
