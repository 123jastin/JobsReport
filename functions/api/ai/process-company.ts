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
  "nearbyLocations": ["Nearby landmarks, cities, or regions mentioned"],
  "keyEntities": ["Important people, brands, subsidiaries, technologies mentioned"],
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

    // Build location context for richer writing
    const locationContext = [
      facts.locality,
      facts.district,
      facts.area,
      facts.country,
      ...(facts.nearbyLocations || [])
    ].filter(Boolean).join(', ');

    // ========== STEP 2: Random encyclopedia style ==========
    const styles = [
      "Wikipedia-style encyclopedia entry",
      "Britannica-style reference article",
      "business directory factual summary",
      "industry publication company overview"
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    // ========== STEP 3: Generate encyclopedia-style description ==========
    let descriptionData: any = {};
    
    const descResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `Write an "About" section for ${facts.name || 'a company'} in ${randomStyle}. 

Length: 150-300 words. Write naturally without headings.

STRUCTURE (vary naturally, do not label sections):
- Begin by explaining what the company is and where it is located
- Describe its services, customers, and role within its industry
- Explain why its location matters to its operations, mentioning nearby places naturally
- End with its significance or impact within its sector

WRITING RULES:
- Write as if for Wikipedia or Britannica
- Vary sentence length and structure throughout
- Do NOT use "the company," "the organization," "the firm" repeatedly
- Do NOT repeat the company name more than 3 times
- Do NOT summarize facts mechanically like a checklist
- Do NOT mention employee count unless central to understanding the business
- Do NOT include website URLs
- Do NOT use marketing or promotional language
- Mention locations, landmarks, regions, and entities naturally

FORBIDDEN PHRASES (never use):
the company, the firm, the organization, the business (use sparingly or not at all)
leading, best, top, trusted, world-class, premier, renowned, well-known
major player, key player, leading provider, innovative solutions
committed to excellence, cutting-edge, state-of-the-art, unparalleled

PLAIN TEXT ONLY. No HTML. No markdown. No headings. No URLs.

Return ONLY valid JSON:
{
  "description": "The encyclopedia-style description (150-300 words)",
  "shortDescription": "One sentence under 20 words",
  "metaTitle": "Company Name - Industry | JobsReport Company Profile",
  "metaDescription": "140-160 characters with company name, industry, location, and what they do"
}`
        }, { 
          role: 'user', 
          content: `Write an encyclopedia-style "About" section for:

Company: ${facts.name || ''}
Industry: ${facts.industry || ''}
Location context: ${locationContext}
Founded: ${facts.foundedYear || ''}
Services: ${(facts.services || []).join(', ')}
Specialties: ${(facts.specialties || []).join(', ')}
Industries Served: ${(facts.industriesServed || []).join(', ')}
Nearby Locations: ${(facts.nearbyLocations || []).join(', ')}
Key Entities: ${(facts.keyEntities || []).join(', ')}

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
        descriptionData = {
          description: descContent.replace(/[{}"]/g, '').substring(0, 800),
          shortDescription: '',
          metaTitle: `${facts.name || 'Company'} - ${facts.industry || ''} | JobsReport`,
          metaDescription: ''
        };
      }
    }

    if (!descriptionData.description || descriptionData.description.length < 50) {
      descriptionData.description = rawText.substring(0, 500);
    }

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
        nearbyLocations: facts.nearbyLocations || [],
        keyEntities: facts.keyEntities || [],
        // Generated content
        description: cleanField(descriptionData.description),
        shortDescription: cleanField(descriptionData.shortDescription) || '',
        metaTitle: cleanField(descriptionData.metaTitle) || `${facts.name} - ${facts.industry} | JobsReport`,
        metaDescription: cleanField(descriptionData.metaDescription) || '',
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
