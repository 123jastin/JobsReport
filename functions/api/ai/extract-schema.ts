
import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

const GROQ_API_URL =
  'https://api.groq.com/openai/v1/chat/completions';

// Powerful Groq model
const AI_MODEL = 'openai/gpt-oss-120b';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================
// JSON RESPONSE HELPER
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
// CLEAN JSON FROM AI RESPONSE
// ============================================================

function parseAIJson(content: string): any | null {
  if (!content) return null;

  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Try direct JSON
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Try extracting JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (
    start !== -1 &&
    end !== -1 &&
    end > start
  ) {
    try {
      return JSON.parse(
        cleaned.substring(start, end + 1)
      );
    } catch {}
  }

  return null;
}

// ============================================================
// MAIN HANDLER
// ============================================================

export const onRequestOptions: PagesFunction<Env> =
  async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  };

export const onRequestPost: PagesFunction<Env> =
  async (context) => {

    const { GROQ_API_KEY } = context.env;

    // ========================================================
    // API KEY CHECK
    // ========================================================

    if (!GROQ_API_KEY) {
      return jsonResponse(
        {
          success: false,
          error: 'AI service not configured',
          details:
            'GROQ_API_KEY is missing from Cloudflare environment variables.',
        },
        500
      );
    }

    try {

      // ======================================================
      // READ REQUEST
      // ======================================================

      const body: any =
        await context.request.json();

      const title =
        typeof body.title === 'string'
          ? body.title.trim()
          : '';

      const description =
        typeof body.description === 'string'
          ? body.description.trim()
          : '';

      const location =
        typeof body.location === 'string'
          ? body.location.trim()
          : '';

      const company =
        typeof body.company === 'string'
          ? body.company.trim()
          : '';

      // ======================================================
      // VALIDATION
      // ======================================================

      if (!title) {
        return jsonResponse(
          {
            success: false,
            error: 'Job title is required',
          },
          400
        );
      }

      if (!description) {
        return jsonResponse(
          {
            success: false,
            error: 'Job description is required',
          },
          400
        );
      }

      // ======================================================
      // GROQ REQUEST
      // ======================================================

      const groqResponse = await fetch(
        GROQ_API_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${GROQ_API_KEY}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({

            model: AI_MODEL,

            messages: [

              // ==============================================
              // SYSTEM
              // ==============================================

              {
                role: 'system',

                content: `
You are an expert job classification and structured-data extraction engine.

Analyze the supplied job advertisement and extract ONLY information supported by the text.

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Never return markdown.
3. Never return explanations.
4. Never invent information.
5. If information is unavailable, use the specified default.
6. Do not guess salary values.
7. Do not guess experience requirements.
8. Do not invent skills.
9. Do not invent benefits.
10. Extract the most appropriate job category and industry.

Return EXACTLY this JSON structure:

{
  "job_category": "Accounting|Engineering|Healthcare|Hospitality|Marketing|IT|Education|Finance|Legal|Other",
  "industry": "",
  "employment_type": "FULL_TIME|PART_TIME|CONTRACT|TEMPORARY|INTERNSHIP",
  "workplace_type": "Onsite|Remote|Hybrid",
  "education_level": "High School|Diploma|Bachelor|Master|PhD|Any",
  "experience_months": 0,
  "skills": [],
  "benefits": [],
  "salary_min": null,
  "salary_max": null,
  "salary_currency": "TZS|KES|UGX|USD|EUR|GBP"
}

CLASSIFICATION RULES:

job_category:
Choose the closest category from the allowed list.

industry:
Identify the industry sector from the job and employer information.
Use an empty string when it cannot be determined.

employment_type:
Determine the employment type only when explicitly stated or clearly supported.

workplace_type:
Use:
Onsite = primarily workplace-based
Remote = fully remote
Hybrid = combination of remote and workplace

education_level:
Use the highest clearly required education level.
If no education requirement is stated, use "Any".

experience_months:
Convert explicitly stated experience requirements into months.

Examples:
"1 year" = 12
"2 years" = 24
"3 years" = 36
"6 months" = 6

If experience is not stated, use 0.

skills:
Extract specific technical, professional or job-related skills mentioned or clearly required.

benefits:
Extract benefits explicitly stated in the job advertisement.

salary:
Only extract salary when explicitly stated.

salary_min:
Minimum salary number only.

salary_max:
Maximum salary number only.

salary_currency:
Use the currency explicitly stated.

If salary is not stated:
salary_min = null
salary_max = null

If the currency is not stated:
use "TZS" only when the job is clearly a Tanzania-based job.
Otherwise use the most clearly supported currency or "TZS" as the default.

Do not invent numeric salary values.
                `.trim(),
              },

              // ==============================================
              // USER
              // ==============================================

              {
                role: 'user',

                content: `
Analyze this job advertisement:

Title:
${title}

Company:
${company}

Location:
${location}

Description:
${description.substring(0, 4000)}
                `.trim(),
              },

            ],

            // Force JSON response
            response_format: {
              type: 'json_object',
            },

            // Structured extraction should be deterministic
            temperature: 0.1,

            max_tokens: 1000,

            reasoning_effort: 'low',
          }),
        }
      );

      // ======================================================
      // READ GROQ RESPONSE
      // ======================================================

      const data: any =
        await groqResponse.json();

      // ======================================================
      // HANDLE GROQ ERRORS
      // ======================================================

      if (!groqResponse.ok) {

        const errorMessage =
          data?.error?.message ||
          data?.message ||
          `Groq API returned HTTP ${groqResponse.status}`;

        console.error(
          'Groq schema error:',
          data
        );

        return jsonResponse(
          {
            success: false,
            error:
              'Schema extraction failed',
            details: errorMessage,
            model: AI_MODEL,
          },
          groqResponse.status === 429
            ? 429
            : 500
        );
      }

      // ======================================================
      // GET AI CONTENT
      // ======================================================

      const content =
        data?.choices?.[0]?.message
          ?.content || '';

      if (!content) {
        return jsonResponse(
          {
            success: false,
            error:
              'AI returned an empty response',
            model: AI_MODEL,
          },
          422
        );
      }

      // ======================================================
      // PARSE JSON
      // ======================================================

      const schema =
        parseAIJson(content);

      if (!schema) {
        console.error(
          'Invalid AI JSON:',
          content
        );

        return jsonResponse(
          {
            success: false,
            error:
              'AI returned invalid JSON',
            model: AI_MODEL,
          },
          422
        );
      }

      // ======================================================
      // NORMALIZE DATA
      // ======================================================

      const allowedCategories = [
        'Accounting',
        'Engineering',
        'Healthcare',
        'Hospitality',
        'Marketing',
        'IT',
        'Education',
        'Finance',
        'Legal',
        'Other',
      ];

      const allowedEmploymentTypes = [
        'FULL_TIME',
        'PART_TIME',
        'CONTRACT',
        'TEMPORARY',
        'INTERNSHIP',
      ];

      const allowedWorkplaceTypes = [
        'Onsite',
        'Remote',
        'Hybrid',
      ];

      const allowedEducationLevels = [
        'High School',
        'Diploma',
        'Bachelor',
        'Master',
        'PhD',
        'Any',
      ];

      const allowedCurrencies = [
        'TZS',
        'KES',
        'UGX',
        'USD',
        'EUR',
        'GBP',
      ];

      // ======================================================
      // CATEGORY
      // ======================================================

      const jobCategory =
        allowedCategories.includes(
          schema.job_category
        )
          ? schema.job_category
          : 'Other';

      // ======================================================
      // EMPLOYMENT TYPE
      // ======================================================

      const employmentType =
        allowedEmploymentTypes.includes(
          schema.employment_type
        )
          ? schema.employment_type
          : 'FULL_TIME';

      // ======================================================
      // WORKPLACE TYPE
      // ======================================================

      const workplaceType =
        allowedWorkplaceTypes.includes(
          schema.workplace_type
        )
          ? schema.workplace_type
          : 'Onsite';

      // ======================================================
      // EDUCATION
      // ======================================================

      const educationLevel =
        allowedEducationLevels.includes(
          schema.education_level
        )
          ? schema.education_level
          : 'Any';

      // ======================================================
      // EXPERIENCE
      // ======================================================

      let experienceMonths = 0;

      if (
        typeof schema.experience_months ===
        'number' &&
        Number.isFinite(
          schema.experience_months
        ) &&
        schema.experience_months >= 0
      ) {
        experienceMonths = Math.round(
          schema.experience_months
        );
      }

      // ======================================================
      // SKILLS
      // ======================================================

      const skills =
        Array.isArray(schema.skills)
          ? schema.skills
              .filter(
                (skill: any) =>
                  typeof skill ===
                  'string'
              )
              .map(
                (skill: string) =>
                  skill.trim()
              )
              .filter(Boolean)
          : [];

      // ======================================================
      // BENEFITS
      // ======================================================

      const benefits =
        Array.isArray(schema.benefits)
          ? schema.benefits
              .filter(
                (benefit: any) =>
                  typeof benefit ===
                  'string'
              )
              .map(
                (benefit: string) =>
                  benefit.trim()
              )
              .filter(Boolean)
          : [];

      // ======================================================
      // SALARY
      // ======================================================

      const salaryMin =
        typeof schema.salary_min ===
          'number' &&
        Number.isFinite(
          schema.salary_min
        )
          ? schema.salary_min
          : null;

      const salaryMax =
        typeof schema.salary_max ===
          'number' &&
        Number.isFinite(
          schema.salary_max
        )
          ? schema.salary_max
          : null;

      const salaryCurrency =
        allowedCurrencies.includes(
          schema.salary_currency
        )
          ? schema.salary_currency
          : 'TZS';

      // ======================================================
      // SLUG
      // ======================================================

      const slug =
        title
          .toLowerCase()
          .normalize('NFKD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /[^a-z0-9]+/g,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            '');

      // ======================================================
      // CANONICAL URL
      // ======================================================

      const canonicalUrl =
        `https://jobsreport.online/market/${slug}-${Date.now().toString(36)}`;

      // ======================================================
      // FINAL RESPONSE
      // ======================================================

      return jsonResponse({
        success: true,

        model: AI_MODEL,

        schema: {

          job_category:
            jobCategory,

          industry:
            typeof schema.industry ===
            'string'
              ? schema.industry.trim()
              : '',

          employment_type:
            employmentType,

          workplace_type:
            workplaceType,

          education_level:
            educationLevel,

          experience_months:
            experienceMonths,

          skills,

          benefits,

          salary_min:
            salaryMin,

          salary_max:
            salaryMax,

          salary_currency:
            salaryCurrency,

          slug,

          canonical_url:
            canonicalUrl,

          date_posted:
            new Date()
              .toISOString()
              .split('T')[0],
        },
      });

    } catch (err) {

      // ======================================================
      // GENERAL ERROR
      // ======================================================

      console.error(
        'Groq API error:',
        err
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Schema extraction failed',
          details:
            err instanceof Error
              ? err.message
              : 'Unknown error',
          model: AI_MODEL,
        },
        500
      );
    }
  };
