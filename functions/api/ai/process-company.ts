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
            content: `Extract company facts from text. Return ONLY valid JSON. Use empty string "" for missing info.

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
  "employeeCount": "Number of employees",
  "services": ["List of products/services"],
  "specialties": ["Areas of expertise"],
  "industriesServed": ["Industries they serve"]
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

    // Build semantic keyword variations
    const nameVariations = facts.name 
      ? [
          facts.name,
          facts.name.replace(/Limited|Ltd|Inc|LLC|PLC|Corp|Corporation/gi, '').trim(),
          facts.name.split(' ')[0], // First word only
        ].filter((v, i, a) => v && a.indexOf(v) === i)
      : [];

    // ========== STEP 2: Generate unique, high-quality company profile ==========
    let descriptionData: any = {};
    
    const descResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `You are a business journalist writing for JobsReport.online, a job board serving Tanzania and East Africa.

Write a unique, comprehensive company profile using ONLY the provided facts. This content must be original and pass as human-written.

STRUCTURE (4 sections, 500-800 words total):

SECTION 1 - Company Overview (2 paragraphs):
- What the company does, its industry, and core business
- Where it operates and its headquarters location
- Use varied sentence structures
- Mix company name with semantic variations (e.g., "the company," "the firm," "the organization")

SECTION 2 - Products, Services & Operations (2 paragraphs):
- Detail their products and services
- Explain how they operate
- Industries they serve
- Scale of operations, workforce

SECTION 3 - Industry Role & Market Presence (1-2 paragraphs):
- The company's position in its industry
- Economic impact or contribution
- Geographic coverage
- Role in the local/national economy

SECTION 4 - Company Facts Summary:
- Quick reference facts listed clearly

WRITING RULES:
- ❌ NEVER use: "leading," "best," "top," "trusted," "world-class," "industry leader," "premier," "foremost"
- ❌ NEVER copy phrasing from company websites
- ❌ NEVER use HTML tags or entities (&nbsp; &amp; etc.)
- ✅ Vary sentence length (short, medium, long mixed together)
- ✅ Use active and passive voice naturally
- ✅ Use natural transitions between paragraphs
- ✅ Write like a journalist, not a marketer
- ✅ Include specific facts when available (numbers, years, locations)
- ✅ PLAIN TEXT only - no markdown, no HTML

Return ONLY valid JSON:
{
  "description": "Full company profile with all 4 sections",
  "shortDescription": "One sentence summary under 20 words",
  "metaTitle": "Company Name - Industry | JobsReport Company Profile",
  "metaDescription": "140-160 characters. Include company name, industry, location, and services."
}`
        }, { 
          role: 'user', 
          content: `Write a company profile using these facts:

Company: ${facts.name || ''}
Industry: ${facts.industry || ''}
Headquarters: ${[facts.streetAddress, facts.area, facts.locality, facts.district].filter(Boolean).join(', ')}
Country: ${facts.country || ''}
Founded: ${facts.foundedYear || ''}
Employees: ${facts.employeeCount || ''}
Website: ${facts.website || ''}
Services: ${(facts.services || []).join(', ')}
Specialties: ${(facts.specialties || []).join(', ')}
Industries Served: ${(facts.industriesServed || []).join(', ')}

Semantic variations to use naturally: ${nameVariations.join(', ')}

Source text for reference:
${rawText.substring(0, 3000)}`
        }],
        temperature: 0.6, max_tokens: 2000,
      }),
    });

    const descRaw: any = await descResponse.json();
    if (descRaw.choices?.[0]) {
      let descContent = descRaw.choices[0].message.content || '';
      
      // Aggressive cleaning
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
          description: descContent.replace(/[{}"]/g, '').substring(0, 1500),
          shortDescription: '',
          metaTitle: `${facts.name || 'Company'} - ${facts.industry || ''} | JobsReport`,
          metaDescription: ''
        };
      }
    }

    // Final cleanup
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
        shortDescription: cleanField(descriptionData.shortDescription) || '',
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
