import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    // 1. Get all active jobs with role and company info
    const jobsResult = await DB.prepare(`
      SELECT 
        j.id,
        j.title,
        r.name as role,
        c.name as company,
        j.location,
        j.apply_url,
        j.salary,
        j.posted_at,
        j.expires_at,
        j.is_active,
        c.logo_url
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = 1
      ORDER BY j.posted_at DESC
      LIMIT 100
    `).all();

    // ✅ Map jobs and fetch files for each (images, PDFs, documents with type)
    const jobs = await Promise.all(
      jobsResult.results.map(async (job: any) => {
        // Fetch files for this job
        let images: any[] = [];
        try {
          const imagesResult = await DB.prepare(
            'SELECT url, thumbnail_url, name, type FROM job_images WHERE job_id = ? ORDER BY sort_order'
          ).bind(job.id).all();
          images = (imagesResult.results || []).map((img: any) => ({
            url: img.url,
            thumbnail: img.thumbnail_url || img.url,
            name: img.name,
            type: img.type || 'image'  // ✅ Include file type (image, pdf, document)
          }));
        } catch (err) {
          // Table might not exist yet
          images = [];
        }

        return {
          id: job.id,
          title: job.title,
          role: job.role,
          company: job.company,
          location: job.location || 'Remote',
          url: job.apply_url,
          salary: job.salary,
          postedAt: job.posted_at,
          expiresAt: job.expires_at,
          active: job.is_active === 1,
          logoUrl: job.logo_url || '',
          country: 'Tanzania',
          images: images  // ✅ Include files with type
        };
      })
    );

    // 2. Get all roles
    const rolesResult = await DB.prepare(`
      SELECT name FROM roles ORDER BY name
    `).all();
    
    const roles = rolesResult.results.map((r: any) => r.name);

    // 3. Get all companies with website
    const companiesResult = await DB.prepare(`
      SELECT id, name, logo_url, website FROM companies ORDER BY name
    `).all();

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

    return new Response(JSON.stringify({
      jobs,
      roles,
      companies,
      recentActivity,
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
