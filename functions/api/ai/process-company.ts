import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

const GROQ_API_URL =
  'https://api.groq.com/openai/v1/chat/completions';

// ============================================================
// MODEL
// ============================================================

const AI_MODEL = 'openai/gpt-oss-120b';

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================
// RESPONSE HELPER
// ============================================================

function jsonResponse(
  data: any,
  status = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: corsHeaders,
    }
  );
}

// ============================================================
// CLEAN TEXT
// ============================================================

function cleanText(value: any): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

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

// ============================================================
// PARSE JSON
// ============================================================

function extractJSON(
  content: string
): any | null {

  if (!content) {
    return null;
  }

  const cleaned =
    content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

  // Direct JSON
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Find JSON object
  const firstBrace =
    cleaned.indexOf('{');

  const lastBrace =
    cleaned.lastIndexOf('}');

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    try {
      return JSON.parse(
        cleaned.substring(
          firstBrace,
          lastBrace + 1
        )
      );
    } catch {}
  }

  return null;
}

// ============================================================
// GROQ REQUEST
// ============================================================

async function callGroq(
  apiKey: string,
  messages: any[],
  options: {
    temperature?: number;
    max_tokens?: number;
    reasoning_effort?: 'low' | 'medium' | 'high';
  } = {}
) {

  const response =
    await fetch(
      GROQ_API_URL,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({

          model: AI_MODEL,

          messages,

          response_format: {
            type: 'json_object',
          },

          temperature:
            options.temperature ?? 0.3,

          max_tokens:
            options.max_tokens ?? 1800,

          reasoning_effort:
            options.reasoning_effort ?? 'low',

          // Don't return reasoning content
          include_reasoning: false,
        }),
      }
    );

  const data: any =
    await response.json();

  // ==========================================================
  // GROQ ERROR
  // ==========================================================

  if (!response.ok) {

    const message =
      data?.error?.message ||
      data?.message ||
      `Groq HTTP ${response.status}`;

    const error: any =
      new Error(message);

    error.status =
      response.status;

    error.groq =
      data;

    throw error;
  }

  // ==========================================================
  // EMPTY RESPONSE
  // ==========================================================

  const content =
    data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(
      'Groq returned an empty response'
    );
  }

  return {
    data,
    content,
  };
}

// ============================================================
// OPTIONS
// ============================================================

export const onRequestOptions:
  PagesFunction<Env> =
  async () => {

    return new Response(
      null,
      {
        status: 204,
        headers: corsHeaders,
      }
    );
  };

// ============================================================
// MAIN API
// ============================================================

export const onRequestPost:
  PagesFunction<Env> =
  async (context) => {

    const {
      GROQ_API_KEY
    } = context.env;

    // ========================================================
    // API KEY
    // ========================================================

    if (!GROQ_API_KEY) {

      return jsonResponse(
        {
          success: false,
          error:
            'AI service not configured',

          details:
            'GROQ_API_KEY is missing from Cloudflare environment variables.',
        },
        500
      );
    }

    try {

      // ======================================================
      // REQUEST BODY
      // ======================================================

      const body: any =
        await context.request.json();

      const rawText =
        typeof body.text === 'string'
          ? body.text.trim()
          : '';

      if (
        !rawText ||
        rawText.length < 20
      ) {

        return jsonResponse(
          {
            success: false,

            error:
              'Please provide at least 20 characters of company information.',
          },
          400
        );
      }

      // Keep request reasonably small
      const sourceText =
        rawText.substring(
          0,
          5000
        );

      // ======================================================
      // ONE AI REQUEST
      // ======================================================

      const messages = [

        {
          role: 'system',

          content: `
You are an expert company information extraction and business-reference writing engine for JobsReport.

Your job is to analyze the supplied company information and return structured company data plus an encyclopedia-style company description.

IMPORTANT:

Extract facts ONLY from the supplied source.

NEVER invent facts.

NEVER guess missing information.

If something is not stated, use an empty string "".

For missing lists, use [].

Do not infer:
- postal codes
- employee numbers
- founding years
- branches
- customers
- awards
- achievements
- market share
- ownership
- services

unless supported by the source.

COUNTRY CODES:

TZ = Tanzania
KE = Kenya
UG = Uganda
RW = Rwanda
ZA = South Africa
NG = Nigeria
GH = Ghana

Return ONLY valid JSON.

Use exactly this structure:

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
  "ownership": "",
  "services": [],
  "specialties": [],
  "industriesServed": [],
  "nearbyLocations": [],
  "keyEntities": [],
  "description": "",
  "shortDescription": "",
  "metaTitle": "",
  "metaDescription": ""
}

DESCRIPTION RULES:

Write 150–300 words.

Write like a professional encyclopedia or business reference article.

Begin by explaining what the company is and where it operates.

Describe its services and activities.

Mention customers or industries served only when supported.

Mention geographical information naturally.

Use nearby locations only when explicitly supported.

Do not exaggerate.

Do not use promotional language.

Do not repeatedly say "the company".

Do not repeat the company name more than 3 times.

Do not use:

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

Do not include:
- HTML
- Markdown
- URLs inside description
- citations
- explanations
- headings

SHORT DESCRIPTION:

One factual sentence under 20 words.

META TITLE:

Use:

Company Name - Industry | JobsReport Company Profile

META DESCRIPTION:

140–160 characters when enough factual information exists.

Include:
company name
industry
location
what the company does

Do not use marketing language.
          `.trim(),
        },

        {
          role: 'user',

          content: `
Analyze this company information:

${sourceText}

Return the required JSON only.
          `.trim(),
        },

      ];

      // ======================================================
      // TRY AI
      // ======================================================

      let aiResult: any = null;

      let lastError: any = null;

      for (
        let attempt = 1;
        attempt <= 2;
        attempt++
      ) {

        try {

          aiResult =
            await callGroq(
              GROQ_API_KEY,
              messages,
              {
                temperature: 0.35,

                max_tokens: 2200,

                reasoning_effort: 'low',
              }
            );

          break;

        } catch (error: any) {

          lastError =
            error;

          console.error(
            `Company AI attempt ${attempt} failed:`,
            error
          );

          // Wait briefly before retry
          if (
            attempt === 1
          ) {

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  700
                )
            );
          }
        }
      }

      // ======================================================
      // AI FAILED
      // ======================================================

      if (!aiResult) {

        const status =
          lastError?.status || 500;

        return jsonResponse(
          {
            success: false,

            error:
              'AI service unavailable',

            details:
              lastError?.message ||
              'Groq request failed',

            model:
              AI_MODEL,

            groq_status:
              status,
          },
          status === 429
            ? 429
            : 500
        );
      }

      // ======================================================
      // PARSE AI JSON
      // ======================================================

      const parsed =
        extractJSON(
          aiResult.content
        );

      if (
        !parsed ||
        typeof parsed !== 'object'
      ) {

        console.error(
          'Invalid AI JSON:',
          aiResult.content
        );

        return jsonResponse(
          {
            success: false,

            error:
              'AI returned invalid JSON',

            model:
              AI_MODEL,
          },
          422
        );
      }

      // ======================================================
      // NORMALIZE
      // ======================================================

      const facts: any = {

        name:
          cleanText(
            parsed.name
          ),

        industry:
          cleanText(
            parsed.industry
          ),

        website:
          cleanText(
            parsed.website
          ),

        streetAddress:
          cleanText(
            parsed.streetAddress
          ),

        area:
          cleanText(
            parsed.area
          ),

        locality:
          cleanText(
            parsed.locality
          ),

        district:
          cleanText(
            parsed.district
          ),

        postalCode:
          cleanText(
            parsed.postalCode
          ),

        postalArea:
          cleanText(
            parsed.postalArea
          ),

        country:
          cleanText(
            parsed.country
          ) || 'TZ',

        foundedYear:
          cleanText(
            parsed.foundedYear
          ),

        employeeCount:
          cleanText(
            parsed.employeeCount
          ),

        ownership:
          cleanText(
            parsed.ownership
          ),

        services:
          Array.isArray(
            parsed.services
          )
            ? parsed.services
                .map(cleanText)
                .filter(Boolean)
            : [],

        specialties:
          Array.isArray(
            parsed.specialties
          )
            ? parsed.specialties
                .map(cleanText)
                .filter(Boolean)
            : [],

        industriesServed:
          Array.isArray(
            parsed.industriesServed
          )
            ? parsed.industriesServed
                .map(cleanText)
                .filter(Boolean)
            : [],

        nearbyLocations:
          Array.isArray(
            parsed.nearbyLocations
          )
            ? parsed.nearbyLocations
                .map(cleanText)
                .filter(Boolean)
            : [],

        keyEntities:
          Array.isArray(
            parsed.keyEntities
          )
            ? parsed.keyEntities
                .map(cleanText)
                .filter(Boolean)
            : [],

      };

      // ======================================================
      // FALLBACK COMPANY NAME
      // ======================================================

      if (!facts.name) {

        facts.name =
          sourceText
            .substring(
              0,
              100
            )
            .split(
              /[.,\n]/
            )[0]
            .replace(
              /Company Name[:|\s]*/i,
              ''
            )
            .trim();
      }

      // ======================================================
      // DESCRIPTION
      // ======================================================

      let description =
        cleanText(
          parsed.description
        );

      if (
        !description ||
        description.length < 50
      ) {

        description =
          sourceText.substring(
            0,
            800
          );
      }

      // ======================================================
      // SHORT DESCRIPTION
      // ======================================================

      const shortDescription =
        cleanText(
          parsed.shortDescription
        );

      // ======================================================
      // META TITLE
      // ======================================================

      const metaTitle =
        cleanText(
          parsed.metaTitle
        ) ||
        `${facts.name} - ${
          facts.industry ||
          'Company Profile'
        } | JobsReport`;

      // ======================================================
      // META DESCRIPTION
      // ======================================================

      const metaDescription =
        cleanText(
          parsed.metaDescription
        );

      // ======================================================
      // RETURN
      // ======================================================

      return jsonResponse(
        {
          success: true,

          model:
            AI_MODEL,

          data: {

            name:
              facts.name,

            industry:
              facts.industry,

            website:
              facts.website,

            streetAddress:
              facts.streetAddress,

            area:
              facts.area,

            locality:
              facts.locality,

            district:
              facts.district,

            postalCode:
              facts.postalCode,

            postalArea:
              facts.postalArea,

            country:
              facts.country,

            foundedYear:
              facts.foundedYear,

            employeeCount:
              facts.employeeCount,

            ownership:
              facts.ownership,

            services:
              facts.services,

            specialties:
              facts.specialties,

            industriesServed:
              facts.industriesServed,

            nearbyLocations:
              facts.nearbyLocations,

            keyEntities:
              facts.keyEntities,

            description,

            shortDescription,

            metaTitle,

            metaDescription,
          },
        },
        200
      );

    } catch (err: any) {

      console.error(
        'Company API error:',
        err
      );

      return jsonResponse(
        {
          success: false,

          error:
            'AI service unavailable',

          details:
            err?.message ||
            'Unknown error',

          model:
            AI_MODEL,
        },
        500
      );
    }
  };
