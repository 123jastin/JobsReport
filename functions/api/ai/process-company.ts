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
  "country": "Country code (TZ, KE, UG, RW)",
  "foundedYear": "Year founded",
  "employeeCount": "Number of employees"
}

Extract ONLY from the text. Never invent.`
          }, { role: 'user', content: rawText.substring(0, 4000) }],
          temperature: 0.1, max_tokens: 800,
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

    // ========== STEP 2: Generate clean company description ==========
    let descriptionData: any = {};
    
    const descResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `Write a factual company profile. 

Follow this EXACT structure and return ONLY valid JSON:

{
  "description": "Three paragraphs. Paragraph 1: What the company does and its industry. Paragraph 2: Services, operations, and scale. Paragraph 3: Impact and market presence. Use ONLY facts from the source. Write in clear English. Do NOT use &nbsp; or HTML entities. Just plain text with spaces.",
  "shortDescription": "One sentence summary under 25 words",
  "metaTitle": "Company Name - Industry | JobsReport",
  "metaDescription": "Under 160 characters. Include company name, what they do, and location."
}

RULES:
- NO HTML tags or entities
- NO marketing fluff (leading, best, top, trusted)
- PLAIN TEXT only
- Use ONLY facts from the source
- 250-400 words for description`
        }, { 
          role: 'user', 
          content: `Source information:\n${rawText.substring(0, 3000)}`
        }],
        temperature: 0.3, max_tokens: 1200,
      }),
    });

    const descRaw: any = await descResponse.json();
    if (descRaw.choices?.[0]) {
      let descContent = descRaw.choices[0].message.content || '';
      
      // ✅ Aggressive cleaning
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
        // If JSON parse fails, use raw text as description
        descriptionData = {
          description: descContent.replace(/[{}"]/g, '').substring(0, 1000),
          shortDescription: '',
          metaTitle: `${facts.name || 'Company'} - ${facts.industry || 'Company'} | JobsReport`,
          metaDescription: ''
        };
      }
    }

    // ✅ Final cleanup - remove any remaining HTML entities
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
        name: facts.name?.trim() || '',
        industry: facts.industry?.trim() || '',
        description: cleanField(descriptionData.description) || rawText.substring(0, 500),
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
