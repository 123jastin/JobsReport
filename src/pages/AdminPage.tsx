import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, TrendingUp, BookOpen, Plus, Trash2, RefreshCw, Check, AlertCircle, ExternalLink,
  ChevronRight, Shield, Clock, Briefcase, Lock, LogOut, Building2, FileText, Image as ImageIcon,
  Key, Flame, Globe, Compass, Settings, ChevronDown, Layers, Sparkles, DollarSign, MapPin,
  Eye, CheckCircle, HelpCircle, Upload, Bold, Italic, Underline, List, Code, Link as LinkIcon, File,
  ChevronLeft
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

// ========== PAGINATION CONSTANTS ==========
const JOBS_PER_PAGE = 20;
const COMPANIES_PER_PAGE = 20;

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

  // ✅ Pagination state
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsTotalPages, setJobsTotalPages] = useState(0);
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatus, setJobsStatus] = useState<'all' | 'active' | 'draft'>('all');

  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [companiesTotalPages, setCompaniesTotalPages] = useState(0);
  const [companiesSearch, setCompaniesSearch] = useState('');

  // ✅ All companies list for dropdowns (separate from paginated list)
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
  
  const [jobFiles, setJobFiles] = useState<{
    url: string; thumbnail: string; name: string; type: string; file?: File;
    seoTitle?: string; seoDescription?: string; seoSlug?: string;
  }[]>([]);
  
  const [jobDescription, setJobDescription] = useState('');
  const jobDescEditorRef = useRef<HTMLDivElement>(null);
  
  const [showAIPaste, setShowAIPaste] = useState(false);
  const [rawJobText, setRawJobText] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const [showAICompanyPaste, setShowAICompanyPaste] = useState(false);
  const [rawCompanyText, setRawCompanyText] = useState('');
  const [aiCompanyProcessing, setAiCompanyProcessing] = useState(false);
  
  const [isCreatingNewCompanyInline, setIsCreatingNewCompanyInline] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  const [descEditMode, setDescEditMode] = useState<'visual' | 'code'>('visual');
  
  const [isDraft, setIsDraft] = useState(false);
  const [applicationType, setApplicationType] = useState<'url' | 'email' | 'whatsapp' | 'instructions'>('url');
  
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

  // --- COMPANY FORM STATES ---
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
  
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code' | 'preview'>('visual');

  const isEditingRef = useRef(false);
  const visualEditorRef = useRef<HTMLDivElement>(null);

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

  const [pipelineFinishedInfo, setPipelineFinishedInfo] = useState<{ original: number; deduplicated: number } | null>(null);

  // ✅ AUTO-FILL LOCATION FROM COMPANY
  const handleAutoFillLocationFromCompany = (companyName: string) => {
    const company = allCompanies.find(c => c.name === companyName);
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

  // ✅ Fetch stats, roles, reports (once)
  const fetchStatsAndMeta = async () => {
    try {
      const [statsRes, rolesRes, reportsRes, allCompaniesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/roles'),
        fetch('/api/reports'),
        fetch('/api/companies?all=true')  // Get all for dropdowns
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

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        if (rolesData && rolesData.length > 0) {
          setRolesState(rolesData);
        }
      }
      
      if (reportsRes.ok) setReportsState(await reportsRes.json());
      
      if (allCompaniesRes.ok) {
        const companiesData = await allCompaniesRes.json();
        // Handle both formats: array or {companies: [...]}
        const companiesList = Array.isArray(companiesData) 
          ? companiesData 
          : (companiesData.companies || []);
        setAllCompanies(companiesList);
      }
    } catch (err) {
      console.error("Failed to sync system metadata", err);
    }
  };

  // ✅ Fetch paginated jobs
  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams({
        page: jobsPage.toString(),
        limit: JOBS_PER_PAGE.toString()
      });
      if (jobsSearch.trim()) params.append('search', jobsSearch.trim());
      if (jobsStatus !== 'all') params.append('status', jobsStatus);

      const res = await fetch(`/api/admin/jobs-list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setJobsTotal(data.stats?.total || 0);
        setJobsTotalPages(data.stats?.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  // ✅ Fetch paginated companies
  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams({
        page: companiesPage.toString(),
        limit: COMPANIES_PER_PAGE.toString()
      });
      if (companiesSearch.trim()) params.append('search', companiesSearch.trim());

      const res = await fetch(`/api/companies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.companies) {
          setCompaniesState(data.companies || []);
          setCompaniesTotal(data.stats?.total || 0);
          setCompaniesTotalPages(data.stats?.totalPages || 0);
        } else if (Array.isArray(data)) {
          // Backward compatibility
          setCompaniesState(data);
          setCompaniesTotal(data.length);
          setCompaniesTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  // ✅ Main initial fetch
  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchStatsAndMeta().finally(() => setLoading(false));
    }
  }, [isAdmin]);

  // ✅ Jobs refetch when page/search/status changes
  useEffect(() => {
    if (isAdmin && activeTab === 'jobs') {
      fetchJobs();
    }
  }, [isAdmin, activeTab, jobsPage, jobsStatus]);

  // ✅ Companies refetch when page/search changes
  useEffect(() => {
    if (isAdmin && activeTab === 'companies') {
      fetchCompanies();
    }
  }, [isAdmin, activeTab, companiesPage]);

  // ✅ Debounced search for jobs
  useEffect(() => {
    if (!isAdmin || activeTab !== 'jobs') return;
    const timer = setTimeout(() => {
      setJobsPage(1);
      fetchJobs();
    }, 400);
    return () => clearTimeout(timer);
  }, [jobsSearch]);

  // ✅ Debounced search for companies
  useEffect(() => {
    if (!isAdmin || activeTab !== 'companies') return;
    const timer = setTimeout(() => {
      setCompaniesPage(1);
      fetchCompanies();
    }, 400);
    return () => clearTimeout(timer);
  }, [companiesSearch]);

  // Legacy fetchSystemData for backward compat with action handlers
  const fetchSystemData = async () => {
    await Promise.all([fetchStatsAndMeta(), fetchJobs(), fetchCompanies()]);
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setOperationMessage({ type, text });
    setTimeout(() => setOperationMessage(null), 5000);
  };

  // ✅ AI Job Parser
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
        setJobForm(prev => ({
          ...prev,
          title: result.data.title || prev.title,
          roleSelected: result.data.role || prev.roleSelected,
          location: result.data.location || prev.location,
          salary: result.data.salary || prev.salary,
          companySelected: result.data.company || prev.companySelected,
        }));

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
          }
        } catch (schemaErr) {
          console.log('Schema extraction skipped:', schemaErr);
        }

        showFeedback('success', 'Job parsed! Description and schema loaded.');
        setShowAIPaste(false);
        setRawJobText('');
      } else {
        showFeedback('error', result.error || 'AI processing failed');
      }
    } catch (err) {
      showFeedback('error', 'AI service unavailable. Please fill manually.');
    } finally {
      setAiProcessing(false);
    }
  };

  // ✅ AI Company Parser
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

        showFeedback('success', 'Company parsed! Form auto-filled.');
        setShowAICompanyPaste(false);
        setRawCompanyText('');
      } else {
        showFeedback('error', result.error || 'AI processing failed');
      }
    } catch (err) {
      showFeedback('error', 'AI service unavailable. Please fill manually.');
    } finally {
      setAiCompanyProcessing(false);
    }
  };

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
          resolve(canvas.toDataURL('image/webp', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const generateDocumentThumbnail = (fileName: string, fileType: string): string => {
    const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    const isDoc = fileName.match(/\.(doc|docx)$/i);
    const isSheet = fileName.match(/\.(xls|xlsx)$/i);
    const isPPT = fileName.match(/\.(ppt|pptx)$/i);
    let fileIcon = 'PDF';
    let bgColor = '#ef4444';
    if (isDoc) { fileIcon = 'DOC'; bgColor = '#3b82f6'; }
    else if (isSheet) { fileIcon = 'XLS'; bgColor = '#10b981'; }
    else if (isPPT) { fileIcon = 'PPT'; bgColor = '#f59e0b'; }
    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect fill="${bgColor}" width="200" height="200" rx="12"/>
        <text fill="white" font-size="48" font-weight="bold" text-anchor="middle" x="100" y="90">${fileIcon}</text>
      </svg>
    `);
  };

  const handleJobFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setActionLoading(true);
    const newFiles: any[] = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isDoc = file.type.includes('document') || file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
      
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
            showFeedback('success', `${files.length} file(s) ready`);
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
            showFeedback('success', `${files.length} file(s) ready`);
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
          resolve(canvas.toDataURL('image/webp', 0.8));
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

    if (job.company) {
      const company = allCompanies.find(c => c.name === job.company);
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
    if (jobDescEditorRef.current) jobDescEditorRef.current.innerHTML = '';
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
      showFeedback('error', 'Please fill in the Job Title, Location, and Company selections.');
      return;
    }

    setActionLoading(true);
    try {
      if (!editingJobId && !isDraft && duplicateWarning) {
        showFeedback('error', 'Duplicate insertion blocked.');
        setActionLoading(false);
        return;
      }

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
          salary: jobForm.salary,
          expiresAt: jobForm.expiresAt,
          description: jobDescription,
          is_active: isDraft ? 0 : 1,
          logoUrl: companyLogoUrl || undefined,
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
          street_address: schemaData.street_address || '',
          city: schemaData.city || '',
          region: schemaData.region || '',
          country: schemaData.country || 'Tanzania',
          postcode: schemaData.postcode || '',
          canonical_url: schemaData.canonical_url || '',
          whatsapp_number: whatsapp_number,
          application_instructions: application_instructions,
          images: uploadedFiles
        })
      });

      if (res.ok) {
        const addedJob = await res.json();
        
        // 🔥 NOTIFY GOOGLE - Only for new published jobs
        if (!editingJobId && !isDraft) {
          const jobUrl = `https://jobsreport.online/market/${addedJob.slug || addedJob.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${addedJob.id}`;
          fetch('/api/test-indexing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: jobUrl })
          }).catch(err => console.log('Google notification failed:', err));
        }
        
        if (editingJobId) {
          showFeedback('success', `Updated "${jobForm.title}" successfully.`);
        } else {
          showFeedback('success', isDraft ? `Draft saved!` : `Published successfully.`);
        }

        // Reset form
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

        // Refresh data
        await fetchStatsAndMeta();
        await fetchJobs();
      } else {
        const errObj = await res.json();
        showFeedback('error', errObj.message || errObj.error || 'Validation error');
      }
    } catch (err) {
      showFeedback('error', 'Failed to save job.');
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
        fetchStatsAndMeta();
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
        showFeedback('success', 'Job record purged.');
        await fetchStatsAndMeta();
        await fetchJobs();
      } else {
        showFeedback('error', 'Delete failed');
      }
    } catch (err) {
      showFeedback('error', 'Failed delete operation.');
    }
  };

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

  const handleCancelEditCompany = () => {
    setEditingCompanyId(null);
    setCompanyForm({ 
      name: '', url: '', logoUrl: '', description: '',
      streetAddress: '', area: '', locality: '', district: '',
      postalCode: '', postalArea: '', country: 'TZ', industry: '',
      foundedYear: '', employeeCount: ''
    });
  };

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
        showFeedback('success', data.message || 'Company removed.');
        await fetchStatsAndMeta();
        await fetchCompanies();
      } else {
        showFeedback('error', data.error || data.details || 'Could not delete company.');
      }
    } catch (err) {
      showFeedback('error', 'Network error.');
    }
  };

  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;

    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Corporate index editing is blocked.');
      return;
    }

    if (!editingCompanyId) {
      const duplicateExists = allCompanies.some(
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
        showFeedback('success', editingCompanyId ? `Updated ${companyForm.name}.` : `Created ${companyForm.name}.`);
        setCompanyForm({ 
          name: '', url: '', logoUrl: '', description: '',
          streetAddress: '', area: '', locality: '', district: '',
          postalCode: '', postalArea: '', country: 'TZ', industry: '',
          foundedYear: '', employeeCount: ''
        });
        setEditingCompanyId(null);
        await fetchStatsAndMeta();
        await fetchCompanies();
      } else {
        showFeedback('error', data.error || data.details || 'Failed to save company');
      }
    } catch (err) {
      showFeedback('error', 'Error establishing corporate reference.');
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
      showFeedback('error', 'PERMISSION DENIED.');
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
        showFeedback('success', `Normalization mapping saved: [${roleForm.title}]`);
        setRoleForm({ title: '', keywordInput: '', growth: 15, keywords: [] });
        fetchStatsAndMeta();
      }
    } catch (err) {
      showFeedback('error', 'Failed saving mapped configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED.');
      return;
    }

    if (!confirm("Delete this role?")) return;

    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setRolesState(prev => prev.filter(r => r.id !== id));
        showFeedback('success', 'Role deleted.');
        fetchStatsAndMeta();
      } else if (res.status === 409) {
        showFeedback('error', data.error || 'Jobs are using this role.');
      } else {
        showFeedback('error', data.error || 'Could not delete role.');
      }
    } catch (err) {
      showFeedback('error', 'Network error.');
    }
  };

  const handlePostReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.roleSelected) {
      showFeedback('error', 'Report title and role are required.');
      return;
    }

    setActionLoading(true);
    try {
      let finalContent = '';
      
      if (editorMode === 'visual' && visualEditorRef.current) {
        finalContent = visualEditorRef.current.innerHTML;
      } else if (editorMode === 'code') {
        finalContent = reportForm.excerpt;
      } else {
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
            compiledHtml += `<div class="my-6 rounded-3xl overflow-hidden border border-white/10 relative"><img src="${line.mediaUrl}" alt="${line.text}" referrerPolicy="no-referrer" class="w-full object-cover max-h-72" /></div>`;
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
        showFeedback('success', editingReportId ? `Report updated!` : `Report published!`);
        
        setReportForm({
          title: '',
          roleSelected: 'Software Developer',
          monthYear: 'June 2026',
          excerpt: '',
          content: ''
        });
        setRichLines([
          { type: 'h2', text: 'Market Demand Indicators' },
          { type: 'p', text: 'Telemetry analysis validates rising hiring volume.' }
        ]);
        setEditingReportId(null);
        
        if (visualEditorRef.current) visualEditorRef.current.innerHTML = '';
        
        await fetchStatsAndMeta();
        setActiveTab('dashboard');
      } else {
        const errData = await res.json();
        showFeedback('error', errData.error || 'Error saving report.');
      }
    } catch (err) {
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
          showFeedback('success', `Saved asset "${mediaForm.name}".`);
          setMediaForm({ name: '', altText: '' });
          setSelectedFileBase64(null);
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
          showFeedback('success', `Uploaded "${added.name}"`);
          setMediaForm({ name: '', altText: '' });
          setSelectedFileBase64(null);
        } else {
          const errData = await res.json();
          showFeedback('error', errData.error || 'Upload failed');
        }
      }
    } catch (err) {
      showFeedback('error', 'Error uploading.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Purge this image?")) return;

    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMediaAssets(prev => prev.filter(m => m.id !== id));
        showFeedback('success', 'Media asset removed.');
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
    showFeedback('success', `Loaded "${rep.title}"`);
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
    if (!window.confirm("Delete this report permanently?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback('success', 'Report deleted.');
        fetchStatsAndMeta();
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
      tpl = `<h2>Market Demand Vectors</h2>\n<p>Our analytics indicate rising demand in specialized technical operations.</p>`;
    } else if (type === 'segmented') {
      tpl = `<h2>Functional Breakdown</h2>\n<p>Hiring indexes remain concentrated in leading regional hubs.</p>`;
    } else {
      tpl = `<p>The current landscape indicates significant growth spikes in active listings.</p>`;
    }
    const newExcerpt = reportForm.excerpt + (reportForm.excerpt ? '\n\n' : '') + tpl;
    setReportForm(prev => ({ ...prev, excerpt: newExcerpt }));
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = newExcerpt;
    }
    showFeedback('success', 'Template inserted.');
  };

  const executeFormatting = (command: string, value: string = '') => {
    if (visualEditorRef.current) visualEditorRef.current.focus();
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
        showFeedback('success', `Pipeline completed!`);
        fetchStatsAndMeta();
        fetchJobs();
      }
    } catch (err) {
      showFeedback('error', 'Execution error.');
    } finally {
      setActionLoading(false);
    }
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  const getDynamicBarChartData = () => {
    return rolesState.map(r => {
      const activeCount = jobs.filter(j => j.role.toLowerCase() === r.title.toLowerCase() && j.active).length;
      return { role: r.title, listings: activeCount || Math.floor(Math.random() * 5) + 1 };
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

  // ========== PAGINATION CONTROLS COMPONENT ==========
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    accentColor = 'blue'
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (p: number) => void;
    accentColor?: 'blue' | 'violet' | 'emerald';
  }) => {
    if (totalPages <= 1) return null;

    const activeColor = accentColor === 'violet' ? 'bg-violet-600' : 
                       accentColor === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600';

    return (
      <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .map((p, idx, arr) => (
              <div key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-gray-600 px-1 text-xs">...</span>
                )}
                <button
                  onClick={() => onPageChange(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    currentPage === p 
                      ? `${activeColor} text-white shadow-sm` 
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              </div>
            ))}
        </div>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1"
        >
          Next <ChevronRight size={12} />
        </button>
      </div>
    );
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
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 mt-4 text-white">
      
      {/* Permissions Banner */}
      <div className="p-4 bg-orange-950/20 border border-orange-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 h-10 w-10 flex items-center justify-center bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/25">
            <Key size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-orange-500 font-mono tracking-widest uppercase">DEMO PERMISSIONS CONTROLLER</span>
            <h4 className="text-sm font-black tracking-tight leading-tight uppercase text-stone-200">Test Multi-Role Capabilities</h4>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 font-mono shrink-0">
          <button 
            type="button" 
            onClick={() => { setUserRole('admin'); showFeedback('success', 'Switched to Admin'); }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors ${userRole === 'admin' ? 'bg-blue-600 text-stone-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SYSTEM ADMIN
          </button>
          <button 
            type="button" 
            onClick={() => { setUserRole('editor'); showFeedback('success', 'Switched to Editor'); }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors ${userRole === 'editor' ? 'bg-violet-600 text-stone-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            STAFF EDITOR
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {operationMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border flex items-center gap-3 text-xs uppercase tracking-wider font-semibold ${
              operationMessage.type === 'success' 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                : 'bg-red-950/40 text-red-400 border-red-500/30'
            }`}
          >
            {operationMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{operationMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-1 font-mono">
            <Shield size={14} /> telemetry operations console
          </div>
          
          <div className="flex items-center gap-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase font-sans">
              JOBSREPORT<span className="text-blue-500">.ONLINE</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono tracking-widest uppercase">
              {userRole === 'admin' ? 'ADMIN ACCESS' : 'EDITOR MODE'}
            </span>
            
            <button
              onClick={() => { triggerLogout(); showFeedback('success', 'Logged out'); }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ml-4"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0 w-full md:w-auto">
          <button
            onClick={handleTriggerPipeline}
            disabled={actionLoading}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={actionLoading ? "animate-spin" : ""} />
            <span>TRIGGER DEDUPLICATION PIPE</span>
          </button>
        </div>
      </div>

      {pipelineFinishedInfo && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-violet-950/20 border border-blue-500/25 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider font-mono">
            <CheckCircle size={16} /> Pipeline Executed
          </div>
          <div className="text-xs font-mono text-gray-400">
            Original: <span className="font-bold text-white">{pipelineFinishedInfo.original}</span>
          </div>
          <div className="text-xs font-mono text-gray-400 text-right">
            After dedup: <span className="font-bold text-green-400">{pipelineFinishedInfo.deduplicated}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 border-b border-white/5 pb-2">
        {(['dashboard', 'jobs', 'companies', 'roles', 'reports', 'media'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setOperationMessage(null); }}
            className={`py-3 px-3.5 rounded-2xl font-bold font-mono text-[10px] uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-white/5 text-blue-400 border border-blue-500/30' 
                : 'text-gray-500 hover:text-white bg-white/[0.01] border border-transparent'
            }`}
          >
            {tab === 'dashboard' && '📊 KPI'}
            {tab === 'jobs' && '📥 Jobs'}
            {tab === 'companies' && '🏢 Companies'}
            {tab === 'roles' && '⚙️ Roles'}
            {tab === 'reports' && '📰 Reports'}
            {tab === 'media' && '🖼️ Media'}
          </button>
        ))}
      </div>

      {/* ========== TAB: DASHBOARD ========== */}
      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Today's Ingestion</p>
              <p className="text-4xl font-extrabold text-blue-400 tracking-tight mt-2 font-mono">{stats.addedToday}</p>
            </div>
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Active Listings</p>
              <p className="text-4xl font-extrabold text-violet-400 tracking-tight mt-2 font-mono">{stats.activeJobs}</p>
            </div>
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Companies</p>
              <p className="text-4xl font-extrabold text-emerald-400 tracking-tight mt-2 font-mono">{stats.totalCompanies}</p>
            </div>
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Roles</p>
              <p className="text-4xl font-extrabold text-amber-500 tracking-tight mt-2 font-mono">{rolesState.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========== TAB: JOBS (with pagination) ========== */}
      {activeTab === 'jobs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* Job Form */}
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5">
            <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
              <Briefcase size={16} className="text-blue-500" /> {editingJobId ? 'Edit Placement' : 'Ingest Real-Time Placement'}
            </h3>

            {/* AI Parser */}
            <div className="pb-4 border-b border-white/5">
              <button
                type="button"
                onClick={() => setShowAIPaste(!showAIPaste)}
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles size={14} />
                {showAIPaste ? '✕ Close AI Parser' : '⚡ AI Auto-Fill from Job Description'}
              </button>

              {showAIPaste && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3 p-4 bg-violet-950/10 border border-violet-500/10 rounded-2xl">
                  <textarea
                    value={rawJobText}
                    onChange={(e) => setRawJobText(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50 font-mono"
                    disabled={aiProcessing}
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setRawJobText(''); setShowAIPaste(false); }} className="px-3 py-2 bg-white/5 text-gray-400 text-[10px] font-bold uppercase rounded-xl">Clear</button>
                    <button type="button" onClick={handleAIProcessJob} disabled={aiProcessing || rawJobText.trim().length < 20} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 text-white font-bold text-[10px] uppercase rounded-xl flex items-center gap-2">
                      {aiProcessing ? <><RefreshCw size={12} className="animate-spin" /> Processing...</> : <><Sparkles size={12} /> Parse with AI</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <form onSubmit={handleIngestJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Job Title</label>
                  <input type="text" value={jobForm.title} onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Senior Frontend React Engineer" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Location</label>
                  <input type="text" value={jobForm.location} onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))} placeholder="Remote / Dar es Salaam" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none" required />
                </div>
              </div>

              {duplicateWarning && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[10px] font-mono text-red-400">
                  <AlertCircle size={12} className="inline mr-1" /> {duplicateWarning}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Company Source</label>
                <button type="button" onClick={() => setIsCreatingNewCompanyInline(!isCreatingNewCompanyInline)} className="text-[9px] font-mono font-bold text-blue-500 uppercase hover:text-blue-400">
                  {isCreatingNewCompanyInline ? "Select Existing" : "+ New Company inline"}
                </button>
              </div>

              {isCreatingNewCompanyInline ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <input type="text" value={jobForm.companyNewName} onChange={(e) => setJobForm(prev => ({ ...prev, companyNewName: e.target.value }))} placeholder="New Company Name" className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  <input type="url" value={jobForm.companyNewUrl} onChange={(e) => setJobForm(prev => ({ ...prev, companyNewUrl: e.target.value }))} placeholder="https://company.com" className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                </div>
              ) : (
                <select
                  value={jobForm.companySelected}
                  onChange={(e) => { setJobForm(prev => ({ ...prev, companySelected: e.target.value })); handleAutoFillLocationFromCompany(e.target.value); }}
                  className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white"
                  required
                >
                  <option value="">-- Choose Company --</option>
                  {allCompanies.map(co => <option key={co.id} value={co.name}>{co.name}</option>)}
                </select>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={jobForm.roleSelected} onChange={(e) => setJobForm(prev => ({ ...prev, roleSelected: e.target.value }))} className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white">
                  {rolesState.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                </select>
                <input type="text" value={jobForm.salary} onChange={(e) => setJobForm(prev => ({ ...prev, salary: e.target.value }))} placeholder="Salary (Optional)" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white" />
              </div>

              {/* Application Type */}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Application Method</label>
                <div className="flex flex-wrap bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                  {(['url', 'email', 'whatsapp', 'instructions'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setApplicationType(type)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        applicationType === type ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {type === 'url' && '🔗 URL'}
                      {type === 'email' && '✉️ Email'}
                      {type === 'whatsapp' && '💬 WhatsApp'}
                      {type === 'instructions' && '📋 Instructions'}
                    </button>
                  ))}
                </div>

                {applicationType === 'instructions' ? (
                  <textarea
                    value={jobForm.url}
                    onChange={(e) => setJobForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="Application instructions..."
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white h-20 resize-none"
                  />
                ) : (
                  <input
                    type={applicationType === 'email' ? 'email' : 'text'}
                    value={jobForm.url}
                    onChange={(e) => setJobForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder={
                      applicationType === 'url' ? 'https://company.com/apply' :
                      applicationType === 'email' ? 'careers@company.com' :
                      '+255 612 345 678'
                    }
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white"
                  />
                )}
              </div>

              <input type="date" value={jobForm.expiresAt} onChange={(e) => setJobForm(prev => ({ ...prev, expiresAt: e.target.value }))} className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" required />

              {/* Description */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Job Description</label>
                <div className="p-1.5 bg-black/50 border border-white/10 rounded-xl flex flex-wrap gap-0.5">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Bold size={12}/></button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Italic size={12}/></button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><List size={12}/></button>
                </div>
                <div 
                  ref={jobDescEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-stone-200 focus:outline-none focus:border-blue-500/50"
                  onInput={() => { if (jobDescEditorRef.current) setJobDescription(jobDescEditorRef.current.innerHTML); }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {editingJobId && (
                  <button type="button" onClick={handleCancelEditJob} className="flex-1 py-3 bg-white/5 border border-white/10 text-stone-300 font-extrabold text-[11px] uppercase rounded-2xl">Cancel</button>
                )}
                <button
                  type="button"
                  onClick={async (e) => { setIsDraft(true); await handleIngestJob(e as any); setIsDraft(false); }}
                  disabled={actionLoading || !jobForm.title}
                  className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] uppercase rounded-2xl"
                >
                  Save Draft
                </button>
                <button type="submit" disabled={actionLoading || !!duplicateWarning} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-extrabold text-[10px] uppercase rounded-2xl">
                  {editingJobId ? 'Update' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>

          {/* Job List with Pagination */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <Database size={13} className="text-blue-500" /> Placements ({jobsTotal} total)
              </span>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={jobsSearch}
                  onChange={(e) => setJobsSearch(e.target.value)}
                  className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-white w-48 focus:outline-none focus:border-blue-500/50"
                />
                <select
                  value={jobsStatus}
                  onChange={(e) => { setJobsStatus(e.target.value as any); setJobsPage(1); }}
                  className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-white"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="draft">Drafts</option>
                </select>
                <button onClick={() => { fetchJobs(); fetchStatsAndMeta(); }} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-bold uppercase flex items-center gap-1.5">
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02]">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-stone-100 truncate">{job.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-gray-400 font-mono">{job.role}</span>
                      {job.salary && <span className="text-[9px] text-emerald-400 font-mono">{job.salary}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Building2 size={11} />{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                      {job.active === false && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-amber-500/10 text-amber-400 uppercase">📝 Draft</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEditJob(job)} className="p-2 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 rounded-xl">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => handleToggleJobActive(job.id, job.active)} className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest uppercase font-bold border ${job.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-stone-800 text-gray-500 border-transparent'}`}>
                      {job.active ? "● ACTIVE" : "○ OFFLINE"}
                    </button>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && <p className="text-xs text-gray-500 font-mono text-center py-12">NO JOBS FOUND</p>}
            </div>

            <PaginationControls 
              currentPage={jobsPage} 
              totalPages={jobsTotalPages} 
              onPageChange={setJobsPage}
              accentColor="blue"
            />
          </div>
        </motion.div>
      )}

      {/* ========== TAB: COMPANIES (with pagination) ========== */}
      {activeTab === 'companies' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
                <Building2 size={16} className="text-blue-500" /> {editingCompanyId ? 'Edit Company' : 'Add Company'}
              </h3>

              <form onSubmit={handleCreateCompany} className="space-y-4">
                {/* AI Company Parser */}
                <div className="pb-4 border-b border-white/5">
                  <button type="button" onClick={() => setShowAICompanyPaste(!showAICompanyPaste)} className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Sparkles size={14} /> {showAICompanyPaste ? '✕ Close AI Parser' : '⚡ AI Auto-Fill Company'}
                  </button>
                  {showAICompanyPaste && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3 p-4 bg-violet-950/10 border border-violet-500/10 rounded-2xl">
                      <textarea value={rawCompanyText} onChange={(e) => setRawCompanyText(e.target.value)} placeholder="Paste company info..." className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white resize-none font-mono" disabled={aiCompanyProcessing} />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setRawCompanyText(''); setShowAICompanyPaste(false); }} className="px-3 py-2 bg-white/5 text-gray-400 text-[10px] font-bold uppercase rounded-xl">Clear</button>
                        <button type="button" onClick={handleAIProcessCompany} disabled={aiCompanyProcessing || rawCompanyText.trim().length < 20} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 text-white font-bold text-[10px] uppercase rounded-xl">
                          {aiCompanyProcessing ? 'Processing...' : 'Parse Company'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Company Name *</label>
                  <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Selcom Tanzania" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={companyForm.industry} onChange={(e) => setCompanyForm(prev => ({ ...prev, industry: e.target.value }))} placeholder="Industry" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" />
                  <input type="url" value={companyForm.url} onChange={(e) => setCompanyForm(prev => ({ ...prev, url: e.target.value }))} placeholder="Website URL" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" />
                </div>

                <input type="text" value={companyForm.streetAddress} onChange={(e) => setCompanyForm(prev => ({ ...prev, streetAddress: e.target.value }))} placeholder="Street Address" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" />

                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={companyForm.area} onChange={(e) => setCompanyForm(prev => ({ ...prev, area: e.target.value }))} placeholder="Area" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white" />
                  <input type="text" value={companyForm.locality} onChange={(e) => setCompanyForm(prev => ({ ...prev, locality: e.target.value }))} placeholder="City" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white" />
                  <input type="text" value={companyForm.district} onChange={(e) => setCompanyForm(prev => ({ ...prev, district: e.target.value }))} placeholder="District" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={companyForm.postalCode} onChange={(e) => setCompanyForm(prev => ({ ...prev, postalCode: e.target.value }))} placeholder="Postal Code" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white" />
                  <input type="text" value={companyForm.foundedYear} onChange={(e) => setCompanyForm(prev => ({ ...prev, foundedYear: e.target.value }))} placeholder="Founded" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white" />
                  <input type="text" value={companyForm.employeeCount} onChange={(e) => setCompanyForm(prev => ({ ...prev, employeeCount: e.target.value }))} placeholder="Employees" className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white" />
                </div>

                <textarea value={companyForm.description} onChange={(e) => setCompanyForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Company description..." className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white h-24 resize-none" />

                <div className="flex gap-2 pt-2">
                  {editingCompanyId && (
                    <button type="button" onClick={handleCancelEditCompany} className="flex-1 py-3 bg-white/5 border border-white/10 text-stone-300 font-extrabold text-[11px] uppercase rounded-2xl">Cancel</button>
                  )}
                  <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-extrabold text-[11px] uppercase rounded-2xl">
                    {actionLoading ? 'Processing...' : editingCompanyId ? 'Update' : 'Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <Layers size={13} className="text-blue-500" /> Companies ({companiesTotal} total)
              </span>
              <input
                type="text"
                placeholder="Search companies..."
                value={companiesSearch}
                onChange={(e) => setCompaniesSearch(e.target.value)}
                className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-white w-48"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companiesState.map((co) => (
                <div key={co.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-3xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {co.logoUrl ? (
                      <img src={co.logoUrl} alt={co.name} className="w-10 h-10 object-cover rounded-xl border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center font-bold text-white">{co.name.slice(0, 2).toUpperCase()}</div>
                    )}
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-stone-100 block">{co.name}</span>
                      {co.url && <span className="text-[10px] text-blue-400 flex items-center gap-1"><Globe size={10} />{co.url.replace(/^https?:\/\//, '').slice(0, 30)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditCompany(co)} className="p-2 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 rounded-xl">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteCompany(co.id)} className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls 
              currentPage={companiesPage} 
              totalPages={companiesTotalPages} 
              onPageChange={setCompaniesPage}
              accentColor="violet"
            />
          </div>
        </motion.div>
      )}

      {/* ========== TAB: ROLES ========== */}
      {activeTab === 'roles' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
                <Layers size={16} className="text-blue-500" /> Create Role Rule
              </h3>

              <div className="space-y-4">
                <input type="text" value={roleForm.title} onChange={(e) => setRoleForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Software Developer" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" />
                <input type="number" value={roleForm.growth} onChange={(e) => setRoleForm(prev => ({ ...prev, growth: Number(e.target.value) }))} placeholder="Growth %" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" />
                
                <div className="flex gap-2">
                  <input type="text" value={roleForm.keywordInput} onChange={(e) => setRoleForm(prev => ({ ...prev, keywordInput: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleAddKeywordToRole()} placeholder="Keyword (Enter to add)" className="flex-1 bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-xs text-white" />
                  <button type="button" onClick={handleAddKeywordToRole} className="px-4 py-2 bg-white/5 hover:bg-white/10 font-bold text-[10px] uppercase rounded-xl border border-white/10">Add</button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {roleForm.keywords.map((chip, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-mono uppercase rounded-lg flex items-center gap-1">
                      {chip}
                      <button type="button" onClick={() => handleRemoveKeywordFromFile(idx)} className="text-red-400 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>

                <button type="button" onClick={handleSaveRoleRule} disabled={actionLoading || !roleForm.title} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-extrabold text-[11px] uppercase rounded-2xl">
                  SAVE ROLE
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Layers size={13} className="text-blue-500" /> Roles ({rolesState.length})
            </span>

            <div className="space-y-3">
              {rolesState.map((role) => (
                <div key={role.id} className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-stone-100 uppercase block">{role.title}</span>
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {role.mappedTitles.map((kw, i) => (
                        <span key={i} className="text-[8px] bg-white/5 text-gray-400 font-mono px-2 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-bold text-emerald-400 font-mono">+{role.growth}%</span>
                    <button onClick={() => handleDeleteRole(role.id)} className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========== TAB: REPORTS ========== */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-extrabold uppercase text-stone-100">Report Editor</h3>
              <div className="flex bg-black/60 p-1 rounded-2xl text-[10px] font-bold">
                {(['visual','code','preview'] as const).map(m => (
                  <button key={m} onClick={() => setEditorMode(m)} className={`px-3 py-1.5 rounded-xl uppercase ${editorMode===m?'bg-blue-600 text-white':'text-gray-400'}`}>{m}</button>
                ))}
              </div>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/45">
              {editorMode==='visual' && (
                <div className="p-6">
                  <div ref={visualEditorRef} contentEditable onInput={handleVisualEditorInput} onBlur={handleVisualEditorBlur} className="w-full min-h-[400px] text-stone-200 text-sm outline-none" style={{ fontSize: '15px', lineHeight: '1.8' }} />
                </div>
              )}
              {editorMode==='code' && (
                <div className="p-6">
                  <textarea id="excerpt-editor-textarea" value={reportForm.excerpt} onChange={(e) => setReportForm(prev=>({...prev,excerpt:e.target.value}))} className="w-full min-h-[400px] bg-transparent text-blue-400 text-sm font-mono outline-none resize-none" style={{ fontSize: '14px', lineHeight: '1.8' }} />
                </div>
              )}
              {editorMode==='preview' && (
                <div className="p-6 min-h-[400px] overflow-y-auto">
                  {reportForm.excerpt ? <div dangerouslySetInnerHTML={{__html:reportForm.excerpt}} className="text-stone-300 text-sm leading-relaxed"/> : <p className="text-gray-500 text-center py-20">No content</p>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input type="text" value={reportForm.title} onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Report Title" className="bg-black/40 border border-white/15 px-4 py-2.5 rounded-2xl text-xs text-white w-64" required />
              <select value={reportForm.roleSelected} onChange={(e) => setReportForm(prev => ({ ...prev, roleSelected: e.target.value }))} className="bg-black/40 border border-white/15 px-3 py-2.5 rounded-2xl text-xs text-white">
                {rolesState.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
              </select>
              <input type="text" value={reportForm.monthYear} onChange={(e) => setReportForm(prev => ({ ...prev, monthYear: e.target.value }))} placeholder="June 2026" className="bg-black/40 border border-white/15 px-3 py-2.5 rounded-2xl text-xs text-white w-28" />
              {editingReportId && <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 bg-white/5 border border-white/10 text-stone-300 font-extrabold text-[10px] uppercase rounded-2xl">Cancel</button>}
              <button onClick={handlePostReport} disabled={actionLoading || !reportForm.title} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-extrabold text-[10px] uppercase rounded-2xl disabled:opacity-50">
                {actionLoading ? "Saving..." : editingReportId ? "UPDATE" : "PUBLISH"}
              </button>
            </div>
          </div>

          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
            <h3 className="text-sm font-extrabold uppercase mb-4">Published ({reportsState.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportsState.map(rep => (
                <div key={rep.id} className={`p-3 bg-black/30 border rounded-2xl flex items-center justify-between ${editingReportId===rep.id?'border-blue-500/50':'border-white/5'}`}>
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{rep.title}</p><span className="text-[9px] text-gray-500">{rep.monthYear} • {rep.role}</span></div>
                  <div className="flex gap-1">
                    <button onClick={()=>handleLoadReportToEdit(rep)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded text-[9px]">Edit</button>
                    <button onClick={()=>handleDeleteReport(rep.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded text-[9px]">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========== TAB: MEDIA ========== */}
      {activeTab === 'media' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
                <ImageIcon size={16} className="text-blue-500" /> Upload Media
              </h3>
              <form onSubmit={handleUploadMedia} className="space-y-4">
                <input type="text" value={mediaForm.name} onChange={(e) => setMediaForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Asset Name" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" required />
                <input type="text" value={mediaForm.altText} onChange={(e) => setMediaForm(prev => ({ ...prev, altText: e.target.value }))} placeholder="Alt Text" className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white" />
                
                <div className="border border-dashed border-white/10 p-8 rounded-2xl text-center relative cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'media')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-[11px] text-gray-400">{selectedFileBase64 ? `✓ Loaded (${selectedFileSize})` : 'Drop or click'}</span>
                </div>

                <button type="submit" disabled={actionLoading || !selectedFileBase64} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-extrabold text-[11px] uppercase rounded-2xl">
                  {actionLoading ? "Saving..." : "PUBLISH"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <Layers size={13} className="text-blue-500" /> Vault ({mediaAssets.length})
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-3xl relative">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 mb-2.5">
                    <img src={asset.dataUrl} alt={asset.altText} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black text-stone-100 truncate block">{asset.name}</span>
                  <button onClick={() => handleDeleteMedia(asset.id)} className="absolute bottom-2.5 right-2.5 p-1.5 bg-red-500/10 text-red-400 rounded-xl"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
