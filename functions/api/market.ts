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

// ✅ Currency names mapping
const currencyNames: Record<string, string> = {
  'TZS': 'Tanzanian Shilling', 'KES': 'Kenyan Shilling', 'UGX': 'Ugandan Shilling',
  'RWF': 'Rwandan Franc', 'USD': 'US Dollar', 'EUR': 'Euro',
  'GBP': 'British Pound', 'ZAR': 'South African Rand', 'NGN': 'Nigerian Naira',
  'GHS': 'Ghanaian Cedi', 'ZMW': 'Zambian Kwacha', 'MWK': 'Malawian Kwacha',
  'AED': 'UAE Dirham', 'SAR': 'Saudi Riyal'
};

// ✅ Format salary for display with proper currency symbol
function formatSalary(job: any): string {
  // If job has a display salary string, use it
  if (job.salary && job.salary.trim()) return job.salary;
  
  const symbol = currencySymbols[job.salary_currency] || job.salary_currency || '';
  const min = job.salary_min ? Number(job.salary_min).toLocaleString() : '';
  const max = job.salary_max ? Number(job.salary_max).toLocaleString() : '';
  
  if (min && max) return `${symbol} ${min} - ${max}`;
  if (min) return `${symbol} ${min}+`;
  if (max) return `${symbol} Up to ${max}`;
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
        j.street_address, j.city, j.region, j.country, j.postcode, j.canonical_url,
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
        } catch (err) { images = []; }

        // Format salary with proper currency
        const formattedSalary = formatSalary(job);
        const currencySymbol = currencySymbols[job.salary_currency] || '';

        return {
          // Basic info
          id: job.id,
          title: job.title,
          description: job.description || '',
          role: job.role,
          company: job.company,
          logoUrl: job.logo_url || '',
          companyWebsite: job.website || '',
          
          // Location (Google Schema)
          street_address: job.street_address || '',
          city: job.city || '',
          region: job.region || '',
          country: job.country || 'Tanzania',
          postcode: job.postcode || '',
          location: job.location || 'Remote',
          
          // Application
          url: job.apply_url,
          salary: formattedSalary,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency || 'TZS',
          salary_currency_symbol: currencySymbol,
          salary_currency_name: currencyNames[job.salary_currency] || job.salary_currency || 'TZS',
          
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
    const companiesResult = await DB.prepare('SELECT id, name, logo_url, website FROM companies ORDER BY name').all();
    const companies = companiesResult.results.map((c: any) => ({
      id: c.id, name: c.name, logoUrl: c.logo_url || '', url: c.website || ''
    }));

    // 4. Get recent activity
    const activityResult = await DB.prepare(`
      SELECT j.id, j.title, c.name as company, j.posted_at
      FROM jobs j JOIN companies c ON j.company_id = c.id
      ORDER BY j.posted_at DESC LIMIT 10
    `).all();
    const recentActivity = activityResult.results.map((a: any) => ({
      id: a.id, action: 'Job Ingested', details: `${a.title} at ${a.company}`, timestamp: a.posted_at
    }));

    // 5. Get job categories
    const categoriesResult = await DB.prepare(
      "SELECT DISTINCT job_category FROM jobs WHERE job_category != '' AND job_category != 'Other' AND is_active = 1"
    ).all();
    const jobCategories = categoriesResult.results.map((c: any) => c.job_category);

    // 6. Get workplace types
    const workplaceResult = await DB.prepare(
      "SELECT DISTINCT workplace_type FROM jobs WHERE workplace_type != '' AND is_active = 1"
    ).all();
    const workplaceTypes = workplaceResult.results.map((w: any) => w.workplace_type);

    return new Response(JSON.stringify({
      jobs, roles, companies, recentActivity, jobCategories, workplaceTypes,
      currencies: Object.keys(currencySymbols).map(code => ({
        code, symbol: currencySymbols[code], name: currencyNames[code] || code
      })),
      stats: {
        totalJobs: jobs.length, totalCompanies: companies.length,
        totalRoles: roles.length, activeJobs: jobs.filter(j => j.active).length
      }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }
    });

  } catch (err) {
    console.error('Market API Error:', err);
    return new Response(JSON.stringify({
      jobs: [], roles: [], companies: [], recentActivity: [], jobCategories: [], workplaceTypes: [], currencies: [],
      stats: { totalJobs: 0, totalCompanies: 0, totalRoles: 0, activeJobs: 0 },
      error: err instanceof Error ? err.message : 'Failed to load market data'
    }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
};
