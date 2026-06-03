// ✅ Job Template Engine - Converts AI structured data into professional HTML
// This is YOUR system's presentation layer, NOT AI-controlled

export interface JobTemplateData {
  title: string;
  company: string;
  location: string;
  salary?: string;
  role: string;
  sections: {
    overview: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
  };
}

// ✅ Template A: Standard Professional Layout
export function renderStandardTemplate(data: JobTemplateData): string {
  return `
    <div class="job-description-standard">
      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-2">Overview</h3>
        <p class="text-stone-300 leading-relaxed">${data.sections.overview || 'No overview provided.'}</p>
      </div>

      ${data.sections.responsibilities.length > 0 ? `
      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3">Key Responsibilities</h3>
        <ul class="space-y-2">
          ${data.sections.responsibilities.map(r => `
            <li class="flex items-start gap-2 text-stone-300">
              <span class="text-blue-400 mt-1.5 shrink-0">▸</span>
              <span>${r}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      ${data.sections.requirements.length > 0 ? `
      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3">Requirements</h3>
        <ul class="space-y-2">
          ${data.sections.requirements.map(r => `
            <li class="flex items-start gap-2 text-stone-300">
              <span class="text-emerald-400 mt-1.5 shrink-0">✓</span>
              <span>${r}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      ${data.sections.benefits.length > 0 ? `
      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3">Benefits</h3>
        <ul class="space-y-2">
          ${data.sections.benefits.map(b => `
            <li class="flex items-start gap-2 text-stone-300">
              <span class="text-amber-400 mt-1.5 shrink-0">★</span>
              <span>${b}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
  `;
}

// ✅ Template B: Premium/Featured Layout (more visual)
export function renderPremiumTemplate(data: JobTemplateData): string {
  return `
    <div class="job-description-premium">
      <div class="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl mb-6">
        <h3 class="text-lg font-bold text-white mb-2">🏢 About This Role</h3>
        <p class="text-stone-300 leading-relaxed">${data.sections.overview || 'No overview provided.'}</p>
      </div>

      ${data.sections.responsibilities.length > 0 ? `
      <div class="p-4 bg-white/[0.01] border border-white/5 rounded-2xl mb-4">
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-500 rounded-full"></span>
          What You'll Do
        </h3>
        <div class="grid grid-cols-1 gap-2">
          ${data.sections.responsibilities.map(r => `
            <div class="flex items-start gap-3 p-2 bg-white/[0.02] rounded-xl">
              <span class="text-blue-400 font-bold text-sm mt-0.5">${data.sections.responsibilities.indexOf(r) + 1}.</span>
              <span class="text-stone-300 text-sm">${r}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${data.sections.requirements.length > 0 ? `
      <div class="p-4 bg-white/[0.01] border border-white/5 rounded-2xl mb-4">
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          What We're Looking For
        </h3>
        <div class="flex flex-wrap gap-2">
          ${data.sections.requirements.map(r => `
            <span class="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">${r}</span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${data.sections.benefits.length > 0 ? `
      <div class="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
        <h3 class="text-lg font-bold text-white mb-3">✨ Perks & Benefits</h3>
        <div class="grid grid-cols-2 gap-2">
          ${data.sections.benefits.map(b => `
            <div class="flex items-center gap-2 p-2 bg-amber-500/5 rounded-xl">
              <span class="text-amber-400">⭐</span>
              <span class="text-stone-300 text-sm">${b}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// ✅ Template selector based on job type
export function renderJobDescription(data: JobTemplateData, template: 'standard' | 'premium' = 'standard'): string {
  if (template === 'premium') {
    return renderPremiumTemplate(data);
  }
  return renderStandardTemplate(data);
}
