import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GROQ_API_KEY } = context.env;

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'AI service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body: any = await context.request.json();
    const rawText = body.text?.trim();

    if (!rawText || rawText.length < 20) {
      return new Response(JSON.stringify({ success: false, error: 'Please provide at least 20 characters' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ========== STEP 1: Extract structured facts ==========
    let extractedFacts = '';
    let attempts = 0;
    
    while (attempts < 2 && !extractedFacts) {
      attempts++;
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'system',
            content: `Extract company facts from text. Return ONLY valid JSON. Use empty string "" for missing info, empty array [] for missing lists.

{
  "name": "Official company name",
  "industry": "Primary industry",
  "website": "Company website URL",
  "streetAddress": "Full street address",
  "area": "Area/neighborhood",
  "locality": "City",
  "district": "District",
  "postalCode": "Postal code",
  "postalArea": "Postal area name",
  "country": "Country code (TZ, KE, UG, RW, ZA, NG, GH)",
  "foundedYear": "Year founded",
  "employeeCount": "Number of employees or range",
  "services": ["Products or services mentioned"],
  "specialties": ["Areas of expertise"],
  "industriesServed": ["Industries they serve"],
  "entities": ["Brands, subsidiaries, technologies, locations mentioned"],
  "ownership": "Public, Private, Government, or Subsidiary"
}

Extract ONLY what is explicitly stated. Never invent facts.`
          }, { role: 'user', content: rawText.substring(0, 4000) }],
          temperature: 0.1, max_tokens: 1000,
        }),
      });

      const data: any = await groqResponse.json();
      if (data.choices?.[0]) extractedFacts = data.choices[0].message.content || '';
    }

    let facts: any = {};
    try {
      const cleanJson = extractedFacts
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      facts = JSON.parse(cleanJson);
    } catch {
      facts.name = rawText.substring(0, 80).split(/[.,\n]/)[0].replace(/Company Name[:|\s]*/i, '').trim();
    }

    // ========== STEP 2: Random style selection for uniqueness ==========
    const styles = [
      "business journalism style - concise and factual",
      "industry overview style - focusing on what the company does",
      "corporate snapshot style - brief but comprehensive",
      "professional directory style - clear and informative"
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    // Random paragraph count (3-4)
    const targetParagraphs = Math.floor(Math.random() * 2) + 3;

    // ========== STEP 3: Generate concise narrative description ==========
    let descriptionData: any = {};
    
    const descResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `You write company profiles for JobsReport.online, a job board serving Tanzania and East Africa.

Write a concise company profile in ${randomStyle}. Write ${targetParagraphs} paragraphs. Keep the entire profile between 150-300 words. Be informative but brief. Avoid filler content. Every sentence should add value.

CONTENT GUIDELINES:
- Explain what the company does, its industry, and core services
- Mention location, scale, and who they serve
- Describe their role in the industry or economy
- Write like a journalist explaining to someone unfamiliar with the company

WRITING RULES:
- Alternate between the company name and: "the company," "the organization," "the firm"
- Do NOT repeat the company name more than 3 times total
- Vary sentence length naturally
- Write smooth transitions between paragraphs
- Do NOT include website URLs (displayed elsewhere on page)
- Do NOT include address or contact details (shown in company header)

FORBIDDEN PHRASES (never use):
leading, best, top, trusted, world-class, premier, renowned, well-known, major player, key player, leading provider, innovative solutions, committed to excellence, cutting-edge, state-of-the-art, unparalleled, unmatched, foremost, industry-leading, market-leading

PLAIN TEXT ONLY. No HTML. No markdown. No headings. No URLs.

Return ONLY valid JSON:
{
  "description": "The full profile (150-300 words)",
  "shortDescription": "One sentence under 20 words",
  "metaTitle": "Company Name - Industry | JobsReport Company Profile",
  "metaDescription": "140-160 characters with company name, industry, location, and what they do"
}`
        }, { 
          role: 'user', 
          content: `Write a concise company profile using these facts:

Company: ${facts.name || ''}
Industry: ${facts.industry || ''}
Headquarters: ${[facts.locality, facts.district, facts.country].filter(Boolean).join(', ')}
Founded: ${facts.foundedYear || ''}
Employees: ${facts.employeeCount || ''}
Ownership: ${facts.ownership || ''}
Services: ${(facts.services || []).join(', ')}
Specialties: ${(facts.specialties || []).join(', ')}
Industries Served: ${(facts.industriesServed || []).join(', ')}
Entities: ${(facts.entities || []).join(', ')}

IMPORTANT: Keep the profile between 150-300 words. Do NOT mention website URL.

Reference information:
${rawText.substring(0, 3000)}`
        }],
        temperature: 0.8,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.4,
        max_tokens: 800,
      }),
    });

    const descRaw: any = await descResponse.json();
    if (descRaw.choices?.[0]) {
      let descContent = descRaw.choices[0].message.content || '';
      
      // Aggressive cleaning - remove JSON wrappers, HTML entities
      descContent = descContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      try {
        descriptionData = JSON.parse(descContent);
      } catch {
        // If JSON parse fails, extract what we can
        descriptionData = {
          description: descContent.replace(/[{}"]/g, '').substring(0, 800),
          shortDescription: '',
          metaTitle: `${facts.name || 'Company'} - ${facts.industry || ''} | JobsReport`,
          metaDescription: ''
        };
      }
    }

    // Fallback if no description generated or too short
    if (!descriptionData.description || descriptionData.description.length < 50) {
      descriptionData.description = rawText.substring(0, 500);
    }

    // Final cleanup function
    const cleanField = (str: string) => {
      if (!str) return '';
      return str
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        // Extracted facts
        name: facts.name?.trim() || '',
        industry: facts.industry?.trim() || '',
        website: facts.website?.trim() || '',
        streetAddress: facts.streetAddress?.trim() || '',
        area: facts.area?.trim() || '',
        locality: facts.locality?.trim() || '',
        district: facts.district?.trim() || '',
        postalCode: facts.postalCode?.trim() || '',
        postalArea: facts.postalArea?.trim() || '',
        country: facts.country?.trim() || 'TZ',
        foundedYear: facts.foundedYear?.trim() || '',
        employeeCount: facts.employeeCount?.trim() || '',
        ownership: facts.ownership?.trim() || '',
        services: facts.services || [],
        specialties: facts.specialties || [],
        industriesServed: facts.industriesServed || [],
        entities: facts.entities || [],
        // Generated content
        description: cleanField(descriptionData.description),
        shortDescription: cleanField(descriptionData.shortDescription) || '',
        metaTitle: cleanField(descriptionData.metaTitle) || `${facts.name} - ${facts.industry} | JobsReport`,
        metaDescription: cleanField(descriptionData.metaDescription) || '',
        // Metadata for debugging
        style: randomStyle,
        targetParagraphs: targetParagraphs,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Groq API error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'AI service unavailable',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
