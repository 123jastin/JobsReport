import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, X, ShieldCheck, ArrowRight, CornerDownRight } from 'lucide-react';

interface CareerRedirectContextType {
  triggerRedirect: (url: string, company: string, title?: string) => void;
}

const CareerRedirectContext = createContext<CareerRedirectContextType | undefined>(undefined);

export function CareerRedirectProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [animationKey, setAnimationKey] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRedirect = (url: string, companyName: string, jobTitle?: string) => {
    if (!url) return;
    setDestinationUrl(url);
    setCompany(companyName);
    setTitle(jobTitle || 'Career Opportunity');
    setTimeLeft(10);
    setIsOpen(true);
    setAnimationKey(prev => prev + 1);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSkip = () => {
    window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            window.open(destinationUrl, '_blank', 'noopener,noreferrer');
            setIsOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, destinationUrl]);

  const getDomain = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      return url.hostname;
    } catch {
      return urlStr;
    }
  };

  // 🔥 Push Career page ad when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {}
      }, 300);
    }
  }, [isOpen, animationKey]);

  return (
    <CareerRedirectContext.Provider value={{ triggerRedirect }}>
      {children}
      
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/85 backdrop-blur-xl"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-stone-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 font-sans text-left"
            >
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded bg-blue-500/10 text-blue-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                    Telemetry Route Verified
                  </span>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Company Info Header */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold font-mono">Opening External Carrier Page</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {company}
                </h3>
                {title && (
                  <p className="text-xs text-blue-400/90 font-mono flex items-center gap-1">
                    <CornerDownRight size={12} /> {title}
                  </p>
                )}
              </div>

              {/* Professional Countdown & Horizontal Loader Container */}
              <div className="space-y-3 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider">
                    Redirect Bridge Active
                  </span>
                  <div className="text-right flex items-center gap-1.5">
                    <span className="text-xs text-stone-500 font-mono">Redirecting in:</span>
                    <span className="text-base font-black text-blue-400 font-mono">{timeLeft}s</span>
                  </div>
                </div>

                {/* Smooth Progress Bar */}
                <div className="relative w-full h-3 bg-stone-900 rounded-full border border-white/5 overflow-hidden">
                  <motion.div
                    key={animationKey}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full"
                    style={{ boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)" }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] text-gray-400 font-mono truncate">
                    Safe connection: <span className="text-stone-300 font-bold">{getDomain(destinationUrl)}</span>
                  </span>
                </div>
              </div>

              {/* Extra micro copy */}
              <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
                You are leaving the JobsReport telemetry interface. External applications and career dashboards are hosted directly by hiring corporate entities and may store local profiling cookies.
              </p>
              
{/* 🔥 AD - Career Page (Above Buttons) - Compact size */}
<div style={{ minHeight: '80px', maxHeight: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', margin: '0 -8px' }}>
  <ins className="adsbygoogle"
    style={{ display: 'block', width: '100%', maxHeight: '120px' }}
    data-ad-client="ca-pub-8155064094205693"
    data-ad-slot="1091652594"
    data-ad-format="horizontal"
    data-full-width-responsive="true" />
</div>
              

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/25 border border-blue-500"
                >
                  <span>Open Immediately</span>
                  <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CareerRedirectContext.Provider>
  );
}

export function useCareerRedirect() {
  const context = useContext(CareerRedirectContext);
  if (!context) {
    throw new Error('useCareerRedirect must be used within a CareerRedirectProvider');
  }
  return context;
}
