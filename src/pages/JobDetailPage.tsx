import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import {
  Building2, MapPin, Clock, ExternalLink, ArrowLeft,
  FileText, Eye, ChevronLeft, ChevronRight, X, Download,
  Briefcase, Calendar, Globe, Share2, AlertCircle, Flag
} from 'lucide-react';
import { useCareerRedirect } from '../context/CareerRedirectContext';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { triggerRedirect } = useCareerRedirect();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerFiles, setViewerFiles] = useState<any[]>([]);

  const isExpired = job ? (
    job.active === false || 
    (job.expiresAt && new Date(job.expiresAt) < new Date())
  ) : false;

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          setAllJobs(data.jobs || []);
          const jobIdMatch = jobId?.match(/job-([a-z0-9]+)$/i);
          const extractedId = jobIdMatch ? `job-${jobIdMatch[1]}` : jobId;
          let found = data.jobs?.find((j: any) => j.id === extractedId);
          if (!found && jobId) {
            found = data.jobs?.find((j: any) => 
              jobId.includes(j.id) || j.id.includes(extractedId || '')
            );
          }
          if (found && data.companies) {
            const company = data.companies.find(
              (c: any) => c.name?.toLowerCase() === found.company?.toLowerCase()
            );
            if (company?.url) found.companyWebsite = company.url;
          }
          setJob(found || null);
          if (found) document.title = `${found.title} - ${found.company} | JobsReport`;
        }
      } catch (err) { console.error('Failed to load job:', err); }
      finally { setLoading(false); }
    }
    if (jobId) loadJob();
    window.scrollTo(0, 0);
  }, [jobId]);

  const getRelatedJobs = () => {
    if (!job || allJobs.length === 0) return [];
    const related = allJobs.filter(j => 
      j.id !== job.id && (j.role === job.role || j.company === job.company || j.job_category === job.job_category)
    );
    if (related.length < 6) {
      const remaining = allJobs.filter(j => j.id !== job.id && !related.find(r => r.id === j.id)).slice(0, 6 - related.length);
      related.push(...remaining);
    }
    return related.slice(0, 6);
  };

  const relatedJobs = getRelatedJobs();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Job Not Found</h2>
        <p className="text-gray-400 mb-6">This listing may have been removed or expired.</p>
        <Link to="/market" className="text-blue-500 hover:underline font-bold uppercase tracking-wider text-sm">← Back to Market</Link>
      </div>
    );
  }

  const hasFiles = job.images && job.images.length > 0;
  const hasDescription = job.description && job.description.trim() !== '';
  const isEmailLink = job.url && job.url.startsWith('mailto:');
  const salaryDisplay = job.salary || null;
  const currencyFlag = job.salary_currency_flag || '🇹🇿';
  const jobUrl = job.slug ? `https://jobsreport.online/market/${job.slug}` : `https://jobsreport.online/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`;

  return (
    <div className="min-h-screen bg-black text-white">
      
      <SEO
        title={isExpired ? `${job.title} - ${job.company} (Expired) | JobsReport` : `${job.title} - ${job.company} | JobsReport`}
        description={`${job.title} at ${job.company} in ${job.location || 'Remote'}. ${isExpired ? 'This job listing has expired.' : 'Apply now!'} ${job.role || ''} ${job.salary ? '• ' + job.salary : ''}`}
        canonicalUrl={jobUrl}
        ogTitle={`${job.title} - ${job.company}`}
        ogDescription={`${job.title} at ${job.company} in ${job.location || 'Remote'}. ${job.salary || ''} Apply now on JobsReport.`}
        ogUrl={jobUrl}
        ogImage={job.logoUrl || undefined}
      />

      <script type="application/ld+json">
        {JSON.stringify(isExpired ? {
          "@context":"https://schema.org","@type":"WebPage","name":`${job.title} at ${job.company} (Expired)`,"description":`${job.title} at ${job.company}. Expired.`,"url":jobUrl
        } : {
          "@context":"https://schema.org","@type":"JobPosting","title":job.title,"description":(job.description||'').replace(/<[^>]*>/g,'').substring(0,5000),
          "identifier":{"@type":"PropertyValue","name":"JobsReport","value":job.id},
          "datePosted":job.postedAt,"validThrough":job.expiresAt||new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0],
          "employmentType":job.employment_type||'FULL_TIME',
          "hiringOrganization":{"@type":"Organization","name":job.company,"sameAs":job.companyWebsite||'',"logo":job.logoUrl||''},
          "jobLocation":{"@type":"Place","address":{"@type":"PostalAddress","streetAddress":job.street_address||'',"addressLocality":job.city||job.location||'',"addressRegion":job.region||'',"addressCountry":"TZ","postalCode":job.postcode||''}},
          "baseSalary":(job.salary_min||job.salary_max)?{"@type":"MonetaryAmount","currency":(job.salary_currency||'TZS').toUpperCase(),"value":{"@type":"QuantitativeValue","minValue":Number(job.salary_min||job.salary_max),"maxValue":Number(job.salary_max||job.salary_min),"unitText":"MONTH"}}:undefined,
          "educationRequirements":(job.education_level&&job.education_level!=='Any')?{"@type":"EducationalOccupationalCredential","credentialCategory":job.education_level}:undefined,
          "experienceRequirements":job.experience_months>0?{"@type":"OccupationalExperienceRequirements","monthsOfExperience":Number(job.experience_months)}:undefined,
          "skills":Array.isArray(job.skills)&&job.skills.length>0?job.skills.join(', '):undefined,
          "jobBenefits":Array.isArray(job.benefits)&&job.benefits.length>0?job.benefits.join(', '):undefined,
          "industry":job.industry||undefined,"occupationalCategory":job.job_category||job.role||undefined,"url":jobUrl
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
          {"@type":"ListItem","position":1,"name":"Home","item":"https://jobsreport.online"},
          {"@type":"ListItem","position":2,"name":"Market","item":"https://jobsreport.online/market"},
          {"@type":"ListItem","position":3,"name":job.title,"item":jobUrl}
        ]})}
      </script>
      
      {/* TOP NAVIGATION BAR */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/market" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Market</span>
          </Link>
          <div className="flex items-center gap-3">
            {isExpired && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">Expired</span>}
            <button onClick={() => { if(navigator.share){navigator.share({title:job.title,url:window.location.href})}else{navigator.clipboard.writeText(window.location.href)} }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Share2 size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* HERO HEADER */}
      <div className="px-4 py-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {job.logoUrl ? <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg">{job.company?.charAt(0)?.toUpperCase()||'?'}</div>}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">{job.company}</h2>
            {job.companyWebsite ? <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"><Globe size={11} />{(()=>{try{return new URL(job.companyWebsite).hostname.replace('www.','')}catch{return'Company Website'}})()}<ExternalLink size={10} /></a> : <span className="text-[11px] text-gray-600">No website listed</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{job.title}</h1>
          {isExpired && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase whitespace-nowrap">Expired</span>}
        </div>
        {isExpired && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-[11px] text-red-400/80">This job listing has expired. Applications are no longer accepted. Browse related jobs below.</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><MapPin size={13} /> {job.location||'Remote'}</span>
          {salaryDisplay && <span className="flex items-center gap-1.5 text-emerald-400 font-bold">💰 {salaryDisplay}</span>}
          <span className="flex items-center gap-1.5"><Briefcase size={13} /> {job.role}</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {job.postedAt||'Recent'}</span>
          {job.expiresAt && <span className={`flex items-center gap-1.5 ${isExpired?'text-red-400':'text-amber-400'}`}><Clock size={13} /> {isExpired?'Expired':'Expires'}: {job.expiresAt}</span>}
        </div>
      </div>

      {/* APPLY BUTTON */}
      <div className="sticky bottom-0 z-40 bg-black/95 backdrop-blur border-t border-white/5 px-4 py-3">
        {job.url && !isExpired && (
          <p className="text-[10px] text-gray-500 text-center mb-2 truncate px-4">
            {isEmailLink?'📧 ':'🔗 '}{isEmailLink?job.url.replace('mailto:',''):(()=>{try{return new URL(job.url).hostname.replace('www.','')+new URL(job.url).pathname}catch{return job.url}})()}
          </p>
        )}
        <button onClick={()=>{if(!isExpired&&job.url){triggerRedirect(job.url,job.company,job.title)}}} disabled={isExpired||!job.url} className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isExpired?'bg-red-500/10 text-red-400 cursor-not-allowed':job.url?'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]':'bg-white/5 text-gray-600 cursor-not-allowed'}`}>
          {isExpired?'🚫 Application Closed':isEmailLink?'✉️ Send Application':'Apply Now'}
          {!isExpired && <ExternalLink size={16} />}
        </button>
      </div>

      {/* 🔴 FRAUD WARNING - Compact professional design */}
      <div className="mx-4 mt-3 px-4 py-3 rounded-xl border border-red-500/15 bg-red-500/[0.03] flex items-center gap-3">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-[11px] text-red-300/70 leading-relaxed flex-1">
          <span className="font-semibold text-red-400">Stay safe:</span> Never pay for job applications or employment offers. 
        </p>
        <a
          href={`mailto:jjovinatha@gmail.com?subject=Report%20Job&body=Please%20review%20this%20listing%3A%20${encodeURIComponent(jobUrl)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0"
        >
          <Flag size={11} />
          Report
        </a>
      </div>

      {/* JOB DESCRIPTION */}
      {hasDescription && (
        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Job Description</h3>
          <div className="text-stone-300 text-sm leading-relaxed space-y-4 job-description-content" dangerouslySetInnerHTML={{ __html: job.description }} />
        </div>
      )}
      {!hasDescription && (
        <div className="px-4 py-6 border-b border-white/5 text-center">
          <FileText size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No detailed description available for this listing.</p>
        </div>
      )}

      {/* AD #1 */}
      <AdBanner key={`ad1-${jobId}`} slot="4550717155" />

      {/* ATTACHMENTS */}
      {hasFiles && (
        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Eye size={16} className="text-blue-400" /> Attachments ({job.images.length})</h3>
          <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto scrollbar-none">
            {job.images.map((img: any, index: number) => {
              const isPDF = img.type === 'pdf' || img.name?.toLowerCase().endsWith('.pdf');
              const isDoc = img.type === 'document';
              return (
                <div key={index} onClick={() => { setViewerFiles(job.images); setViewerIndex(index); setViewerOpen(true); }} className="flex-shrink-0 w-24 h-24 md:w-full md:aspect-square rounded-xl overflow-hidden border border-white/5 bg-slate-900/50 cursor-pointer active:scale-95 transition-transform">
                  {isPDF ? <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 p-2"><span className="text-lg font-black text-red-400">PDF</span><span className="text-[7px] text-gray-400 mt-0.5 text-center truncate w-full">{img.name?.substring(0, 12)}</span></div> :
                   isDoc ? <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 p-2"><span className="text-lg font-black text-blue-400">DOC</span></div> :
                   <img src={img.thumbnail || img.url} alt={img.seoTitle || img.name || 'Attachment'} className="w-full h-full object-cover" loading="lazy" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JOB DETAILS */}
      <div className="px-4 py-6 border-b border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Job Details</h3>
        <div className="space-y-3">
          {[
            ['Status', isExpired ? 'Expired' : 'Active'],
            ['Company', job.company],
            ['Location', job.location || 'Remote'],
            ['Role', job.role],
            ['Salary', salaryDisplay ? `${currencyFlag} ${salaryDisplay}` : 'Not specified'],
            ['Category', job.job_category || 'General'],
            ['Employment Type', job.employment_type === 'FULL_TIME' ? 'Full Time' : (job.employment_type || 'Full Time')],
            ['Workplace', job.workplace_type || 'Onsite'],
            ['Education', job.education_level || 'Any'],
            ['Experience', job.experience_months ? `${job.experience_months} months` : 'Not specified'],
            ['Posted', job.postedAt || 'Recent'],
            ['Signal ID', `JR-${job.id?.slice(0, 8).toUpperCase()}`]
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-xs font-bold ${label === 'Status' ? (isExpired ? 'text-red-400' : 'text-green-400') : 'text-white'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AD #2 */}
      <AdBanner key={`ad2-${jobId}`} slot="1373889473" />

      {/* RELATED JOBS */}
      {relatedJobs.length > 0 && (
        <div className="px-4 py-8 border-t border-white/5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-500" />
            {isExpired ? 'Similar Active Jobs' : 'Related Jobs'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {isExpired ? 'This job has expired. Here are similar active opportunities.' : `Explore more ${job.role || ''} jobs similar to this one.`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relatedJobs.map((rj: any) => {
              const rjUrl = rj.slug ? `/market/${rj.slug}` : `/market/${rj.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${rj.id}`;
              const rjExpired = rj.active === false || (rj.expiresAt && new Date(rj.expiresAt) < new Date());
              return (
                <Link key={rj.id} to={rjUrl} className={`p-4 rounded-xl border transition-all group ${rjExpired ? 'border-white/5 bg-white/[0.005] opacity-60' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-blue-500/30'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors truncate pr-2">{rj.title}</div>
                    {rjExpired && <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded whitespace-nowrap">Expired</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Building2 size={11} />{rj.company}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{rj.location || 'Remote'}</span>
                  </div>
                  {rj.salary && <div className="text-[10px] text-emerald-400 mt-1.5 font-mono">{rj.salary}</div>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* AD #3 */}
      <AdBanner key={`ad3-${jobId}`} slot="5466053430" />

      {/* SHARE */}
      <div className="px-4 py-6">
        <button onClick={() => { if (navigator.share) { navigator.share({ title: job.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.04] text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
          <Share2 size={14} /> Share This Job
        </button>
      </div>

      <div className="h-20" />

      {/* FULLSCREEN VIEWER */}
      {viewerOpen && viewerFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 bg-black/90 shrink-0">
            <span className="text-white text-xs font-mono">{viewerIndex + 1} / {viewerFiles.length}</span>
            <div className="flex items-center gap-2">
              <a href={viewerFiles[viewerIndex]?.url} download className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg flex items-center gap-1"><Download size={12} /></a>
              <button onClick={() => setViewerOpen(false)} className="p-1.5 bg-white/10 rounded-full text-white"><X size={18} /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {viewerFiles[viewerIndex]?.type === 'pdf' || viewerFiles[viewerIndex]?.name?.endsWith('.pdf') ? (
              <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewerFiles[viewerIndex].url)}&embedded=true`} className="w-full h-full" style={{ border: 'none' }} />
            ) : (
              <img src={viewerFiles[viewerIndex]?.url} alt="" className="max-w-full max-h-full object-contain" />
            )}
          </div>
          <div className="flex justify-center gap-6 px-4 py-4 bg-black/90 shrink-0">
            <button onClick={() => setViewerIndex(Math.max(0, viewerIndex - 1))} disabled={viewerIndex === 0} className="p-2 text-white disabled:opacity-30"><ChevronLeft size={24} /></button>
            <button onClick={() => setViewerIndex(Math.min(viewerFiles.length - 1, viewerIndex + 1))} disabled={viewerIndex === viewerFiles.length - 1} className="p-2 text-white disabled:opacity-30"><ChevronRight size={24} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
