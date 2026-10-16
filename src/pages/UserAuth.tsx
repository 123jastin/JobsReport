import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useUserAuth, type PublicUser } from '../context/UserAuthContext';
import {
  X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, Search, Briefcase, Mail, Lock, User as UserIcon,
  MapPin, Calendar, Shield
} from 'lucide-react';

// ============================================================
// BRAND HEADER
// ============================================================
const BrandHeader: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <div className="flex items-center justify-center gap-2">
    <img
      src="https://media.jobsreport.online/file_0000000084b47243aec7e8cf3cbeb6bd.png"
      alt="JobsReport"
      style={{ width: size, height: size }}
      className="object-contain rounded-full"
    />
    <h1
      className="font-black bg-gradient-to-r from-[#1877F2] via-[#7B4DFF] to-[#A033FF] text-transparent bg-clip-text tracking-tight"
      style={{ fontSize: size }}
    >
      JobsReport
    </h1>
  </div>
);

// ============================================================
// FORGOT PASSWORD (UI only — you'll wire backend later)
// ============================================================
interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center px-4 py-8">
      <SEO title="Reset Password | JobsReport" description="Reset your JobsReport account password." />
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        <div className="text-center">
          <BrandHeader size={40} />
          <h2 className="text-2xl font-bold text-white mt-6">Find Your Account</h2>
          <p className="text-gray-400 text-sm mt-1">
            Enter your email to search for your account.
          </p>
        </div>

        {isSent ? (
          <div className="text-center flex flex-col gap-4">
            <CheckCircle2 className="mx-auto text-emerald-400" size={48} />
            <h3 className="text-xl font-bold text-white">Reset Link Sent!</h3>
            <p className="text-gray-400 text-sm">
              If an account with <strong className="text-white">{email}</strong> exists,
              a reset link has been sent. Check your inbox and spam folder.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 rounded-xl transition-colors"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================================
// LOGIN
// ============================================================
interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onClose?: () => void;
  onLoggedIn?: (user: PublicUser) => void;
}

export const Login: React.FC<LoginProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onClose,
  onLoggedIn,
}) => {
  const navigate = useNavigate();
  const { login } = useUserAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email.trim(), password, remember);
      if (res.success) {
        onLoggedIn?.(null as any);
        if (onClose) onClose();
        else navigate('/');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col relative">
      <SEO title="Login | JobsReport" description="Log in to your JobsReport account." />

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors z-50"
          aria-label="Close"
        >
          <X size={20} className="text-white" />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-8">
          <BrandHeader size={44} />
          <p className="text-gray-400 text-base mt-4 max-w-[400px]">
            Log in to share job stories, save opportunities, and connect with professionals.
          </p>
        </div>

        <div className="w-full max-w-[400px] flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-[#1877F2] rounded"
                disabled={loading}
              />
              Remember me for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-[#1877F2] hover:text-[#4A9EFF] text-sm hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="border-b border-white/5 my-1" />

          <button
            type="button"
            onClick={onNavigateToRegister}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            Create New Account
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 pb-6 px-4">
        Log in to post job stories, save jobs, and more.{' '}
        {onClose && (
          <button onClick={onClose} className="text-white font-bold hover:underline">
            Continue as Guest
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// REGISTER
// ============================================================
interface RegisterProps {
  onBackToLogin: () => void;
  onRegistered?: (user: PublicUser) => void;
}

interface CountryData {
  name: { common: string };
  flag: string;
}

export const Register: React.FC<RegisterProps> = ({ onBackToLogin, onRegistered }) => {
  const navigate = useNavigate();
  const { register } = useUserAuth();

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState('Tanzania');
  const [countryInput, setCountryInput] = useState('🇹🇿 Tanzania');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  // Load countries
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,flag')
      .then((r) => r.json())
      .then((data: CountryData[]) => {
        const sorted = [...data].sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sorted);
      })
      .catch(() => {})
      .finally(() => setLoadingCountries(false));
  }, []);

  // Click-outside closes country dropdown
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryList(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter((c) =>
      c.name.common.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countries, countrySearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const name = surname.trim() ? `${firstName.trim()} ${surname.trim()}` : firstName.trim();
    if (name.length < 2) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email: email.trim(),
        password,
        country,
      });

      if (res.success) {
        onRegistered?.(null as any);
        navigate('/');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center px-4 py-8">
      <SEO
        title="Create Account | JobsReport"
        description="Create a JobsReport account to share job stories and access more features."
      />

      <div className="w-full max-w-[440px] flex flex-col gap-6">
        <div className="text-center">
          <BrandHeader size={40} />
          <h2 className="text-2xl font-bold text-white mt-6">Create your account</h2>
          <p className="text-gray-400 text-sm mt-1">Quick and easy — takes 30 seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="First name"
              className="w-1/2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
              autoComplete="given-name"
            />
            <input
              type="text"
              placeholder="Surname (optional)"
              className="w-1/2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              disabled={loading}
              autoComplete="family-name"
            />
          </div>

          {/* Country dropdown */}
          <div ref={countryRef} className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-10 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40"
              value={countryInput}
              onChange={(e) => {
                setCountryInput(e.target.value);
                setCountrySearch(e.target.value);
                setShowCountryList(true);
              }}
              onFocus={() => setShowCountryList(true)}
              placeholder="Country"
              disabled={loading}
            />
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />

            {showCountryList && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#0B1120] border border-white/10 rounded-xl max-h-56 overflow-y-auto shadow-2xl">
                {loadingCountries ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Loading countries…</div>
                ) : filteredCountries.length > 0 ? (
                  filteredCountries.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 text-white flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setCountry(c.name.common);
                        setCountryInput(`${c.flag} ${c.name.common}`);
                        setShowCountryList(false);
                        setCountrySearch('');
                      }}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-sm">{c.name.common}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">No country found</div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 6)"
              minLength={6}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed mt-1">
            <Shield size={12} className="mt-0.5 shrink-0" />
            <p>
              By creating an account you agree to our{' '}
              <a href="/terms-of-service" className="text-[#1877F2] hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy-policy" className="text-[#1877F2] hover:underline">Privacy Policy</a>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors mt-1 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Creating…' : 'Create Account'}
          </button>

          <div className="text-center mt-2">
            <span className="text-gray-400 text-sm">Already have an account? </span>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-[#1877F2] hover:underline text-sm font-bold"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
