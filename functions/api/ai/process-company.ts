import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

// ========== IMPROVED COMPANY PROCESSOR ==========
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

    // ========== STEP 1: Extract structured facts from raw text ==========
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
            content: `You are a fact extractor. Extract ONLY what is explicitly stated in the text. Never invent information.

Return valid JSON:
{
  "name": "Official company name",
  "industry": "Primary industry (e.g., Telecommunications, Banking, Agriculture)",
  "website": "Company website URL if mentioned",
  "streetAddress": "Full street address with plot/building number",
  "area": "Area or neighborhood",
  "locality": "City",
  "district": "District",
  "postalCode": "Postal code",
  "postalArea": "Postal area name",
  "country": "Country code (TZ, KE, UG, RW, ZA, NG, GH)",
  "foundedYear": "Year founded",
  "employeeCount": "Number of employees or range",
  "services": ["List of products or services mentioned"],
  "specialties": ["Specific areas of expertise mentioned"]
}

Rules:
- Use empty string "" for missing information
- Empty array [] for missing lists
- Extract ONLY from the provided text
- Keep original names, numbers, and details as written`
          }, { role: 'user', content: rawText.substring(0, 4000) }],
          temperature: 0.1, max_tokens: 1000,
        }),
      });

      const data: any = await groqResponse.json();
      if (data.choices?.[0]) extractedFacts = data.choices[0].message.content || '';
    }

    let facts: any = {};
    try {
      const cleanJson = extractedFacts.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      facts = JSON.parse(cleanJson);
    } catch {
      facts.name = rawText.substring(0, 100).split(/[.,\n]/)[0].trim();
    }

    // ========== STEP 2: Generate structured, factual company description ==========
    let descriptionData: any = {};
    
    const descResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `You are a business journalist writing for JobsReport.online, a job board in Tanzania.

Write a factual, informative company profile. Follow this exact structure:

PARAGRAPH 1 (What the company does):
- Describe the company's core business, products, and services
- Mention the industry and sector

PARAGRAPH 2 (Operations and presence):
- Describe scale of operations, locations served, market presence
- Include workforce information if available

PARAGRAPH 3 (Impact and context):
- Describe the company's role in the industry or economy
- Mention business impact or mission if supported by facts

RULES:
- Write for users, not search engines
- NEVER use marketing claims: "leading employer," "best company," "top company," "trusted company," "world-class," "industry leader"
- Only include claims supported by the source text
- Use naturally occurring industry and location terms
- Keep language professional and factual
- Length: 250-500 words total across 3 paragraphs
- Write in clear, readable English

Return ONLY valid JSON:
{
  "description": "Full 3-paragraph company description",
  "shortDescription": "One-sentence summary (15-25 words)",
  "metaTitle": "Company Name - Industry | JobsReport Company Profile",
  "metaDescription": "SEO meta description (140-160 characters). Include company name, industry, location, and what they do."
}`
        }, { 
          role: 'user', 
          content: `Write a company profile based on these facts:

Company: ${facts.name || 'Company'}
Industry: ${facts.industry || ''}
Location: ${[facts.locality, facts.area, facts.district, facts.country].filter(Boolean).join(', ')}
Founded: ${facts.foundedYear || ''}
Employees: ${facts.employeeCount || ''}
Website: ${facts.website || ''}
Services: ${(facts.services || []).join(', ')}
Specialties: ${(facts.specialties || []).join(', ')}

Source information:
${rawText.substring(0, 3000)}`
        }],
        temperature: 0.4, max_tokens: 1200,
      }),
    });

    const descData: any = await descResponse.json();
    if (descData.choices?.[0]) {
      try {
        const cleanDescJson = descData.choices[0].message.content
          .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        descriptionData = JSON.parse(cleanDescJson);
      } catch {
        descriptionData.description = descData.choices[0].message.content?.trim() || '';
      }
    }

    // ========== RETURN COMPLETE DATA ==========
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
        services: facts.services || [],
        specialties: facts.specialties || [],
        // Generated content
        description: descriptionData.description || facts.description || rawText.substring(0, 500),
        shortDescription: descriptionData.shortDescription || '',
        metaTitle: descriptionData.metaTitle || `${facts.name} - ${facts.industry || 'Company'} | JobsReport`,
        metaDescription: descriptionData.metaDescription || `Learn about ${facts.name}, ${facts.industry || 'a company'} based in ${facts.locality || 'Tanzania'}. Company profile, services, and career information.`,
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
