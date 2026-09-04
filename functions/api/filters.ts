// functions/api/filters.ts
import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

let filtersCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  
  if (filtersCache && (Date.now() - filtersCache.timestamp) < CACHE_TTL) {
    return new Response(JSON.stringify(filtersCache.data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT'
      }
    });
  }

  try {
    const [
      categoriesResult,
      workplaceTypesResult,
      employmentTypesResult,
      companiesResult,
      locationsResult
    ] = await Promise.all([
      // Categories with active job counts
      DB.prepare(`
        SELECT 
          TRIM(job_category) as name,
          COUNT(*) as total_count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
        FROM jobs 
        WHERE TRIM(job_category) != '' 
          AND TRIM(job_category) != 'Other'
          AND is_active = 1
        GROUP BY TRIM(job_category)
        ORDER BY active_count DESC
        LIMIT 50
      `).all(),
      
      // Workplace types
      DB.prepare(`
        SELECT DISTINCT workplace_type 
        FROM jobs 
        WHERE workplace_type != '' 
          AND is_active = 1
        ORDER BY workplace_type
      `).all(),
      
      // Employment types
      DB.prepare(`
        SELECT DISTINCT employment_type 
        FROM jobs 
        WHERE employment_type != '' 
          AND is_active = 1
        ORDER BY employment_type
      `).all(),
      
      // Companies with active jobs
      DB.prepare(`
        SELECT DISTINCT c.id, c.name, c.logo_url, c.website, c.industry
        FROM companies c
        INNER JOIN jobs j ON c.id = j.company_id
        WHERE j.is_active = 1
        ORDER BY c.name
        LIMIT 100
      `).all(),
      
      // ✅ FIXED: Just return locations directly (no EXISTS subquery)
      DB.prepare(`
        SELECT name, region, country, postcode
        FROM locations
        ORDER BY name
        LIMIT 100
      `).all()
    ]);

    const filters = {
      categories: categoriesResult.results.map((c: any) => ({
        name: c.name,
        slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        activeCount: c.active_count
      })),
      workplaceTypes: workplaceTypesResult.results.map((w: any) => w.workplace_type),
      employmentTypes: employmentTypesResult.results.map((e: any) => e.employment_type),
      companies: companiesResult.results.map((c: any) => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logo_url || '',
        website: c.website || '',
        industry: c.industry || ''
      })),
      locations: locationsResult.results.map((l: any) => ({
        name: l.name,
        region: l.region || '',
        country: l.country || 'Tanzania',
        postcode: l.postcode || '',
        slug: l.name.toLowerCase().replace(/\s+/g, '-')
      }))
    };

    filtersCache = {
      data: filters,
      timestamp: Date.now()
    };

    return new Response(JSON.stringify(filters), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS'
      }
    });

  } catch (err) {
    console.error('Filters API Error:', err);
    return new Response(JSON.stringify({
      categories: [],
      workplaceTypes: [],
      employmentTypes: [],
      companies: [],
      locations: []
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  }
};
