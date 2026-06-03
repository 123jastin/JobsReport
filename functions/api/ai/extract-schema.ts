import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
  DB: D1Database;
};

// ✅ Location database lookup
async function lookupLocation(DB: D1Database, location: string) {
  // Check if we have this location in our database
  const existing = await DB.prepare(
    'SELECT * FROM locations WHERE LOWER(name) = LOWER(?) OR LOWER(region) = LOWER(?)'
  ).bind(location, location).first();

  if (existing) {
    return {
      city: existing.name,
      region: existing.region,
      country: existing.country || 'Tanzania',
      postcode: existing.postcode || ''
    };
  }

  // Default for unknown locations
  return {
    city: location,
    region: '',
    country: 'Tanzania',
    postcode: ''
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GROQ_API_KEY, DB } = context.env;

  try {
    const body: any = await context.request.json();
    const { title, description, location, company } = body;

    // ✅ Call Groq for schema extraction
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'system',
          content: `Extract structured job schema data. Return ONLY valid JSON:
{
  "job_category": "one of: Accounting, Engineering, Healthcare, Hospitality, Marketing, IT, Education, Finance, Legal, Other",
  "industry": "industry sector",
  "employment_type": "FULL_TIME|PART_TIME|CONTRACT|TEMPORARY|INTERNSHIP",
  "workplace_type": "Onsite|Remote|Hybrid",
  "education_level": "High School|Diploma|Bachelor|Master|PhD|Any",
  "experience_months": number,
  "skills": ["skill1", "skill2"],
  "benefits": ["benefit1", "benefit2"],
  "salary_min": number_or_null,
  "salary_max": number_or_null,
  "salary_currency": "TZS|USD|EUR"
}`
        }, {
          role: 'user',
          content: `Title: ${title}\nCompany: ${company}\nLocation: ${location}\nDescription: ${description?.substring(0, 2000)}`
        }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    const data: any = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let schema: any = {};
    try {
      schema = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      schema = {};
    }

    // ✅ Lookup location from database
    const locationData = await lookupLocation(DB, location || '');

    // ✅ Generate SEO slug
    const slug = title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // ✅ Auto-generate canonical URL
    const canonicalUrl = `https://jobsreport.online/market/${slug}-${Date.now().toString(36)}`;

    return new Response(JSON.stringify({
      success: true,
      schema: {
        // AI extracted
        job_category: schema.job_category || 'Other',
        industry: schema.industry || '',
        employment_type: schema.employment_type || 'FULL_TIME',
        workplace_type: schema.workplace_type || 'Onsite',
        education_level: schema.education_level || 'Any',
        experience_months: schema.experience_months || 0,
        skills: schema.skills || [],
        benefits: schema.benefits || [],
        salary_min: schema.salary_min || null,
        salary_max: schema.salary_max || null,
        salary_currency: schema.salary_currency || 'TZS',
        
        // Database lookup
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        postcode: locationData.postcode,
        
        // System generated
        slug: slug,
        canonical_url: canonicalUrl,
        date_posted: new Date().toISOString().split('T')[0],
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Schema extraction failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
