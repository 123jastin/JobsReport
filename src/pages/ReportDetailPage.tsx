import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Building2, TrendingUp, ArrowLeft, ExternalLink, Share2, Clock,
  Sparkles, MapPin, Briefcase, Calendar, RefreshCw,
  Eye, FileText, X, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Report, RawJob } from '../types';
import { useCareerRedirect } from '../context/CareerRedirectContext';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function ReportDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();

  // ✅ Attachment viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerFiles, setViewerFiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch(`/api/reports/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setReport(data);
          setJobs(data.jobs || []);
        } else if (response.status === 404) {
          setReport(null);
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchReportData();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Loading Intelligence Report...
        </span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Report Not Found</h2>
        <p className="text-gray-400 mb-6">The intelligence report you're looking for doesn't exist or has been archived.</p>
        <Link to="/reports" className="text-blue-500 hover:underline font-bold uppercase tracking-wider text-sm">
          ← Back to Reports
        </Link>
      </div>
    );
  }

  const stats = report.stats || { companies: 0, growth: 0 };
  const chartData = report.chartData?.length ? report.chartData : [{ name: 'No Data', demand: 0 }];
  const distribution = report.distribution?.length ? report.distribution : [{ name: 'No Data', value: 1 }];
  const companies = report.companies || [];
  const hasChartData = chartData.length > 0 && chartData[0]?.demand > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/reports" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group text-xs font-bold uppercase tracking-widest">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Intel Feed</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-gray-500">
            Report ID: JR-{(report.id || '????').slice(0, 4).toUpperCase()}
          </span>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: report.title, url: window.location.href });
              }
            }}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Market Analysis / Intelligence</span>
          <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Live Data</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
          {report.title || 'Untitled Report'}
        </h1>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-12 border-l border-white/10 pl-6 h-4">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span className="uppercase font-bold tracking-widest">
              Updated: {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-500">
            <Sparkles size={12} />
            <span className="font-bold tracking-widest uppercase">Verified Source Data</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Companies Hiring</p>
          <div className="text-4xl font-mono text-white tracking-tighter">{stats.companies || companies.length || 0}</div>
          <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">Active Employers</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Growth Trend</p>
          <div className="text-4xl font-mono text-white tracking-tighter">+{stats.growth || 0}%</div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase italic">Above avg velocity</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Active Placements</p>
          <div className="text-4xl font-mono text-white tracking-tighter">{jobs.length}</div>
          <p className="text-[10px] text-blue-400 mt-2 font-bold uppercase tracking-widest">{report.role || 'General'} Positions</p>
        </div>
      </div>

      {/* Charts Section */}
      {hasChartData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />Job Demand Velocity
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#8b5cf6' }} />
                  <Bar dataKey="demand" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#8b5cf6' : '#27272a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6">Location Distribution</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 text-center">
          <TrendingUp size={24} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">
            Chart data will populate as jobs are added for this role
          </p>
        </div>
      )}

      {/* Content + Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Report Content */}
          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={24} className="text-blue-500" />
              Key Insights & Market Analysis
            </h2>
            {report.content ? (
              <div className="space-y-4 text-stone-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: report.content }} />
            ) : report.excerpt ? (
              <div className="space-y-3 text-stone-300 text-sm leading-relaxed"><p>{report.excerpt}</p></div>
            ) : (
              <p className="text-gray-500 text-sm">No content available for this report.</p>
            )}
          </div>

          {/* Jobs List with Attachments */}
          <div>
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
              <Briefcase size={18} className="text-blue-500" />
              Active Placements for {report.role || 'this role'}
            </h3>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-white/[0.01] border border-white/5">
                  <p className="text-xs text-gray-500 font-mono">NO ACTIVE PLACEMENTS TRACKED IN THIS QUARTER</p>
                </div>
              ) : (
                jobs.map((job: any) => {
                  const expired = job.expiresAt && job.expiresAt < new Date().toISOString().split('T')[0];
                  const hasFiles = job.images && job.images.length > 0;
                  
                  return (
                    <div key={job.id} className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                      {/* Job Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-base font-bold text-stone-100">{job.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase ${
                              expired ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-400'
                            }`}>
                              {expired ? 'Expired' : 'Active'}
                            </span>
                            {job.salary && <span className="text-[10px] text-emerald-400 font-mono font-bold">{job.salary}</span>}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><Building2 size={13} />{job.company}</span>
                            <span className="flex items-center gap-1"><MapPin size={13} />{job.location || 'Remote'}</span>
                            {job.postedAt && <span className="flex items-center gap-1 font-mono text-[10px]"><Calendar size={13} />{job.postedAt}</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => job.url && triggerRedirect(job.url, job.company, job.title)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shrink-0"
                        >
                          Apply <ExternalLink size={10} />
                        </button>
                      </div>

                      {/* ✅ Attachments for this job */}
                      {hasFiles && (
                        <div className="border-t border-white/5 pt-4">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Attachments ({job.images.length})</p>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {job.images.map((img: any, imgIdx: number) => {
                              const isPDF = img.type === 'pdf' || img.name?.toLowerCase().endsWith('.pdf');
                              const isDoc = img.type === 'document';
                              
                              return (
                                <div
                                  key={imgIdx}
                                  onClick={() => {
                                    setViewerFiles(job.images);
                                    setViewerIndex(imgIdx);
                                    setViewerOpen(true);
                                  }}
                                  className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-blue-500/30 transition-all bg-slate-900/50"
                                >
                                  {isPDF ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 p-1">
                                      <span className="text-sm font-black text-red-400">PDF</span>
                                    </div>
                                  ) : isDoc ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 p-1">
                                      <span className="text-sm font-black text-blue-400">DOC</span>
                                    </div>
                                  ) : (
                                    <img src={img.thumbnail || img.url} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Hiring Companies</h3>
            {companies.length > 0 ? (
              <div className="space-y-3">
                {companies.map((company: any) => (
                  <div key={company.name} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white">
                        {(company.name || '?')[0]}
                      </div>
                      <span className="font-bold text-white text-sm">{company.name}</span>
                    </div>
                    {company.url && (
                      <button onClick={() => triggerRedirect(company.url, company.name, 'Careers Page')} className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                        <ExternalLink size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5">
                No hiring companies tracked for this role yet
              </p>
            )}
          </div>

          <div className="p-5 rounded-3xl bg-white/[0.01] border border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Report Details</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="text-white font-bold">{report.role || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Period</span><span className="text-white font-bold">{report.monthYear || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Country</span><span className="text-white font-bold">{report.country || 'Tanzania'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Report ID</span><span className="text-white font-mono text-[10px]">{(report.id || '').slice(0, 8)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Fullscreen Attachment Viewer */}
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
                className="w-full h-full rounded-xl" style={{ border: 'none' }}
              />
            ) : (
              <img src={viewerFiles[viewerIndex]?.url} alt="" className="max-w-full max-h-full object-contain" />
            )}
          </div>
          <div className="flex justify-center gap-4 p-4 bg-black/90 shrink-0">
            <button onClick={() => setViewerIndex(Math.max(0, viewerIndex - 1))} disabled={viewerIndex === 0} className="p-2 bg-white/10 rounded-full text-white disabled:opacity-30">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setViewerIndex(Math.min(viewerFiles.length - 1, viewerIndex + 1))} disabled={viewerIndex === viewerFiles.length - 1} className="p-2 bg-white/10 rounded-full text-white disabled:opacity-30">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
