import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Briefcase, MapPin, Globe, FileText, Upload, File,
  Bold, Italic, Underline, List, Trash2, Plus, AlertCircle,
  ChevronDown, CheckCircle, RefreshCw, ArrowLeft, Eye,
  Image as ImageIcon, Sparkles, DollarSign, Clock, Search,
  ExternalLink, LogOut
} from 'lucide-react';
import SEO from '../components/SEO';
import { useUserAuth, getUserToken } from '../context/UserAuthContext';
import { useCountry } from '../context/CountryContext';

// ============================================================
// TYPES
// ============================================================
interface UserCompany {
  id: string;
  name: string;
  industry?: string;
  logoUrl?: string;
  website?: string;
}

interface JobFile {
  url: string;
  thumbnail: string;
  name: string;
  type: string;
  file?: File;
  seoTitle?: string;
  seoSlug?: string;
}

// ============================================================
// SEARCHABLE COMBOBOX
// ============================================================
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; sublabel?: string }[];
  placeholder?: string;
  emptyMessage?: string;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  emptyMessage = 'No matches found',
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const displayValue =
    value && !isOpen ? options.find((o) => o.value === value)?.label || value : search;

  return (
    <div ref={containerRef} className="relative">
      <div
        className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 rounded-2xl text-sm text-white focus-within:border-[#1877F2] transition-colors cursor-pointer flex items-center justify-between gap-2"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? '' : placeholder}
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
        />
        <ChevronDown size={16} className="text-gray-500 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 text-center">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-[#1877F2]/20 text-[#4A9EFF]'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                {opt.sublabel && (
                  <div className="text-[11px] text-gray-500 mt-0.5">{opt.sublabel}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function UserJobInput() {
  const { user: authUser, loading: authLoading } = useUserAuth();
  const { selectedCountry } = useCountry();
  const navigate = useNavigate();

  // ── Auth guard
  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);

  // ── Data fetching
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state
  const [title, setTitle] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Software Developer');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // ── Application method
  const [applicationType, setApplicationType] = useState<'url' | 'email' | 'whatsapp' | 'instructions'>('url');
  const [applicationValue, setApplicationValue] = useState('');

  // ── Files
  const [files, setFiles] = useState<JobFile[]>([]);

  // ── Rich description
  const [description, setDescription] = useState('');
  const [descEditMode, setDescEditMode] = useState<'visual' | 'code'>('visual');
  const descriptionEditorRef = useRef<HTMLDivElement>(null);

  // ── Schema data
  const [schemaData, setSchemaData] = useState({
    job_category: '',
    industry: '',
    employment_type: 'FULL_TIME',
    workplace_type: 'Onsite',
    education_level: 'Any',
    experience_months: 0,
    skills: [] as string[],
    benefits: [] as string[],
    salary_min: null as number | null,
    salary_max: null as number | null,
    salary_currency: 'TZS',
    street_address: '',
    city: '',
    region: '',
    country: 'Tanzania',
    postcode: '',
  });

  const [showSchema, setShowSchema] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ────────────────────────────────────────────────────────
  // LOAD USER'S COMPANY + COMPANIES + ROLES
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;

    async function load() {
      try {
        // Fetch all companies for search
        const compRes = await fetch('/api/companies?all=true');
        if (compRes.ok) {
          const compData = await compRes.json();
          const list = Array.isArray(compData) ? compData : compData.companies || [];
          setCompanies(list);

          // Auto-match user's "work" field to a company
          const userWork = (authUser as any)?.work || '';
          if (userWork) {
            const matched = list.find(
              (c: any) => c.name.toLowerCase() === userWork.toLowerCase()
            );
            if (matched) {
              setSelectedCompany(matched.name);
            } else {
              // Pre-fill as custom company if no match
              setCustomCompanyName(userWork);
              setIsCustomCompany(true);
            }
          }
        }

        // Fetch roles
        const rolesRes = await fetch('/api/filters');
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          const cats = Array.isArray(rolesData.categories) ? rolesData.categories : [];
          setRoles(cats.map((c: any) => ({ id: c.slug, title: c.name })));
        }
      } catch (err) {
        console.error('Load failed:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authUser]);

  // Sync description editor when switching modes
  useEffect(() => {
    if (descEditMode === 'visual' && descriptionEditorRef.current) {
      descriptionEditorRef.current.innerHTML = description;
    }
  }, [descEditMode]);

  // ────────────────────────────────────────────────────────
  // HANDLERS
  // ────────────────────────────────────────────────────────
  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      const isImage = file.type.startsWith('image/');
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const cleanSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (isImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles((prev) => [
            ...prev,
            {
              url: reader.result as string,
              thumbnail: reader.result as string,
              name: file.name,
              type: 'image',
              file,
              seoTitle: `${title || 'Job'} - ${baseName}`,
              seoSlug: `${cleanSlug}-${Date.now().toString(36)}.${file.name.split('.').pop()}`,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else if (
        file.type === 'application/pdf' ||
        /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name)
      ) {
        const docExt = file.name.split('.').pop()?.toUpperCase() || 'DOC';
        const svgThumb =
          'data:image/svg+xml,' +
          encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <rect fill="#1e293b" width="200" height="200" rx="12"/>
            <text fill="#60a5fa" font-size="40" font-weight="bold" text-anchor="middle" x="100" y="100">${docExt}</text>
            <text fill="#94a3b8" font-size="14" text-anchor="middle" x="100" y="140">Document</text>
          </svg>
        `);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles((prev) => [
            ...prev,
            {
              url: reader.result as string,
              thumbnail: svgThumb,
              name: file.name,
              type: file.type === 'application/pdf' ? 'pdf' : 'document',
              file,
              seoTitle: `${title || 'Job'} - ${baseName}`,
              seoSlug: `${cleanSlug}-${Date.now().toString(36)}.${file.name.split('.').pop()}`,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        showMsg('error', `Unsupported file type: ${file.name}`);
      }
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      navigate('/login');
      return;
    }

    const token = getUserToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Validation
    const targetCompany = isCustomCompany ? customCompanyName.trim() : selectedCompany;
    if (!title.trim()) {
      showMsg('error', 'Job title is required');
      return;
    }
    if (!targetCompany) {
      showMsg('error', 'Please select or enter a company');
      return;
    }
    if (!expiresAt) {
      showMsg('error', 'Please set an expiry date');
      return;
    }
    if (applicationType === 'url' && !applicationValue.trim()) {
      showMsg('error', 'Application URL is required');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload files to R2
      const uploadedFiles = [];
      for (const file of files) {
        if (!file.file) continue;
        const fd = new FormData();
        fd.append('file', file.file, file.seoSlug || file.name);
        fd.append('name', file.seoSlug || file.name);
        fd.append('altText', file.seoTitle || file.name);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          uploadedFiles.push({
            url: data.url,
            thumbnail: data.thumbnail_url || data.url,
            name: file.name,
            type: file.type,
            seoTitle: file.seoTitle,
          });
        }
      }

      // 2. Build application URL
      let applyUrl = '';
      let whatsapp_number = '';
      let application_instructions = '';

      if (applicationType === 'url') applyUrl = applicationValue;
      else if (applicationType === 'email') {
        applyUrl = applicationValue.startsWith('mailto:')
          ? applicationValue
          : `mailto:${applicationValue}`;
      } else if (applicationType === 'whatsapp') {
        whatsapp_number = applicationValue;
      } else if (applicationType === 'instructions') {
        application_instructions = applicationValue;
      }

      // 3. Submit job (via a NEW user endpoint)
      const res = await fetch('/api/user/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          company: targetCompany,
          role: selectedRole,
          location: location || 'Remote',
          url: applyUrl,
          salary: salary?.trim() || 'Not Disclosed',
          expiresAt,
          description,
          is_active: 1,
          // Schema
          job_category: schemaData.job_category || 'Other',
          industry: schemaData.industry || '',
          employment_type: schemaData.employment_type,
          workplace_type: schemaData.workplace_type,
          education_level: schemaData.education_level,
          experience_months: schemaData.experience_months,
          skills: schemaData.skills,
          benefits: schemaData.benefits,
          salary_min: schemaData.salary_min,
          salary_max: schemaData.salary_max,
          salary_currency: schemaData.salary_currency,
          street_address: schemaData.street_address,
          city: schemaData.city,
          region: schemaData.region,
          country: schemaData.country,
          postcode: schemaData.postcode,
          whatsapp_number,
          application_instructions,
          images: uploadedFiles,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        showMsg('success', 'Job posted successfully! Redirecting...');
        setTimeout(() => navigate('/market'), 1500);
      } else {
        showMsg('error', result.error || 'Failed to post job');
      }
    } catch (err: any) {
      console.error(err);
      showMsg('error', err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw size={24} className="text-[#4A9EFF] animate-spin" />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Loading job builder...
        </span>
      </div>
    );
  }

  if (!authUser) {
    return null; // redirect in progress
  }

  const targetCompanyName = isCustomCompany ? customCompanyName : selectedCompany;

  return (
    <>
      <SEO
        title="Post a Job | JobsReport"
        description="Post a job opening to reach thousands of qualified candidates on JobsReport."
      />

      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        {/* Back + header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#7B4DFF] flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Post a Job</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Reach thousands of qualified candidates. Hiring on behalf of{' '}
            <span className="text-white font-bold">{targetCompanyName || 'your company'}</span>.
          </p>
        </div>

        {/* Success/Error toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Company (searchable, pre-filled from profile) ─── */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Building2 size={14} className="text-[#4A9EFF]" />
              Company You're Hiring For
            </h2>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsCustomCompany(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  !isCustomCompany
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setIsCustomCompany(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  isCustomCompany
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                Enter Manually
              </button>
            </div>

            {isCustomCompany ? (
              <input
                type="text"
                value={customCompanyName}
                onChange={(e) => setCustomCompanyName(e.target.value)}
                placeholder="Company name"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2]"
              />
            ) : (
              <SearchableSelect
                value={selectedCompany}
                onChange={setSelectedCompany}
                options={companies.map((c) => ({
                  value: c.name,
                  label: c.name,
                  sublabel: c.industry,
                }))}
                placeholder="Search companies..."
                emptyMessage="No company found. Try 'Enter Manually'."
              />
            )}

            {(authUser as any)?.work && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle size={12} className="text-emerald-400" />
                <span>
                  Your profile lists <strong className="text-white">{(authUser as any).work}</strong> as
                  your workplace
                </span>
              </div>
            )}
          </div>

          {/* ─── Job Basics ─── */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={14} className="text-[#4A9EFF]" />
              Job Basics
            </h2>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Category / Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#1877F2]"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.title}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dar es Salaam, Tanzania"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Salary (optional)
                </label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. TZS 1,500,000 - 2,500,000"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Expires On *
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#1877F2]"
                  required
                />
              </div>
            </div>
          </div>

          {/* ─── Application Method ─── */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ExternalLink size={14} className="text-[#4A9EFF]" />
              How to Apply
            </h2>

            <div className="flex flex-wrap gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
              {(['url', 'email', 'whatsapp', 'instructions'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setApplicationType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    applicationType === type
                      ? 'bg-[#1877F2] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type === 'url' && '🔗 URL'}
                  {type === 'email' && '✉️ Email'}
                  {type === 'whatsapp' && '💬 WhatsApp'}
                  {type === 'instructions' && '📋 Instructions'}
                </button>
              ))}
            </div>

            {applicationType === 'url' && (
              <input
                type="url"
                value={applicationValue}
                onChange={(e) => setApplicationValue(e.target.value)}
                placeholder="https://company.com/careers/apply"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
              />
            )}

            {applicationType === 'email' && (
              <input
                type="email"
                value={applicationValue}
                onChange={(e) => setApplicationValue(e.target.value)}
                placeholder="careers@company.com"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
              />
            )}

            {applicationType === 'whatsapp' && (
              <input
                type="text"
                value={applicationValue}
                onChange={(e) => setApplicationValue(e.target.value)}
                placeholder="+255 712 345 678"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm"
              />
            )}

            {applicationType === 'instructions' && (
              <textarea
                value={applicationValue}
                onChange={(e) => setApplicationValue(e.target.value)}
                placeholder="e.g. Submit your CV to the HR office at..."
                rows={4}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none"
              />
            )}
          </div>

          {/* ─── Files ─── */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <File size={14} className="text-[#4A9EFF]" />
              Attachments
            </h2>

            <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-white/10 hover:border-[#1877F2]/40 rounded-2xl cursor-pointer transition-all group">
              <input
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload size={18} className="text-gray-500 group-hover:text-[#4A9EFF] transition-colors" />
              <span className="text-sm text-gray-400 group-hover:text-[#4A9EFF] transition-colors">
                {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload files (optional)'}
              </span>
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]"
                  >
                    {f.type === 'image' ? (
                      <img src={f.thumbnail || f.url} alt={f.name} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 flex flex-col items-center justify-center p-1">
                        <File size={20} className="text-blue-400" />
                        <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">
                          {f.name.slice(0, 12)}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Description (BIG) ─── */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-[#4A9EFF]" />
                Job Description
              </h2>
              <div className="flex bg-white/5 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDescEditMode('visual')}
                  className={`px-2.5 py-1 rounded-md uppercase ${
                    descEditMode === 'visual' ? 'bg-[#1877F2] text-white' : 'text-gray-400'
                  }`}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (descriptionEditorRef.current) {
                      setDescription(descriptionEditorRef.current.innerHTML);
                    }
                    setDescEditMode('code');
                  }}
                  className={`px-2.5 py-1 rounded-md uppercase ${
                    descEditMode === 'code' ? 'bg-[#1877F2] text-white' : 'text-gray-400'
                  }`}
                >
                  HTML
                </button>
              </div>
            </div>

            {/* Toolbar */}
            {descEditMode === 'visual' && (
              <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-white/[0.03] border border-white/10 rounded-xl">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                  title="Bold"
                ><Bold size={14} /></button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                  title="Italic"
                ><Italic size={14} /></button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                  title="Underline"
                ><Underline size={14} /></button>
                <span className="w-px h-4 bg-white/10 mx-1" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h3'); }}
                  className="px-2 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold"
                >H3</button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'p'); }}
                  className="px-2 py-1.5 hover:bg-white/10 rounded-lg text-xs"
                >P</button>
                <span className="w-px h-4 bg-white/10 mx-1" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                  title="Bullet list"
                ><List size={14} /></button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                  title="Numbered list"
                ><List size={14} /></button>
              </div>
            )}

            {/* Editor */}
            {descEditMode === 'visual' ? (
              <div
                ref={descriptionEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                  if (descriptionEditorRef.current) {
                    setDescription(descriptionEditorRef.current.innerHTML);
                  }
                }}
                className="w-full min-h-[500px] max-h-[900px] bg-white/[0.01] border border-white/10 rounded-2xl p-5 text-gray-200 focus:outline-none focus:border-[#1877F2]/40 overflow-y-auto resize-y"
                style={{ fontSize: '15px', lineHeight: '1.8' }}
                data-placeholder="Describe the role, responsibilities, requirements, benefits..."
              />
            ) : (
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionEditorRef.current) {
                    descriptionEditorRef.current.innerHTML = e.target.value;
                  }
                }}
                className="w-full min-h-[500px] max-h-[900px] bg-white/[0.01] border border-white/10 rounded-2xl p-5 text-[#4A9EFF] font-mono focus:outline-none focus:border-[#1877F2]/40 overflow-y-auto resize-y text-[13px] leading-relaxed"
                placeholder="<p>Edit HTML directly...</p>"
              />
            )}

            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>{description.length} characters</span>
              <span>{descEditMode === 'visual' ? 'WYSIWYG' : 'HTML'} mode</span>
            </div>
          </div>

          {/* ─── Advanced Schema (collapsed) ─── */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSchema((v) => !v)}
              className="w-full flex items-center justify-between p-5 text-sm font-bold text-white uppercase tracking-widest hover:bg-white/[0.02] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                Advanced Options (Schema for Google)
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${showSchema ? 'rotate-180' : ''}`}
              />
            </button>

            {showSchema && (
              <div className="p-5 pt-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Category"
                    value={schemaData.job_category}
                    onChange={(e) => setSchemaData((p) => ({ ...p, job_category: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <select
                    value={schemaData.employment_type}
                    onChange={(e) => setSchemaData((p) => ({ ...p, employment_type: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                  <select
                    value={schemaData.workplace_type}
                    onChange={(e) => setSchemaData((p) => ({ ...p, workplace_type: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  >
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select
                    value={schemaData.education_level}
                    onChange={(e) => setSchemaData((p) => ({ ...p, education_level: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  >
                    <option value="Any">Any Education</option>
                    <option value="High School">High School</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Experience (months)"
                    value={schemaData.experience_months || ''}
                    onChange={(e) => setSchemaData((p) => ({ ...p, experience_months: parseInt(e.target.value) || 0 }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Industry"
                    value={schemaData.industry}
                    onChange={(e) => setSchemaData((p) => ({ ...p, industry: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Street"
                    value={schemaData.street_address}
                    onChange={(e) => setSchemaData((p) => ({ ...p, street_address: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="City *"
                    value={schemaData.city}
                    onChange={(e) => setSchemaData((p) => ({ ...p, city: e.target.value }))}
                    className="bg-white/[0.03] border border-emerald-500/20 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Region"
                    value={schemaData.region}
                    onChange={(e) => setSchemaData((p) => ({ ...p, region: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={schemaData.country}
                    onChange={(e) => setSchemaData((p) => ({ ...p, country: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Skills (comma-separated)"
                    value={schemaData.skills.join(', ')}
                    onChange={(e) => setSchemaData((p) => ({ ...p, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Benefits (comma-separated)"
                    value={schemaData.benefits.join(', ')}
                    onChange={(e) => setSchemaData((p) => ({ ...p, benefits: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── Submit ─── */}
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm text-center transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#1877F2] to-[#7B4DFF] hover:opacity-90 disabled:opacity-60 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Publish Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
