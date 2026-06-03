import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

// ✅ Validation schema (simple but effective)
function validateJobData(data: any): { valid: boolean; errors: string[]; cleaned: any } {
  const errors: string[] = [];
  const cleaned: any = {};

  // Required fields
  if (!data.title || data.title.length < 3) {
    errors.push('Missing or invalid title');
  } else {
    cleaned.title = data.title.trim();
  }

  if (!data.company || data.company.length < 1) {
    errors.push('Missing company name');
  } else {
    cleaned.company = data.company.trim();
  }

  // Optional fields with fallbacks
  cleaned.location = data.location?.trim() || 'Remote';
  cleaned.salary = data.salary?.trim() || '';
  cleaned.role = data.role?.trim() || 'General';

  // ✅ Split description into structured sections (not raw HTML)
  cleaned.sections = {
    overview: data.description_raw || data.description || '',
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
  };

  return {
    valid: errors.length === 0 && !!cleaned.title,
    errors,
    cleaned
  };
}

// ✅ Generate safe HTML from structured sections
function renderJobDescription(sections: any): string {
  let html = '';

  if (sections.overview) {
    html += `<div class="mb-4"><p class="text-stone-300 leading-relaxed">${sections.overview}</p></div>`;
  }

  if (sections.responsibilities.length > 0) {
    html += `<div class="mb-4"><h4 class="text-white font-bold text-sm mb-2">Key Responsibilities</h4><ul class="list-disc pl-5 space-y-1 text-stone-300 text-sm">`;
    sections.responsibilities.forEach((r: string) => {
      html += `<li>${r}</li>`;
    });
    html += `</ul></div>`;
  }

  if (sections.requirements.length > 0) {
    html += `<div class="mb-4"><h4 class="text-white font-bold text-sm mb-2">Requirements</h4><ul class="list-disc pl-5 space-y-1 text-stone-300 text-sm">`;
    sections.requirements.forEach((r: string) => {
      html += `<li>${r}</li>`;
    });
    html += `</ul></div>`;
  }

  if (sections.benefits.length > 0) {
    html += `<div class="mb-4"><h4 class="text-white font-bold text-sm mb-2">Benefits</h4><ul class="list-disc pl-5 space-y-1 text-stone-300 text-sm">`;
    sections.benefits.forEach((b: string) => {
      html += `<li>${b}</li>`;
    });
    html += `</ul></div>`;
  }

  return html || `<p class="text-stone-300">${sections.overview || 'No description available.'}</p>`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GROQ_API_KEY } = context.env;

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'AI service not configured' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body: any = await context.request.json();
    const rawText = body.text?.trim();

    if (!rawText || rawText.length < 20) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Please provide at least 20 characters of job description' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Retry logic (2 attempts)
    let aiContent = '';
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !aiContent) {
      attempts++;
      
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a job post parser. Extract structured data from job descriptions.

Return ONLY valid JSON (no markdown, no explanations) with these fields:
{
  "title": "Exact job title",
  "company": "Company name",
  "location": "Location or Remote",
  "salary": "Salary range if mentioned",
  "role": "Category (e.g., Software Developer, Accountant, Manager)",
  "description_raw": "Brief overview paragraph (plain text, no HTML)",
  "responsibilities": ["duty 1", "duty 2"],
  "requirements": ["requirement 1", "requirement 2"],
  "benefits": ["benefit 1", "benefit 2"]
}

If you cannot determine a field, use empty string or empty array.`
            },
            {
              role: 'user',
              content: rawText.substring(0, 4000) // Limit input size
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      const data: any = await groqResponse.json();
      
      if (data.choices && data.choices[0]) {
        aiContent = data.choices[0].message.content || '';
      }
    }

    if (!aiContent) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI could not process this job description. Please fill manually.',
        raw: rawText.substring(0, 500)
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ✅ Parse JSON safely
    let parsed: any = null;
    try {
      const cleanContent = aiContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseErr) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI returned invalid format. Please try again.',
        raw: aiContent.substring(0, 500),
        debug: 'parse_failed'
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ✅ Validate and clean data
    const validation = validateJobData(parsed);
    
    if (!validation.valid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI could not extract required fields (title, company)',
        details: validation.errors,
        partial: validation.cleaned,
        debug: 'validation_failed'
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ✅ Render safe HTML from structured sections
    const descriptionHtml = renderJobDescription(validation.cleaned.sections);

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: validation.cleaned.title,
        company: validation.cleaned.company,
        location: validation.cleaned.location,
        salary: validation.cleaned.salary,
        role: validation.cleaned.role,
        description: descriptionHtml,  // Safe HTML generated by US
        sections: validation.cleaned.sections,  // Raw sections for reference
      },
      attempts
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Groq API error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'AI service temporarily unavailable. Please fill manually.',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
