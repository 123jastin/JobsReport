import { motion } from 'motion/react';
import { TrendingUp, Users } from 'lucide-react';
import { Trend } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface TrendingCardProps {
  trend: Trend;
  index: number;
  key?: string | number;
}

export default function TrendingCard({ trend, index }: TrendingCardProps) {
  return (
    <Link 
      to={`/jobs?role=${encodeURIComponent(trend.role)}`} 
      className="block flex-shrink-0 cursor-pointer focus:outline-none"
    >
      <motion.div
        whileHover={{ scale: 1.04, y: -4 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 }}
        className="w-44 p-4 rounded-2xl glass-panel trend-gradient relative overflow-hidden group border border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300"
        id={`trend-card-${trend.id}`}
      >
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 block">
            {trend.role.split(' ')[0]}
          </span>
          <h3 className="text-sm font-bold text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors">
            {trend.role}
          </h3>
          
          <div className="flex items-end justify-between">
            <div className="text-green-400 font-mono text-sm font-bold">
              +{trend.growth}%
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              {trend.companies} Co.
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

