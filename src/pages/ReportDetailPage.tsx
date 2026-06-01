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

// ✅ Default empty data to prevent crashes
const emptyChartData = [{ name: 'No Data', demand: 0 }];
const emptyDistribution = [{ name: 'No Data', value: 1 }];

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
          console.log('Report data:', data); // Debug
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

  // ✅ Safe data with fallbacks
  const stats = report.stats || { companies: jobs.length, growth: 0 };
  const chartData = report.chartData?.length ? report.chartData : emptyChartData;
  const distribution = report.distribution?.length ? report.distribution : emptyDistribution;
  const companies = report.companies || [];

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
          {report.title}
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

      {/* 📈 Charts Section - Only show if data exists */}
      {chartData.length > 0 && chartData[0]?.name !== 'No Data' && (
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
                    {chartData.map((_entry: any, index: number) => (
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
                    {distribution.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ✍️ Article Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={24} className="text-blue-500" />
              Key Insights & Market Analysis
            </h2>
            {report.content ? (
              <div 
                className="space-y-4 text-stone-300 text-sm leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: report.content }} 
              />
            ) : report.excerpt ? (
              <div className="space-y-3 text-stone-300 text-sm leading-relaxed">
                <p>{report.excerpt}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No content available for this report.</p>
            )}
          </div>

          {companies.length > 0 && (
            <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
              <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">
                Hiring Companies
              </h3>
              <div className="space-y-3">
                {companies.map((company: any) => (
                  <div key={company.name} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white">
                        {(company.name || '?')[0]}
                      </div>
                      <span className="font-bold text-white">{company.name}</span>
                    </div>
                    {company.url && (
                      <button 
                        onClick={() => triggerRedirect(company.url, company.name, 'Careers Page')}
                        className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <ExternalLink size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Report Info</h3>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Role</span>
                <span className="text-white font-bold">{report.role || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Period</span>
                <span className="text-white font-bold">{report.monthYear || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Country</span>
                <span className="text-white font-bold">{report.country || 'Tanzania'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
