// functions/lib/autoLink.ts

export function enrichJobDescription(html: string, job: {
  company: string;
  companyId?: string;
  role?: string;
  job_category?: string;
  city?: string;
  country?: string;
  location?: string;
}): string {
  let enriched = html;

  // 🔥 Add contextual footer with internal links
  const links: string[] = [];

  // Company link
  if (job.company) {
    const companySlug = slugify(job.company);
    links.push(
      `<a href="https://jobsreport.online/companies/${companySlug}" style="color:#3b82f6;text-decoration:none;">📋 View all jobs at ${job.company}</a>`
    );
  }

  // Category link
  const category = job.job_category || job.role;
  if (category) {
    const catSlug = slugify(category);
    links.push(
      `<a href="https://jobsreport.online/category/${catSlug}" style="color:#3b82f6;text-decoration:none;">🔍 Browse more ${category} jobs</a>`
    );
  }

  // Location link
  if (job.city) {
    const citySlug = slugify(job.city.trim());
    const countrySlug = slugify(job.country || 'tanzania');
    links.push(
      `<a href="https://jobsreport.online/country/${countrySlug}/region/${citySlug}" style="color:#3b82f6;text-decoration:none;">📍 More jobs in ${job.city.trim()}</a>`
    );
  }

  // Only add footer if there are links
  if (links.length > 0) {
    enriched += `
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #334155;display:flex;flex-wrap:wrap;gap:12px;font-size:13px;">
        ${links.join(' <span style="color:#475569;">|</span> ')}
      </div>
    `;
  }

  return enriched;
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
