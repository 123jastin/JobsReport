import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  GROQ_API_KEY: string;
};

// ========== TEMPLATE DATA INTERFACE ==========
interface JobTemplateData {
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

// ========== 8 PREMIUM TEMPLATES ==========
const templates = [t1, t2, t3, t4, t5, t6, t7, t8];

// ✅ Random template selection (works with stateless Workers)
function getRandomTemplate(data: JobTemplateData): { html: string; index: number } {
  const index = Math.floor(Math.random() * templates.length);
  return { html: templates[index](data), index: index + 1 };
}

// Template 1: Executive Boardroom
function t1(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:32px;color:#e2e8f0"><div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;padding:24px;margin-bottom:24px"><h1 style="font-size:24px;font-weight:800;color:#fff;margin:0 0 8px">${d.title}</h1><div style="display:flex;gap:16px;flex-wrap:wrap"><span style="background:rgba(255,255,255,.15);padding:6px 14px;border-radius:20px;font-size:13px">🏢 ${d.company}</span><span style="background:rgba(255,255,255,.15);padding:6px 14px;border-radius:20px;font-size:13px">📍 ${d.location}</span>${d.salary?`<span style="background:rgba(255,255,255,.15);padding:6px 14px;border-radius:20px;font-size:13px">💰 ${d.salary}</span>`:''}</div></div><div style="background:rgba(255,255,255,.03);border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid #667eea"><p style="font-size:14px;line-height:1.7;margin:0">${d.sections.overview||'Exciting opportunity!'}</p></div>${d.sections.responsibilities.length?`<div style="margin-bottom:20px"><h3 style="font-size:16px;font-weight:700;color:#a78bfa;margin-bottom:12px">📋 Key Responsibilities</h3>${d.sections.responsibilities.map((r,i)=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="background:#667eea;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${i+1}</span><span style="font-size:13px;line-height:1.6">${r}</span></div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div style="margin-bottom:20px"><h3 style="font-size:16px;font-weight:700;color:#34d399;margin-bottom:12px">✅ Requirements</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${d.sections.requirements.map(r=>`<span style="background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);padding:8px 16px;border-radius:20px;font-size:12px;color:#34d399">✓ ${r}</span>`).join('')}</div></div>`:''}${d.sections.benefits.length?`<div><h3 style="font-size:16px;font-weight:700;color:#fbbf24;margin-bottom:12px">⭐ Benefits</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${d.sections.benefits.map(b=>`<div style="background:rgba(251,191,36,.08);border-radius:10px;padding:12px;display:flex;align-items:center;gap:8px"><span style="font-size:16px">🎁</span><span style="font-size:12px;color:#fbbf24">${b}</span></div>`).join('')}</div></div>`:''}</div>`;
}

// Template 2: Tech Startup
function t2(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;background:#0a0a0a;border:2px solid #333;border-radius:24px;overflow:hidden;color:#f0f0f0"><div style="background:linear-gradient(135deg,#f72585,#7209b7);padding:32px;text-align:center"><span style="background:rgba(0,0,0,.3);padding:4px 12px;border-radius:20px;font-size:11px;text-transform:uppercase;letter-spacing:2px">🚀 We're Hiring!</span><h1 style="font-size:28px;font-weight:900;margin:12px 0 8px;color:#fff">${d.title}</h1><div style="display:flex;justify-content:center;gap:20px;font-size:13px;opacity:.9"><span>🏢 ${d.company}</span><span>📍 ${d.location}</span>${d.salary?`<span>💰 ${d.salary}</span>`:''}</div></div><div style="padding:28px"><div style="background:#111;border-radius:16px;padding:20px;margin-bottom:24px;border:1px solid #222"><p style="font-size:14px;line-height:1.8;color:#ccc;margin:0">${d.sections.overview}</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">${d.sections.responsibilities.length?`<div style="background:#111;border-radius:16px;padding:20px;border:1px solid #222"><h3 style="color:#f72585;font-size:15px;margin-bottom:12px">💻 What You'll Build</h3>${d.sections.responsibilities.map(r=>`<div style="font-size:13px;padding:6px 0;color:#aaa">▸ ${r}</div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div style="background:#111;border-radius:16px;padding:20px;border:1px solid #222"><h3 style="color:#7209b7;font-size:15px;margin-bottom:12px">🔧 Your Stack</h3>${d.sections.requirements.map(r=>`<div style="font-size:13px;padding:6px 0;color:#aaa">✦ ${r}</div>`).join('')}</div>`:''}</div>${d.sections.benefits.length?`<div style="background:linear-gradient(135deg,rgba(247,37,133,.1),rgba(114,9,183,.1));border-radius:16px;padding:20px;margin-top:20px;text-align:center"><h3 style="color:#f72585;font-size:14px;margin-bottom:12px">🎉 Perks</h3><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px">${d.sections.benefits.map(b=>`<span style="background:rgba(255,255,255,.05);padding:8px 16px;border-radius:20px;font-size:12px">${b}</span>`).join('')}</div></div>`:''}</div></div>`;
}

// Template 3: Corporate Blue
function t3(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;background:linear-gradient(180deg,#1e3a5f,#0f1b2d);border-radius:16px;overflow:hidden;color:#e8ecf1"><div style="padding:28px 32px;border-bottom:3px solid #3b82f6"><div style="display:flex;align-items:center;gap:12px;margin-bottom:8px"><div style="width:40px;height:40px;background:#3b82f6;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">💼</div><div><h1 style="font-size:22px;font-weight:800;margin:0;color:#fff">${d.title}</h1><span style="font-size:12px;color:#94a3b8">${d.company} • ${d.location}${d.salary?` • ${d.salary}`:''}</span></div></div></div><div style="padding:24px 32px"><p style="font-size:14px;line-height:1.7;color:#cbd5e1;margin-bottom:24px">${d.sections.overview}</p><div style="display:grid;gap:20px">${d.sections.responsibilities.length?`<div><h3 style="color:#60a5fa;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Responsibilities</h3>${d.sections.responsibilities.map(r=>`<div style="background:rgba(59,130,246,.08);padding:10px 14px;border-radius:8px;margin-bottom:6px;font-size:13px;border-left:3px solid #3b82f6">${r}</div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div><h3 style="color:#34d399;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Qualifications</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${d.sections.requirements.map(r=>`<span style="background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.2);padding:8px 14px;border-radius:6px;font-size:12px;color:#34d399">${r}</span>`).join('')}</div></div>`:''}</div></div></div>`;
}

// Template 4: Minimal Dark
function t4(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;background:#18181b;border-radius:20px;padding:36px;color:#d4d4d8"><div style="text-align:center;margin-bottom:32px"><div style="font-size:40px;margin-bottom:12px">💎</div><h1 style="font-size:26px;font-weight:700;color:#fff;margin:0 0 6px">${d.title}</h1><div style="display:flex;justify-content:center;gap:20px;font-size:12px;color:#71717a"><span>${d.company}</span><span>•</span><span>${d.location}</span>${d.salary?`<span>•</span><span style="color:#34d399">${d.salary}</span>`:''}</div></div><div style="border-top:1px solid #27272a;border-bottom:1px solid #27272a;padding:24px 0;margin-bottom:24px"><p style="font-size:15px;line-height:1.8;color:#a1a1aa;text-align:center;margin:0">${d.sections.overview}</p></div>${d.sections.responsibilities.length?`<div style="margin-bottom:24px"><h3 style="font-size:13px;font-weight:600;color:#fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">What You'll Do</h3>${d.sections.responsibilities.map(r=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0"><span style="color:#a78bfa;font-weight:700">→</span><span style="font-size:14px">${r}</span></div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div style="background:#27272a;border-radius:12px;padding:20px;margin-bottom:24px"><h3 style="font-size:13px;color:#fff;margin-bottom:12px">Requirements</h3>${d.sections.requirements.map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px"><span style="color:#22c55e">✓</span>${r}</div>`).join('')}</div>`:''}${d.sections.benefits.length?`<div style="text-align:center"><h3 style="font-size:13px;color:#fbbf24;margin-bottom:12px">Perks</h3><span style="font-size:13px;color:#a1a1aa">${d.sections.benefits.join(' • ')}</span></div>`:''}</div>`;
}

// Template 5: Gradient Modern
function t5(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;background:linear-gradient(145deg,#0f172a,#1e1b4b 50%,#0f172a);border-radius:24px;overflow:hidden;color:#e2e8f0"><div style="background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);padding:2px"><div style="background:#0f172a;padding:32px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><span style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#a855f7">Job Opening</span><h1 style="font-size:26px;font-weight:800;margin:6px 0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${d.title}</h1></div><div style="text-align:right;font-size:12px;color:#94a3b8"><div>${d.company}</div><div>${d.location}</div></div></div></div></div><div style="padding:28px 32px"><p style="font-size:14px;line-height:1.8;margin-bottom:28px">${d.sections.overview}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">${d.sections.responsibilities.length?`<div style="background:rgba(99,102,241,.05);border-radius:16px;padding:20px"><h3 style="color:#818cf8;font-size:13px;margin-bottom:14px">🎯 Role</h3>${d.sections.responsibilities.map(r=>`<div style="font-size:12px;padding:4px 0;color:#cbd5e1">• ${r}</div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div style="background:rgba(168,85,247,.05);border-radius:16px;padding:20px"><h3 style="color:#a855f7;font-size:13px;margin-bottom:14px">📋 Skills</h3>${d.sections.requirements.map(r=>`<div style="font-size:12px;padding:4px 0;color:#cbd5e1">• ${r}</div>`).join('')}</div>`:''}${d.sections.benefits.length?`<div style="background:rgba(236,72,153,.05);border-radius:16px;padding:20px"><h3 style="color:#ec4899;font-size:13px;margin-bottom:14px">✨ Benefits</h3>${d.sections.benefits.map(b=>`<div style="font-size:12px;padding:4px 0;color:#cbd5e1">• ${b}</div>`).join('')}</div>`:''}</div></div></div>`;
}

// Template 6: Card Grid
function t6(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;background:#0c0c0c;border-radius:20px;padding:28px;color:#d1d5db"><div style="display:grid;grid-template-columns:auto 1fr;gap:20px;margin-bottom:24px"><div style="width:60px;height:60px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px">🔥</div><div><h1 style="font-size:22px;font-weight:800;color:#fff;margin:0">${d.title}</h1><div style="font-size:12px;color:#6b7280;margin-top:4px">${d.company} • ${d.location}${d.salary?` • ${d.salary}`:''}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${d.sections.responsibilities.length?`<div style="background:#18181b;border-radius:16px;padding:18px"><h3 style="font-size:12px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">📋 Duties</h3>${d.sections.responsibilities.map(r=>`<div style="font-size:12px;padding:3px 0">${r}</div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div style="background:#18181b;border-radius:16px;padding:18px"><h3 style="font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">✅ Must Have</h3>${d.sections.requirements.map(r=>`<div style="font-size:12px;padding:3px 0">${r}</div>`).join('')}</div>`:''}<div style="background:#18181b;border-radius:16px;padding:18px;grid-column:1/-1"><p style="font-size:13px;line-height:1.6;margin:0">📝 ${d.sections.overview}</p></div>${d.sections.benefits.length?`<div style="background:#18181b;border-radius:16px;padding:18px;grid-column:1/-1"><h3 style="font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">🎁 Benefits</h3><div style="display:flex;gap:8px;flex-wrap:wrap">${d.sections.benefits.map(b=>`<span style="background:rgba(16,185,129,.1);padding:6px 12px;border-radius:8px;font-size:11px;color:#10b981">${b}</span>`).join('')}</div></div>`:''}</div></div>`;
}

// Template 7: Split Panel
function t7(d: JobTemplateData): string {
  return `<div style="font-family:system-ui,sans-serif;display:grid;grid-template-columns:200px 1fr;background:#111;border-radius:20px;overflow:hidden;color:#e5e7eb"><div style="background:linear-gradient(180deg,#7c3aed,#db2777);padding:28px 20px"><div style="text-align:center"><div style="font-size:48px;margin-bottom:16px">💼</div><div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.8;margin-bottom:8px">${d.company}</div><div style="font-size:12px;opacity:.7">${d.location}</div>${d.salary?`<div style="font-size:14px;font-weight:700;margin-top:12px;background:rgba(0,0,0,.3);padding:8px;border-radius:8px">${d.salary}</div>`:''}</div></div><div style="padding:28px"><h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px">${d.title}</h1><p style="font-size:13px;line-height:1.7;margin-bottom:20px">${d.sections.overview}</p>${d.sections.responsibilities.length?`<h3 style="color:#a78bfa;font-size:13px;margin-bottom:8px">Responsibilities</h3>${d.sections.responsibilities.map(r=>`<div style="font-size:12px;padding:3px 0;color:#9ca3af">▸ ${r}</div>`).join('')}`:''}${d.sections.requirements.length?`<h3 style="color:#f472b6;font-size:13px;margin-top:16px;margin-bottom:8px">Requirements</h3>${d.sections.requirements.map(r=>`<div style="font-size:12px;padding:3px 0;color:#9ca3af">✦ ${r}</div>`).join('')}`:''}</div></div>`;
}

// Template 8: Magazine Style
function t8(d: JobTemplateData): string {
  return `<div style="font-family:Georgia,serif;background:#1a1a1a;border-radius:16px;padding:36px;color:#d4d4d4"><div style="text-align:center;border-bottom:2px solid #333;padding-bottom:24px;margin-bottom:24px"><span style="font-size:10px;text-transform:uppercase;letter-spacing:4px;color:#fbbf24">Career Opportunity</span><h1 style="font-size:30px;font-weight:400;color:#fff;margin:8px 0;font-style:italic">${d.title}</h1><div style="font-size:13px;color:#888">${d.company} — ${d.location}</div></div><div style="font-size:15px;line-height:2;margin-bottom:28px;text-align:justify;color:#aaa"><span style="font-size:40px;float:left;line-height:1;margin-right:8px;color:#fbbf24">T</span>${d.sections.overview}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">${d.sections.responsibilities.length?`<div><h3 style="font-size:16px;color:#fbbf24;font-style:italic;margin-bottom:12px">The Role</h3>${d.sections.responsibilities.map(r=>`<div style="font-size:13px;padding:4px 0;border-bottom:1px dotted #333">${r}</div>`).join('')}</div>`:''}${d.sections.requirements.length?`<div><h3 style="font-size:16px;color:#fbbf24;font-style:italic;margin-bottom:12px">The Candidate</h3>${d.sections.requirements.map(r=>`<div style="font-size:13px;padding:4px 0;border-bottom:1px dotted #333">${r}</div>`).join('')}</div>`:''}</div></div>`;
}

// ========== VALIDATION ==========
function validateJobData(data: any): { valid: boolean; errors: string[]; cleaned: any } {
  const errors: string[] = [];
  const cleaned: any = {};

  if (!data.title || data.title.length < 3) errors.push('Missing or invalid title');
  else cleaned.title = data.title.trim();

  if (!data.company || data.company.length < 1) errors.push('Missing company name');
  else cleaned.company = data.company.trim();

  cleaned.location = data.location?.trim() || 'Remote';
  cleaned.salary = data.salary?.trim() || '';
  cleaned.role = data.role?.trim() || 'General';

  cleaned.sections = {
    overview: data.description_raw || data.description || '',
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
  };

  return { valid: errors.length === 0 && !!cleaned.title, errors, cleaned };
}

// ========== MAIN HANDLER ==========
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

    let aiContent = '';
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !aiContent) {
      attempts++;
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{
            role: 'system',
            content: `You are a job post parser. Return ONLY valid JSON with: {"title":"","company":"","location":"","salary":"","role":"","description_raw":"","responsibilities":[],"requirements":[],"benefits":[]}`
          }, { role: 'user', content: rawText.substring(0, 4000) }],
          temperature: 0.2, max_tokens: 1500,
        }),
      });

      const data: any = await groqResponse.json();
      if (data.choices?.[0]) aiContent = data.choices[0].message.content || '';
    }

    if (!aiContent) {
      return new Response(JSON.stringify({ success: false, error: 'AI could not process this description' }), {
        status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'AI returned invalid format', debug: 'parse_failed' }), {
        status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const validation = validateJobData(parsed);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: 'Required fields missing', details: validation.errors, partial: validation.cleaned }), {
        status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const templateData: JobTemplateData = {
      title: validation.cleaned.title,
      company: validation.cleaned.company,
      location: validation.cleaned.location,
      salary: validation.cleaned.salary,
      role: validation.cleaned.role,
      sections: validation.cleaned.sections
    };

    // ✅ Random template selection
    const { html: descriptionHtml, index: templateIndex } = getRandomTemplate(templateData);

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: validation.cleaned.title,
        company: validation.cleaned.company,
        location: validation.cleaned.location,
        salary: validation.cleaned.salary,
        role: validation.cleaned.role,
        description: descriptionHtml,
        sections: validation.cleaned.sections,
        templateIndex
      },
      attempts
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Groq API error:', err);
    return new Response(JSON.stringify({ success: false, error: 'AI service unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
