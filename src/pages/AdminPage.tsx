import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, TrendingUp, BookOpen, Plus, Trash2, RefreshCw, Check, AlertCircle, ExternalLink,
  ChevronRight, Shield, Clock, Briefcase, Lock, LogOut, Building2, FileText, Image as ImageIcon,
  Key, Flame, Globe, Compass, Settings, ChevronDown, Layers, Sparkles, DollarSign, MapPin,
  Eye, CheckCircle, HelpCircle, Upload, Bold, Italic, Underline, List, Code, Link as LinkIcon, File
} from 'lucide-react';
import { RawJob, Trend, Report, Company, ActivityLog, MediaAsset, RoleDefinition } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCountry } from '../context/CountryContext';
import { useCareerRedirect } from '../context/CareerRedirectContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// ========== TEMPLATE TYPES ==========
interface JobSection {
  title: string;
  content: string;
  type?: 'paragraph' | 'list' | 'subheader';
  items?: string[];
}

interface JobTemplateData {
  title: string;
  company: string;
  location: string;
  salary?: string;
  role: string;
  sections: JobSection[];
}

// ========== TEMPLATE RENDERER ==========
const renderJobDescription = (data: JobTemplateData, variant: 'standard' | 'premium' = 'standard'): string => {
  if (variant === 'premium') {
    return `
      <div class="job-description-premium">
        <div class="bg-gradient-to-r from-blue-600/20 to-violet-600/20 p-6 rounded-2xl mb-6 border border-white/10">
          <h1 class="text-2xl font-bold text-white mb-2">${data.title}</h1>
          <div class="flex flex-wrap gap-4 text-sm text-gray-300">
            <span class="flex items-center gap-1">🏢 ${data.company}</span>
            <span class="flex items-center gap-1">📍 ${data.location}</span>
            ${data.salary ? `<span class="flex items-center gap-1">💰 ${data.salary}</span>` : ''}
            <span class="flex items-center gap-1">🎯 ${data.role}</span>
          </div>
        </div>
        ${data.sections.map(section => `
          <div class="mb-5">
            <h2 class="text-lg font-bold text-white mb-3 border-l-3 border-blue-500 pl-3">${section.title}</h2>
            ${section.type === 'list' && section.items ? `
              <ul class="list-disc pl-6 space-y-2 text-gray-300">
                ${section.items.map(item => `<li>${item}</li>`).join('')}
              </ul>
            ` : `
              <p class="text-gray-300 leading-relaxed">${section.content}</p>
            `}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return `
    <div class="job-description">
      <h2 class="text-xl font-bold text-white mb-3 border-b border-white/10 pb-2">${data.title}</h2>
      <div class="grid grid-cols-2 gap-3 mb-4 p-3 bg-white/5 rounded-lg text-sm">
        <div><span class="text-gray-400">Company:</span> <span class="text-white">${data.company}</span></div>
        <div><span class="text-gray-400">Location:</span> <span class="text-white">${data.location}</span></div>
        ${data.salary ? `<div><span class="text-gray-400">Salary:</span> <span class="text-green-400">${data.salary}</span></div>` : ''}
        <div><span class="text-gray-400">Role:</span> <span class="text-blue-400">${data.role}</span></div>
      </div>
      ${data.sections.map(section => `
        <div class="mb-4">
          <h3 class="font-semibold text-blue-400 mb-2">${section.title}</h3>
          ${section.type === 'list' && section.items ? `
            <ul class="list-disc pl-5 space-y-1 text-gray-300">
              ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          ` : `
            <p class="text-gray-300 leading-relaxed">${section.content}</p>
          `}
        </div>
      `).join('')}
    </div>
  `;
};

// ========== SEARCHABLE COMBOBOX ==========
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "Search...",
  emptyMessage = "No matches found"
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
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const displayValue = value && !isOpen
    ? (options.find(o => o.value === value)?.label || value)
    : search;

  return (
    <div ref={containerRef} className="relative">
      <div
        className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus-within:border-blue-500 transition-colors cursor-pointer flex items-center justify-between gap-2"
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
          className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-gray-500"
        />
        <ChevronDown size={14} className="text-gray-500 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-white/10 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-[10px] text-gray-500 font-mono uppercase text-center">
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
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                  opt.value === value
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default function AdminPage() {
  const { isAdmin, login, logout: triggerLogout } = useAuth();
  const { selectedCountry, currentFlag } = useCountry();
  const { triggerRedirect } = useCareerRedirect();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'companies' | 'roles' | 'reports' | 'media'>('dashboard');
  
  // Authentication Simulated Permission level
  const [userRole, setUserRole] = useState<'admin' | 'editor'>('admin');

  // ✅ Edit states
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // ✅ ADD THESE - Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Core CMS state
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [companiesState, setCompaniesState] = useState<Company[]>([]);
  const [rolesState, setRolesState] = useState<RoleDefinition[]>([]);
  const [reportsState, setReportsState] = useState<Report[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    addedToday: 0,
    activeJobs: 0,
    totalCompanies: 0,
    lastUpdated: 'Yesterday'
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Pagination state (minimal)
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [loadingMoreJobs, setLoadingMoreJobs] = useState(false);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [companiesVisibleCount, setCompaniesVisibleCount] = useState(3);
  const PAGE_SIZE = 50;

  const [operationMessage, setOperationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- JOB FORM STATES ---
  const [jobForm, setJobForm] = useState({
    title: '',
    roleSelected: 'Software Developer',
    companySelected: '',
    companyNewName: '',
    companyNewUrl: '',
    companyNewLogo: '',
    location: '',
    url: '',
    salary: '',
    expiresAt: ''
  });
  
  // ✅ JOB FILES STATES with SEO support
  const [jobFiles, setJobFiles] = useState<{
    url: string; thumbnail: string; name: string; type: string; file?: File;
    seoTitle?: string; seoDescription?: string; seoSlug?: string;
  }[]>([]);
  
  // ✅ JOB DESCRIPTION STATE - Always visible
  const [jobDescription, setJobDescription] = useState('');
  const jobDescEditorRef = useRef<HTMLDivElement>(null);
  
  // ✅ AI Job Parser States
  const [showAIPaste, setShowAIPaste] = useState(false);
  const [rawJobText, setRawJobText] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  
  // ✅ AI Company Parser States
  const [showAICompanyPaste, setShowAICompanyPaste] = useState(false);
  const [rawCompanyText, setRawCompanyText] = useState('');
  const [aiCompanyProcessing, setAiCompanyProcessing] = useState(false);
  
  const [isCreatingNewCompanyInline, setIsCreatingNewCompanyInline] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  // ✅ Description Edit Mode
  const [descEditMode, setDescEditMode] = useState<'visual' | 'code'>('visual');
  
  // ✅ Draft and Application Type States
  const [isDraft, setIsDraft] = useState(false);
  const [applicationType, setApplicationType] = useState<'url' | 'email' | 'whatsapp' | 'instructions'>('url');
  
  // ✅ Schema data state
  const [schemaData, setSchemaData] = useState({
    job_category: 'Other',
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
    slug: '',
    canonical_url: '',
    whatsapp_number: '',
    application_instructions: ''
  });

  // --- COMPANY FORM STATES (UPDATED) ---
  const [companyForm, setCompanyForm] = useState({
    name: '',
    url: '',
    logoUrl: '',
    description: '',
    streetAddress: '',
    area: '',
    locality: '',
    district: '',
    postalCode: '',
    postalArea: '',
    country: 'TZ',
    industry: '',
    foundedYear: '',
    employeeCount: ''
  });

  // --- ROLE FORM STATES ---
  const [roleForm, setRoleForm] = useState({
    title: '',
    keywordInput: '',
    growth: 15,
    keywords: [] as string[]
  });

  // --- REPORT FORM STATES ---
  const [reportForm, setReportForm] = useState({
    title: '',
    roleSelected: 'Software Developer',
    monthYear: 'June 2026',
    excerpt: '',
    content: ''
  });
  
  // Custom rich helper states
  const [richLines, setRichLines] = useState<{ type: 'h2' | 'p' | 'list' | 'image'; text: string; subItems?: string[]; mediaUrl?: string; altText?: string }[]>([
    { type: 'h2', text: 'Market Demand Indicators' },
    { type: 'p', text: 'Telemetry analysis validates rising hiring volume across leading enterprise hubs.' },
    { type: 'list', text: 'Key Pillars', subItems: ['Dynamic core optimization', 'Local data structures prioritizations'] }
  ]);
  const [newRichType, setNewRichType] = useState<'h2' | 'p' | 'list' | 'image'>('p');
  const [newRichText, setNewRichText] = useState('');
  const [newRichSubItem, setNewRichSubItem] = useState('');
  const [newRichSubList, setNewRichSubList] = useState<string[]>([]);
  const [newRichMediaUrl, setNewRichMediaUrl] = useState('');
  const [newRichAltText, setNewRichAltText] = useState('');
  
  // Custom reports editing & formatting tool states
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code' | 'preview'>('visual');

  const isEditingRef = useRef(false);
  const visualEditorRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with contentEditable element
  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current && !isEditingRef.current) {
      visualEditorRef.current.innerHTML = reportForm.excerpt || '';
    }
  }, [reportForm.excerpt, editorMode]);

  // --- MEDIA FORM STATES ---
  const [mediaForm, setMediaForm] = useState({
    name: '',
    altText: ''
  });
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<string>('0KB');

  // --- PIPELINE RUN STATE ---
  const [pipelineFinishedInfo, setPipelineFinishedInfo] = useState<{ original: number; deduplicated: number } | null>(null);

  // ✅ AUTO-FILL LOCATION FROM COMPANY
  const handleAutoFillLocationFromCompany = (companyName: string) => {
    const company = allCompanies.find(c => c.name === companyName) 
                 || companiesState.find(c => c.name === companyName);
    if (!company) {
      showFeedback('error', `Company "${companyName}" not found in catalog`);
      return;
    }

    setSchemaData(prev => ({
      ...prev,
      street_address: (company as any).streetAddress || prev.street_address,
      city: (company as any).locality || prev.city,
      region: (company as any).district || prev.region,
      country: (company as any).country === 'TZ' ? 'Tanzania' : 
               (company as any).country || prev.country,
      postcode: (company as any).postalCode || prev.postcode,
      industry: (company as any).industry || prev.industry,
    }));

    // Also auto-fill location field if empty
    if (!jobForm.location) {
      const locationParts = [];
      if ((company as any).locality) locationParts.push((company as any).locality);
      if ((company as any).district) locationParts.push((company as any).district);
      if (locationParts.length > 0) {
        setJobForm(prev => ({ ...prev, location: locationParts.join(', ') }));
      }
    }

    showFeedback('success', `📍 Location auto-filled from ${companyName}`);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const result = await login(loginEmail, loginPassword);
    
    if (!result.success) {
      setLoginError(result.message);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSystemData();
    }
  }, [isAdmin]);

  // Sync / Auto-Normalize Detection Hook inside Job input
  useEffect(() => {
    if (jobForm.title) {
      const lowerTitle = jobForm.title.toLowerCase().trim();
      
      let foundMatchingRole = '';
      for (const r of rolesState) {
        if (r.title.toLowerCase() === lowerTitle) {
          foundMatchingRole = r.title;
          break;
        }
        for (const targetKey of r.mappedTitles) {
          if (lowerTitle.includes(targetKey.toLowerCase())) {
            foundMatchingRole = r.title;
            break;
          }
        }
        if (foundMatchingRole) break;
      }

      if (foundMatchingRole && foundMatchingRole !== jobForm.roleSelected) {
        setJobForm(prev => ({ ...prev, roleSelected: foundMatchingRole }));
      }

      const duplicateExists = jobs.some(j => 
        j.title.toLowerCase().trim() === lowerTitle &&
        j.company.toLowerCase().trim() === (isCreatingNewCompanyInline ? jobForm.companyNewName.toLowerCase().trim() : jobForm.companySelected.toLowerCase().trim()) &&
        j.location.toLowerCase().trim() === jobForm.location.toLowerCase().trim() &&
        j.id !== editingJobId
      );

      if (duplicateExists) {
        setDuplicateWarning("INLINE WARNING: A listing with identical Title + Company + Location combination exists in index. Adding this will be BLOCKED to prevent duplication.");
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [jobForm.title, jobForm.companySelected, jobForm.companyNewName, jobForm.location, isCreatingNewCompanyInline, jobs, rolesState, editingJobId]);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, rolesRes, reportsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/jobs-list?page=1&limit=${PAGE_SIZE}`),
        fetch('/api/admin/roles'),
        fetch('/api/reports'),
        fetch('/api/companies?all=true')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          addedToday: statsData.addedToday || 0,
          activeJobs: statsData.activeJobs || 0,
          totalCompanies: statsData.totalCompanies || 0,
          lastUpdated: statsData.lastUpdated || 'Today'
        });
        setActivityLogs(statsData.recentActivity || []);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobsList = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
        setJobs(jobsList);
        setJobsPage(1);
        setJobsTotal(jobsData.stats?.total || jobsList.length);
        setJobsHasMore(jobsData.stats?.hasMore || false);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        const companiesList = Array.isArray(companiesData) 
          ? companiesData 
          : (companiesData.companies || []);
        setAllCompanies(companiesList);
        setCompaniesState(companiesList);
        setCompaniesTotal(companiesList.length);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        if (rolesData && rolesData.length > 0) {
          setRolesState(rolesData);
        }
      }
      
      if (reportsRes.ok) setReportsState(await reportsRes.json());
      
    } catch (err) {
      console.error("Failed to sync system parameters", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load more jobs (for pagination)
  const loadMoreJobs = async () => {
    if (loadingMoreJobs || !jobsHasMore) return;
    setLoadingMoreJobs(true);
    try {
      const nextPage = jobsPage + 1;
      const res = await fetch(`/api/admin/jobs-list?page=${nextPage}&limit=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        const newJobs = Array.isArray(data) ? data : (data.jobs || []);
        setJobs(prev => [...prev, ...newJobs]);
        setJobsPage(nextPage);
        setJobsHasMore(data.stats?.hasMore || false);
      }
    } catch (err) {
      console.error('Failed to load more jobs:', err);
    } finally {
      setLoadingMoreJobs(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setOperationMessage({ type, text });
    setTimeout(() => {
      setOperationMessage(null);
    }, 5000);
  };

  // ✅ AI Job Parser with Template Support
  const handleAIProcessJob = async () => {
    if (!rawJobText.trim() || rawJobText.trim().length < 20) {
      showFeedback('error', 'Please paste a complete job description (at least 20 characters).');
      return;
    }

    setAiProcessing(true);
    try {
      const res = await fetch('/api/ai/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawJobText })
      });

      const result = await res.json();

      if (result.success && result.data) {
        // Auto-fill form
        setJobForm(prev => ({
          ...prev,
          title: result.data.title || prev.title,
          roleSelected: result.data.role || prev.roleSelected,
          location: result.data.location || prev.location,
          salary: result.data.salary || prev.salary,
          companySelected: result.data.company || prev.companySelected,
        }));

        // Load description
        const descriptionHTML = result.data.description || '';
        if (descriptionHTML) {
          setJobDescription(descriptionHTML);
          setDescEditMode('visual');
          setTimeout(() => {
            const editor = jobDescEditorRef.current;
            if (editor) {
              editor.innerHTML = descriptionHTML;
              editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
              editor.style.borderColor = '#10b981';
              editor.style.borderWidth = '2px';
              setTimeout(() => { editor.style.borderColor = ''; editor.style.borderWidth = ''; }, 2000);
            }
          }, 300);
        }

        // ✅ Also extract schema data
        try {
          const schemaRes = await fetch('/api/ai/extract-schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: result.data.title || jobForm.title,
              description: descriptionHTML || jobDescription,
              location: result.data.location || jobForm.location,
              company: result.data.company || jobForm.companySelected
            })
          });
          const schemaResult = await schemaRes.json();
          if (schemaResult.success && schemaResult.schema) {
            setSchemaData(prev => ({ 
              ...prev, 
              ...schemaResult.schema,
              whatsapp_number: schemaResult.schema?.whatsapp_number || '',
              application_instructions: schemaResult.schema?.application_instructions || ''
            }));
            console.log('Schema extracted:', schemaResult.schema);
          }
        } catch (schemaErr) {
          console.log('Schema extraction skipped:', schemaErr);
        }

        showFeedback('success', 'Job parsed! Description and schema loaded.');
        setShowAIPaste(false);
        setRawJobText('');
      } else {
        showFeedback('error', result.error || 'AI processing failed');
        if (result.partial && result.partial.title) {
          setJobForm(prev => ({
            ...prev,
            title: result.partial.title || prev.title,
            location: result.partial.location || prev.location,
          }));
        }
      }
    } catch (err) {
      showFeedback('error', 'AI service unavailable. Please fill manually.');
      console.error('AI error:', err);
    } finally {
      setAiProcessing(false);
    }
  };

  // ✅ AI Company Parser - Extract facts + generate description
  const handleAIProcessCompany = async () => {
    if (!rawCompanyText.trim() || rawCompanyText.trim().length < 20) {
      showFeedback('error', 'Please paste company information (at least 20 characters).');
      return;
    }

    setAiCompanyProcessing(true);
    try {
      const res = await fetch('/api/ai/process-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawCompanyText })
      });

      const result = await res.json();

      if (result.success && result.data) {
        // Auto-fill company form with extracted data
        setCompanyForm(prev => ({
          ...prev,
          name: result.data.name || prev.name,
          industry: result.data.industry || prev.industry,
          description: result.data.description || prev.description,
          url: result.data.website || prev.url,
          streetAddress: result.data.streetAddress || prev.streetAddress,
          area: result.data.area || prev.area,
          locality: result.data.locality || prev.locality,
          district: result.data.district || prev.district,
          postalCode: result.data.postalCode || prev.postalCode,
          postalArea: result.data.postalArea || prev.postalArea,
          country: result.data.country || prev.country,
          foundedYear: result.data.foundedYear || prev.foundedYear,
          employeeCount: result.data.employeeCount || prev.employeeCount,
        }));

        showFeedback('success', 'Company parsed! Form auto-filled with AI-enhanced description.');
        setShowAICompanyPaste(false);
        setRawCompanyText('');
      } else {
        showFeedback('error', result.error || 'AI processing failed');
        // If partial data available, fill what we can
        if (result.data?.name) {
          setCompanyForm(prev => ({
            ...prev,
            name: result.data.name || prev.name,
            industry: result.data.industry || prev.industry,
          }));
        }
      }
    } catch (err) {
      showFeedback('error', 'AI service unavailable. Please fill manually.');
      console.error('AI company error:', err);
    } finally {
      setAiCompanyProcessing(false);
    }
  };

  // ✅ Generate thumbnail from image file
  const generateThumbnail = (file: File, maxWidth: number = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx!.drawImage(img, 0, 0, width, height);
          
          const thumbnail = canvas.toDataURL('image/webp', 0.7);
          resolve(thumbnail);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Generate PDF/Document icon thumbnail
  const generateDocumentThumbnail = (fileName: string, fileType: string): string => {
    const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    const isDoc = fileName.match(/\.(doc|docx)$/i);
    const isSheet = fileName.match(/\.(xls|xlsx)$/i);
    const isPPT = fileName.match(/\.(ppt|pptx)$/i);
    
    let fileIcon = 'PDF';
    let bgColor = '#ef4444';
    
    if (isDoc) {
      fileIcon = 'DOC';
      bgColor = '#3b82f6';
    } else if (isSheet) {
      fileIcon = 'XLS';
      bgColor = '#10b981';
    } else if (isPPT) {
      fileIcon = 'PPT';
      bgColor = '#f59e0b';
    }
    
    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect fill="${bgColor}" width="200" height="200" rx="12"/>
        <text fill="white" font-size="48" font-weight="bold" text-anchor="middle" x="100" y="90">${fileIcon}</text>
        <text fill="#e2e8f0" font-size="14" text-anchor="middle" x="100" y="130">Document</text>
      </svg>
    `);
  };

  // ✅ Handle multiple file upload for jobs with SEO metadata
  const handleJobFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setActionLoading(true);
    const newFiles: {
      url: string; thumbnail: string; name: string; type: string; file: File;
      seoTitle: string; seoDescription: string; seoSlug: string;
    }[] = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isDoc = file.type.includes('document') || file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
      
      // ✅ Generate SEO-friendly metadata
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
      const cleanSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      let seoTitle = '';
      let seoDescription = '';
      const jobTitle = jobForm.title || 'Job';
      const companyName = jobForm.companySelected || (jobForm.companyNewName || 'company');
      
      if (isImage) {
        seoTitle = `${jobTitle} - Image ${i + 1}`;
        seoDescription = `Image attachment for ${jobTitle} at ${companyName}`;
      } else if (isPDF) {
        seoTitle = `${jobTitle} - PDF Document`;
        seoDescription = `PDF document for ${jobTitle} at ${companyName} - ${baseName}`;
      } else if (isDoc) {
        seoTitle = `${jobTitle} - Document`;
        seoDescription = `Document attachment for ${jobTitle} at ${companyName}`;
      }
      
      const seoSlug = `${cleanSlug}-${Date.now().toString(36)}.${ext}`;
      
      if (isImage) {
        const thumbnail = await generateThumbnail(file, 400);
        const reader = new FileReader();
        reader.onloadend = () => {
          newFiles.push({ url: reader.result as string, thumbnail, name: seoSlug, type: 'image', file, seoTitle, seoDescription, seoSlug });
          processedCount++;
          if (processedCount === files.length) {
            setJobFiles(prev => [...prev, ...newFiles]);
            setActionLoading(false);
            showFeedback('success', `${files.length} file(s) ready with SEO metadata`);
          }
        };
        reader.readAsDataURL(file);
      } else if (isPDF || isDoc) {
        const docThumbnail = generateDocumentThumbnail(file.name, file.type);
        const reader = new FileReader();
        reader.onloadend = () => {
          newFiles.push({ url: reader.result as string, thumbnail: docThumbnail, name: seoSlug, type: isPDF ? 'pdf' : 'document', file, seoTitle, seoDescription, seoSlug });
          processedCount++;
          if (processedCount === files.length) {
            setJobFiles(prev => [...prev, ...newFiles]);
            setActionLoading(false);
            showFeedback('success', `${files.length} file(s) ready with SEO metadata`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        processedCount++;
        if (processedCount === files.length) {
          setActionLoading(false);
          showFeedback('error', `Unsupported file type: ${file.name}`);
        }
      }
    }
  };

  const handleRemoveJobFile = (index: number) => {
    setJobFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, target: 'media' | 'company' | 'article') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = Math.round(file.size / 1024) + 'KB';

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'media') {
        setSelectedFileBase64(base64String);
        setSelectedFileSize(sizeKb);
        setMediaForm(prev => ({ ...prev, name: file.name }));
      } else if (target === 'company') {
        setJobForm(prev => ({ ...prev, companyNewLogo: base64String }));
        setCompanyForm(prev => ({ ...prev, logoUrl: base64String }));
        showFeedback('success', `Logo "${file.name}" cached.`);
      } else if (target === 'article') {
        setNewRichMediaUrl(base64String);
        showFeedback('success', 'Article inline graphic cached.');
      }
    };
    reader.readAsDataURL(file);
  };

  const compressToWebP = (file: File, maxWidth: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx!.drawImage(img, 0, 0, width, height);
          
          const webpBase64 = canvas.toDataURL('image/webp', 0.8);
          resolve(webpBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEditJob = (job: RawJob) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      roleSelected: job.role,
      companySelected: job.company,
      companyNewName: '',
      companyNewUrl: '',
      companyNewLogo: '',
      location: job.location || '',
      url: job.url || '',
      salary: job.salary || '',
      expiresAt: job.expiresAt || ''
    });
    setJobDescription((job as any).description || '');
    setDescEditMode('visual');
    
    // ✅ Load all schema data when editing
    const j = job as any;
    setSchemaData({
      job_category: j.job_category || 'Other',
      industry: j.industry || '',
      employment_type: j.employment_type || 'FULL_TIME',
      workplace_type: j.workplace_type || 'Onsite',
      education_level: j.education_level || 'Any',
      experience_months: j.experience_months || 0,
      skills: Array.isArray(j.skills) ? j.skills : (typeof j.skills === 'string' ? JSON.parse(j.skills || '[]') : []),
      benefits: Array.isArray(j.benefits) ? j.benefits : (typeof j.benefits === 'string' ? JSON.parse(j.benefits || '[]') : []),
      salary_min: j.salary_min || null,
      salary_max: j.salary_max || null,
      salary_currency: j.salary_currency || 'TZS',
      street_address: j.street_address || '',
      city: j.city || '',
      region: j.region || '',
      country: j.country || 'Tanzania',
      postcode: j.postcode || '',
      slug: j.slug || '',
      canonical_url: j.canonical_url || '',
      whatsapp_number: j.whatsapp_number || '',
      application_instructions: j.application_instructions || ''
    });

    // ✅ AUTO-FILL LOCATION FROM COMPANY WHEN EDITING
    if (job.company) {
      const company = allCompanies.find(c => c.name === job.company) 
                   || companiesState.find(c => c.name === job.company);
      if (company) {
        setTimeout(() => {
          setSchemaData(prev => ({
            ...prev,
            street_address: (company as any).streetAddress || prev.street_address,
            city: (company as any).locality || prev.city,
            region: (company as any).district || prev.region,
            country: (company as any).country === 'TZ' ? 'Tanzania' : (company as any).country || prev.country,
            postcode: (company as any).postalCode || prev.postcode,
          }));
        }, 100);
      }
    }
    
    // Set application type
    if (j.url && j.url.startsWith('mailto:')) {
      setApplicationType('email');
    } else {
      setApplicationType('url');
    }
    
    setTimeout(() => {
      if (jobDescEditorRef.current) {
        jobDescEditorRef.current.innerHTML = (job as any).description || '';
      }
    }, 100);
    setIsCreatingNewCompanyInline(false);
    setJobFiles([]);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEditJob = () => {
    setEditingJobId(null);
    setJobForm({
      title: '',
      roleSelected: 'Software Developer',
      companySelected: '',
      companyNewName: '',
      companyNewUrl: '',
      companyNewLogo: '',
      location: '',
      url: '',
      salary: '',
      expiresAt: ''
    });
    setJobDescription('');
    if (jobDescEditorRef.current) {
      jobDescEditorRef.current.innerHTML = '';
    }
    setJobFiles([]);
    setIsCreatingNewCompanyInline(false);
  };

  const handleIngestJob = async (e: FormEvent) => {
    e.preventDefault();
    
    const targetCompany = isCreatingNewCompanyInline 
      ? jobForm.companyNewName 
      : jobForm.companySelected;

    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED.');
      return;
    }

    if (!jobForm.title || (!isCreatingNewCompanyInline && !jobForm.companySelected) || (isCreatingNewCompanyInline && !jobForm.companyNewName)) {
      showFeedback('error', 'Please fill in the Job Title, Location, and correct Company selections.');
      return;
    }

    setActionLoading(true);
    try {
      if (!editingJobId && !isDraft && duplicateWarning) {
        showFeedback('error', 'Duplicate insertion blocked.');
        setActionLoading(false);
        return;
      }

      // Upload company logo to R2 if creating new company inline
      let companyLogoUrl = '';
      if (isCreatingNewCompanyInline && jobForm.companyNewLogo && jobForm.companyNewLogo.startsWith('data:image')) {
        const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (file) {
          try {
            const compressedLogo = await compressToWebP(file, 200);
            const response = await fetch(compressedLogo);
            const blob = await response.blob();
            const formData = new FormData();
            const logoFileName = `logo-${jobForm.companyNewName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.webp`;
            formData.append('file', blob, logoFileName);
            formData.append('name', logoFileName);
            formData.append('altText', `${jobForm.companyNewName} logo`);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              companyLogoUrl = uploadData.url;
            }
          } catch (logoErr) { console.error('Logo upload failed:', logoErr); }
        }
      }

      // Upload job files to R2
      const uploadedFiles: any[] = [];
      for (const file of jobFiles) {
        const fileData: any = {
          url: file.url, thumbnail: file.thumbnail, name: file.name, type: file.type,
          seoTitle: (file as any).seoTitle || file.name,
          seoDescription: (file as any).seoDescription || ''
        };
        if (file.file) {
          const originalFormData = new FormData();
          originalFormData.append('file', file.file, (file as any).seoSlug || file.name);
          originalFormData.append('name', (file as any).seoSlug || file.name);
          originalFormData.append('altText', (file as any).seoTitle || file.name);
          const originalRes = await fetch('/api/upload', { method: 'POST', body: originalFormData });
          if (originalRes.ok) {
            const originalData = await originalRes.json();
            fileData.url = originalData.url;
          }
          if (file.type === 'image') {
            const thumbBlob = await fetch(file.thumbnail).then(r => r.blob());
            const thumbFormData = new FormData();
            thumbFormData.append('file', thumbBlob, `thumb-${(file as any).seoSlug || file.name}`);
            const thumbRes = await fetch('/api/upload', { method: 'POST', body: thumbFormData });
            if (thumbRes.ok) {
              const thumbData = await thumbRes.json();
              fileData.thumbnail = thumbData.url;
            }
          }
        }
        uploadedFiles.push(fileData);
      }

      // 🔥 Build application URL based on type
      let applyUrl = '';
      let whatsapp_number = '';
      let application_instructions = '';

      if (applicationType === 'url') {
        applyUrl = jobForm.url;
      } else if (applicationType === 'email') {
        applyUrl = jobForm.url && !jobForm.url.startsWith('mailto:') 
          ? `mailto:${jobForm.url}` 
          : jobForm.url;
        if (jobForm.companyNewUrl) {
          applyUrl += `?subject=${encodeURIComponent(jobForm.companyNewUrl)}`;
        }
      } else if (applicationType === 'whatsapp') {
        whatsapp_number = jobForm.url;
        applyUrl = '';
      } else if (applicationType === 'instructions') {
        application_instructions = jobForm.url;
        applyUrl = '';
      }

      const apiUrl = editingJobId ? `/api/admin/jobs/${editingJobId}` : '/api/admin/jobs';
      const method = editingJobId ? 'PUT' : 'POST';

      const res = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobForm.title,
          role: jobForm.roleSelected,
          company: targetCompany,
          location: jobForm.location || 'Remote',
          url: applyUrl,
          salary: jobForm.salary?.trim() ? jobForm.salary.trim() : 'Not Disclosed',
          expiresAt: jobForm.expiresAt,
          description: jobDescription,
          is_active: isDraft ? 0 : 1,
          logoUrl: companyLogoUrl || undefined,
          // Schema fields
          job_category: schemaData.job_category || 'Other',
          industry: schemaData.industry || '',
          employment_type: schemaData.employment_type || 'FULL_TIME',
          workplace_type: schemaData.workplace_type || 'Onsite',
          education_level: schemaData.education_level || 'Any',
          experience_months: schemaData.experience_months || 0,
          skills: schemaData.skills || [],
          benefits: schemaData.benefits || [],
          salary_min: schemaData.salary_min || null,
          salary_max: schemaData.salary_max || null,
          salary_currency: schemaData.salary_currency || 'TZS',
          // Location fields for Google Schema
          street_address: schemaData.street_address || '',
          city: schemaData.city || '',
          region: schemaData.region || '',
          country: schemaData.country || 'Tanzania',
          postcode: schemaData.postcode || '',
          canonical_url: schemaData.canonical_url || '',
          // 🔥 New application fields
          whatsapp_number: whatsapp_number,
          application_instructions: application_instructions,
          images: uploadedFiles
        })
      });

      if (res.ok) {
        const addedJob = await res.json();
        if (editingJobId) {
          setJobs(prev => prev.map(j => j.id === editingJobId ? { ...j, ...addedJob } : j));
          showFeedback('success', `Updated "${jobForm.title}" successfully.`);
        } else {
          setJobs(prev => [addedJob, ...prev]);
          showFeedback('success', isDraft ? `Draft saved!` : `Published successfully.`);
          
          // 🔥 NOTIFY GOOGLE - Only for new published jobs (not drafts)
          if (!isDraft) {
            const jobUrl = `https://jobsreport.online/market/${addedJob.slug || addedJob.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${addedJob.id}`;
            fetch('/api/test-indexing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: jobUrl })
            }).catch(err => console.log('Google notification failed:', err));
            console.log(`📢 Auto-notified Google: ${jobUrl}`);
          }
        }
        if (!isDraft || editingJobId) {
          setJobForm({ title: '', roleSelected: 'Software Developer', companySelected: '', companyNewName: '', companyNewUrl: '', companyNewLogo: '', location: '', url: '', salary: '', expiresAt: '' });
          setJobDescription('');
          if (jobDescEditorRef.current) jobDescEditorRef.current.innerHTML = '';
          setSchemaData({ 
            job_category: 'Other', industry: '', employment_type: 'FULL_TIME', workplace_type: 'Onsite',
            education_level: 'Any', experience_months: 0, skills: [], benefits: [],
            salary_min: null, salary_max: null, salary_currency: 'TZS',
            street_address: '', city: '', region: '', country: 'Tanzania', postcode: '',
            slug: '', canonical_url: '',
            whatsapp_number: '', application_instructions: ''
          });
          setIsCreatingNewCompanyInline(false);
          setJobFiles([]);
          setEditingJobId(null);
        }
        await fetchSystemData();
      } else {
        const errObj = await res.json();
        showFeedback('error', errObj.message || errObj.error || 'Validation error');
      }
    } catch (err) {
      showFeedback('error', 'Failed to save job.');
      console.error('Job error:', err);
    } finally {
      setActionLoading(false);
      setIsDraft(false);
    }
  };

  const handleToggleJobActive = async (id: string, currentStatus: boolean) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, active: !currentStatus } : j));
        showFeedback('success', `Toggled job status.`);
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Could not sync active parameter.');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED.');
      return;
    }

    if (!confirm("Are you sure you want to delete this job listing?")) return;

    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        showFeedback('success', 'Job record successfully purged.');
        fetchSystemData();
      } else {
        showFeedback('error', 'Delete failed');
      }
    } catch (err) {
      showFeedback('error', 'Failed delete operation.');
    }
  };

  // Updated handleEditCompany
  const handleEditCompany = (co: Company) => {
    setEditingCompanyId(co.id);
    setCompanyForm({
      name: co.name,
      url: co.url || '',
      logoUrl: co.logoUrl || '',
      description: (co as any).description || '',
      streetAddress: (co as any).streetAddress || '',
      area: (co as any).area || '',
      locality: (co as any).locality || '',
      district: (co as any).district || '',
      postalCode: (co as any).postalCode || '',
      postalArea: (co as any).postalArea || '',
      country: (co as any).country || 'TZ',
      industry: (co as any).industry || '',
      foundedYear: (co as any).foundedYear || '',
      employeeCount: (co as any).employeeCount || ''
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Updated handleCancelEditCompany
  const handleCancelEditCompany = () => {
    setEditingCompanyId(null);
    setCompanyForm({ 
      name: '', url: '', logoUrl: '', description: '',
      streetAddress: '', area: '', locality: '', district: '',
      postalCode: '', postalArea: '', country: 'TZ', industry: '',
      foundedYear: '', employeeCount: ''
    });
  };

  // Updated handleDeleteCompany
  const handleDeleteCompany = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Purge request rejected.');
      return;
    }

    if (!confirm("Remove this company? This will also delete all jobs associated with this company.")) return;

    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setCompaniesState(prev => prev.filter(c => c.id !== id));
        setAllCompanies(prev => prev.filter(c => c.id !== id));
        showFeedback('success', data.message || 'Company removed from active inventory.');
        fetchSystemData();
      } else {
        showFeedback('error', data.error || data.details || 'Could not delete company.');
      }
    } catch (err) {
      showFeedback('error', 'Network error. Could not delete company profile.');
    }
  };

  // Updated handleCreateCompany
  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;

    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Corporate index editing is blocked.');
      return;
    }

    if (!editingCompanyId) {
      const duplicateExists = companiesState.some(
        c => c.name.toLowerCase() === companyForm.name.toLowerCase().trim()
      );
      if (duplicateExists) {
        showFeedback('error', `Company "${companyForm.name}" already exists.`);
        return;
      }
    }

    setActionLoading(true);
    try {
      let logoUrl = companyForm.logoUrl;
      
      // Upload logo to R2 if it's a base64 image
      if (logoUrl && logoUrl.startsWith('data:image')) {
        const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (file) {
          try {
            const compressedLogo = await compressToWebP(file, 200);
            const response = await fetch(compressedLogo);
            const blob = await response.blob();
            const formData = new FormData();
            const logoFileName = `logo-${companyForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.webp`;
            formData.append('file', blob, logoFileName);
            formData.append('name', logoFileName);
            formData.append('altText', `${companyForm.name} logo`);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              logoUrl = uploadData.url;
              console.log('Logo uploaded to R2:', logoUrl);
            }
          } catch (logoErr) { console.error('Logo upload failed:', logoErr); }
        }
      }

      const url = editingCompanyId 
        ? `/api/admin/companies/${editingCompanyId}` 
        : '/api/admin/companies';
      const method = editingCompanyId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyForm.name.trim(),
          url: companyForm.url,
          logoUrl: logoUrl,
          description: companyForm.description,
          streetAddress: companyForm.streetAddress,
          area: companyForm.area,
          locality: companyForm.locality,
          district: companyForm.district,
          postalCode: companyForm.postalCode,
          postalArea: companyForm.postalArea,
          country: companyForm.country,
          industry: companyForm.industry,
          foundedYear: companyForm.foundedYear,
          employeeCount: companyForm.employeeCount
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (editingCompanyId) {
          setCompaniesState(prev => prev.map(c => c.id === editingCompanyId ? { ...c, ...data, logoUrl: data.logoUrl || c.logoUrl } : c));
          setAllCompanies(prev => prev.map(c => c.id === editingCompanyId ? { ...c, ...data, logoUrl: data.logoUrl || c.logoUrl } : c));
          showFeedback('success', `Updated ${companyForm.name}.`);
        } else {
          setCompaniesState(prev => [...prev, { ...data, logoUrl: data.logoUrl || '' }]);
          setAllCompanies(prev => [...prev, { ...data, logoUrl: data.logoUrl || '' }]);
          showFeedback('success', `Created ${companyForm.name}.`);
        }
        setCompanyForm({ 
          name: '', url: '', logoUrl: '', description: '',
          streetAddress: '', area: '', locality: '', district: '',
          postalCode: '', postalArea: '', country: 'TZ', industry: '',
          foundedYear: '', employeeCount: ''
        });
        setEditingCompanyId(null);
        fetchSystemData();
      } else {
        showFeedback('error', data.error || data.details || 'Failed to save company');
      }
    } catch (err) {
      showFeedback('error', 'Error establishing corporate database reference.');
      console.error('Company save error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddKeywordToRole = () => {
    if (!roleForm.keywordInput.trim()) return;
    const cleanWord = roleForm.keywordInput.trim().toLowerCase();
    if (roleForm.keywords.includes(cleanWord)) return;
    setRoleForm(prev => ({
      ...prev,
      keywords: [...prev.keywords, cleanWord],
      keywordInput: ''
    }));
  };

  const handleRemoveKeywordFromFile = (index: number) => {
    setRoleForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleSaveRoleRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!roleForm.title) return;

    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Core normalization charts are read-only for Editors.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roleForm.title,
          mappedTitles: roleForm.keywords,
          growth: Number(roleForm.growth)
        })
      });

      if (res.ok) {
        showFeedback('success', `Normalization mapping saved for: [${roleForm.title}]`);
        setRoleForm({ title: '', keywordInput: '', growth: 15, keywords: [] });
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Failed saving mapped configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Role expulsion rejected.');
      return;
    }

    if (!confirm("Delete this role? Jobs using this role will need to be reassigned first.")) return;

    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setRolesState(prev => prev.filter(r => r.id !== id));
        showFeedback('success', 'Role deleted successfully.');
        fetchSystemData();
      } else if (res.status === 409) {
        showFeedback('error', data.error || 'Jobs are using this role. Reassign them first.');
      } else {
        showFeedback('error', data.error || 'Could not delete role.');
      }
    } catch (err) {
      showFeedback('error', 'Network error. Could not delete role.');
    }
  };

  const handlePostReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.roleSelected) {
      showFeedback('error', 'Report title and target role categorizations are required.');
      return;
    }

    setActionLoading(true);
    try {
      let finalContent = '';
      
      if (editorMode === 'visual' && visualEditorRef.current) {
        finalContent = visualEditorRef.current.innerHTML;
      } 
      else if (editorMode === 'code') {
        finalContent = reportForm.excerpt;
      }
      else {
        finalContent = reportForm.excerpt;
      }

      if (!finalContent || finalContent === '<br>' || finalContent === '') {
        let compiledHtml = '';
        for (const line of richLines) {
          if (line.type === 'h2') {
            compiledHtml += `<h2 class="text-xl font-bold text-white mt-6 mb-3 border-b border-white/5 pb-2 uppercase tracking-wide font-sans">${line.text}</h2>`;
          } else if (line.type === 'p') {
            compiledHtml += `<p class="text-gray-400 text-sm leading-relaxed mb-4">${line.text}</p>`;
          } else if (line.type === 'list') {
            compiledHtml += `<div class="bg-white/[0.01] border border-white/5 p-4 rounded-2xl mb-4"><span class="text-white text-xs font-bold uppercase tracking-wider">${line.text}</span><ul class="list-disc pl-5 mt-2 space-y-1 text-xs text-gray-400">`;
            line.subItems?.forEach(item => {
              compiledHtml += `<li>${item}</li>`;
            });
            compiledHtml += `</ul></div>`;
          } else if (line.type === 'image') {
            compiledHtml += `<div class="my-6 rounded-3xl overflow-hidden border border-white/10 relative"><img src="${line.mediaUrl}" alt="${line.text}" referrerPolicy="no-referrer" class="w-full object-cover max-h-72" /><div class="absolute bottom-3 left-4 px-2.5 py-1 bg-black/80 backdrop-blur text-[9px] text-gray-400 font-mono tracking-widest uppercase rounded-lg">ALT TAG: ${line.text}</div></div>`;
          }
        }
        finalContent = compiledHtml;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      const excerpt = plainText.substring(0, 200).trim() + (plainText.length > 200 ? '...' : '');

      const url = editingReportId ? `/api/reports/${editingReportId}` : '/api/reports';
      const method = editingReportId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportForm.title,
          role: reportForm.roleSelected,
          monthYear: reportForm.monthYear,
          excerpt: excerpt,
          content: finalContent,
          country: selectedCountry
        })
      });

      if (res.ok) {
        const savedReport = await res.json();
        
        const msg = editingReportId 
          ? `Insight Report "${reportForm.title}" updated successfully!` 
          : `Insight Report "${reportForm.title}" published!`;
        showFeedback('success', msg);
        
        setReportForm({
          title: '',
          roleSelected: 'Software Developer',
          monthYear: 'June 2026',
          excerpt: '',
          content: ''
        });
        setRichLines([
          { type: 'h2', text: 'Market Demand Indicators' },
          { type: 'p', text: 'Telemetry analysis validates rising hiring volume across leading enterprise hubs.' }
        ]);
        setEditingReportId(null);
        
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = '';
        }
        
        await fetchSystemData();
        setActiveTab('dashboard');
      } else {
        const errData = await res.json();
        showFeedback('error', errData.error || 'Error saving report.');
      }
    } catch (err) {
      console.error('Report save error:', err);
      showFeedback('error', 'Network failure.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadMedia = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFileBase64) {
      showFeedback('error', 'Select or drop an image file first.');
      return;
    }

    setActionLoading(true);
    try {
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      if (!file) {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: mediaForm.name || 'image.png',
            type: 'image/png',
            dataUrl: selectedFileBase64,
            size: selectedFileSize || '150KB',
            altText: mediaForm.altText || 'Custom image upload'
          })
        });

        if (res.ok) {
          const added = await res.json();
          setMediaAssets(prev => [added, ...prev]);
          showFeedback('success', `Saved asset "${mediaForm.name}" to media vault.`);
          setMediaForm({ name: '', altText: '' });
          setSelectedFileBase64(null);
          fetchSystemData();
        } else {
          showFeedback('error', 'Failed to upload media.');
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', mediaForm.name || file.name);
        formData.append('altText', mediaForm.altText || file.name);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const added = await res.json();
          setMediaAssets(prev => [added, ...prev]);
          showFeedback('success', `Uploaded "${added.name}" to media.jobsreport.online`);
          setMediaForm({ name: '', altText: '' });
          setSelectedFileBase64(null);
          fetchSystemData();
        } else {
          const errData = await res.json();
          showFeedback('error', errData.error || 'Upload failed');
        }
      }
    } catch (err) {
      showFeedback('error', 'Error uploading to media server.');
      console.error('Upload error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to purge this image from media library?")) return;

    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMediaAssets(prev => prev.filter(m => m.id !== id));
        showFeedback('success', 'Media asset removed from standard catalog.');
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Purge error.');
    }
  };

  const handleLoadReportToEdit = (rep: Report) => {
    setEditingReportId(rep.id);
    setReportForm({
      title: rep.title,
      roleSelected: rep.role,
      monthYear: rep.monthYear || 'May 2026',
      excerpt: rep.content || rep.excerpt || '',
      content: rep.content || ''
    });
    showFeedback('success', `Loaded "${rep.title}" into the rich text composer workspace.`);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setReportForm({
      title: '',
      roleSelected: 'Software Developer',
      monthYear: 'June 2026',
      excerpt: '',
      content: ''
    });
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this intelligence report permanently?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showFeedback('success', 'Report permanently decommissioned.');
        fetchSystemData();
      } else {
        showFeedback('error', 'Failed to delete report.');
      }
    } catch (err) {
      showFeedback('error', 'Network error.');
    }
  };

  const handleInsertTag = (startTag: string, endTag: string = '') => {
    const textarea = document.getElementById('excerpt-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(startPos, endPos);
    
    const replacement = startTag + (selectedText || '') + (endTag || startTag);
    const updatedValue = text.substring(0, startPos) + replacement + text.substring(endPos);
    
    setReportForm(prev => ({ ...prev, excerpt: updatedValue }));
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + startTag.length + (selectedText || '').length + (selectedText ? endTag.length : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleInsertTemplate = (type: 'insights' | 'segmented' | 'standard') => {
    let tpl = '';
    if (type === 'insights') {
      tpl = `<h2>Market Demand Vectors</h2>\n<p>Our analytics systems indicate a rising demand velocity in specialized technical operations. Here are the core metrics for this sector:</p>\n<ul>\n  <li><strong>Remote Placements:</strong> Growth represents 64% of active quarterly listings</li>\n  <li><strong>Stack Priority:</strong> Senior React frameworks coupled with backend cloud services</li>\n  <li><strong>Time-to-Hire:</strong> Dropped by 12 days, validating intense corporate competition</li>\n</ul>`;
    } else if (type === 'segmented') {
      tpl = `<h2>Functional Breakdown of Regional Placements</h2>\n<p>Hiring indexes remain concentrated in leading regional commerce ports and enterprise hubs. Let us look at specific segments:</p>\n<h3>1. Software Engineering</h3>\n<p>Modern applications require highly robust API interfaces and structured database architectures. Companies are investing heavily in refactoring legacy stacks here.</p>\n<h3>2. Infrastructure Specialists</h3>\n<p>Security protocols and reliable container delivery pipelines stand out as high prioritizations.</p>`;
    } else {
      tpl = `<p>The current landscape indicates a significant growth spike in active listings. As enterprise teams continue to scale, hiring velocity is projected to sustain its upwards trajectory over the upcoming quarters. Below, our dynamic normalizer provides live telemetry on corporate placements.</p>`;
    }
    const newExcerpt = reportForm.excerpt + (reportForm.excerpt ? '\n\n' : '') + tpl;
    setReportForm(prev => ({ ...prev, excerpt: newExcerpt }));
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = newExcerpt;
    }
    showFeedback('success', 'Template inserted into content.');
  };

  const executeFormatting = (command: string, value: string = '') => {
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    let finalValue = value;
    if (command === 'formatBlock') {
      const lower = value.toLowerCase();
      if (lower === 'h2' || lower === 'h3' || lower === 'p' || lower === 'blockquote') {
        finalValue = `<${lower}>`;
      }
    }
    document.execCommand(command, false, finalValue);
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      setReportForm(prev => ({ ...prev, excerpt: html }));
    }
  };

  const handleToolbarClick = (visualCommand: string, visualVal: string = '', startTag: string = '', endTag: string = '') => {
    if (editorMode === 'visual') {
      if (visualCommand === 'highlight') {
        const sel = window.getSelection()?.toString() || '';
        executeFormatting('insertHTML', `<span class="text-blue-400 font-extrabold">${sel || 'Highlighted Text'}</span>`);
      } else {
        executeFormatting(visualCommand, visualVal);
      }
    } else {
      handleInsertTag(startTag, endTag);
    }
  };

  const handleVisualEditorInput = (e: FormEvent<HTMLDivElement>) => {
    isEditingRef.current = true;
    const html = e.currentTarget.innerHTML;
    setReportForm(prev => ({ ...prev, excerpt: html }));
  };

  const handleVisualEditorBlur = () => {
    isEditingRef.current = false;
  };

  const handleTriggerPipeline = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/aggregate', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setPipelineFinishedInfo({
          original: result.originalCount,
          deduplicated: result.deduplicatedCount
        });
        showFeedback('success', `Pipeline completed! Deduplicated index sizes: ${result.deduplicatedCount} entries.`);
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Execution error on backend system script.');
    } finally {
      setActionLoading(false);
    }
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  const getDynamicBarChartData = () => {
    return rolesState.map(r => {
      const activeCount = jobs.filter(j => j.role.toLowerCase() === r.title.toLowerCase() && j.active).length;
      return {
        role: r.title,
        listings: activeCount || Math.floor(Math.random() * 5) + 1
      };
    });
  };

  const getDynamicPieChartData = () => {
    const countMap: Record<string, number> = {};
    jobs.filter(j => j.active).forEach(j => {
      countMap[j.role] = (countMap[j.role] || 0) + 1;
    });

    const parsedArray = Object.keys(countMap).map(k => ({
      name: k,
      value: countMap[k]
    }));

    if (parsedArray.length === 0) {
      return rolesState.map(r => ({ name: r.title, value: Math.floor(Math.random() * 12) + 4 }));
    }
    return parsedArray;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <form onSubmit={handleLogin} className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5">
            <div className="text-center space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Shield size={24} className="text-blue-500" />
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Admin Login</h2>
              </div>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                JobsReport.online Telemetry Console
              </p>
            </div>
            
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
              >
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-xs">{loginError}</span>
              </motion.div>
            )}
            
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@jobsreport.online"
                className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/10 active:scale-95 cursor-pointer"
            >
              Authenticate to Console
            </button>
            
            <p className="text-[9px] text-gray-600 text-center font-mono uppercase tracking-wider">
              Secure Telemetry Access • Session Persists 30 Days
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 mt-4 text-white">
