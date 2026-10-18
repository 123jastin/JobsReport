// functions/api/users/[id]/jobs.ts
import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// ── Same helper as market.ts so display is identical ──
function formatSalary(
  job: any,
  currencies: Record<string, { symbol: string; name: string; flag?: string }>
): string {
  const currency = job.salary_currency || 'TZS';
  const currencyInfo = currencies[currency] || { symbol: currency, name: currency };
  const symbol = currencyInfo.symbol;

  const min = job.salary_min ? Number(job.salary_min).toLocaleString() : '';
  const max = job.salary_max ? Number(job.salary_max).toLocaleString() : '';

  if (min && max) return `${symbol} ${min} - ${max}`;
  if (min) return `${symbol} ${min}+`;
  if (max) return `${symbol} Up to ${max}`;
  if (job.salary && job.salary.trim()) return `${symbol} ${job.salary}`;
  return '';
}

const extractUserId = (context: any): string | null => {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/users/:id/jobs → ['api','users',':id','jobs']
  const idx = parts.lastIndexOf('jobs');
  const id = idx > 1 ? parts[idx - 1] : null;
  return id && id !== 'users' ? id : null;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const userId = extractUserId(context);

  if (!userId) {
    return new Response(
      JSON.stringify({
        jobs: [],
        stats: { totalJobs: 0 },
        error: 'Missing user id',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const url = new URL(context.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // ── 1. Count ──
    const totalResult: any = await DB.prepare(`
      SELECT COUNT(*) as total
      FROM jobs j
      WHERE j.user_id = ? AND j.is_active = 1
    `).bind(userId).all();

    const totalJobs = totalResult.results?.[0]?.total || 0;

    // ── 2. Jobs ──
    const jobsResult: any = await DB.prepare(`
      SELECT
        j.id, j.title, j.description,
        j.job_category, j.industry, j.employment_type, j.workplace_type,
        j.education_level, j.experience_months, j.skills, j.benefits,
        j.salary_min, j.salary_max, j.salary_currency,
        j.street_address, j.city, j.region, j.postcode, j.canonical_url,
        j.whatsapp_number, j.application_instructions,
        r.name AS role,
        c.name AS company, c.id AS company_id, c.logo_url, c.website,
        j.location, j.apply_url, j.salary,
        j.posted_at, j.expires_at, j.is_active, j.user_id
      FROM jobs j
      LEFT JOIN roles r ON j.role_id = r.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.user_id = ? AND j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    // ── 3. Currency lookup ──
    const currenciesResult: any = await DB.prepare(
      'SELECT code, name, symbol, flag FROM currencies ORDER BY name'
    ).all();

    const currenciesMap: Record<string, { symbol: string; name: string; flag?: string }> = {};
    for (const c of currenciesResult.results || []) {
      currenciesMap[c.code] = {
        symbol: c.symbol,
        name: c.name,
        flag: c.flag || '',
      };
    }

    // ── 4. Map to same shape as /api/market ──
    const jobs = (jobsResult.results || []).map((job: any) => {
      const currencyCode = job.salary_currency || 'TZS';
      const currencyInfo =
        currenciesMap[currencyCode] || { symbol: currencyCode, name: currencyCode };
      const titleSlug = job.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      return {
        id: job.id,
        title: job.title,
        description: job.description || '',
        role: job.role || 'General',
        company: job.company || 'Unknown',
        companyId: job.company_id,
        logoUrl: job.logo_url || '',
        companyWebsite: job.website || '',
        location: job.location || 'Remote',
        url: job.apply_url,
        salary: formatSalary(job, currenciesMap),
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: currencyCode,
        salary_currency_symbol: currencyInfo.symbol,
        salary_currency_name: currencyInfo.name,
        salary_currency_flag: currencyInfo.flag || '',
        job_category: job.job_category || 'Other',
        industry: job.industry || '',
        employment_type: job.employment_type || 'FULL_TIME',
        workplace_type: job.workplace_type || 'Onsite',
        education_level: job.education_level || 'Any',
        experience_months: job.experience_months || 0,
        skills: (() => {
          try {
            return JSON.parse(job.skills || '[]');
          } catch {
            return [];
          }
        })(),
        benefits: (() => {
          try {
            return JSON.parse(job.benefits || '[]');
          } catch {
            return [];
          }
        })(),
        canonical_url:
          job.canonical_url ||
          `https://jobsreport.online/market/${titleSlug}-${job.id}`,
        slug: `${titleSlug}-${job.id}`,
        postedAt: job.posted_at,
        expiresAt: job.expires_at,
        active: job.is_active === 1,
        user_id: job.user_id,
        whatsapp_number: job.whatsapp_number || '',
        application_instructions: job.application_instructions || '',
        city: job.city || '',
        region: job.region || '',
        country: job.country || 'Tanzania',
        images: [] as any[], // populated below if needed
      };
    });

    // ── 5. Attach images (batch) ──
    const jobIds = jobs.map((j: any) => j.id);
    if (jobIds.length > 0) {
      const placeholders = jobIds.map(() => '?').join(',');
      const imagesResult: any = await DB.prepare(
        `SELECT job_id, url, thumbnail_url, name, type, seo_title, seo_description
         FROM job_images
         WHERE job_id IN (${placeholders})
         ORDER BY sort_order`
      )
        .bind(...jobIds)
        .all();

      const imagesByJob: Record<string, any[]> = {};
      for (const img of imagesResult.results || []) {
        if (!imagesByJob[img.job_id]) imagesByJob[img.job_id] = [];
        imagesByJob[img.job_id].push({
          url: img.url,
          thumbnail: img.thumbnail_url || img.url,
          name: img.name,
          type: img.type || 'image',
          seoTitle: img.seo_title || img.name || '',
          seoDescription: img.seo_description || '',
        });
      }

      for (const job of jobs) {
        job.images = imagesByJob[job.id] || [];
      }
    }

    return new Response(
      JSON.stringify({
        jobs,
        stats: {
          totalJobs,
          page,
          limit,
          hasMore: offset + jobs.length < totalJobs,
        },
        userId,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (err) {
    console.error('User jobs API Error:', err);
    return new Response(
      JSON.stringify({
        jobs: [],
        stats: { totalJobs: 0, page: 1, limit: 100, hasMore: false },
        error: err instanceof Error ? err.message : 'Failed to load user jobs',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
