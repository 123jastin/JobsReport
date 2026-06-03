import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Building2, MapPin, Clock, ExternalLink, ArrowLeft,
  FileText, Eye, ChevronLeft, ChevronRight, X, Download,
  Briefcase, DollarSign, Calendar
} from 'lucide-react';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();
  
  // Image/PDF viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerFiles, setViewerFiles] = useState<any[]>([]);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          const found = data.jobs?.find((j: any) => j.id === jobId);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
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

  return (
    <div className="space-y-6 pb-12">
      {/* Back Navigation */}
      <Link to="/market" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Market
      </Link>

      {/* Job Header Card */}
      <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {job.company?.charAt(0)?.toUpperCase() || '?'}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Role Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                {job.role || 'General'}
              </span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Calendar size={11} />
                Posted: {job.postedAt || 'Recent'}
              </span>
              {job.expiresAt && (
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock size={11} />
                  Expires: {job.expiresAt}
                </span>
              )}
            </div>

            {/* Job Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{job.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Building2 size={14} className="text-stone-500" />
                {job.company}
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <MapPin size={14} className="text-stone-500" />
                {job.location || 'Remote'}
              </span>
              {job.salary && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <DollarSign size={14} />
                    {job.salary}
                  </span>
                </>
              )}
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Briefcase size={14} className="text-stone-500" />
                {job.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Description + Media */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Job Description */}
          {hasDescription && (
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                Job Description
              </h2>
              <div 
                className="text-stone-300 text-sm leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          )}

          {!hasDescription && (
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl text-center">
              <FileText size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No detailed description available for this listing.</p>
            </div>
          )}

          {/* Attachments / Media */}
          {hasFiles && (
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye size={18} className="text-blue-400" />
                Attachments ({job.images.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                      className="relative rounded-xl overflow-hidden border border-white/5 bg-slate-900/50 cursor-pointer group hover:border-blue-500/30 transition-all aspect-square"
                    >
                      {isPDF ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 p-3">
                          <span className="text-2xl font-black text-red-400">PDF</span>
                          <span className="text-[8px] text-gray-400 mt-1 text-center truncate w-full">{img.name?.substring(0, 15)}</span>
                        </div>
                      ) : isDoc ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 p-3">
                          <span className="text-2xl font-black text-blue-400">DOC</span>
                          <span className="text-[8px] text-gray-400 mt-1 text-center truncate w-full">{img.name?.substring(0, 15)}</span>
                        </div>
                      ) : (
                        <>
                          <img src={img.thumbnail || img.url} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Apply Button + Info */}
        <div className="space-y-4">
          {/* Apply Now Button */}
          <button
            onClick={() => job.url && triggerRedirect(job.url, job.company, job.title)}
            disabled={!job.url}
            className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              job.url 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            Apply Now <ExternalLink size={16} />
          </button>

          {/* Job Info Card */}
          <div className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">Job Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="text-white font-bold">{job.role || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Company</span>
                <span className="text-white font-bold">{job.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="text-white font-bold">{job.location || 'Remote'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Salary</span>
                <span className="text-emerald-400 font-bold">{job.salary || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="text-white font-bold">{job.postedAt || 'Recent'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Signal ID</span>
                <span className="text-white font-mono text-[10px]">JR-{job.id?.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: job.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied!');
              }
            }}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all"
          >
            📤 Share This Job
          </button>
        </div>
      </div>

      {/* Fullscreen File Viewer */}
      {viewerOpen && viewerFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/90 shrink-0">
            <span className="text-white text-xs font-mono">{viewerIndex + 1} / {viewerFiles.length}</span>
            <div className="flex gap-2">
              <a href={viewerFiles[viewerIndex]?.url} download className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg flex items-center gap-1">
                <Download size={12} /> Download
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
                className="w-full h-full rounded-xl"
                style={{ border: 'none' }}
              />
            ) : (
              <img src={viewerFiles[viewerIndex]?.url} alt="" className="max-w-full max-h-full object-contain" />
            )}
          </div>
          
          <div className="flex justify-center gap-4 p-4 bg-black/90 shrink-0">
            <button
              onClick={() => setViewerIndex(Math.max(0, viewerIndex - 1))}
              disabled={viewerIndex === 0}
              className="p-2 bg-white/10 rounded-full text-white disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setViewerIndex(Math.min(viewerFiles.length - 1, viewerIndex + 1))}
              disabled={viewerIndex === viewerFiles.length - 1}
              className="p-2 bg-white/10 rounded-full text-white disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
