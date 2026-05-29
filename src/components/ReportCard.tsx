import { motion } from 'motion/react';
import { Calendar, ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Report } from '../types';

interface ReportCardProps {
  report: Report;
  key?: string | number;
}

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <Link to={`/report/${report.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="w-full p-4 bg-white/[0.02] border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all group relative overflow-hidden"
        id={`report-card-${report.id}`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-tighter border border-blue-500/20">
              Insight Report
            </span>
            <div className="status-text flex items-center gap-1">
              <Calendar size={10} />
              Updated Today
            </div>
          </div>
          
          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-blue-400 transition-colors">
            {report.title}
          </h3>
          
          <div className="flex gap-4">
            <div className="text-[10px]">
              <p className="text-gray-500 uppercase font-bold tracking-widest text-[8px] mb-0.5">Companies</p>
              <p className="text-white font-mono font-bold tracking-tight">{report.stats.companies.toLocaleString()}</p>
            </div>
            <div className="text-[10px]">
              <p className="text-gray-500 uppercase font-bold tracking-widest text-[8px] mb-0.5">Avg Salary</p>
              <p className="text-white font-mono font-bold tracking-tight">$145k</p>
            </div>
            <div className="text-[10px]">
              <p className="text-gray-500 uppercase font-bold tracking-widest text-[8px] mb-0.5">Growth</p>
              <p className="text-green-400 font-mono font-bold tracking-tight">+{report.stats.growth}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
