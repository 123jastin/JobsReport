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
  
  const [isCreatingNewCompanyInline, setIsCreatingNewCompanyInline] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  // ✅ Description Edit Mode
  const [descEditMode, setDescEditMode] = useState<'visual' | 'code'>('visual');
  
  // ✅ Draft and Application Type States
  const [isDraft, setIsDraft] = useState(false);
  const [applicationType, setApplicationType] = useState<'url' | 'email'>('url');

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
    city: '',
    region: '',
    country: 'Tanzania',
    postcode: '',
    slug: '',
    canonical_url: ''
  });

  // --- COMPANY FORM STATES ---
  const [companyForm, setCompanyForm] = useState({
    name: '',
    url: '',
    logoUrl: ''
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
      const [statsRes, marketRes, rolesRes, reportsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/market'),
        fetch('/api/admin/roles'),
        fetch('/api/reports'),
        fetch('/api/companies')
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

      if (marketRes.ok) {
        const marketData = await marketRes.json();
        
        if (marketData.jobs && Array.isArray(marketData.jobs)) {
          setJobs(marketData.jobs);
        }
        
        if (marketData.companies && marketData.companies.length > 0) {
          setCompaniesState(marketData.companies);
        }
        
        if (marketData.roles && marketData.roles.length > 0) {
          const roleDefinitions = marketData.roles.map((name: string, idx: number) => ({
            id: `role-${idx}`,
            title: name,
            mappedTitles: [name.toLowerCase()],
            growth: Math.floor(Math.random() * 30) + 10
          }));
          setRolesState(roleDefinitions);
        }
      }

      if (companiesRes.ok && companiesState.length === 0) {
        const companiesData = await companiesRes.json();
        if (companiesData && companiesData.length > 0) {
          setCompaniesState(companiesData);
        }
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
            setSchemaData(prev => ({ ...prev, ...schemaResult.schema }));
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
      // ✅ Location fields for Google Schema
      street_address: j.street_address || '',
      city: j.city || '',
      region: j.region || '',
      country: j.country || 'Tanzania',
      postcode: j.postcode || '',
      slug: j.slug || '',
      canonical_url: j.canonical_url || ''
    });
    
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

      // Build application URL
      let applyUrl = jobForm.url;
      if (applicationType === 'email' && applyUrl && !applyUrl.startsWith('mailto:')) {
        applyUrl = `mailto:${applyUrl}`;
        if (jobForm.companyNewUrl) applyUrl += `?subject=${encodeURIComponent(jobForm.companyNewUrl)}`;
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
          // ✅ Location fields for Google Schema
          street_address: schemaData.street_address || '',
          city: schemaData.city || '',
          region: schemaData.region || '',
          country: schemaData.country || 'Tanzania',
          postcode: schemaData.postcode || '',
          canonical_url: schemaData.canonical_url || '',
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
            slug: '', canonical_url: ''
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
      
      // ✅ Upload logo to R2 if it's a base64 image or file
      if (logoUrl && logoUrl.startsWith('data:image')) {
        // Get the file from the input
        const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (file) {
          // Compress to WebP first
          const compressedLogo = await compressToWebP(file, 200);
          
          // Convert base64 to blob for upload
          const response = await fetch(compressedLogo);
          const blob = await response.blob();
          
          // Upload to R2
          const formData = new FormData();
          const logoFileName = `logo-${companyForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.webp`;
          formData.append('file', blob, logoFileName);
          formData.append('name', logoFileName);
          formData.append('altText', `${companyForm.name} logo`);
          
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            logoUrl = uploadData.url; // ✅ R2 URL: https://media.jobsreport.online/logo-xxx.webp
            console.log('Logo uploaded to R2:', logoUrl);
          } else {
            showFeedback('error', 'Logo upload failed. Saving anyway.');
          }
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
          logoUrl: logoUrl // ✅ Now R2 URL
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (editingCompanyId) {
          setCompaniesState(prev => prev.map(c => c.id === editingCompanyId ? { ...c, ...data } : c));
          showFeedback('success', `Updated ${companyForm.name}.`);
        } else {
          setCompaniesState(prev => [...prev, data]);
          showFeedback('success', `Created ${companyForm.name}.`);
        }
        setCompanyForm({ name: '', url: '', logoUrl: '' });
        setEditingCompanyId(null);
        fetchSystemData();
      } else {
        const errData = await res.json();
        showFeedback('error', errData.error || 'Failed to save company');
      }
    } catch (err) {
      showFeedback('error', 'Error establishing corporate database reference.');
    } finally {
      setActionLoading(false);
    }
  };




  const handleDeleteCompany = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Purge request rejected.');
      return;
    }

    if (!confirm("Remove this company and its associated index metadata?")) return;

    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompaniesState(prev => prev.filter(c => c.id !== id));
        showFeedback('success', 'Corporate node removed from active inventory.');
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Could not delete company profile.');
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

    if (!confirm("Expel this role mapping category?")) return;

    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRolesState(prev => prev.filter(r => r.id !== id));
        showFeedback('success', 'Normalization algorithm reference expelled.');
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Could not purge role mapping.');
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
      tpl = `<p>The current landscape indicates a significant growth spike in active listings. As enterprise teams continue to scale, hiring velocity is projected to sustain its upwards trajectory throughout the upcoming quarters. Below, our dynamic normalizer provides live telemetry on corporate placements.</p>`;
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
      
      {/* Admin & Editor Permissions Banner Toggle */}
      <div className="p-4 bg-orange-950/20 border border-orange-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 h-10 w-10 flex items-center justify-center bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/25">
            <Key size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-orange-500 font-mono tracking-widest uppercase">DEMO PERMISSIONS CONTROLLER</span>
            <h4 className="text-sm font-black tracking-tight leading-tight uppercase text-stone-200">Test Multi-Role Capabilities</h4>
            <p className="text-xs text-gray-400">Simulate permissions constraints requested in specs. Toggle instantly to test validation feedback and blocks.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 font-mono shrink-0">
          <button 
            type="button" 
            onClick={() => {
              setUserRole('admin');
              showFeedback('success', 'Switched simulated status: Administrator level authorization applied.');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors ${userRole === 'admin' ? 'bg-blue-600 text-stone-100 shadow-md shadow-blue-600/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SYSTEM ADMIN
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              setUserRole('editor');
              showFeedback('success', 'Switched simulated status: Staff Editor level applied. Data index modification is locked.');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors ${userRole === 'editor' ? 'bg-violet-600 text-stone-100 shadow-md shadow-violet-600/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            STAFF EDITOR
          </button>
        </div>
      </div>

      {/* Active Feedback Toast Marker */}
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

      {/* Hero control dashboard banner */}
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
              onClick={() => {
                triggerLogout();
                showFeedback('success', 'Logged out successfully');
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ml-4"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2 max-w-xl font-mono leading-relaxed">
            Deduplicate listings, map normalized roles, direct custom images and documents, catalog company spotlights, and write dynamic charts insight articles.
          </p>
        </div>

        <div className="flex flex-col gap-1 shrink-0 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={handleTriggerPipeline}
            disabled={actionLoading}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={actionLoading ? "animate-spin" : ""} />
            <span>TRIGGER DEDUPLICATION PIPE</span>
          </button>
          
          <p className="text-[10px] text-gray-500 font-mono text-center md:text-right">
            Last execution sweep: Today
          </p>
        </div>
      </div>

      {pipelineFinishedInfo && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-violet-950/20 border border-blue-500/25 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider font-mono">
            <CheckCircle size={16} /> Pipeline Executed Silently
          </div>
          <div className="text-xs font-mono text-gray-400">
            Total original telemetry: <span className="font-bold text-white font-sans">{pipelineFinishedInfo.original}</span> jobs found.
          </div>
          <div className="text-xs font-mono text-gray-400 text-right">
            Cleaned post-deduplication database count: <span className="font-bold text-green-400 font-sans">{pipelineFinishedInfo.deduplicated}</span> active index jobs.
          </div>
        </div>
      )}

      {/* Matrix Tab Selection Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 border-b border-white/5 pb-2">
        {(['dashboard', 'jobs', 'companies', 'roles', 'reports', 'media'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setOperationMessage(null);
            }}
            className={`py-3 px-3.5 rounded-2xl font-bold font-mono text-[10px] uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-white/5 text-blue-400 border border-blue-500/30' 
                : 'text-gray-500 hover:text-white bg-white/[0.01] border border-transparent'
            }`}
          >
            {tab === 'dashboard' && '📊 KPI Overview'}
            {tab === 'jobs' && '📥 Job Input'}
            {tab === 'companies' && '🏢 Companies'}
            {tab === 'roles' && '⚙️ Role Normalizer'}
            {tab === 'reports' && '📰 Report Editor'}
            {tab === 'media' && '🖼️ Media Vault'}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW SECTION */}
      {activeTab === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white/[0.01] border hover:border-white/15 border-white/5 rounded-3xl relative overflow-hidden transition-all group duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Today's Ingestion</p>
              <p className="text-4xl font-extrabold text-blue-400 tracking-tight mt-2 font-mono">{jobs.length}</p>
              <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-green-400 font-mono tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                ACTIVE FEED ACTIVE
              </div>
            </div>

            <div className="p-6 bg-white/[0.01] border hover:border-white/15 border-white/5 rounded-3xl relative overflow-hidden transition-all group duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Active Index Listings</p>
              <p className="text-4xl font-extrabold text-violet-400 tracking-tight mt-2 font-mono">{jobs.filter(j => j.active).length}</p>
              <div className="flex items-center gap-1 mt-2.5 text-[9px] text-gray-500 font-mono tracking-wider uppercase">
                <span>Deduplicated in real-time</span>
              </div>
            </div>

            <div className="p-6 bg-white/[0.01] border hover:border-white/15 border-white/5 rounded-3xl relative overflow-hidden transition-all group duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Unique Corporate Nodes</p>
              <p className="text-4xl font-extrabold text-emerald-400 tracking-tight mt-2 font-mono">{companiesState.length}</p>
              <div className="flex items-center gap-1 mt-2.5 text-[9px] text-gray-500 font-mono tracking-wider uppercase">
                <span>Domain map synchronized</span>
              </div>
            </div>

            <div className="p-6 bg-white/[0.01] border hover:border-white/15 border-white/5 rounded-3xl relative overflow-hidden transition-all group duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold font-mono">Target Growth Sectors</p>
              <p className="text-4xl font-extrabold text-amber-500 tracking-tight mt-2 font-mono">{rolesState.length}</p>
              <div className="flex items-center gap-1 mt-2.5 text-[9px] text-gray-500 font-mono tracking-wider uppercase">
                <span>Mapping normalization: active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl lg:col-span-8 space-y-4">
              <p className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <span className="w-1.5 h-3 bg-blue-500"></span> Sector Ingestion distribution (Live Telemetry Indices)
              </p>
              
              <div className="h-68 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDynamicBarChartData()}>
                    <XAxis dataKey="role" stroke="#52525b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,r255,255,0.02)' }} contentStyle={{ backgroundColor: '#0c0a09', borderColor: '#27272a' }} />
                    <Bar dataKey="listings" fill="#2563eb" radius={[6, 6, 0, 0]}>
                      {getDynamicBarChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl lg:col-span-4 space-y-4">
              <p className="text-xs font-bold text-white uppercase tracking-widest font-mono">Role allocation share</p>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDynamicPieChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {getDynamicPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0c0a09', borderColor: '#27272a' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
      
              <div className="grid grid-cols-2 gap-2 pt-2">
                {getDynamicPieChartData().map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                    <span className="truncate">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
              
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <p className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <Flame size={14} className="text-amber-500" /> Active Trending roles (Automatic priority Matrix)
              </p>

              <div className="space-y-2">
                {rolesState.sort((a,b) => b.growth - a.growth).slice(0, 5).map((role, idx) => {
                  const jobMatches = jobs.filter(j => j.role.toLowerCase() === role.title.toLowerCase() && j.active).length;
                  const uniqueCos = new Set(jobs.filter(j => j.role.toLowerCase() === role.title.toLowerCase() && j.active).map(j => j.company)).size;
                  
                  return (
                    <div 
                      key={role.id}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-gray-500">0{idx + 1}</span>
                        <div>
                          <span className="text-xs font-bold text-stone-100">{role.title}</span>
                          <span className="block text-[8px] text-gray-400 font-mono uppercase mt-0.5">
                            {role.mappedTitles.length} keywords mapped • {uniqueCos} tracking companies
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">+{role.growth}%</span>
                        <span className="block text-[9px] text-gray-500 font-mono uppercase mt-0.5">{jobMatches} active postings</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                  <Database size={13} className="text-blue-500" /> System Aggregator Log Stream
                </p>
                
                <div className="space-y-3.5 mt-4">
                  {activityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="border-l-2 border-blue-500 pl-3 py-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                        <span className="font-bold text-stone-200">{log.action}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{log.details}</p>
                    </div>
                  ))}
                  
                  {activityLogs.length === 0 && (
                    <p className="text-xs text-gray-500 font-mono text-center py-6">LOG STREAM UNINITIALIZED</p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 text-center">
                <button 
                  onClick={handleTriggerPipeline}
                  className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto"
                >
                  <span>Force Aggregate Telemetry</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

          </div>

        </motion.div>
      )}

      {/* TAB 2: JOB INPUT SYSTEM WITH AI PARSER & FILE UPLOAD - FULL WIDTH */}
      {activeTab === 'jobs' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Main insertion form - Full width */}
          <div className="space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-sans text-stone-100">
                  <Briefcase size={16} className="text-blue-500" /> {editingJobId ? 'Edit Placement' : 'Ingest Real-Time Placement'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Automatic categorizations are applied based on keyword matching logic. Supports images, PDFs, Word, Excel, PowerPoint files.</p>
              </div>

              {/* AI Job Parser - Smart Paste */}
              <div className="pb-4 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAIPaste(!showAIPaste)}
                  className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all group"
                >
                  <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                  {showAIPaste ? '✕ Close AI Parser' : '⚡ AI Auto-Fill from Job Description'}
                </button>

                {showAIPaste && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-3 p-4 bg-violet-950/10 border border-violet-500/10 rounded-2xl"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-violet-400" />
                      <p className="text-[9px] text-gray-400 font-mono leading-relaxed">
                        Paste a raw job posting below. AI will extract: <span className="text-violet-400">title, company, location, salary, role, and description</span>.
                      </p>
                    </div>
                    
                    <textarea
                      value={rawJobText}
                      onChange={(e) => setRawJobText(e.target.value)}
                      placeholder={`Paste job description here...\n\nExample:\n"We are hiring a Senior Accountant in Dar es Salaam. The ideal candidate will have 5+ years experience..."`}
                      className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50 font-mono placeholder:text-gray-600"
                      style={{ fontSize: '13px', lineHeight: '1.6' }}
                      disabled={aiProcessing}
                    />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-gray-500 font-mono">
                        {rawJobText.length} characters
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setRawJobText(''); setShowAIPaste(false); }}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold uppercase rounded-xl transition-all"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleAIProcessJob}
                          disabled={aiProcessing || rawJobText.trim().length < 20}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-500/10"
                        >
                          {aiProcessing ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              Parse with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleIngestJob} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Job Title</label>
                    <input 
                      type="text" 
                      value={jobForm.title}
                      onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Senior Frontend React Engineer"
                      className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Location parameters</label>
                    <input 
                      type="text" 
                      value={jobForm.location}
                      onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Remote / Silicon Valley"
                      className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {jobForm.title && (
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[10px] font-mono leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-400 uppercase font-extrabold">
                      <Sparkles size={12} /> Auto-Normalization Engine
                    </div>
                    <span className="text-gray-400">
                      Decoded title keywords will automatically categorize role to: <span className="text-stone-100 font-bold bg-white/10 px-1.5 py-0.5 rounded uppercase font-sans text-[9px] ml-1">{jobForm.roleSelected}</span>
                    </span>
                  </div>
                )}

                {duplicateWarning && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[10px] font-mono leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 text-red-400 uppercase font-extrabold">
                      <AlertCircle size={12} /> DUPLICATE WARNING MATCH
                    </div>
                    <span className="text-gray-400">{duplicateWarning}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Company Source</label>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingNewCompanyInline(!isCreatingNewCompanyInline)}
                    className="text-[9px] font-mono font-bold text-blue-500 uppercase flex items-center gap-1 hover:text-blue-400"
                  >
                    {isCreatingNewCompanyInline ? "Select Existing Node" : "Create New Corporate Spot inline"}
                  </button>
                </div>

                {isCreatingNewCompanyInline ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-gray-400 uppercase font-extrabold tracking-widest">New Company Name</label>
                      <input 
                        type="text" 
                        value={jobForm.companyNewName}
                        onChange={(e) => setJobForm(prev => ({ ...prev, companyNewName: e.target.value }))}
                        placeholder="e.g. OpenAI Inc"
                        className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded-xl text-xs text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] text-gray-400 uppercase font-extrabold tracking-widest">Careers Page URL</label>
                      <input 
                        type="url" 
                        value={jobForm.companyNewUrl}
                        onChange={(e) => setJobForm(prev => ({ ...prev, companyNewUrl: e.target.value }))}
                        placeholder="https://openai.com/careers"
                        className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[9px] text-gray-400 uppercase font-extrabold tracking-widest">Logo (Drag / Click to upload)</label>
                      <div className="border border-dashed border-white/10 hover:border-white/20 p-4 rounded-xl text-center relative cursor-pointer group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'company')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload size={14} className="mx-auto text-gray-500 group-hover:text-white transition-colors mb-2" />
                        <span className="block text-[10px] text-gray-400">
                          {jobForm.companyNewLogo ? "✓ LOGO LOADED IN BUFFER" : "Png / Jpg / Svg optimized logo"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={jobForm.companySelected}
                      onChange={(e) => setJobForm(prev => ({ ...prev, companySelected: e.target.value }))}
                      className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Corporate Target --</option>
                      {companiesState.map(co => (
                        <option key={co.id} value={co.name}>{co.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Default Role Match</label>
                    <select
                      value={jobForm.roleSelected}
                      onChange={(e) => setJobForm(prev => ({ ...prev, roleSelected: e.target.value }))}
                      className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white focus:outline-none"
                    >
                      {rolesState.map(r => (
                        <option key={r.id} value={r.title}>{r.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Salary estimates (Optional)</label>
                    <input 
                      type="text" 
                      value={jobForm.salary}
                      onChange={(e) => setJobForm(prev => ({ ...prev, salary: e.target.value }))}
                      placeholder="e.g. $140,000 - $170,000"
                      className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Apply Method Selection */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">
                    Application Method
                  </label>
                  
                  {/* Toggle URL/Email */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-fit">
                    <button
                      type="button"
                      onClick={() => setApplicationType('url')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        applicationType === 'url' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      🔗 URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicationType('email')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        applicationType === 'email' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      ✉️ Email
                    </button>
                  </div>

                  {applicationType === 'url' ? (
                    <div className="space-y-1">
                      <label className="block text-[9px] text-gray-400 uppercase font-extrabold tracking-widest">Application URL</label>
                      <input 
                        type="url" 
                        value={jobForm.url}
                        onChange={(e) => setJobForm(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://company.com/careers/apply"
                        className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] text-gray-400 uppercase font-extrabold tracking-widest">Application Email</label>
                        <input 
                          type="email" 
                          value={jobForm.url}
                          onChange={(e) => setJobForm(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="careers@company.com"
                          className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] text-gray-400 uppercase font-extrabold tracking-widest">Email Subject (Optional)</label>
                        <input 
                          type="text" 
                          value={jobForm.companyNewUrl}
                          onChange={(e) => setJobForm(prev => ({ ...prev, companyNewUrl: e.target.value }))}
                          placeholder={`Application for ${jobForm.title || 'Position'}`}
                          className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Job Expiry Date</label>
                  <input 
                    type="date" 
                    value={jobForm.expiresAt}
                    onChange={(e) => setJobForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    required
                  />
                </div>

                {/* Job Files Upload Section */}
                <div className="space-y-2 border-t border-white/5 pt-4 mt-2">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">
                    Job Listing Files (Images, PDFs, Documents)
                  </label>
                  
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-2xl cursor-pointer transition-all group">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" 
                      multiple 
                      onChange={handleJobFileUpload}
                      className="hidden"
                    />
                    <Upload size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-blue-400 font-mono uppercase tracking-wider">
                      {jobFiles.length > 0 
                        ? `${jobFiles.length} file(s) selected` 
                        : 'Click to upload images, PDFs & documents'}
                    </span>
                  </label>

                  {jobFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                      {jobFiles.map((file, index) => (
                        <div key={index} className="relative group/file rounded-xl overflow-hidden border border-white/5 bg-slate-900/50">
                          {(file.type === 'image') ? (
                            <img 
                              src={file.thumbnail || file.url} 
                              alt={file.name} 
                              className="w-full h-16 object-cover"
                            />
                          ) : (
                            <div className="w-full h-16 flex flex-col items-center justify-center bg-slate-800/50 p-1">
                              <File size={16} className="text-blue-400" />
                              <span className="text-[6px] text-gray-400 mt-1 truncate w-full text-center">{file.name.slice(0, 10)}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveJobFile(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white opacity-0 group-hover/file:opacity-100 transition-opacity"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[9px] text-gray-500 font-mono">
                    Upload images, PDFs, Word docs, Excel sheets, or PowerPoint files.
                  </p>
                </div>

                {/* Job Description Editor - Always Visible with Edit Modes */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">
                      Job Description {jobDescription && <span className="text-emerald-400 ml-1">• Ready</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      {/* ✅ Edit Mode Toggle */}
                      {jobDescription && (
                        <div className="flex bg-black/60 p-0.5 rounded-lg font-mono text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setDescEditMode('visual')}
                            className={`px-2 py-1 rounded-md uppercase transition-all ${descEditMode === 'visual' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                          >
                            Visual
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDescEditMode('code');
                              if (jobDescEditorRef.current) {
                                setJobDescription(jobDescEditorRef.current.innerHTML);
                              }
                            }}
                            className={`px-2 py-1 rounded-md uppercase transition-all ${descEditMode === 'code' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                          >
                            HTML
                          </button>
                        </div>
                      )}
                      {/* Copy button */}
                      {jobDescription && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              descEditMode === 'code' ? jobDescription : (jobDescEditorRef.current?.innerHTML || jobDescription)
                            );
                            showFeedback('success', 'Description copied!');
                          }}
                          className="text-[9px] font-mono font-bold text-gray-500 hover:text-white uppercase flex items-center gap-1 transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Copy
                        </button>
                      )}
                      {/* Clear button */}
                      {jobDescription && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Clear description?')) {
                              setJobDescription('');
                              if (jobDescEditorRef.current) {
                                jobDescEditorRef.current.innerHTML = '';
                              }
                            }
                          }}
                          className="text-[9px] font-mono font-bold text-red-500 hover:text-red-400 uppercase transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mini Toolbar - Only in visual mode */}
                  {descEditMode === 'visual' && (
                    <div className="p-1.5 bg-black/50 border border-white/10 rounded-xl flex flex-wrap items-center gap-0.5">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Bold size={12}/></button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Italic size={12}/></button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><Underline size={12}/></button>
                      <span className="w-px h-4 bg-white/10 mx-0.5"/>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h3'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-[9px] font-bold">H3</button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h4'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-[9px] font-bold">H4</button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'p'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-[9px]">P</button>
                      <span className="w-px h-4 bg-white/10 mx-0.5"/>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><List size={12}/></button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }} className="p-1.5 hover:bg-white/10 rounded-lg"><List size={12}/></button>
                      <span className="w-px h-4 bg-white/10 mx-0.5"/>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('removeFormat'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-[9px] text-gray-400">Clear fmt</button>
                    </div>
                  )}
                  
                  {/* ✅ Visual Editor */}
                  {descEditMode === 'visual' && (
                    <div 
                      ref={jobDescEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="w-full min-h-[250px] bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-stone-200 focus:outline-none focus:border-blue-500/50 overflow-y-auto"
                      style={{ fontSize: '14px', lineHeight: '1.8' }}
                      onInput={() => {
                        if (jobDescEditorRef.current) {
                          setJobDescription(jobDescEditorRef.current.innerHTML);
                        }
                      }}
                      data-placeholder="Write job description here or use AI Auto-Fill above..."
                    />
                  )}

                  {/* ✅ Code/HTML Editor */}
                  {descEditMode === 'code' && (
                    <textarea
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        if (jobDescEditorRef.current) {
                          jobDescEditorRef.current.innerHTML = e.target.value;
                        }
                      }}
                      className="w-full min-h-[250px] bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-blue-400 font-mono focus:outline-none focus:border-blue-500/50 overflow-y-auto resize-none"
                      style={{ fontSize: '13px', lineHeight: '1.8' }}
                      placeholder="Edit HTML directly..."
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] text-gray-500 font-mono">
                      {jobDescription ? `${jobDescription.length} characters • ${descEditMode === 'code' ? 'HTML' : 'Visual'} mode` : 'Rich text editor • AI content will appear here'}
                    </p>
                    {jobDescription && (
                      <p className="text-[8px] text-emerald-500 font-mono">
                        ✓ Ready to save
                      </p>
                    )}
                  </div>
                </div>

{/* ✅ Schema & SEO Data Section */}
<div className="space-y-2 border-t border-white/5 pt-4">
  <div className="flex items-center justify-between">
    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">
      Schema & SEO Data
    </label>
    <button
      type="button"
      onClick={async () => {
        if (!jobForm.title) { showFeedback('error', 'Please enter a job title first'); return; }
        setActionLoading(true);
        try {
          const res = await fetch('/api/ai/extract-schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: jobForm.title,
              description: jobDescription,
              location: jobForm.location,
              company: isCreatingNewCompanyInline ? jobForm.companyNewName : jobForm.companySelected
            })
          });
          const result = await res.json();
          if (result.success && result.schema) {
            setSchemaData(prev => ({
              ...prev,
              job_category: result.schema.job_category || prev.job_category,
              industry: result.schema.industry || prev.industry,
              employment_type: result.schema.employment_type || prev.employment_type,
              workplace_type: result.schema.workplace_type || prev.workplace_type,
              education_level: result.schema.education_level || prev.education_level,
              experience_months: result.schema.experience_months || prev.experience_months,
              skills: Array.isArray(result.schema.skills) ? result.schema.skills : prev.skills,
              benefits: Array.isArray(result.schema.benefits) ? result.schema.benefits : prev.benefits,
              salary_min: result.schema.salary_min ? Number(result.schema.salary_min) : prev.salary_min,
              salary_max: result.schema.salary_max ? Number(result.schema.salary_max) : prev.salary_max,
              salary_currency: result.schema.salary_currency || prev.salary_currency,
            }));
            showFeedback('success', 'Schema extracted! Fill location manually below.');
          } else {
            showFeedback('error', result.error || 'Schema extraction failed');
          }
        } catch (err) { showFeedback('error', 'AI service unavailable'); }
        finally { setActionLoading(false); }
      }}
      disabled={actionLoading || !jobForm.title}
      className="text-[9px] font-mono font-bold text-violet-500 hover:text-violet-400 disabled:text-gray-600 uppercase flex items-center gap-1 transition-colors"
    >
      <Sparkles size={12} /> Auto-Extract Schema
    </button>
  </div>

  {/* Row 1: Category (FREE TEXT) + Employment + Workplace */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    <input 
      type="text" 
      placeholder="Category (e.g. IT, Accounting)" 
      value={schemaData.job_category || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, job_category: e.target.value}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <select value={schemaData.employment_type || 'FULL_TIME'} onChange={(e) => setSchemaData(prev => ({...prev, employment_type: e.target.value}))} className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white">
      <option value="FULL_TIME">Full Time</option>
      <option value="PART_TIME">Part Time</option>
      <option value="CONTRACT">Contract</option>
      <option value="TEMPORARY">Temporary</option>
      <option value="INTERNSHIP">Internship</option>
    </select>
    <select value={schemaData.workplace_type || 'Onsite'} onChange={(e) => setSchemaData(prev => ({...prev, workplace_type: e.target.value}))} className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white">
      <option value="Onsite">Onsite</option>
      <option value="Remote">Remote</option>
      <option value="Hybrid">Hybrid</option>
    </select>
  </div>

  {/* Row 2: Education + Experience + Industry (FREE TEXT) */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    <select value={schemaData.education_level || 'Any'} onChange={(e) => setSchemaData(prev => ({...prev, education_level: e.target.value}))} className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white">
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
      onChange={(e) => setSchemaData(prev => ({...prev, experience_months: parseInt(e.target.value) || 0}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="text" 
      placeholder="Industry (e.g. Finance)" 
      value={schemaData.industry || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, industry: e.target.value}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
  </div>

  {/* Row 3: Currency + Salary Min + Salary Max */}
  <div className="grid grid-cols-3 gap-2">
    <select value={schemaData.salary_currency || 'TZS'} onChange={(e) => setSchemaData(prev => ({...prev, salary_currency: e.target.value}))} className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white">
      <option value="TZS">🇹🇿 TSh</option>
      <option value="KES">🇰🇪 KSh</option>
      <option value="UGX">🇺🇬 USh</option>
      <option value="USD">🇺🇸 $</option>
      <option value="EUR">🇪🇺 €</option>
      <option value="GBP">🇬🇧 £</option>
      <option value="ZAR">🇿🇦 R</option>
      <option value="NGN">🇳🇬 ₦</option>
      <option value="AED">🇦🇪 د.إ</option>
    </select>
    <input 
      type="number" 
      placeholder="Min Salary" 
      value={schemaData.salary_min || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, salary_min: parseFloat(e.target.value) || null}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="number" 
      placeholder="Max Salary" 
      value={schemaData.salary_max || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, salary_max: parseFloat(e.target.value) || null}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
  </div>

  {/* Row 4: LOCATION FIELDS - Google Schema (Street, City, Region, Country) */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
    <input 
      type="text" 
      placeholder="Street (e.g. Kashai)" 
      value={schemaData.street_address || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, street_address: e.target.value}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="text" 
      placeholder="City *" 
      value={schemaData.city || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, city: e.target.value}))} 
      className="bg-black/40 border border-emerald-500/20 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="text" 
      placeholder="Region" 
      value={schemaData.region || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, region: e.target.value}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="text" 
      placeholder="Country" 
      value={schemaData.country || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, country: e.target.value}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
  </div>

  {/* Row 5: Postcode + Skills + Benefits */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
    <input 
      type="text" 
      placeholder="Postcode (e.g. 35101)" 
      value={schemaData.postcode || ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, postcode: e.target.value}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="text" 
      placeholder="Skills (comma separated)" 
      value={Array.isArray(schemaData.skills) ? schemaData.skills.join(', ') : ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
    <input 
      type="text" 
      placeholder="Benefits (comma separated)" 
      value={Array.isArray(schemaData.benefits) ? schemaData.benefits.join(', ') : ''} 
      onChange={(e) => setSchemaData(prev => ({...prev, benefits: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))} 
      className="bg-black/40 border border-white/10 px-2 py-2 rounded-lg text-[10px] text-white" 
    />
  </div>

  {/* Google Schema indicator */}
  <div className="flex items-center gap-2 text-[8px] text-gray-500 font-mono">
    <Globe size={10} />
    <span>These location fields are used by Google for job search results</span>
  </div>
</div>





                {/* Action Buttons - Save Draft + Publish */}
                <div className="flex gap-2 pt-2">
                  {editingJobId && (
                    <button
                      type="button"
                      onClick={handleCancelEditJob}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-stone-300 font-extrabold text-[11px] uppercase rounded-2xl"
                    >
                      Cancel
                    </button>
                  )}
                  
                  {/* ✅ Save Draft Button */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      setIsDraft(true);
                      await handleIngestJob(e as any);
                      setIsDraft(false);
                    }}
                    disabled={actionLoading || !jobForm.title}
                    className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {actionLoading && isDraft ? 'Saving...' : 'Save Draft'}
                  </button>
                  
                  {/* ✅ Publish Button */}
                  <button
                    type="submit"
                    disabled={actionLoading || !!duplicateWarning}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-stone-100 font-extrabold text-[10px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {actionLoading && !isDraft ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        Publishing...
                      </>
                    ) : editingJobId ? (
                      'Update Placement'
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Publish Job
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Recently Added Job postings catalog preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <Database size={13} className="text-blue-500" /> Real-Time placements directory ({jobs.length} total)
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                <button
                  onClick={fetchSystemData}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </span>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 max-h-[500px] overflow-y-auto">
              
              {jobs.map((job) => (
                <div 
                  key={job.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-stone-100 truncate">{job.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-gray-400 font-mono">
                        {job.role}
                      </span>
                      {job.salary && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">
                          {job.salary}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 size={11} />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {job.location}
                      </span>
                      <span className="font-mono text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded">
                        JR-{job.id.toUpperCase().slice(0, 4)}
                      </span>
                      {job.expiresAt && (
                        <span className={`font-mono text-[9px] px-1 rounded ${
                          job.expiresAt < new Date().toISOString().split('T')[0]
                            ? 'bg-red-500/10 text-red-500/90 font-bold' 
                            : 'bg-violet-500/10 text-violet-400 font-bold'
                        }`}>
                          Expires: {job.expiresAt}
                        </span>
                      )}
                    </div>
                    
                    {/* ✅ Draft Badge */}
                    {job.active === false && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-amber-500/10 text-amber-400 uppercase">
                          📝 Draft
                        </span>
                      </div>
                    )}

                    {(job as any).images && (job as any).images.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <File size={10} className="text-blue-400" />
                        <span className="text-[8px] text-gray-500 font-mono">
                          {(job as any).images.length} file(s)
                        </span>
                      </div>
                    )}

                    {(job as any).description && (
                      <div className="flex items-center gap-1 mt-1">
                        <FileText size={10} className="text-emerald-400" />
                        <span className="text-[8px] text-gray-500 font-mono">
                          Description available
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 rounded-xl transition-colors"
                      title="Edit Job"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>

                    <button
                      onClick={() => handleToggleJobActive(job.id, job.active)}
                      className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest uppercase font-bold border transition-all ${
                        job.active 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-stone-800 text-gray-500 border-transparent'
                      }`}
                      title={job.active ? "Click to set Offline" : "Click to set Active"}
                    >
                      {job.active ? "● ACTIVE" : "○ OFFLINE"}
                    </button>

                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl transition-all"
                      title="Purge Listing"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <p className="text-xs text-gray-500 font-mono text-center py-12">DATABASE COLD-START IN PROGRESS</p>
              )}

            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: COMPANY MANAGEMENT */}
      {activeTab === 'companies' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-sans text-stone-100">
                  <Building2 size={16} className="text-blue-500" /> {editingCompanyId ? 'Edit Corporate Node' : 'Establish Corporate Spotlight Node'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Manual company profile initialization for Spotlight visualization panels.</p>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Company Title</label>
                  <input 
                    type="text" 
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Stripe Inc"
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Main website careers portal URL</label>
                  <input 
                    type="url" 
                    value={companyForm.url}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://stripe.com/jobs"
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Spotlight Logo Vector</label>
                  <div className="border border-dashed border-white/10 hover:border-white/20 p-6 rounded-2xl text-center relative cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'company')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={16} className="mx-auto text-gray-500 group-hover:text-white transition-colors mb-2" />
                    <span className="block text-[11px] text-gray-400">
                      {companyForm.logoUrl ? "✓ PNG/SVG LOGO LOADED IN MEMORY" : "Drag & drop company logo icon here"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingCompanyId && (
                    <button
                      type="button"
                      onClick={handleCancelEditCompany}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-stone-300 font-extrabold text-[11px] uppercase rounded-2xl"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                  >
                    {actionLoading ? "Processing..." : editingCompanyId ? "UPDATE COMPANY" : "PUBLISH CORPORATE DOMAIN NODE"}
                  </button>
                </div>

              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Layers size={13} className="text-blue-500" /> Active Corporate Catalog ({companiesState.length} Spotlighted profiles)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companiesState.map((co) => (
                <div 
                  key={co.id}
                  className="p-4 bg-white/[0.01] border hover:bg-white/[0.02] border-white/5 rounded-3xl transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {co.logoUrl ? (
                      <img src={co.logoUrl} alt={co.name} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-xl border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center font-bold font-mono text-white">
                        {co.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-stone-100 block">{co.name}</span>
                      <button 
                        onClick={() => triggerRedirect(co.url, co.name, 'Admin Verified Directory')}
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <Globe size={10} /> Domain portal <ExternalLink size={8} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditCompany(co)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 rounded-xl transition-colors"
                      title="Edit Company"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteCompany(co.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl transition-colors"
                      title="Delete Company"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: ROLES MANAGEMENT */}
      {activeTab === 'roles' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-sans text-stone-100">
                  <Layers size={16} className="text-blue-500" /> Create / Sync Parser Rule
                </h3>
                <p className="text-xs text-gray-500 mt-1">Configure keyword scanning sequences to automatically route job postings into target roles.</p>
              </div>

              <div className="space-y-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Normalized Role Title</label>
                  <input 
                    type="text" 
                    value={roleForm.title}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Software Developer"
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Associated Growth Pct %</label>
                  <input 
                    type="number" 
                    value={roleForm.growth}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, growth: Number(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Normalization matching keywords chips</label>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={roleForm.keywordInput}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, keywordInput: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddKeywordToRole()}
                      placeholder="e.g. backend"
                      className="flex-1 bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeywordToRole}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 font-bold font-mono text-[10px] uppercase rounded-xl border border-white/10"
                    >
                      Add Chip
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {roleForm.keywords.map((chip, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono uppercase rounded-lg flex items-center gap-1.5"
                      >
                        {chip}
                        <button type="button" onClick={() => handleRemoveKeywordFromFile(idx)} className="text-red-400 font-bold hover:scale-110 ml-1">×</button>
                      </span>
                    ))}
                    
                    {roleForm.keywords.length === 0 && (
                      <span className="text-[10px] font-mono text-gray-500">NO PARSING KEYWORDS CHIPS LOADED</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRoleRule}
                  disabled={actionLoading || !roleForm.title}
                  className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                >
                  {actionLoading ? "Syncing sequence mappings..." : "COMMIT ALGORITHM Normalizations"}
                </button>

              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Layers size={13} className="text-blue-500" /> Normalization Schema inventory ({rolesState.length} categories active)
            </span>

            <div className="space-y-3">
              {rolesState.map((role) => (
                <div 
                  key={role.id}
                  className="p-5 bg-white/[0.01] border hover:bg-white/[0.02] border-white/5 rounded-3xl transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-stone-100 uppercase tracking-wide block">{role.title}</span>
                    
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {role.mappedTitles.map((kw, i) => (
                        <span key={i} className="text-[8px] bg-white/5 border border-white/5 text-gray-400 font-mono tracking-wider uppercase px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                      
                      {role.mappedTitles.length === 0 && (
                        <span className="text-[8px] text-gray-500 font-mono">NO KEYWORDS TARGETING THIS NORMALIZATION</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] block text-gray-500 font-mono">GROWTH SCALING</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">+{role.growth}%</span>
                    </div>

                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
  
      {/* TAB 5: REPORT CREATION SYSTEM - FULL WIDTH FLAT */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-extrabold uppercase text-stone-100">
                  <Sparkles size={14} className="text-blue-500 inline mr-1" />TinyMCE Editor
                </h3>
                <span className="text-[9px] text-gray-500 font-mono">
                  {(reportForm.excerpt || '').length} characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(reportForm.excerpt || '');
                    showFeedback('success', 'Content copied to clipboard');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
                <div className="flex bg-black/60 p-1 rounded-2xl font-mono text-[10px] font-bold">
                  {(['visual','code','preview'] as const).map(m => (
                    <button key={m} onClick={() => setEditorMode(m)} className={`px-3 py-1.5 rounded-xl uppercase ${editorMode===m?'bg-blue-600 text-white':'text-gray-400'}`}>{m}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-2 bg-black/50 border border-white/10 rounded-2xl flex flex-wrap items-center gap-1">
              <button onClick={() => handleToolbarClick('bold','','<strong>','</strong>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold"><Bold size={13}/> Bold</button>
              <button onClick={() => handleToolbarClick('italic','','<em>','</em>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold"><Italic size={13}/> Italic</button>
              <label className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 text-blue-400">
                <Upload size={13}/> Image
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'article')} className="hidden" />
              </label>
              <span className="w-px h-5 bg-white/10 mx-1"/>
              <button onClick={() => handleToolbarClick('formatBlock','H2','<h2>','</h2>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold">H2</button>
              <button onClick={() => handleToolbarClick('formatBlock','H3','<h3>','</h3>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold">H3</button>
              <span className="w-px h-5 bg-white/10 mx-1"/>
              <button onClick={() => handleToolbarClick('insertUnorderedList','','<ul><li>','</li></ul>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold"><List size={13}/> List</button>
              <button onClick={() => handleToolbarClick('formatBlock','BLOCKQUOTE','<blockquote>','</blockquote>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold">Quote</button>
              <button onClick={() => handleToolbarClick('highlight','','<span class=\"text-blue-400\">','</span>')} className="p-2 hover:bg-white/10 rounded-lg text-[10px] font-bold text-blue-400">Highlight</button>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/45">
              {editorMode==='visual' && (
                <div className="p-6">
                  <div 
                    ref={visualEditorRef} 
                    contentEditable 
                    onInput={handleVisualEditorInput} 
                    onBlur={handleVisualEditorBlur} 
                    className="w-full min-h-[500px] bg-transparent text-stone-200 text-sm outline-none leading-relaxed"
                    style={{ fontSize: '15px', lineHeight: '1.8' }}
                  />
                </div>
              )}
              {editorMode==='code' && (
                <div className="p-6">
                  <textarea 
                    id="excerpt-editor-textarea" 
                    value={reportForm.excerpt} 
                    onChange={(e) => setReportForm(prev=>({...prev,excerpt:e.target.value}))} 
                    className="w-full min-h-[500px] bg-transparent text-blue-400 text-sm font-mono outline-none resize-none leading-relaxed"
                    style={{ fontSize: '14px', lineHeight: '1.8' }}
                  />
                </div>
              )}
              {editorMode==='preview' && (
                <div className="p-6 min-h-[500px] overflow-y-auto">
                  {reportForm.excerpt ? (
                    <div dangerouslySetInnerHTML={{__html:reportForm.excerpt}} className="text-stone-300 text-sm leading-relaxed max-w-4xl"/>
                  ) : (
                    <p className="text-gray-500 text-center py-20">No content</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2">
                <button onClick={()=>handleInsertTemplate('insights')} className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-bold text-white">Key Insights</button>
                <button onClick={()=>handleInsertTemplate('segmented')} className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-bold text-white">Segment</button>
                <button onClick={()=>handleInsertTemplate('standard')} className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-bold text-white">Summary</button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input 
                  type="text" 
                  value={reportForm.title} 
                  onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))} 
                  placeholder="Report Title" 
                  className="bg-black/40 border border-white/15 px-4 py-2.5 rounded-2xl text-xs text-white w-64" 
                  required 
                />
                <select 
                  value={reportForm.roleSelected} 
                  onChange={(e) => setReportForm(prev => ({ ...prev, roleSelected: e.target.value }))} 
                  className="bg-black/40 border border-white/15 px-3 py-2.5 rounded-2xl text-xs text-white"
                >
                  {rolesState.map(r => (<option key={r.id} value={r.title}>{r.title}</option>))}
                </select>
                <input 
                  type="text" 
                  value={reportForm.monthYear} 
                  onChange={(e) => setReportForm(prev => ({ ...prev, monthYear: e.target.value }))} 
                  placeholder="June 2026" 
                  className="bg-black/40 border border-white/15 px-3 py-2.5 rounded-2xl text-xs text-white w-28" 
                />
                {editingReportId && (
                  <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 bg-white/5 border border-white/10 text-stone-300 font-extrabold text-[10px] uppercase rounded-2xl">Cancel</button>
                )}
                <button 
                  onClick={handlePostReport} 
                  disabled={actionLoading || !reportForm.title} 
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-stone-100 font-extrabold text-[10px] uppercase rounded-2xl disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : editingReportId ? "UPDATE" : "PUBLISH"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold uppercase text-stone-100">
                <Layers size={14} className="text-violet-500 inline mr-1"/>Published Reports ({reportsState.length})
              </h3>
              <button onClick={fetchSystemData} className="px-3 py-1.5 bg-white/5 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1">
                <RefreshCw size={12}/>Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
              {reportsState.map(rep=>(
                <div key={rep.id} className={`p-3 bg-black/30 border rounded-2xl flex items-center justify-between ${editingReportId===rep.id?'border-blue-500/50':'border-white/5'}`}>
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{rep.title}</p><span className="text-[9px] text-gray-500">{rep.monthYear} • {rep.role}</span></div>
                  <div className="flex gap-1">
                    <button onClick={()=>handleLoadReportToEdit(rep)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-black">Edit</button>
                    <button onClick={()=>handleDeleteReport(rep.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded text-[9px] font-black">Del</button>
                  </div>
                </div>
              ))}
              {reportsState.length===0 && <div className="col-span-full text-center py-8 text-gray-500 text-xs">No published reports.</div>}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 6: MEDIA MANAGEMENT */}
      {activeTab === 'media' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-sans text-stone-100">
                  <ImageIcon size={16} className="text-blue-500" /> Ingest Static Media Asset
                </h3>
                <p className="text-xs text-gray-500 mt-1">Upload graphics assets directly into the dynamic media catalog for reports integration.</p>
              </div>

              <form onSubmit={handleUploadMedia} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Asset Name (Label)</label>
                  <input 
                    type="text" 
                    value={mediaForm.name}
                    onChange={(e) => setMediaForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. software_trend_q2_2026.png"
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">SEO Alternate Text description</label>
                  <input 
                    type="text" 
                    value={mediaForm.altText}
                    onChange={(e) => setMediaForm(prev => ({ ...prev, altText: e.target.value }))}
                    placeholder="Demand and growth index for technical listings"
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Select Visual Artifact file (Drag & Drop)</label>
                  <div className="border border-dashed border-white/10 hover:border-white/20 p-8 rounded-2xl text-center relative cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'media')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={20} className="mx-auto text-gray-400 group-hover:text-white transition-colors mb-2" />
                    {selectedFileBase64 ? (
                      <span className="block text-[11px] text-emerald-400 font-bold uppercase font-mono">
                        ✓ File loaded inside buffer ({selectedFileSize})
                      </span>
                    ) : (
                      <span className="block text-[11px] text-gray-400">
                        Drag & Drop or click to browse local files
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !selectedFileBase64}
                  className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {actionLoading ? "Saving static parameters..." : "PUBLISH FILE TO MEDIA CATALOG"}
                </button>

              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Layers size={13} className="text-blue-500" /> Catalog Inventory Vault ({mediaAssets.length} static assets cataloged)
            </span>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaAssets.map((asset) => (
                <div 
                  key={asset.id}
                  className="p-3 bg-white/[0.01] border hover:border-white/15 border-white/5 rounded-3xl transition-all group relative overflow-hidden"
                >
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative mb-2.5">
                    <img 
                      src={asset.dataUrl} 
                      alt={asset.altText} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" 
                    />
                    
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 backdrop-blur rounded text-[8px] font-mono tracking-wider text-gray-400 uppercase">
                      {asset.size}
                    </div>
                  </div>

                  <div className="space-y-1 pr-8 text-left min-w-0">
                    <span className="text-[10px] font-black text-stone-100 truncate block uppercase tracking-wide" title={asset.name}>
                      {asset.name}
                    </span>
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-wider block">
                      Uploaded: {asset.uploadedAt}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteMedia(asset.id)}
                    className="absolute bottom-2.5 right-2.5 p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl transition-colors"
                    title="Purge static file properties"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {mediaAssets.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-500 font-mono text-xs">
                  NO MEDIA IN INVENTORY VAULT Yet
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
