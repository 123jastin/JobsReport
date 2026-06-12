import { ReactNode, useState, FormEvent } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  BookOpen, 
  Menu, 
  Search, 
  X, 
  Shield, 
  LogIn, 
  LogOut, 
  Briefcase,
  Building2,
  MapPin,
  AlertCircle,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useCountry } from '../context/CountryContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAdmin, login: submitPasscode, logout: triggerLogout } = useAuth();
  const { selectedCountry, setSelectedCountry, countriesList, currentFlag } = useCountry();
  
  // Navigation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = submitPasscode(passcode);
    if (success) {
      setIsLoginModalOpen(false);
      setPasscode('');
    } else {
      setLoginError('INVALID INTEL ACCESS CODE.');
      setPasscode('');
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col overflow-x-hidden pt-16">
      
      {/* 🔥 Organization Schema - Appears on ALL pages */}
      <SEO
        title="JobsReport - Real-Time Jobs platform for Employers and Job Seekers"
        description="Find the latest jobs, vacancies, and career opportunities worldwide in a real-time job market intelligence platform with verified listings from top employers."
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "JobsReport",
          "alternateName": "JobsReport.online",
          "url": "https://jobsreport.online",
          "logo": {
            "@type": "ImageObject",
            "url": "https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png",
            "width": 112,
            "height": 112
          },
          "description": "JobsReport aggregates real-time job market data to help you find the best career opportunities. We track hiring trends across industries and locations worldwide.",
          "foundingDate": "2025",
          "areaServed": "Worldwide",
          "sameAs": [
            "https://www.facebook.com/J2Accessories"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "jjovinatha@gmail.com",
            "telephone": "+255616069692"
          }
        }}
      />
      
      {/* 🔮 Sticky Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-surface/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
              JR
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              JobsReport<span className="text-blue-500">.online</span>
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-6 h-6">
            <NavLink to="/" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white border-b-2 border-blue-500 pb-4 pt-4 -mb-4' : 'text-gray-500 hover:text-white'}`}>
              Intelligence Feed
            </NavLink>
            <NavLink to="/companies" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white border-b-2 border-emerald-500 pb-4 pt-4 -mb-4' : 'text-gray-500 hover:text-white'}`}>
              Companies
            </NavLink>
            <NavLink to="/regions" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white border-b-2 border-amber-500 pb-4 pt-4 -mb-4' : 'text-gray-500 hover:text-white'}`}>
              Regions
            </NavLink>
            <NavLink to="/jobs" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white border-b-2 border-blue-500 pb-4 pt-4 -mb-4' : 'text-gray-500 hover:text-white'}`}>
              All Jobs List
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white border-b-2 border-blue-500 pb-4 pt-4 -mb-4' : 'text-gray-500 hover:text-white'}`}>
              All Job Reports
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white border-b-2 border-blue-500 pb-4 pt-4 -mb-4' : 'text-blue-500 hover:text-white'}`}>
              Admin Studio
            </NavLink>
          </div>
        </div>
        
        {/* Actions bar (Search, Login badges, hamburger) */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Live System Active</span>
          </div>

          {/* 🌍 Country Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-200 transition-all font-bold uppercase tracking-wider h-9"
              id="country-selector-btn"
              title="Change country context"
            >
              <Globe size={14} className="text-blue-500 animate-[spin_12s_linear_infinite]" />
              <span className="text-sm leading-none flex items-center">{currentFlag}</span>
              <span className="hidden sm:inline-block max-w-[100px] truncate text-stone-300 select-none">
                {selectedCountry}
              </span>
            </button>

            <AnimatePresence>
              {isCountryDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => {
                      setIsCountryDropdownOpen(false);
                      setCountrySearchQuery('');
                    }} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-bg-surface border border-white/10 rounded-2xl shadow-2xl z-50 p-3.5 space-y-3 max-h-[350px] overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center justify-between pb-1 flex-shrink-0">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">Select Regional Feed</span>
                      <button 
                        onClick={() => {
                          setSelectedCountry('Worldwide');
                          setIsCountryDropdownOpen(false);
                          setCountrySearchQuery('');
                        }}
                        className="text-[10px] text-blue-500 hover:text-blue-400 font-bold hover:underline"
                      >
                        Reset Worldwide
                      </button>
                    </div>

                    <input 
                      type="text"
                      placeholder="Search country..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="w-full bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-blue-500 transition-colors flex-shrink-0 font-mono"
                    />

                    <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-white/10 max-h-[220px]">
                      {('worldwide'.includes(countrySearchQuery.toLowerCase()) || !countrySearchQuery) && (
                        <button
                          onClick={() => {
                            setSelectedCountry('Worldwide');
                            setIsCountryDropdownOpen(false);
                            setCountrySearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                            selectedCountry === 'Worldwide' 
                              ? 'bg-blue-600/20 border border-blue-500/30 text-white font-bold' 
                              : 'text-stone-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>🌍</span>
                            <span>Worldwide</span>
                          </div>
                          {selectedCountry === 'Worldwide' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>}
                        </button>
                      )}

                      {countriesList
                        .filter(c => c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()))
                        .map(c => (
                          <button
                            key={c.code}
                            onClick={() => {
                              setSelectedCountry(c.name);
                              setIsCountryDropdownOpen(false);
                              setCountrySearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                              selectedCountry.toLowerCase() === c.name.toLowerCase()
                                ? 'bg-blue-600/20 border border-blue-500/30 text-white font-bold' 
                                : 'text-stone-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span className={c.name === 'Tanzania' ? 'font-bold text-blue-400' : ''}>
                                {c.name} {c.name === 'Tanzania' ? ' 🇹🇿 *' : ''}
                              </span>
                            </div>
                            {selectedCountry.toLowerCase() === c.name.toLowerCase() && (
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                          </button>
                        ))
                      }
                      
                      {countriesList.filter(c => c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center text-[10px] text-gray-500 font-mono">
                          NO REGIONAL FEED AVAILABLE
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2 text-gray-400 hover:text-white transition-colors" id="search-btn">
            <Search size={18} />
          </button>

          {isAdmin ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-blue-600/15 border border-blue-500/30 text-[9px] font-bold text-blue-400 uppercase tracking-widest font-mono flex items-center gap-1">
                <Shield size={10} />
                ADMIN ACTIVE
              </span>
              <button 
                onClick={triggerLogout}
                className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors px-2 py-1"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider"
              id="admin-login-nav-btn"
            >
              <LogIn size={12} className="text-blue-500" />
              <span>Admin Login</span>
            </button>
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation Menu"
            id="three-bars-nav-btn"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 left-0 w-full bg-bg-surface border-b border-white/10 z-40 p-6 flex flex-col gap-4 shadow-xl"
            id="mobile-navigation-dropdown"
          >
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono font-bold">NAVIGATION MATRIX</span>
              
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-3">
                <Home size={16} className="text-blue-500" /> Intelligence Feed
              </Link>
              
              <Link to="/companies" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-3">
                <Building2 size={16} className="text-emerald-500" /> Companies & Employers
              </Link>
              
              <Link to="/regions" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-3">
                <MapPin size={16} className="text-amber-500" /> Jobs by Regions
              </Link>
              
              <Link to="/jobs" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-3">
                <Briefcase size={16} className="text-blue-500" /> All Jobs List
              </Link>
              
              <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-3">
                <BookOpen size={16} className="text-blue-500" /> All Job Reports
              </Link>
              
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-3">
                <Shield size={16} className="text-violet-500" /> Admin Studio (Locked)
              </Link>
            </div>

            <div className="border-t border-white/5 pt-4 mt-2">
              {isAdmin ? (
                <div className="flex items-center justify-between bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase font-mono">
                    <Shield size={14} /> Admins Authenticated
                  </span>
                  <button onClick={() => { triggerLogout(); setIsMobileMenuOpen(false); }} className="p-1 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-lg transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }} className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-bold text-stone-100 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                  <LogIn size={14} /> Authenticate Admin
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖥️ Login Authentication Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-surface border border-white/10 max-w-sm w-full p-6 rounded-3xl relative space-y-4 shadow-2xl"
            >
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-600/15 border border-blue-500/30 rounded-full text-blue-400">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">ADMIN ESCORT LOCK</h3>
                  <p className="text-xs text-gray-500 mt-1">Unlock raw ingestion records, custom reports & daily deduplication indices.</p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2">
                <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Decrypt passcode Key (try: admin)" className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors text-center font-mono placeholder:text-gray-650" required />
                {loginError && (
                  <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 bg-red-500/10 py-1.5 px-3 rounded-lg">
                    <AlertCircle size={10} /> {loginError}
                  </p>
                )}
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg">
                  DECRYPT KEY NODE
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">
                  ACCESS CODES: <span className="text-blue-500 font-bold">admin</span> OR <span className="text-blue-500 font-bold">admin123</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔥 Reserved Clever Ad Space - Below Header */}
      <div 
        id="clever-ad-space"
        style={{ 
          minHeight: '100px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          margin: '0 auto', 
          maxWidth: '728px',
          padding: '0 16px',
          overflow: 'hidden'
        }}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 pb-12">
        {children}
      </main>
      
      {/* Technical Status Footer */}
      <footer className="flex h-10 bg-bg-surface border-t border-white/10 items-center justify-between px-4 md:px-8">
        <div className="flex gap-4 md:gap-6">
          <span className="status-text text-[9px] md:text-[10px]">PLATFORM v2.4.0-STABLE</span>
          <span className="status-text text-[9px] md:text-[10px] hidden sm:inline">DATA: VERIFIED CORPORATE TELEMETRY</span>
        </div>
        <div className="flex gap-4 md:gap-6">
          <span className="status-text text-blue-500 font-bold text-[9px] md:text-[10px]">© 2026 JOBSREPORT</span>
          <span className="status-text flex items-center gap-1 text-[9px] md:text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            ACTIVE SYNC
          </span>
        </div>
      </footer>
    </div>
  );
}
