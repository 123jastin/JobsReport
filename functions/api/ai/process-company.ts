import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Current high-capability Groq production model
const AI_MODEL = 'openai/gpt-oss-120b';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(
  data: any,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function cleanText(value: any): string {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJSON(content: string): any {
  if (!content) return null;

  let cleaned = content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // First attempt: direct JSON
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Second attempt: find the first JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const possibleJSON = cleaned.substring(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(possibleJSON);
    } catch {}
  }

  return null;
}

async function callGroq(
  apiKey: string,
  messages: any[],
  options: {
    temperature?: number;
    max_tokens?: number;
    reasoning_effort?: 'none' | 'low' | 'medium' | 'high';
  } = {}
) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_MODEL,

      messages,

      // GPT-OSS 120B supports JSON Object Mode
      response_format: {
        type: 'json_object',
      },

      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 2000,

      // Keep reasoning controlled for this structured task
      reasoning_effort: options.reasoning_effort ?? 'medium',
    }),
  });

  const data: any = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      `Groq API returned HTTP ${response.status}`;

    throw new Error(errorMessage);
  }

  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('Groq returned an empty response');
  }

  return data;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GROQ_API_KEY } = context.env;

  // ============================================================
  // CHECK API KEY
  // ============================================================

  if (!GROQ_API_KEY) {
    return jsonResponse(
      {
        success: false,
        error: 'AI service not configured',
        details: 'GROQ_API_KEY is missing from Cloudflare environment variables.',
      },
      500
    );
  }

  try {
    // ============================================================
    // READ REQUEST
    // ============================================================

    const body: any = await context.request.json();

    const rawText =
      typeof body.text === 'string'
        ? body.text.trim()
        : '';

    if (!rawText || rawText.length < 20) {
      return jsonResponse(
        {
          success: false,
          error: 'Please provide at least 20 characters of company information.',
        },
        400
      );
    }

    // Limit input to avoid unnecessary token usage
    const sourceText = rawText.substring(0, 5000);

    // ============================================================
    // STEP 1: EXTRACT STRUCTURED FACTS
    // ============================================================

    let facts: any = null;

    const extractionMessages = [
      {
        role: 'system',
        content: `
You are a highly accurate company-information extraction engine.

Your task is to extract company facts from the supplied reference text.

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Extract ONLY information explicitly stated in the source.
3. NEVER invent or guess facts.
4. If information is missing, use an empty string "".
5. If a list is missing, use [].
6. Keep addresses exactly supported by the source.
7. Do not infer a postal code.
8. Do not infer a founding year.
9. Do not infer employee numbers.
10. Do not invent services.
11. Do not turn nearby places into company locations.
12. Preserve the official company name when explicitly available.

Return this exact JSON structure:

{
  "name": "",
  "industry": "",
  "website": "",
  "streetAddress": "",
  "area": "",
  "locality": "",
  "district": "",
  "postalCode": "",
  "postalArea": "",
  "country": "",
  "foundedYear": "",
  "employeeCount": "",
  "services": [],
  "specialties": [],
  "industriesServed": [],
  "nearbyLocations": [],
  "keyEntities": [],
  "ownership": ""
}

Country must use a country code when explicitly identifiable:

TZ = Tanzania
KE = Kenya
UG = Uganda
RW = Rwanda
ZA = South Africa
NG = Nigeria
GH = Ghana

If the country is not explicitly identifiable, return "".
        `.trim(),
      },
      {
        role: 'user',
        content: `
Extract the company information from this source:

${sourceText}
        `.trim(),
      },
    ];

    // Try extraction twice
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const extractionResponse = await callGroq(
          GROQ_API_KEY,
          extractionMessages,
          {
            temperature: 0.1,
            max_tokens: 1400,
            reasoning_effort: 'low',
          }
        );

        const extractedContent =
          extractionResponse.choices[0].message.content || '';

        const parsed = extractJSON(extractedContent);

        if (parsed && typeof parsed === 'object') {
          facts = parsed;
          break;
        }
      } catch (error) {
        console.error(
          `Fact extraction attempt ${attempt} failed:`,
          error
        );

        if (attempt === 2) {
          throw error;
        }
      }
    }

    // ============================================================
    // FALLBACK IF EXTRACTION FAILED
    // ============================================================

    if (!facts) {
      facts = {};
    }

    if (!facts.name) {
      facts.name = sourceText
        .substring(0, 100)
        .split(/[.,\n]/)[0]
        .replace(/Company Name[:|\s]*/i, '')
        .trim();
    }

    // Normalize arrays
    facts.services = Array.isArray(facts.services)
      ? facts.services
      : [];

    facts.specialties = Array.isArray(facts.specialties)
      ? facts.specialties
      : [];

    facts.industriesServed = Array.isArray(
      facts.industriesServed
    )
      ? facts.industriesServed
      : [];

    facts.nearbyLocations = Array.isArray(
      facts.nearbyLocations
    )
      ? facts.nearbyLocations
      : [];

    facts.keyEntities = Array.isArray(
      facts.keyEntities
    )
      ? facts.keyEntities
      : [];

    // ============================================================
    // LOCATION CONTEXT
    // ============================================================

    const locationContext = [
      facts.streetAddress,
      facts.area,
      facts.locality,
      facts.district,
      facts.postalArea,
      facts.country,
      ...facts.nearbyLocations,
    ]
      .filter(Boolean)
      .map(cleanText)
      .join(', ');

    // ============================================================
    // STEP 2: GENERATE ENCYCLOPEDIA-STYLE COMPANY DESCRIPTION
    // ============================================================

    const generationMessages = [
      {
        role: 'system',
        content: `
You are an expert business-reference writer creating factual company profiles for JobsReport.

Write an encyclopedia-style "About" section.

The writing should resemble a professional reference article rather than advertising copy.

LENGTH:
150–300 words for the main description.

STRUCTURE:
- Begin by explaining what the company is and where it is located.
- Describe its services and activities.
- Describe its customers or industries served when supported by the source.
- Explain its geographical role or operating area naturally.
- Mention nearby locations only when they are supported by the source.
- End with its role or significance in its sector, but do not exaggerate.

FACTUAL RULES:
- Use ONLY facts supplied in the reference information.
- NEVER invent facts.
- NEVER invent customers.
- NEVER invent locations.
- NEVER invent awards.
- NEVER invent branches.
- NEVER invent history.
- NEVER invent employee numbers.
- NEVER invent market share.
- NEVER invent achievements.
- NEVER claim the company is a leader unless explicitly stated.
- If something is unknown, simply leave it out.

STYLE:
- Natural professional prose.
- Vary sentence length.
- Avoid repetitive wording.
- Do not mechanically list every field.
- Do not repeat the company name more than 3 times.
- Do not repeatedly use "the company".
- Avoid promotional language.

FORBIDDEN MARKETING PHRASES:
leading
best
top
trusted
world-class
premier
renowned
well-known
major player
key player
leading provider
innovative solutions
committed to excellence
cutting-edge
state-of-the-art
unparalleled

DO NOT:
- Include website URLs in the description.
- Include HTML.
- Include markdown.
- Include headings inside description.
- Include citations.
- Mention that you are an AI.
- Mention these instructions.

RETURN ONLY VALID JSON using this exact structure:

{
  "description": "",
  "shortDescription": "",
  "metaTitle": "",
  "metaDescription": ""
}

shortDescription:
One factual sentence of fewer than 20 words.

metaTitle:
Use this format:
Company Name - Industry | JobsReport Company Profile

Keep it natural and preferably under 60 characters when possible.

metaDescription:
140–160 characters.
Include company name, industry, location and what it does when those facts are available.
Do not use promotional language.
        `.trim(),
      },
      {
        role: 'user',
        content: `
Create the company profile using ONLY the information below.

COMPANY:
${cleanText(facts.name)}

INDUSTRY:
${cleanText(facts.industry)}

WEBSITE:
${cleanText(facts.website)}

STREET ADDRESS:
${cleanText(facts.streetAddress)}

AREA:
${cleanText(facts.area)}

CITY / LOCALITY:
${cleanText(facts.locality)}

DISTRICT:
${cleanText(facts.district)}

POSTAL CODE:
${cleanText(facts.postalCode)}

POSTAL AREA:
${cleanText(facts.postalArea)}

COUNTRY:
${cleanText(facts.country)}

FOUNDED:
${cleanText(facts.foundedYear)}

EMPLOYEES:
${cleanText(facts.employeeCount)}

OWNERSHIP:
${cleanText(facts.ownership)}

SERVICES:
${facts.services.map(cleanText).filter(Boolean).join(', ')}

SPECIALTIES:
${facts.specialties.map(cleanText).filter(Boolean).join(', ')}

INDUSTRIES SERVED:
${facts.industriesServed.map(cleanText).filter(Boolean).join(', ')}

NEARBY LOCATIONS:
${facts.nearbyLocations.map(cleanText).filter(Boolean).join(', ')}

KEY ENTITIES:
${facts.keyEntities.map(cleanText).filter(Boolean).join(', ')}

LOCATION CONTEXT:
${locationContext}

SOURCE INFORMATION:
${sourceText}
        `.trim(),
      },
    ];

    let descriptionData: any = null;

    try {
      const descriptionResponse = await callGroq(
        GROQ_API_KEY,
        generationMessages,
        {
          temperature: 0.75,
          max_tokens: 1400,
          reasoning_effort: 'medium',
        }
      );

      const descriptionContent =
        descriptionResponse.choices[0].message.content || '';

      descriptionData = extractJSON(descriptionContent);

      // Fallback if JSON extraction fails
      if (!descriptionData) {
        descriptionData = {
          description: cleanText(descriptionContent),
          shortDescription: '',
          metaTitle: '',
          metaDescription: '',
        };
      }
    } catch (error) {
      console.error(
        'Company description generation failed:',
        error
      );

      throw error;
    }

    // ============================================================
    // FINAL FALLBACKS
    // ============================================================

    let description = cleanText(
      descriptionData?.description
    );

    if (!description || description.length < 50) {
      description = sourceText.substring(0, 800);
    }

    const shortDescription = cleanText(
      descriptionData?.shortDescription
    );

    const metaTitle =
      cleanText(descriptionData?.metaTitle) ||
      `${cleanText(facts.name) || 'Company'} - ${
        cleanText(facts.industry) || 'Company Profile'
      } | JobsReport`;

    const metaDescription = cleanText(
      descriptionData?.metaDescription
    );

    // ============================================================
    // RETURN FINAL DATA
    // ============================================================

    return jsonResponse({
      success: true,

      model: AI_MODEL,

      data: {
        // ------------------------------------------
        // Extracted facts
        // ------------------------------------------

        name: cleanText(facts.name),

        industry: cleanText(facts.industry),

        website: cleanText(facts.website),

        streetAddress: cleanText(
          facts.streetAddress
        ),

        area: cleanText(facts.area),

        locality: cleanText(facts.locality),

        district: cleanText(facts.district),

        postalCode: cleanText(
          facts.postalCode
        ),

        postalArea: cleanText(
          facts.postalArea
        ),

        country:
          cleanText(facts.country) || 'TZ',

        foundedYear: cleanText(
          facts.foundedYear
        ),

        employeeCount: cleanText(
          facts.employeeCount
        ),

        ownership: cleanText(
          facts.ownership
        ),

        services: facts.services
          .map(cleanText)
          .filter(Boolean),

        specialties: facts.specialties
          .map(cleanText)
          .filter(Boolean),

        industriesServed:
          facts.industriesServed
            .map(cleanText)
            .filter(Boolean),

        nearbyLocations:
          facts.nearbyLocations
            .map(cleanText)
            .filter(Boolean),

        keyEntities:
          facts.keyEntities
            .map(cleanText)
            .filter(Boolean),

        // ------------------------------------------
        // Generated content
        // ------------------------------------------

        description,

        shortDescription,

        metaTitle,

        metaDescription,
      },
    });
  } catch (err) {
    console.error('Groq API error:', err);

    const errorMessage =
      err instanceof Error
        ? err.message
        : 'Unknown error';

    // Give frontend a useful error instead of hiding
    // the actual Groq/Cloudflare problem.
    return jsonResponse(
      {
        success: false,

        error: 'AI service unavailable',

        details: errorMessage,

        model: AI_MODEL,
      },
      500
    );
  }
};
