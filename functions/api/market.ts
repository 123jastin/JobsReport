import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// ✅ Currency symbols mapping
const currencySymbols: Record<string, string> = {
  'TZS': 'TSh', 'KES': 'KSh', 'UGX': 'USh', 'RWF': 'RF', 'BIF': 'FBu',
  'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'NGN': '₦',
  'GHS': 'GH₵', 'ZMW': 'ZK', 'MWK': 'MK', 'AED': 'د.إ', 'SAR': '﷼'
};

// ✅ Format salary for display
function formatSalary(job: any): string {
  if (job.salary) return job.salary;
  
  const symbol = currencySymbols[job.salary_currency] || '';
  const min = job.salary_min ? Number(job.salary_min).toLocaleString() : '';
  const max = job.salary_max ? Number(job.salary_max).toLocaleString() : '';
  
  if (min && max) return `${symbol} ${min} - ${max}`;
  if (min) return `${symbol} ${min}+`;
  return '';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // 1. Get all active jobs with full schema data
    const jobsResult = await DB.prepare(`
      SELECT 
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits,
        j.salary_min, j.salary_max, j.salary_currency,
        j.city, j.region, j.postcode, j.canonical_url,
        r.name as role,
        c.name as company, c.logo_url, c.website,
        j.location, j.apply_url, j.salary,
        j.posted_at, j.expires_at, j.is_active
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 100
    `).all();

    // ✅ Map jobs with all fields
    const jobs = await Promise.all(
      jobsResult.results.map(async (job: any) => {
        // Fetch files with SEO metadata
        let images: any[] = [];
        try {
          const imagesResult = await DB.prepare(
            'SELECT url, thumbnail_url, name, type, seo_title, seo_description FROM job_images WHERE job_id = ? ORDER BY sort_order'
          ).bind(job.id).all();
          images = (imagesResult.results || []).map((img: any) => ({
            url: img.url,
            thumbnail: img.thumbnail_url || img.url,
            name: img.name,
            type: img.type || 'image',
            seoTitle: img.seo_title || img.name || '',
            seoDescription: img.seo_description || ''
          }));
        } catch (err) {
          images = [];
        }

        return {
          // Basic info
          id: job.id,
          title: job.title,
          description: job.description || '',
          role: job.role,
          company: job.company,
          logoUrl: job.logo_url || '',
          companyWebsite: job.website || '',
          
          // Location
          location: job.location || 'Remote',
          city: job.city || '',
          region: job.region || '',
          country: job.postcode ? 'Tanzania' : 'Tanzania',
          postcode: job.postcode || '',
          
          // Application
          url: job.apply_url,
          salary: formatSalary(job),
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency || 'TZS',
          
          // Schema fields
          job_category: job.job_category || 'Other',
          industry: job.industry || '',
          employment_type: job.employment_type || 'FULL_TIME',
          workplace_type: job.workplace_type || 'Onsite',
          education_level: job.education_level || 'Any',
          experience_months: job.experience_months || 0,
          skills: (() => { try { return JSON.parse(job.skills || '[]'); } catch { return []; } })(),
          benefits: (() => { try { return JSON.parse(job.benefits || '[]'); } catch { return []; } })(),
          
          // SEO
          canonical_url: job.canonical_url || `https://jobsreport.online/market/${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
          slug: `${job.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${job.id}`,
          
          // Dates & Status
          postedAt: job.posted_at,
          expiresAt: job.expires_at,
          active: job.is_active === 1,
          
          // Attachments
          images: images
        };
      })
    );

    // 2. Get all roles
    const rolesResult = await DB.prepare('SELECT name FROM roles ORDER BY name').all();
    const roles = rolesResult.results.map((r: any) => r.name);

    // 3. Get all companies with website
    const companiesResult = await DB.prepare(
      'SELECT id, name, logo_url, website FROM companies ORDER BY name'
    ).all();
    const companies = companiesResult.results.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logo_url || '',
      url: c.website || ''
    }));

    // 4. Get recent activity
    const activityResult = await DB.prepare(`
      SELECT j.id, j.title, c.name as company, j.posted_at
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      ORDER BY j.posted_at DESC
      LIMIT 10
    `).all();
    const recentActivity = activityResult.results.map((activity: any) => ({
      id: activity.id,
      action: 'Job Ingested',
      details: `${activity.title} at ${activity.company}`,
      timestamp: activity.posted_at
    }));

    // 5. Get job categories for filters
    const categoriesResult = await DB.prepare(
      "SELECT DISTINCT job_category FROM jobs WHERE job_category != '' AND job_category != 'Other' AND is_active = 1"
    ).all();
    const jobCategories = categoriesResult.results.map((c: any) => c.job_category);

    // 6. Get workplace types for filters
    const workplaceResult = await DB.prepare(
      "SELECT DISTINCT workplace_type FROM jobs WHERE workplace_type != '' AND is_active = 1"
    ).all();
    const workplaceTypes = workplaceResult.results.map((w: any) => w.workplace_type);

    return new Response(JSON.stringify({
      jobs,
      roles,
      companies,
      recentActivity,
      jobCategories,
      workplaceTypes,
      stats: {
        totalJobs: jobs.length,
        totalCompanies: companies.length,
        totalRoles: roles.length,
        activeJobs: jobs.filter(j => j.active).length
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    console.error('Market API Error:', err);
    
    return new Response(JSON.stringify({
      jobs: [],
      roles: [],
      companies: [],
      recentActivity: [],
      jobCategories: [],
      workplaceTypes: [],
      stats: {
        totalJobs: 0,
        totalCompanies: 0,
        totalRoles: 0,
        activeJobs: 0
      },
      error: err instanceof Error ? err.message : 'Failed to load market data'
    }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
