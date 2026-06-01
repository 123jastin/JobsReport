import { motion } from 'motion/react';
import { Calendar, ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Report } from '../types';

interface ReportCardProps {
  report: Report;
  key?: string | number;
}

export default function ReportCard({ report }: ReportCardProps) {
  // ✅ Safety checks
  if (!report) return null;
  
  const title = report.title || 'Untitled Report';
  const role = report.role || 'General';
  const slug = report.slug || report.id || '#';
  const monthYear = report.monthYear || 'Recent';
  
  // ✅ Safe access to stats with fallbacks
  const companies = report.stats?.companies || 0;
  const growth = report.stats?.growth || 0;

  return (
    <Link to={`/report/${slug}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="w-full p-4 bg-white/[0.02] border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all group relative overflow-hidden"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-tighter border border-blue-500/20">
              {role}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Calendar size={10} />
              {monthYear}
            </div>
          </div>
          
          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
            {title}
          </h3>
          
          <div className="flex gap-4">
            <div className="text-[10px]">
              <p className="text-gray-500 uppercase font-bold tracking-widest text-[8px] mb-0.5">Companies</p>
              <p className="text-white font-mono font-bold tracking-tight">{companies}</p>
            </div>
            <div className="text-[10px]">
              <p className="text-gray-500 uppercase font-bold tracking-widest text-[8px] mb-0.5">Role</p>
              <p className="text-white font-mono font-bold tracking-tight text-[10px]">{role}</p>
            </div>
            <div className="text-[10px]">
              <p className="text-gray-500 uppercase font-bold tracking-widest text-[8px] mb-0.5">Growth</p>
              <p className="text-green-400 font-mono font-bold tracking-tight">+{growth}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
