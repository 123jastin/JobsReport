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
  RefreshCw,
  ChevronRight
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
import SEO from '../components/SEO';
import { Report, RawJob } from '../types';
import { useCareerRedirect } from '../context/CareerRedirectContext';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function ReportDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch(`/api/reports/${slug}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Report data:', data);
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
      <>
        <SEO 
          title="Report Not Found | JobsReport" 
          description="The requested market intelligence report could not be found." 
        />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Report Not Found</h2>
          <p className="text-gray-400 mb-6">The intelligence report you're looking for doesn't exist or has been archived.</p>
          <Link to="/reports" className="text-blue-500 hover:underline font-bold uppercase tracking-wider text-sm">
            ← Back to Reports
          </Link>
        </div>
      </>
    );
  }

  // SEO metadata
  const pageTitle = `${report.title || 'Market Report'} | ${report.role || 'Job Market'} Analysis | JobsReport`;
  const pageDescription = (report.excerpt || report.content || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 160);
  const canonicalUrl = `https://jobsreport.online/report/${slug}`;
  const publishedDate = report.createdAt || report.updatedAt || new Date().toISOString();
  const modifiedDate = report.updatedAt || report.createdAt || new Date().toISOString();

  // Extract plain text for word count
  const plainTextContent = (report.content || report.excerpt || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = plainTextContent.split(/\s+/).length;

  // Extract image from content if any
  const contentImage = (report.content || '').match(/<img[^>]+src="([^">]+)"/);
  const articleImage = report.image || (contentImage ? contentImage[1] : undefined);

  // 🔥 NewsArticle Schema (clean - no JobPosting)
  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": report.title,
    "description": pageDescription,
    "image": articleImage || undefined,
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "url": canonicalUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "author": {
      "@type": "Organization",
      "name": "JobsReport",
      "url": "https://jobsreport.online"
    },
    "publisher": {
      "@type": "Organization",
      "name": "JobsReport",
      "url": "https://jobsreport.online",
      "logo": {
        "@type": "ImageObject",
        "url": "https://jobsreport.online/favicon.ico"
      }
    },
    "about": [
      {
        "@type": "Thing",
        "name": report.role || 'Job Market'
      }
    ],
    "keywords": [
      report.role,
      report.country,
      'job market',
      'hiring trends',
      'employment report',
      'career insights',
      'market analysis'
    ].filter(Boolean),
    "wordCount": wordCount,
    "articleSection": report.role || 'Job Market',
    "isAccessibleForFree": true
  };

  // 🔥 BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://jobsreport.online"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Reports",
        "item": "https://jobsreport.online/reports"
      },
      ...(report.country ? [{
        "@type": "ListItem",
        "position": 3,
        "name": `Reports in ${report.country}`,
        "item": `https://jobsreport.online/reports/${report.country.toLowerCase().replace(/\s+/g, '-')}`
      }] : []),
      {
        "@type": "ListItem",
        "position": report.country ? 4 : 3,
        "name": report.title || 'Report Detail',
        "item": canonicalUrl
      }
    ]
  };

  // Safe data with fallbacks
  const stats = report.stats || { companies: 0, growth: 0 };
  const chartData = report.chartData?.length ? report.chartData : [{ name: 'No Data', demand: 0 }];
  const distribution = report.distribution?.length ? report.distribution : [{ name: 'No Data', value: 1 }];
  const companies = report.companies || [];
  const hasChartData = chartData.length > 0 && chartData[0]?.demand > 0;

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${report.role || 'job'} market report, ${report.country || ''} hiring trends, employment analysis, ${report.role || ''} jobs, career insights`}
        canonicalUrl={canonicalUrl}
        ogTitle={pageTitle}
        ogDescription={pageDescription}
        ogUrl={canonicalUrl}
        structuredData={[newsArticleSchema, breadcrumbSchema]}
      />

      <div className="space-y-8 pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={10} />
          <Link to="/reports" className="hover:text-white transition-colors">Reports</Link>
          {report.country && (
            <>
              <ChevronRight size={10} />
              <Link 
                to={`/reports/${report.country.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-white transition-colors"
              >
                {report.country}
              </Link>
            </>
          )}
          <ChevronRight size={10} />
          <span className="text-blue-400 truncate max-w-[200px]">{report.title}</span>
        </div>

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
                  navigator.share({
                    title: report.title,
                    url: window.location.href
                  });
                }
              }}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
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
            {report.title || 'Untitled Report'}
          </h1>
          <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-12 border-l border-white/10 pl-6 h-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span className="uppercase font-bold tracking-widest">
                Updated: {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
              </span>
            </div>
            {report.role && (
              <div className="flex items-center gap-1.5">
                <Briefcase size={12} />
                <span className="font-bold tracking-widest uppercase">{report.role}</span>
              </div>
            )}
            {report.country && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                <span className="font-bold tracking-widest uppercase">{report.country}</span>
              </div>
            )}
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

        {/* 📈 Charts Section */}
        {hasChartData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Job Demand Velocity
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#8b5cf6' }}
                    />
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
              <div className="mt-4 space-y-2">
                {distribution.map((item: any, index: number) => (
                  <div key={item.name || index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </div>
                    <span className="text-white font-mono">{item.value}</span>
                  </div>
                ))}
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

        {/* ✍️ Article Content & Companies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Report Content */}
            <article className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={24} className="text-blue-500" />
                Key Insights & Market Analysis
              </h2>
              {report.content ? (
                <div 
                  className="space-y-4 text-stone-300 text-sm leading-relaxed excerpt-rich-content" 
                  dangerouslySetInnerHTML={{ __html: report.content }} 
                />
              ) : report.excerpt ? (
                <div className="space-y-3 text-stone-300 text-sm leading-relaxed">
                  <p>{report.excerpt}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No content available for this report.</p>
              )}
            </article>

            {/* Jobs Section */}
            <div>
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                <Briefcase size={18} className="text-blue-500" />
                Active Placements for {report.role || 'this role'}
              </h3>

              <div className="space-y-4">
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
                    return new Date(b.postedAt || '').getTime() - new Date(a.postedAt || '').getTime();
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
                        onClick={() => !expired && job.url && triggerRedirect(job.url, job.company, job.title)}
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

                            {job.postedAt && (
                              <span className="flex items-center gap-1 font-mono text-[10px]">
                                <Calendar size={13} className="text-stone-400" />
                                Posted: <span className="text-gray-400">{job.postedAt}</span>
                              </span>
                            )}

                            {job.expiresAt && (
                              <span className={`flex items-center gap-1 font-mono text-[10px] ${
                                expired ? 'text-red-400/80 font-bold' : 'text-violet-400/80 font-bold'
                              }`}>
                                <Clock size={13} />
                                {expired ? 'Expired' : 'Expires'}: {job.expiresAt}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center self-start sm:self-auto">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!expired && job.url) {
                                triggerRedirect(job.url, job.company, job.title);
                              }
                            }}
                            disabled={expired || !job.url}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                              expired || !job.url
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 text-stone-100 shadow-md shadow-blue-500/15 group-hover:scale-105'
                            }`}
                          >
                            <span>{expired ? 'Archived' : 'Careers Portal'}</span>
                            <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hiring Companies */}
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">
                Hiring Companies
              </h3>
              {companies.length > 0 ? (
                <div className="space-y-3">
                  {companies.map((company: any) => (
                    <div 
                      key={company.name} 
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white">
                          {(company.name || '?')[0]}
                        </div>
                        <span className="font-bold text-white text-sm">{company.name}</span>
                      </div>
                      {company.url && (
                        <button 
                          onClick={() => triggerRedirect(company.url, company.name, 'Official Careers Page')}
                          className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                        >
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
              <p className="text-xs text-gray-500 italic p-4 bg-white/5 rounded-xl border border-dashed border-white/10 mt-4">
                
              </p>
            </div>

            {/* Report Info Card */}
            <aside className="p-5 rounded-3xl bg-white/[0.01] border border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                Report Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="text-white font-bold">{report.role || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Period</span>
                  <span className="text-white font-bold">{report.monthYear || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Country</span>
                  <span className="text-white font-bold">{report.country || 'Tanzania'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Published</span>
                  <span className="text-white font-bold text-[10px]">
                    {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Word Count</span>
                  <span className="text-white font-mono text-[10px]">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Report ID</span>
                  <span className="text-white font-mono text-[10px]">{(report.id || '').slice(0, 8)}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
