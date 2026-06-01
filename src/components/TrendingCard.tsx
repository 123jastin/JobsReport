import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrendingCardProps {
  trend: {
    id: number;
    role: string;
    growth: number;
    companies: number;
  };
  index: number;
}

export default function TrendingCard({ trend, index }: TrendingCardProps) {
  if (!trend) return null;

  return (
    <Link 
      to={`/market?role=${encodeURIComponent(trend.role)}`}
      className="block flex-shrink-0 cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.04, y: -4 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 }}
        className="w-48 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
      >
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">
            {trend.role?.split(' ')[0] || 'Role'}
          </span>
          <h3 className="text-sm font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
            {trend.role}
          </h3>
          
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-green-400 font-mono text-sm font-bold">
                +{trend.growth}%
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              {trend.companies} Co.
            </div>
          </div>
        </div>
        
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
      </motion.div>
    </Link>
  );
}
