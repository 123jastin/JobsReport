import { useState, useEffect, FormEvent, ChangeEvent, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Briefcase, MapPin, Globe, FileText, Upload, File,
  Bold, Italic, Underline, List, Trash2, Plus, AlertCircle,
  ChevronDown, CheckCircle, RefreshCw, ArrowLeft, Eye,
  Image as ImageIcon, Sparkles, DollarSign, Clock, Search,
  ExternalLink, Pencil
} from 'lucide-react';
import SEO from '../components/SEO';
import { useUserAuth, getUserToken } from '../context/UserAuthContext';

// ============================================================
// TYPES
// ============================================================
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
// SEARCHABLE COMBOBOX (search on top, show 3 initially)
// ============================================================
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
  initialCount?: number;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  emptyMessage = 'No matches found',
  initialCount = 3,
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

  const filtered = useMemo(() => {
    const base = search.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;
    return search.trim() ? base : base.slice(0, initialCount);
  }, [options, search, initialCount]);

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
        <Search size={14} className="text-gray-500 shrink-0" />
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
                {opt.label}
              </button>
            ))
          )}
          {!search.trim() && options.length > initialCount && (
            <div className="px-4 py-2 text-[10px] text-gray-500 text-center font-mono uppercase border-t border-white/5">
              Type above to search {options.length} total
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// FLAT SECTION (no card — just plain, with top border)
// ============================================================
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="border-t border-white/5 pt-6">
    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
      <span className="text-[#4A9EFF]">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

// ============================================================
// MAIN PAGE
// ============================================================
export default function UserJobInput() {
  const { user: authUser, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  // ── Auth guard
  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);

  // ── Data fetching
  const [roles, setRoles] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state
  const [title, setTitle] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
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

  // ── Locations (required)
  const [locations, setLocations] = useState({
    street_address: '',
    city: '',
    region: '',
    country: 'Tanzania',
    postcode: '',
  });

  // ── Advanced schema (optional)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advanced, setAdvanced] = useState({
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
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Company from profile (mandatory)
  const companyName = String((authUser as any)?.work || '').trim();
  const hasCompany = companyName.length > 0;

  // ────────────────────────────────────────────────────────
  // LOAD ROLES
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;

    async function load() {
      try {
        const rolesRes = await fetch('/api/filters');
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          const cats = Array.isArray(rolesData.categories) ? rolesData.categories : [];
          const list = cats.map((c: any) => ({ id: c.slug, title: c.name }));
          setRoles(list);
          if (list.length > 0) setSelectedRole(list[0].title);
        }
      } catch (err) {
        console.error('Load failed:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authUser]);

  // Sync description editor
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

    // ── Validation
    if (!hasCompany) {
      showMsg('error', 'Please set your company on your profile first');
      return;
    }
    if (!title.trim()) {
      showMsg('error', 'Job title is required');
      return;
    }
    if (!selectedRole) {
      showMsg('error', 'Please select a category');
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
    if (applicationType === 'email' && !applicationValue.trim()) {
      showMsg('error', 'Application email is required');
      return;
    }
    if (applicationType === 'whatsapp' && !applicationValue.trim()) {
      showMsg('error', 'WhatsApp number is required');
      return;
    }
    if (applicationType === 'instructions' && !applicationValue.trim()) {
      showMsg('error', 'Application instructions are required');
      return;
    }

    // Locations required
    if (!locations.street_address.trim()) { showMsg('error', 'Street address is required'); return; }
    if (!locations.city.trim()) { showMsg('error', 'City is required'); return; }
    if (!locations.region.trim()) { showMsg('error', 'Region is required'); return; }
    if (!locations.country.trim()) { showMsg('error', 'Country is required'); return; }
    if (!locations.postcode.trim()) { showMsg('error', 'Postcode is required'); return; }

    setSubmitting(true);
    try {
      // 1. Upload files
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
        applyUrl = `https://wa.me/${applicationValue.replace(/[^0-9]/g, '')}`;
      } else if (applicationType === 'instructions') {
        application_instructions = applicationValue;
        applyUrl = 'https://jobsreport.online/contact-us';
      }

      // 3. Submit
      const res = await fetch('/api/user/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          company: companyName,
          role: selectedRole,
          location: location || locations.city || 'Remote',
          url: applyUrl,
          applicationType,
          applicationValue,
          salary: salary?.trim() || 'Not Disclosed',
          expiresAt,
          description,
          is_active: 1,
          // Schema
          job_category: advanced.job_category || 'Other',
          industry: advanced.industry || '',
          employment_type: advanced.employment_type,
          workplace_type: advanced.workplace_type,
          education_level: advanced.education_level,
          experience_months: advanced.experience_months,
          skills: advanced.skills,
          benefits: advanced.benefits,
          salary_min: advanced.salary_min,
          salary_max: advanced.salary_max,
          salary_currency: advanced.salary_currency,
          street_address: locations.street_address,
          city: locations.city,
          region: locations.region,
          country: locations.country,
          postcode: locations.postcode,
          whatsapp_number,
          application_instructions,
          images: uploadedFiles,
        }),
      });

      // Safe JSON parse
      let result: any = {};
      try {
        const text = await res.text();
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: `Server error (${res.status}). Please try again.` };
      }

      if (res.ok) {
        showMsg('success', 'Job posted successfully! Redirecting...');
        setTimeout(() => navigate('/market'), 1500);
      } else {
        showMsg('error', result.error || `Failed to post job (${res.status})`);
      }
    } catch (err: any) {
      console.error(err);
      showMsg('error', err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // RENDER STATES
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

  if (!authUser) return null;

  // ────────────────────────────────────────────────────────
  // BLOCK: no company set on profile
  // ────────────────────────────────────────────────────────
  if (!hasCompany) {
    return (
      <>
        <SEO
          title="Set Company First | JobsReport"
          description="Please set your company on your profile before posting jobs."
        />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Building2 size={28} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Company Required</h1>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              Before posting a job, please set the company you work for on your profile.
              This ensures employers post on behalf of their real company.
            </p>
            <div className="flex items-center justify-center gap-2 pt-4">
              <Link
                to={`/u/${authUser.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#7B4DFF] hover:opacity-90 text-white font-bold text-sm transition-opacity"
              >
                <Pencil size={14} />
                Edit My Profile
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
              >
                <ArrowLeft size={14} />
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────────────────
  return (
    <>
      <SEO
        title="Post a Job | JobsReport"
        description="Post a job opening to reach thousands of qualified candidates on JobsReport."
      />

      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-black text-white">Post a Job</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Hiring on behalf of{' '}
            <span className="text-white font-bold">{companyName}</span>
          </p>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-3 rounded-xl flex items-center gap-2 text-sm ${
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

        <form onSubmit={handleSubmit} className="space-y-0">
          {/* ═══════════════════════════════════════════════════ */}
          {/* COMPANY (locked — from profile)                    */}
          {/* ═══════════════════════════════════════════════════ */}
          <Section title="Company You're Hiring For" icon={<Building2 size={14} />}>
            <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#7B4DFF] flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{companyName}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">From your profile</p>
              </div>
              <Link
                to={`/u/${authUser.id}`}
                className="text-[10px] font-bold text-[#4A9EFF] hover:underline uppercase tracking-wider shrink-0"
              >
                Change
              </Link>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* JOB BASICS                                          */}
          {/* ═══════════════════════════════════════════════════ */}
          <Section title="Job Basics" icon={<Briefcase size={14} />}>
            <div className="space-y-4">
              <div>
                <Label required>Job Title</Label>
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
                  <Label required>Category / Role</Label>
                  <SearchableSelect
                    value={selectedRole}
                    onChange={setSelectedRole}
                    options={roles.map((r) => ({ value: r.title, label: r.title }))}
                    placeholder="Search categories..."
                    emptyMessage="No category found"
                    initialCount={3}
                  />
                </div>

                <div>
                  <Label>Location Label</Label>
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
                  <Label>Salary (optional)</Label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. TZS 1,500,000 - 2,500,000"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                  />
                </div>

                <div>
                  <Label required>Expires On</Label>
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
          </Section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* LOCATIONS (required)                                */}
          {/* ═══════════════════════════════════════════════════ */}
          <Section title="Locations" icon={<MapPin size={14} />}>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label required>Street Address</Label>
                  <input
                    type="text"
                    value={locations.street_address}
                    onChange={(e) => setLocations({ ...locations, street_address: e.target.value })}
                    placeholder="e.g. Plot 1520, Mwai Kibaki Road"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                  />
                </div>
                <div>
                  <Label required>City</Label>
                  <input
                    type="text"
                    value={locations.city}
                    onChange={(e) => setLocations({ ...locations, city: e.target.value })}
                    placeholder="e.g. Dar es Salaam"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label required>Region</Label>
                  <input
                    type="text"
                    value={locations.region}
                    onChange={(e) => setLocations({ ...locations, region: e.target.value })}
                    placeholder="e.g. Kinondoni"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                  />
                </div>
                <div>
                  <Label required>Country</Label>
                  <input
                    type="text"
                    value={locations.country}
                    onChange={(e) => setLocations({ ...locations, country: e.target.value })}
                    placeholder="e.g. Tanzania"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                  />
                </div>
                <div>
                  <Label required>Postcode</Label>
                  <input
                    type="text"
                    value={locations.postcode}
                    onChange={(e) => setLocations({ ...locations, postcode: e.target.value })}
                    placeholder="e.g. 14111"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1877F2] text-sm"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* APPLICATION METHOD                                  */}
          {/* ═══════════════════════════════════════════════════ */}
          <Section title="How to Apply" icon={<ExternalLink size={14} />}>
            <div className="space-y-3">
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
          </Section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* ATTACHMENTS                                         */}
          {/* ═══════════════════════════════════════════════════ */}
          <Section title="Attachments" icon={<File size={14} />}>
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
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
          </Section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* DESCRIPTION                                         */}
          {/* ═══════════════════════════════════════════════════ */}
          <Section title="Job Description" icon={<FileText size={14} />}>
            <div className="space-y-3">
              <div className="flex justify-end">
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

              {descEditMode === 'visual' && (
                <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-white/[0.03] border border-white/10 rounded-xl">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Bold size={14} /></button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Italic size={14} /></button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Underline size={14} /></button>
                  <span className="w-px h-4 bg-white/10 mx-1" />
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h3'); }} className="px-2 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold">H3</button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'p'); }} className="px-2 py-1.5 hover:bg-white/10 rounded-lg text-xs">P</button>
                  <span className="w-px h-4 bg-white/10 mx-1" />
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><List size={14} /></button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><List size={14} /></button>
                </div>
              )}

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
          </Section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* ADVANCED OPTIONS (collapsible)                      */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="border-t border-white/5 mt-6 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                Advanced Options
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Category"
                    value={advanced.job_category}
                    onChange={(e) => setAdvanced((p) => ({ ...p, job_category: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <select
                    value={advanced.employment_type}
                    onChange={(e) => setAdvanced((p) => ({ ...p, employment_type: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                  <select
                    value={advanced.workplace_type}
                    onChange={(e) => setAdvanced((p) => ({ ...p, workplace_type: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  >
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select
                    value={advanced.education_level}
                    onChange={(e) => setAdvanced((p) => ({ ...p, education_level: e.target.value }))}
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
                    value={advanced.experience_months || ''}
                    onChange={(e) => setAdvanced((p) => ({ ...p, experience_months: parseInt(e.target.value) || 0 }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Industry"
                    value={advanced.industry}
                    onChange={(e) => setAdvanced((p) => ({ ...p, industry: e.target.value }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Skills (comma-separated)"
                    value={advanced.skills.join(', ')}
                    onChange={(e) => setAdvanced((p) => ({ ...p, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Benefits (comma-separated)"
                    value={advanced.benefits.join(', ')}
                    onChange={(e) => setAdvanced((p) => ({ ...p, benefits: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    className="bg-white/[0.03] border border-white/10 px-3 py-2.5 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SUBMIT                                              */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="border-t border-white/5 mt-6 pt-6 flex gap-2">
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
