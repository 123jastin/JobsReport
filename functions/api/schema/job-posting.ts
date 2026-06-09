import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const jobId = url.searchParams.get('id');

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const job = await DB.prepare(`
      SELECT j.*, r.name as role, c.name as company, c.logo_url, c.website
      FROM jobs j
      JOIN roles r ON j.role_id = r.id
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = ? AND j.is_active = 1
    `).bind(jobId).first();

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get attachments
    const attachments = await DB.prepare(
      'SELECT url, name, type FROM job_images WHERE job_id = ? ORDER BY sort_order'
    ).bind(jobId).all();

    // Parse skills and benefits
    const skills = (() => { try { return JSON.parse(job.skills || '[]'); } catch { return []; } })();
    const benefits = (() => { try { return JSON.parse(job.benefits || '[]'); } catch { return []; } })();

    // Build Google JobPosting schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": (job.description || '').replace(/<[^>]*>/g, '').substring(0, 5000),
      "identifier": {
        "@type": "PropertyValue",
        "name": "JobsReport",
        "value": job.id
      },
      "datePosted": job.posted_at,
      "validThrough": job.expires_at,
      "employmentType": job.employment_type || 'FULL_TIME',
      "jobLocationType": job.workplace_type === 'Remote' ? 'TELECOMMUTE' : undefined,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": job.website || '',
        "logo": job.logo_url || ''
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": job.street_address || '',       // ✅ Street address
          "addressLocality": job.city || job.location || '', // City
          "addressRegion": job.region || '',                 // Region
          "addressCountry": "TZ",                            // Country code
          "postalCode": job.postcode || ''                   // Postcode
        }
      },
      "baseSalary": job.salary_min ? {
        "@type": "MonetaryAmount",
        "currency": job.salary_currency || 'TZS',
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary_min,
          "maxValue": job.salary_max || job.salary_min,
          "unitText": "MONTH"
        }
      } : undefined,
      "educationRequirements": job.education_level && job.education_level !== 'Any' ? {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": job.education_level
      } : undefined,
      "experienceRequirements": job.experience_months > 0 ? {
        "@type": "OccupationalExperienceRequirements",
        "monthsOfExperience": job.experience_months
      } : undefined,
      "skills": skills.length > 0 ? skills.join(', ') : undefined,
      "jobBenefits": benefits.length > 0 ? benefits.join(', ') : undefined,
      "industry": job.industry || undefined,
      "occupationalCategory": job.job_category || undefined,
      "image": attachments.results
        ?.filter((a: any) => a.type === 'image')
        .map((a: any) => a.url)?.[0] || undefined
    };

    // Clean undefined values
    const cleanSchema = JSON.parse(JSON.stringify(schema));

    return new Response(JSON.stringify(cleanSchema), {
      headers: { 
        'Content-Type': 'application/ld+json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to generate schema' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
