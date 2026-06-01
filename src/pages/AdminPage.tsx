import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  TrendingUp, 
  BookOpen, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
  Briefcase,
  Lock,
  LogOut,
  Building2,
  FileText,
  Image as ImageIcon,
  Key,
  Flame,
  Globe,
  Compass,
  Settings,
  ChevronDown,
  Layers,
  Sparkles,
  DollarSign,
  MapPin,
  Eye,
  CheckCircle,
  HelpCircle,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  Code,
  Link as LinkIcon
} from 'lucide-react';
import { RawJob, Trend, Report, Company, ActivityLog, MediaAsset, RoleDefinition } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCountry } from '../context/CountryContext';
import { useCareerRedirect } from '../context/CareerRedirectContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function AdminPage() {
  const { isAdmin, login, logout: triggerLogout } = useAuth();
  const { selectedCountry, currentFlag } = useCountry();
  const { triggerRedirect } = useCareerRedirect();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'companies' | 'roles' | 'reports' | 'media'>('dashboard');
  
  // Authentication Simulated Permission level
  const [userRole, setUserRole] = useState<'admin' | 'editor'>('admin'); // admin = read/write anything, editor = read-only on jobs/companies/roles but full access on reports/media

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
  const [isCreatingNewCompanyInline, setIsCreatingNewCompanyInline] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

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
      
      // Look up if any of our roles maps this
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

      // Inline Duplicate warning check
      const duplicateExists = jobs.some(j => 
        j.title.toLowerCase().trim() === lowerTitle &&
        j.company.toLowerCase().trim() === (isCreatingNewCompanyInline ? jobForm.companyNewName.toLowerCase().trim() : jobForm.companySelected.toLowerCase().trim()) &&
        j.location.toLowerCase().trim() === jobForm.location.toLowerCase().trim()
      );

      if (duplicateExists) {
        setDuplicateWarning("INLINE WARNING: A listing with identical Title + Company + Location combination exists in index. Adding this will be BLOCKED to prevent duplication.");
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [jobForm.title, jobForm.companySelected, jobForm.companyNewName, jobForm.location, isCreatingNewCompanyInline, jobs, rolesState]);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      // ✅ Use /api/market instead of /api/jobs for jobs data
      const [statsRes, marketRes, rolesRes, reportsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/market'),        // ✅ Changed from /api/jobs
        fetch('/api/admin/roles'),
        fetch('/api/reports')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          addedToday: statsData.addedToday,
          activeJobs: statsData.activeJobs,
          totalCompanies: statsData.totalCompanies,
          lastUpdated: statsData.lastUpdated
        });
        setActivityLogs(statsData.recentActivity || []);
      }

      if (marketRes.ok) {
        const marketData = await marketRes.json();
        setJobs(marketData.jobs || []);
        setCompaniesState(marketData.companies || []);
        // ✅ Also set roles from market data
        if (marketData.roles && marketData.roles.length > 0) {
          // Map to RoleDefinition format
          const roleDefinitions = marketData.roles.map((name: string, idx: number) => ({
            id: `role-${idx}`,
            title: name,
            mappedTitles: [name.toLowerCase()],
            growth: Math.floor(Math.random() * 30) + 10
          }));
          setRolesState(roleDefinitions);
        }
      }

      if (rolesRes.ok) setRolesState(await rolesRes.json());
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

  // --- LOGO / IMAGE LOCAL FILE UPLOADER TO BASE64 ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, target: 'media' | 'company' | 'article') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get approximate sizing
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
        showFeedback('success', `Logo "${file.name}" cached successfully as inline Base64 artifact.`);
      } else if (target === 'article') {
        setNewRichMediaUrl(base64String);
        showFeedback('success', 'Article inline graphic cached to image buffer.');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- ACTION HANDLERS ---

  // 1. Ingest Job Telemetry
const handleIngestJob = async (e: FormEvent) => {
    e.preventDefault();
    
    // ✅ ADD THIS - Define targetCompany
    const targetCompany = isCreatingNewCompanyInline 
      ? jobForm.companyNewName 
      : jobForm.companySelected;

    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Editor permissions are strict. Editors cannot change the job index.');
      return;
    }

    if (!jobForm.title || (!isCreatingNewCompanyInline && !jobForm.companySelected) || (isCreatingNewCompanyInline && !jobForm.companyNewName)) {
      showFeedback('error', 'Please fill in the Job Title, Location, and correct Company selections.');
      return;
    }

    setActionLoading(true);
    try {
      if (duplicateWarning) {
        showFeedback('error', 'Duplicate insertion blocked to ensure dynamic list purity.');
        setActionLoading(false);
        return;
      }

      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobForm.title,
          role: jobForm.roleSelected,
          company: targetCompany,
          location: jobForm.location || 'Remote',
          url: jobForm.url,
          salary: jobForm.salary,
          country: selectedCountry,
          expiresAt: jobForm.expiresAt
        })
      });

      if (res.ok) {
        const addedJob = await res.json();
        setJobs(prev => [addedJob, ...prev]);
        showFeedback('success', `Ingested "${jobForm.title}" for ${targetCompany} successfully.`);
        
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
        setIsCreatingNewCompanyInline(false);
        
        await fetchSystemData();
      } else {
        const errObj = await res.json();
        showFeedback('error', `Insertion block: ${errObj.message || 'Validation error'}`);
      }
    } catch (err) {
      showFeedback('error', 'Failed to communicate with job ingestion stream.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleJobActive = async (id: string, currentStatus: boolean) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Staff editors cannot switch job active scopes.');
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, active: !currentStatus } : j));
        showFeedback('success', `Toggled job JR-${id.slice(0,4).toUpperCase()} status.`);
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Could not sync active parameter.');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Purge request rejected.');
      return;
    }

    if (!confirm("Are you sure you want to suspend this career telemetry listing?")) return;

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        showFeedback('success', 'Job record successfully purged from live indexes.');
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Failed delete operation.');
    }
  };

  // 2. Action: Corporate Node Management
// 2. Action: Corporate Node Management
const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;

    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Corporate index editing is blocked.');
      return;
    }

    // ✅ Check for duplicate company
    const duplicateExists = companiesState.some(
      c => c.name.toLowerCase() === companyForm.name.toLowerCase().trim()
    );

    if (duplicateExists) {
      showFeedback('error', `Company "${companyForm.name}" already exists in the corporate catalog.`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {  // ✅ Changed to /api/admin/companies
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyForm.name.trim(),
          url: companyForm.url,
          logoUrl: companyForm.logoUrl
        })
      });
      
      if (res.ok) {
        const added = await res.json();
        setCompaniesState(prev => [...prev, added]);
        setCompanyForm({ name: '', url: '', logoUrl: '' });
        showFeedback('success', `Created corporate profile for ${companyForm.name}.`);
        fetchSystemData(); // Refresh to get updated list
      } else {
        const errData = await res.json();
        showFeedback('error', errData.error || 'Failed to create company');
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
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });  // ✅ Changed endpoint
      if (res.ok) {
        setCompaniesState(prev => prev.filter(c => c.id !== id));
        showFeedback('success', 'Corporate node removed from active inventory.');
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Could not delete company profile.');
    }
  };
  
    
    
                                               


  const handleDeleteCompany = async (id: string) => {
    if (userRole === 'editor') {
      showFeedback('error', 'PERMISSION DENIED: Purge request rejected.');
      return;
    }

    if (!confirm("Remove this company and its associated index metadata? All active listings remain but will display default style marks.")) return;

    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompaniesState(prev => prev.filter(c => c.id !== id));
        showFeedback('success', 'Corporate node excised from active inventory.');
        fetchSystemData();
      }
    } catch (err) {
      showFeedback('error', 'Could not delete company profile.');
    }
  };

  // 3. Action: Roles Management
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

    if (!confirm("Expel this role mapping category? Future automated parse scripts will fallback on other active selectors.")) return;

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

  // 4. Action: Rich Text Article Builder
  const handleAddRichElement = () => {
    if (!newRichText.trim() && newRichType !== 'image') return;
    
    if (newRichType === 'list') {
      setRichLines(prev => [...prev, {
        type: 'list',
        text: newRichText,
        subItems: newRichSubList
      }]);
      setNewRichSubList([]);
      setNewRichSubItem('');
    } else if (newRichType === 'image') {
      setRichLines(prev => [...prev, {
        type: 'image',
        text: newRichAltText || 'Embedded analytical illustration',
        mediaUrl: newRichMediaUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'
      }]);
      setNewRichMediaUrl('');
      setNewRichAltText('');
    } else {
      setRichLines(prev => [...prev, {
        type: newRichType as 'h2' | 'p',
        text: newRichText
      }]);
    }
    
    setNewRichText('');
  };

  const handleAddSubItemToBuffer = () => {
    if (!newRichSubItem.trim()) return;
    setNewRichSubList(prev => [...prev, newRichSubItem.trim()]);
    setNewRichSubItem('');
  };

  const handlePostReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.roleSelected) {
      showFeedback('error', 'Report title and target role categorizations are required.');
      return;
    }

    setActionLoading(true);
    try {
      // Compile rich list to HTML structures automatically!
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

      const url = editingReportId ? `/api/reports/${editingReportId}` : '/api/reports';
      const method = editingReportId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportForm.title,
          role: reportForm.roleSelected,
          monthYear: reportForm.monthYear,
          excerpt: reportForm.excerpt || reportForm.title,
          content: compiledHtml,
          country: selectedCountry
        })
      });

      if (res.ok) {
        const msg = editingReportId 
          ? `Insight Report "${reportForm.title}" updated successfully!` 
          : `Insight Report "${reportForm.title}" published! All charts and corporate mappings are automatically injected.`;
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
        fetchSystemData();
        setActiveTab('dashboard');
      } else {
        showFeedback('error', 'Error saving report.');
      }
    } catch (err) {
      showFeedback('error', 'Network failure.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Action: Media Assets Catalog Upload

const handleUploadMedia = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFileBase64) {
      showFeedback('error', 'Select or drop an image file first.');
      return;
    }

    setActionLoading(true);
    try {
      // Get the file input element
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      if (!file) {
        // Fallback: use base64 if no file in input
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
        // Upload actual file
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

  // --- REPORTS MANAGER ACTIONS ---
  const handleLoadReportToEdit = (rep: Report) => {
    setEditingReportId(rep.id);
    setReportForm({
      title: rep.title,
      roleSelected: rep.role,
      monthYear: rep.monthYear || 'May 2026',
      excerpt: rep.excerpt || '',
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

  // 6. Action: Deduplication & Re-calc Pipeline Trigger
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

  // Colors dictionary for Recharts Cell rendering
  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  // Calculate dynamic charts from current live jobs list
  const getDynamicBarChartData = () => {
    // Group active jobs counts per role
    return rolesState.map(r => {
      const activeCount = jobs.filter(j => j.role.toLowerCase() === r.title.toLowerCase() && j.active).length;
      return {
        role: r.title,
        listings: activeCount || Math.floor(Math.random() * 5) + 1
      };
    });
  };

  const getDynamicPieChartData = () => {
    // Group categories
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

  // ✅ SHOW LOGIN FORM IF NOT AUTHENTICATED
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

  // ✅ MAIN ADMIN DASHBOARD (shown only when authenticated)
  return (
    <div className="space-y-8 pb-12 mt-4 text-white">
      
      {/* 🔐 Admin & Editor Permissions Banner Toggle */}
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

      {/* 🔮 Active Feedback Toast Marker */}
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
            
            {/* ✅ ADD LOGOUT BUTTON */}
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
            Deduplicate listings, map normalized roles, direct custom images, catalog company spotlights, and write dynamic charts insight articles.
          </p>
        </div>

        {/* Dynamic Aggregation Pipe Button */}
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

      {/* ---------------------------------------------------- */}
      {/* 📊 TAB 1: DASHBOARD OVERVIEW SECTION */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Main KPI metrics Row */}
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

          {/* Graphics Dashboard & Telemetry Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sector Breakdown Chart card */}
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

            {/* Pie distribution chart card */}
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
              
              {/* Custom Legends list */}
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
            
            {/* Trending top 5 Roles summary table */}
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

            {/* Recent activity log dashboard view */}
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

      {/* ---------------------------------------------------- */}
      {/* 📥 TAB 2: JOB INPUT SYSTEM */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'jobs' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Main insertion form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-sans text-stone-100">
                  <Briefcase size={16} className="text-blue-500" /> Ingest Real-Time Placement
                </h3>
                <p className="text-xs text-gray-500 mt-1">Automatic categorizations are applied based on keyword matching logic.</p>
              </div>

              <form onSubmit={handleIngestJob} className="space-y-4">
                
                {/* Job title */}
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

                {/* Automation highlight indicator */}
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

                {/* Duplicate block status */}
                {duplicateWarning && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[10px] font-mono leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 text-red-400 uppercase font-extrabold">
                      <AlertCircle size={12} /> DUPLICATE WARNING MATCH
                    </div>
                    <span className="text-gray-400">{duplicateWarning}</span>
                  </div>
                )}

                {/* Company Selection Mode Toggle */}
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
                  // Inline Company Creation Form
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
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

                    {/* Drag and Drop Custom Company logo inline */}
                    <div className="space-y-1">
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
                  // Selection from Database autocomplete/select
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

                {/* Category overriding */}
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Location parameters</label>
                    <input 
                      type="text" 
                      value={jobForm.location}
                      onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Remote / Silicon Valley"
                      className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Apply URL Careers</label>
                    <input 
                      type="url" 
                      value={jobForm.url}
                      onChange={(e) => setJobForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://company.com/apply"
                      className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white focus:outline-none"
                    />
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

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Job Expiry Date</label>
                  <input 
                    type="date" 
                    value={jobForm.expiresAt}
                    onChange={(e) => setJobForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white focus:outline-none cursor-pointer"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !!duplicateWarning}
                  className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {actionLoading ? "Processing Database insertion..." : "COMMIT PLACEMENT TELEMETRY"}
                </button>

              </form>
            </div>
          </div>

          {/* Recently Added Job postings catalog preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <Database size={13} className="text-blue-500" /> Real-Time placements directory ({jobs.length} total)
              </span>
              <span className="text-[10px] text-gray-500 font-mono">DEDUPLICATED STREAM</span>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 max-h-[600px] overflow-y-auto scrollbar-none">
              
              {jobs.map((job) => (
                <div 
                  key={job.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
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
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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

      {/* ---------------------------------------------------- */}
      {/* 🏢 TAB 3: COMPANY MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'companies' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Company creation form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-sans text-stone-100">
                  <Building2 size={16} className="text-blue-500" /> Establish Corporate Spotlight Node
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

                {/* Drag and Drop Custom Company logo block */}
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

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                >
                  {actionLoading ? "Uploading node parameters..." : "PUBLISH CORPORATE DOMAIN NODE"}
                </button>

              </form>
            </div>
          </div>

          {/* Active companies lists */}
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

                  <button
                    onClick={() => handleDeleteCompany(co.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-xl transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ⚙️ TAB 4: ROLES MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'roles' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Role modeling form */}
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

                  {/* Keyword Chips preview list */}
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

          {/* Active mapping lists */}
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
                    
                    {/* Display matching chip tags */}
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

      {/* ---------------------------------------------------- */}
      {/* 📰 TAB 5: REPORT CREATION SYSTEM */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'reports' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans"
        >
          {/* Editorial Settings Form & Published Reports */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
                  <FileText size={16} className="text-blue-500" />
                  {editingReportId ? "Edit Report Scope" : "Publish Scope Key"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Specify report parameters. Automatic charts and matching corporate listings will map dynamically.</p>
              </div>

              <div className="space-y-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Analysis Document Title</label>
                  <input 
                    type="text" 
                    value={reportForm.title}
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Software Developer Demand — June 2026"
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Role targeting</label>
                    <select
                      value={reportForm.roleSelected}
                      onChange={(e) => setReportForm(prev => ({ ...prev, roleSelected: e.target.value }))}
                      className="w-full bg-black/40 border border-white/15 px-3 py-2.5 rounded-2xl text-xs text-white focus:outline-none"
                    >
                      {rolesState.map(r => (
                        <option key={r.id} value={r.title}>{r.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Period Scope</label>
                    <input 
                      type="text" 
                      value={reportForm.monthYear}
                      onChange={(e) => setReportForm(prev => ({ ...prev, monthYear: e.target.value }))}
                      placeholder="e.g. June 2026"
                      className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-2xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Country scope */}
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Country Segment</span>
                  <span className="text-xs font-bold text-blue-400 uppercase bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/15">{selectedCountry}</span>
                </div>

                {/* Automation info box detailing dynamic injection */}
                <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-2xl text-[10px] font-mono text-gray-400 leading-relaxed">
                  <span className="text-blue-400 uppercase font-extrabold block mb-1">✓ DYNAMIC DATA INJECTION</span>
                  Our CMS automatically crawls active jobs to inject: <b>hiring companies vectors</b> with website linkages, <b>growth indexes</b>, and <b>demand metrics</b>.
                </div>

                <div className="flex gap-2">
                  {editingReportId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    onClick={handlePostReport}
                    disabled={actionLoading || !reportForm.title}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-stone-100 font-extrabold text-[11px] uppercase tracking-widest rounded-2xl shadow-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saving Draft..." : (editingReportId ? "UPDATE REPORT" : "PUBLISH REPORT")}
                  </button>
                </div>

              </div>
            </div>

            {/* Published reports management panel */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
                  <Layers size={14} className="text-violet-500" /> Published Reports ({reportsState.length})
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">Select any published document below to load into the rich formatted editor or withdraw.</p>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 select-scrollbar">
                {reportsState.map(rep => (
                  <div 
                    key={rep.id} 
                    className={`p-3 bg-black/30 border rounded-2xl flex items-center justify-between gap-3 transition-all hover:bg-white/[0.02] ${editingReportId === rep.id ? 'border-blue-500/50 bg-blue-500/[0.03]' : 'border-white/5'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{rep.title}</p>
                      <span className="inline-block text-[9px] text-gray-500 font-mono mt-0.5">{rep.monthYear} • {rep.role}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadReportToEdit(rep)}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                        title="Edit Report description via the TinyMCE rich editor"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReport(rep.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                        title="Delete Report permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {reportsState.length === 0 && (
                  <p className="text-xs text-gray-500 font-mono text-center py-6">No published intelligence documents.</p>
                )}
              </div>
            </div>
          </div>

          {/* Premium Visual Dynamic Article & Excerpt Multi-Mode Composer */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-stone-100">
                    <Sparkles size={16} className="text-blue-500 animate-pulse" /> TinyMCE Editorial Composer
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">This formatted area serves as the primary report description of the published article.</p>
                </div>

                {/* Switch editor mode tabs */}
                <div className="flex bg-black/60 p-1 border border-white/5 rounded-2xl font-mono text-[10px] font-bold">
                  {(['visual', 'code', 'preview'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditorMode(mode)}
                      className={`px-3 py-1.5 rounded-xl uppercase transition-all ${editorMode === mode ? 'bg-blue-600 text-stone-100 font-extrabold shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                      {mode === 'visual' && "Visual Editor"}
                      {mode === 'code' && "HTML Source"}
                      {mode === 'preview' && "Live article Preview"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toolbar Actions (Sticky for professional feel) */}
              <div className="p-2 bg-black/50 border border-white/10 rounded-2xl flex flex-wrap items-center gap-1 text-gray-300">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('bold', '', '<strong>', '</strong>')}
                  className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title="Make selection bold (<strong>)"
                >
                  <Bold size={13} /> Bold
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('italic', '', '<em>', '</em>')}
                  className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title="Make selection italic (<em>)"
                >
                  <Italic size={13} /> Italic
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('underline', '', '<u>', '</u>')}
                  className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title="Underline selection (<u>)"
                >
                  <Underline size={13} /> Underline
                </button>
                
                <span className="w-px h-6 bg-white/10 mx-1 block" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('formatBlock', 'H2', '<h2>', '</h2>')}
                  className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors font-sans text-xs font-extrabold"
                  title="Add major heading (<h2>)"
                >
                  H2 Primary
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('formatBlock', 'H3', '<h3>', '</h3>')}
                  className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors font-sans text-xs font-bold"
                  title="Add secondary heading (<h3>)"
                >
                  H3 Sub
                </button>

                <span className="w-px h-6 bg-white/10 mx-1 block" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('insertUnorderedList', '', '<ul>\n  <li>', '</li>\n  <li>Item 2</li>\n</ul>')}
                  className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title="Insert Bulleted List (<ul><li>)"
                >
                  <List size={13} /> Bullets
                </button>
                
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('insertUnorderedList', '', '<li>', '</li>')}
                  className="p-2 hover:bg-white/10 hover:text-white text-[10px] font-bold rounded-lg transition-colors"
                  title="Insert bullet item (<li>)"
                >
                  + Bullet Item
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('formatBlock', 'P', '<p class="text-gray-300 leading-relaxed mb-4">', '</p>')}
                  className="p-2 hover:bg-white/10 hover:text-white text-[10px] font-mono rounded-lg transition-colors"
                  title="Wrap in standardized responsive paragraph"
                >
                  &lt;p&gt; Para
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('formatBlock', 'BLOCKQUOTE', '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-4 italic text-stone-400">', '</blockquote>')}
                  className="p-2 hover:bg-white/10 hover:text-white text-[10px] font-bold rounded-lg transition-colors"
                  title="Insert Styled Blockquote Block"
                >
                  “ Quote
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('highlight', '', '<span class="text-blue-400 font-extrabold">', '</span>')}
                  className="p-2 hover:bg-white/10 hover:text-white text-[10px] font-bold text-blue-400 rounded-lg transition-colors"
                  title="Highlight selected text blue"
                >
                  Highlight tag
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarClick('insertHTML', '<hr class="border-white/5 my-6" />', '<hr class="border-white/5 my-6" />')}
                  className="p-2 hover:bg-white/10 hover:text-white text-[10px] font-bold rounded-lg transition-colors"
                  title="Insert structural line break divider"
                >
                  — Divider Line
                </button>
              </div>

              {/* Layout viewports based on selected mode */}
              <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-black/45">
                {editorMode === 'visual' && (
                  <div className="space-y-2 p-5 bg-black/20 min-h-[460px] flex flex-col justify-between">
                    <div
                      ref={visualEditorRef}
                      contentEditable={true}
                      onInput={handleVisualEditorInput}
                      onBlur={handleVisualEditorBlur}
                      placeholder="Start typing your report insights or insert pre-designed templates... Use formatting controls above to style in real-time."
                      className="w-full min-h-[380px] bg-transparent text-stone-200 text-sm leading-relaxed overflow-y-auto wysiwyg-editor text-left select-scrollbar max-h-[440px]"
                      style={{ outline: 'none' }}
                      id="excerpt-editor-visual"
                    />
                    <div className="text-[10px] text-gray-500 font-mono text-right flex items-center justify-between pt-2 border-t border-white/5">
                      <span>Pro-tip: Highlight visual words and press toolbar actions to style instantly like WordPress.</span>
                      <span>Length: {(reportForm.excerpt || '').length} characters</span>
                    </div>
                  </div>
                )}

                {editorMode === 'code' && (
                  <div className="space-y-2 p-4 min-h-[460px] flex flex-col justify-between bg-sky-950/5">
                    <textarea
                      id="excerpt-editor-textarea"
                      value={reportForm.excerpt}
                      onChange={(e) => setReportForm(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Input customized HTML elements, responsive styles grid, or embed tags..."
                      className="w-full min-h-[380px] bg-transparent text-blue-400 text-xs font-mono leading-relaxed focus:outline-none placeholder:text-gray-700 select-scrollbar max-h-[440px] resize-none"
                      autoComplete="off"
                    />
                    <div className="text-[10px] text-blue-600 font-mono text-right uppercase tracking-wider pt-2 border-t border-white/5">
                      ✓ html elements source buffer mode active
                    </div>
                  </div>
                )}

                {editorMode === 'preview' && (
                  <div className="w-full min-h-[460px] p-6 select-scrollbar overflow-y-auto max-h-[460px] bg-stone-900/10">
                    <div className="max-w-none text-stone-300 text-sm leading-loose uppercase newsletter-preview-outline">
                      <span className="text-[9px] font-mono text-gray-500 block mb-4 border-b border-white/5 pb-2 uppercase tracking-widest">
                        Interactive Live Preview (Responsive layout)
                      </span>
                      {reportForm.excerpt ? (
                        <div 
                          className="prose prose-invert max-w-none text-stone-300 space-y-4 excerpt-rich-content text-left"
                          dangerouslySetInnerHTML={{ __html: reportForm.excerpt }}
                        />
                      ) : (
                        <div className="text-center py-20 text-gray-500 font-mono text-xs">
                          THE NEWSLETTER DOCUMENT HAS NO EXCERPT CONTENT YET. USE VISUAL EDITOR TOOLS TO START COMPOSING.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ready to insert Premium editorial templates (TinyMCE friendly) */}
              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3.5">
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-stone-100 flex items-center gap-1">
                    <Compass size={14} className="text-blue-400" /> Professional Design Blueprints
                  </h4>
                  <p className="text-[10px] text-gray-500">Inject preset article structural blueprints right into the active document body segment:</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('insights')}
                    className="p-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-500/30 text-left rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="block text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors">Key Insights list</span>
                    <span className="block text-[9px] text-gray-500 font-mono mt-1">H2 header with structured metrics list</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('segmented')}
                    className="p-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-violet-500/30 text-left rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="block text-[11px] font-bold text-white group-hover:text-violet-400 transition-colors">Segment Analysis</span>
                    <span className="block text-[9px] text-gray-500 font-mono mt-1">Multi-level sub-headings and analytical text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('standard')}
                    className="p-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-500/30 text-left rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="block text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors">Clean Summary</span>
                    <span className="block text-[9px] text-gray-500 font-mono mt-1">Refined corporate demand paragraph vector</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🖼️ TAB 6: MEDIA MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'media' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Visual asset creation form */}
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

                {/* File input drag selector */}
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

          {/* Active media catalogs */}
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
                    
                    {/* Media metadata badge */}
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

                  {/* Absolute DELETE control */}
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
