import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Building2, 
  TrendingUp, 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  Clock,
  Sparkles,
  MapPin,
  Briefcase,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Report, RawJob } from '../types';
import { useCareerRedirect } from '../context/CareerRedirectContext';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function ReportDetailPage() {
  // ✅ FIXED: Use 'slug' instead of 'id'
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // ✅ SINGLE API CALL: Fetches report + stats + chartData + distribution + companies + jobs
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/reports" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group text-xs font-bold uppercase tracking-widest">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Intel Feed</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="status-text text-[10px] font-mono text-gray-500">
            Report ID: JR-{report.id?.slice(0, 4).toUpperCase()}
          </span>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: report.title,
                  url: window.location.href
                });
              }
            }}
            className="p-2 rounded-full glass-panel hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Market Analysis / Intelligence</span>
          <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Live Data</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
          {report.title}
        </h1>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-12 border-l border-white/10 pl-6 h-4">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span className="uppercase font-bold tracking-widest">
              Updated: {new Date(report.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-500">
            <Sparkles size={12} />
            <span className="font-bold tracking-widest uppercase">Verified Source Data</span>
          </div>
        </div>
      </motion.div>

      {/* 📊 Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Companies Hiring</p>
          <div className="text-4xl font-mono text-white tracking-tighter">{report.stats.companies}</div>
          <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">Active Employers</p>
        </div>
        
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Growth Trend</p>
          <div className="text-4xl font-mono text-white tracking-tighter">+{report.stats.growth}%</div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase italic">Above avg velocity</p>
        </div>
        
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Active Placements</p>
          <div className="text-4xl font-mono text-white tracking-tighter">{jobs.length}</div>
          <p className="text-[10px] text-blue-400 mt-2 font-bold uppercase tracking-widest">{report.role} Positions</p>
        </div>
      </div>

      {/* 📈 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 rounded-3xl glass">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-brand-primary" size={20} />
            Job Demand Velocity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => {
                    // Format YYYY-MM to Month YYYY
                    const [year, month] = value.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                  }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a', 
                    borderRadius: '12px' 
                  }}
                  itemStyle={{ color: '#8b5cf6' }}
                  formatter={(value: number) => [`${value} jobs`, 'Demand']}
                />
                <Bar dataKey="demand" radius={[6, 6, 0, 0]}>
                  {report.chartData.map((_entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === report.chartData.length - 1 ? '#8b5cf6' : '#27272a'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-3xl glass">
          <h3 className="text-xl font-bold text-white mb-6">Location Distribution</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.distribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {report.distribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a', 
                    borderRadius: '12px' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {report.distribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                  />
                  {item.name}
                </div>
                <span className="text-white font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✍️ Article Content & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2 prose prose-invert max-w-none">
          <div className="p-6 rounded-3xl glass border-brand-primary/20 mb-8" id="report-description-insights">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="text-brand-primary" size={24} />
              Key Insights & Market Analysis
            </h2>
            {(() => {
              const excerptText = report.excerpt || "";
              const isHtml = /<[a-z][\s\S]*>/i.test(excerptText);
              if (isHtml) {
                return (
                  <div 
                    className="space-y-4 excerpt-rich-content text-stone-300 text-sm leading-relaxed" 
                    dangerouslySetInnerHTML={{ __html: excerptText }} 
                  />
                );
              }
              return (
                <div className="space-y-3 text-stone-300 text-sm leading-relaxed whitespace-pre-line">
                  {excerptText.split('\n\n').map((para, idx) => (
                    <p key={idx} className="mb-2">{para}</p>
                  ))}
                </div>
              );
            })()}
          </div>

          <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
            <Briefcase size={18} className="text-blue-500" />
            Active Placements for {report.role}
          </h3>

          <div className="space-y-4 mb-12">
            {(() => {
              const isJobExpired = (job: RawJob) => {
                if (!job.active) return true;
                if (job.expiresAt) {
                  const today = new Date().toISOString().split('T')[0];
                  return job.expiresAt < today;
                }
                return false;
              };

              const sortedJobs = [...jobs].sort((a, b) => {
                const aExpired = isJobExpired(a);
                const bExpired = isJobExpired(b);
                if (aExpired && !bExpired) return 1;
                if (!aExpired && bExpired) return -1;
                return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
              });

              if (sortedJobs.length === 0) {
                return (
                  <div className="p-8 text-center rounded-3xl bg-white/[0.01] border border-white/5">
                    <p className="text-xs text-gray-500 font-mono">NO ACTIVE PLACEMENTS TRACKED IN THIS QUARTER</p>
                  </div>
                );
              }

              return sortedJobs.map((job) => {
                const expired = isJobExpired(job);
                return (
                  <div 
                    key={job.id}
                    onClick={() => !expired && triggerRedirect(job.url, job.company, job.title)}
                    className={`group relative p-5 bg-white/[0.01] border border-white/5 rounded-3xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      expired ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/[0.03] cursor-pointer'
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-stone-100 group-hover:text-blue-400 transition-colors">
                          {job.title}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest font-extrabold uppercase ${
                          expired 
                            ? 'bg-red-500/10 text-red-500/95 border border-red-500/10' 
                            : 'bg-green-500/10 text-green-400 border border-green-400/10'
                        }`}>
                          {expired ? 'Expired' : 'Active'}
                        </span>

                        {job.salary && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            {job.salary}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 size={13} className="text-stone-400" />
                          <span className="text-gray-400 font-medium">{job.company}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-stone-400" />
                          <span className="text-gray-400">{job.location}</span>
                        </span>

                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Calendar size={13} className="text-stone-400" />
                          Posted: <span className="text-gray-400">
                            {new Date(job.postedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </span>

                        {job.expiresAt && (
                          <span className={`flex items-center gap-1 font-mono text-[10px] ${
                            expired ? 'text-red-400/80 font-bold' : 'text-violet-400/80 font-bold'
                          }`}>
                            <Clock size={13} />
                            {expired ? 'Expired' : 'Expires'}: {new Date(job.expiresAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center self-start sm:self-auto">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!expired) {
                            triggerRedirect(job.url, job.company, job.title);
                          }
                        }}
                        disabled={expired}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                          expired 
                            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-500 text-stone-100 shadow-md shadow-blue-500/15 group-hover:scale-105'
                        }`}
                      >
                        <span>{expired ? 'Archived Apply' : 'Careers Portal'}</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* 🏢 Companies Hiring Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            Hiring Companies
          </h3>
          <div className="space-y-3">
            {report.companies?.map(company => (
              <div 
                key={company.name} 
                className="p-4 rounded-2xl glass border-white/5 hover:border-brand-primary/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white">
                    {company.name[0]}
                  </div>
                  <span className="font-bold text-white group-hover:text-brand-primary transition-colors">
                    {company.name}
                  </span>
                </div>
                <button 
                  onClick={() => triggerRedirect(company.url, company.name, 'Official Careers Page')}
                  className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 cursor-pointer"
                >
                  <ExternalLink size={18} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 italic p-4 bg-white/5 rounded-xl border border-dashed border-white/10">
            * We link directly to official company career pages. JobsReport does not host internal applications.
          </p>
        </div>
      </div>

      {/* Structured Data (Article & Organization) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": report.title,
          "description": report.excerpt?.replace(/<[^>]*>/g, '').substring(0, 160),
          "datePublished": report.updatedAt,
          "dateModified": report.updatedAt,
          "author": {
            "@type": "Organization",
            "name": "JobsReport Intelligence Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "JobsReport",
            "logo": {
              "@type": "ImageObject",
              "url": "https://jobsreport.online/logo.png"
            }
          }
        })}
      </script>
    </div>
  );
}
