import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Building2, MapPin, Clock, ExternalLink, ArrowLeft,
  FileText, Eye, ChevronLeft, ChevronRight, X, Download
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
  
  // Description viewer
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    async function loadJob() {
      try {
        // Fetch single job from market API
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          const found = data.jobs?.find((j: any) => 
            j.id === jobId || j.title?.toLowerCase().replace(/\s+/g, '-') === jobId
          );
          setJob(found || null);
        }
      } catch (err) {
        console.error('Failed to load job:', err);
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadJob();
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
        <Link to="/market" className="text-blue-500 hover:underline">← Back to Market</Link>
      </div>
    );
  }

  const hasImages = job.images && job.images.length > 0;
  const hasDescription = job.description && job.description.trim() !== '';

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <Link to="/market" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest">
        <ArrowLeft size={16} /> Back to Market
      </Link>

      {/* Job Header */}
      <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {job.company?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 uppercase">
                {job.role}
              </span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock size={11} /> {job.postedAt}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{job.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Building2 size={14} /> {job.company}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
              {job.salary && <span className="text-emerald-400 font-bold">{job.salary}</span>}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
          <button
            onClick={() => job.url && triggerRedirect(job.url, job.company, job.title)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl flex items-center gap-2 transition-all"
          >
            Apply Now <ExternalLink size={14} />
          </button>
          {hasDescription && (
            <button
              onClick={() => setShowDescription(!showDescription)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                showDescription ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              {showDescription ? 'Hide Description' : 'View Description'}
            </button>
          )}
        </div>
      </div>

      {/* Job Description - Expandable */}
      {showDescription && hasDescription && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl"
        >
          <h2 className="text-lg font-bold text-white mb-4">Job Description</h2>
          <div 
            className="prose prose-invert max-w-none text-stone-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </motion.div>
      )}

      {/* Attachments (Images, PDFs) */}
      {hasImages && (
        <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
          <h2 className="text-lg font-bold text-white mb-4">Attachments ({job.images.length})</h2>
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
                      <span className="text-[8px] text-gray-400 mt-1 text-center truncate w-full">{img.name}</span>
                    </div>
                  ) : isDoc ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 p-3">
                      <span className="text-2xl font-black text-blue-400">DOC</span>
                      <span className="text-[8px] text-gray-400 mt-1 text-center truncate w-full">{img.name}</span>
                    </div>
                  ) : (
                    <img src={img.thumbnail || img.url} alt={img.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Viewer */}
      {viewerOpen && viewerFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
          {/* Top bar */}
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
          
          {/* Content */}
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
          
          {/* Navigation */}
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
