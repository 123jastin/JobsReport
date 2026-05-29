import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' })); // support larger base64 uploads

  // Mock Data & In-Memory Database
  let companies = [
    { id: 'co-1', name: 'Google', url: 'https://careers.google.com', logoUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=80&h=80&fit=crop&q=80' },
    { id: 'co-2', name: 'Stripe', url: 'https://stripe.com/jobs', logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop&q=80' },
    { id: 'co-3', name: 'Palantir', url: 'https://palantir.com/careers', logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop&q=80' },
    { id: 'co-4', name: 'Airbnb', url: 'https://careers.airbnb.com', logoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop&q=80' },
    { id: 'co-5', name: 'OpenAI', url: 'https://openai.com/careers', logoUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=80&h=80&fit=crop&q=80' },
    { id: 'co-6', name: 'Anthropic', url: 'https://anthropic.com/careers', logoUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=80&h=80&fit=crop&q=80' },
    { id: 'co-7', name: 'Mistral', url: 'https://mistral.ai/careers', logoUrl: 'https://images.unsplash.com/photo-1549692520-acc662212280?w=80&h=80&fit=crop&q=80' },
    { id: 'co-tz-1', name: 'Shule Direct', url: 'https://www.shuledirect.co.tz', logoUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=80&h=80&fit=crop&q=80' },
    { id: 'co-tz-2', name: 'Nala Cash', url: 'https://www.nala.com', logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=80&h=80&fit=crop&q=80' },
    { id: 'co-tz-3', name: 'Vodacom Tanzania', url: 'https://www.vodacom.co.tz/careers', logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=80&h=80&fit=crop&q=80' },
    { id: 'co-tz-4', name: 'CRDB Bank plc', url: 'https://crdbbank.co.tz', logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=80&h=80&fit=crop&q=80' }
  ];

  let roles = [
    { id: '1', title: 'Software Developer', mappedTitles: ['engineer', 'developer', 'programmer', 'frontend', 'backend', 'fullstack', 'coder'], growth: 22 },
    { id: '2', title: 'Data Scientist', mappedTitles: ['scientist', 'researcher', 'ml', 'ai engineer', 'llm', 'nlp', 'data specialist', 'ai specialist'], growth: 18 },
    { id: '3', title: 'UX Designer', mappedTitles: ['designer', 'ux', 'ui', 'design lead', 'illustrator', 'product designer'], growth: 12 },
    { id: '4', title: 'Product Manager', mappedTitles: ['product manager', 'pm', 'product owner', 'scrum master', 'program manager'], growth: 15 },
    { id: '5', title: 'Cloud Engineer', mappedTitles: ['cloud', 'infrastructure', 'sre', 'devops', 'sysadmin', 'systems engineer'], growth: 31 }
  ];

  let rawJobs = [
    { id: '1', title: 'Senior Frontend React Engineer', role: 'Software Developer', company: 'Google', location: 'Mountain View, CA (Hybrid)', url: 'https://careers.google.com', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-06-30', salary: '$140,000 - $190,000', country: 'United States', active: true },
    { id: '2', title: 'Backend Systems Developer', role: 'Software Developer', company: 'Stripe', location: 'Seattle, WA (Remote)', url: 'https://stripe.com/jobs', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-07-15', salary: '$160,000 - $210,000', country: 'United States', active: true },
    { id: '3', title: 'Lead Fullstack Programmer', role: 'Software Developer', company: 'Palantir', location: 'New York, NY', url: 'https://palantir.com/careers', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-06-10', salary: '$150,000 - $185,000', country: 'United States', active: true },
    { id: '4', title: 'Principal Infrastructure Engineer', role: 'Software Developer', company: 'Airbnb', location: 'San Francisco, CA', url: 'https://careers.airbnb.com', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-05-10', salary: '$190,000 - $240,000', country: 'United States', active: true },
    { id: '5', title: 'Machine Learning Scientist', role: 'Data Scientist', company: 'OpenAI', location: 'San Francisco, CA', url: 'https://openai.com/careers', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-07-20', salary: '$180,000 - $300,000', country: 'United States', active: true },
    { id: '6', title: 'AI Engineering Specialist', role: 'Data Scientist', company: 'Anthropic', location: 'San Francisco, CA (Hybrid)', url: 'https://anthropic.com/careers', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-08-01', salary: '$200,000 - $280,000', country: 'United States', active: true },
    { id: '7', title: 'NLU Research Engineer', role: 'Data Scientist', company: 'Mistral', location: 'Paris, FR', url: 'https://mistral.ai/careers', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-05-20', salary: '€90,000 - €130,000', country: 'France', active: true },
    // Tanzania 🇹🇿 Seed Records
    { id: 'tz-1', title: 'Senior Backend Engineer (Laravel/Python)', role: 'Software Developer', company: 'Shule Direct', location: 'Dar es Salaam, Tanzania (Hybrid)', url: 'https://www.shuledirect.co.tz', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-06-25', salary: 'TSh 3,500,000 - TSh 5,000,000 / month', country: 'Tanzania', active: true },
    { id: 'tz-2', title: 'ML & NLP Specialist (Swahili speech model)', role: 'Data Scientist', company: 'Nala Cash', location: 'Dar es Salaam, Tanzania (Remote)', url: 'https://www.nala.com', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-07-05', salary: 'TSh 4,000,000 - TSh 6,500,000 / month', country: 'Tanzania', active: true },
    { id: 'tz-3', title: 'Infrastructure DevOps Architect', role: 'Cloud Engineer', company: 'Vodacom Tanzania', location: 'Dar es Salaam, Tanzania', url: 'https://www.vodacom.co.tz/careers', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-05-18', salary: 'Negotiable', country: 'Tanzania', active: true },
    { id: 'tz-4', title: 'Lead Product Designer', role: 'UX Designer', company: 'CRDB Bank plc', location: 'Dar es Salaam, Tanzania', url: 'https://crdbbank.co.tz', postedAt: new Date().toISOString().split('T')[0], expiresAt: '2026-06-15', salary: 'Competitive', country: 'Tanzania', active: true }
  ];

  let mediaAssets = [
    { id: 'img-1', name: 'software_trend_q2_2026.png', size: '240KB', type: 'image/png', uploadedAt: '12:30 PM', dataUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80', altText: 'Software Demand Trends Q2 2026 Chart' },
    { id: 'img-2', name: 'ai_talent_expansion_map.png', size: '412KB', type: 'image/png', uploadedAt: '02:15 PM', dataUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', altText: 'AI Talent Heat Map 2026' }
  ];

  let activityLogs = [
    { id: 'log-1', action: 'Deduplication Completed', details: 'Deduplicated 7 listings. Grouped indices with 100% verification score.', timestamp: '10:00 AM' },
    { id: 'log-2', action: 'System Initialized', details: 'Completed mapping parser engine for target client indices.', timestamp: '09:30 AM' },
    { id: 'log-3', action: 'Ingested raw jobs', details: 'Ingested 7 verified corporate telemetry feeds.', timestamp: '09:00 AM' }
  ];

  // Trends representation aligned dynamically
  const getTrendsList = () => {
    return roles.map(r => {
      // Find companies actually hiring for this role from rawJobs
      const jobsInRole = rawJobs.filter(j => j.role.toLowerCase() === r.title.toLowerCase() && j.active);
      const uniqueCompanies = new Set(jobsInRole.map(j => j.company)).size;
      return {
        id: r.id,
        role: r.title,
        growth: r.growth,
        companies: uniqueCompanies > 0 ? uniqueCompanies : Math.floor(Math.random() * 40) + 15,
        trend: r.growth >= 15 ? 'up' as const : 'down' as const
      };
    });
  };

  let reports = [
    {
      id: 'software-dev-demand-may-2026',
      title: 'Software Developer Demand — May 2026',
      role: 'Software Developer',
      monthYear: 'May 2026',
      excerpt: 'Post-recession tech recovery is driving a massive spike in senior engineering roles across fintech and healthcare.',
      updatedAt: new Date().toISOString(),
      country: 'United States',
      content: '<h2>Current Software Development Landscape</h2><p>Our telemetry shows a significant <b>22% growth spike</b> in roles centering engineering systems, particularly Senior React and Backend Infrastructure listings. As companies restructure their product architecture, demand for veteran developers remains exceptionally high.</p><h3>Key Findings</h3><ul><li>Durable product stacks are highly prioritized</li><li>Financial hubs in New York and London lead localized counts</li><li>Remote job counts remain active but undergo selective screening</li></ul><p>We target this growth rate to stabilize as Q3 advances. Below we lay out the companies leading this hiring drive.</p>',
      stats: { companies: 4, growth: 22 },
      roles: ['Frontend Developer', 'Backend Engineer', 'Fullstack Developer'],
      companies: [
        { name: 'Google', url: 'https://careers.google.com', logoUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=80&h=80&fit=crop&q=80' },
        { name: 'Stripe', url: 'https://stripe.com/jobs', logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop&q=80' },
        { name: 'Palantir', url: 'https://palantir.com/careers', logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop&q=80' },
        { name: 'Airbnb', url: 'https://careers.airbnb.com', logoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop&q=80' }
      ],
      chartData: [
        { name: 'Jan', demand: 400 },
        { name: 'Feb', demand: 300 },
        { name: 'Mar', demand: 600 },
        { name: 'Apr', demand: 800 },
        { name: 'May', demand: 1240 },
      ],
      distribution: [
        { name: 'Tech', value: 400 },
        { name: 'Finance', value: 300 },
        { name: 'Healthcare', value: 300 },
        { name: 'Retail', value: 200 },
      ]
    },
    {
      id: 'ai-specialist-surge-2026',
      title: 'The AI Specialist Surge: 2026 Trends',
      role: 'Data Scientist',
      monthYear: 'June 2026',
      excerpt: 'Generative AI deployment in enterprise is creating specialized roles that didnt exist two years ago.',
      updatedAt: new Date().toISOString(),
      country: 'United States',
      content: '<h2>Artificial Intelligence Integration Waves</h2><p>Machine Learning and Language Model positions are scaling rapidly. Backed by solid enterprise capital, specialist roles represent a <b>45% trend spike</b> this year. We observe structured investments across leading tech laboratories and applied systems integrator hubs alike.</p><h3>Key Roles Being Filled</h3><ul><li>Large Language Model Architects</li><li>Machine Learning Infrastructure Engineers</li><li>Applied Generative AI Practitioners</li></ul><p>Explore the full statistical allocation matrix and active career portal feeds down below.</p>',
      stats: { companies: 3, growth: 18 },
      roles: ['Prompt Engineer', 'AI Ops Manager', 'LLM Architect'],
      companies: [
        { name: 'OpenAI', url: 'https://openai.com/careers', logoUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=80&h=80&fit=crop&q=80' },
        { name: 'Anthropic', url: 'https://anthropic.com/careers', logoUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=80&h=80&fit=crop&q=80' },
        { name: 'Mistral', url: 'https://mistral.ai/careers', logoUrl: 'https://images.unsplash.com/photo-1549692520-acc662212280?w=80&h=80&fit=crop&q=80' }
      ],
      chartData: [
        { name: 'Jan', demand: 100 },
        { name: 'Feb', demand: 150 },
        { name: 'Mar', demand: 300 },
        { name: 'Apr', demand: 450 },
        { name: 'May', demand: 840 },
      ],
      distribution: [
        { name: 'AI Labs', value: 500 },
        { name: 'Cloud', value: 200 },
        { name: 'Gov', value: 140 },
      ]
    },
    {
      id: 'tanzania-tech-ecosystem-2026',
      title: 'Tanzania Tech & Mobile Money Growth — 2026',
      role: 'Software Developer',
      monthYear: 'June 2026',
      excerpt: 'Dar es Salaam is rising as a major regional hub for fintech and mobile banking portals, driving professional software engineers demand.',
      updatedAt: new Date().toISOString(),
      country: 'Tanzania',
      content: '<h2>Tanzania Tech Hub Expansion</h2><p>Our telemetry shows a substantial <b>28% demand growth</b> in corporate developer roles in East Africa, centered heavily in Dar es Salaam, Tanzania. With Vodacom, Tigo, and banking institutions like CRDB and NMB expanding their digital APIs, software developer demand has hit record heights.</p><h3>Key Drivers</h3><ul><li>Mobile fintech and payment integrations</li><li>E-learning expansion across Swahili speech systems</li><li>Cross-border digital remittance solutions</li></ul><p>Explore the local listings to see current openings in Dar es Salaam.</p>',
      stats: { companies: 4, growth: 28 },
      roles: ['Frontend Developer', 'Backend Engineer', 'Fullstack Developer'],
      companies: [
        { name: 'Shule Direct', url: 'https://www.shuledirect.co.tz', logoUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=80&h=80&fit=crop&q=80' },
        { name: 'Nala Cash', url: 'https://www.nala.com', logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=80&h=80&fit=crop&q=80' },
        { name: 'Vodacom Tanzania', url: 'https://www.vodacom.co.tz/careers', logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=80&h=80&fit=crop&q=80' },
        { name: 'CRDB Bank plc', url: 'https://crdbbank.co.tz', logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=80&h=80&fit=crop&q=80' }
      ],
      chartData: [
        { name: 'Jan', demand: 120 },
        { name: 'Feb', demand: 180 },
        { name: 'Mar', demand: 240 },
        { name: 'Apr', demand: 310 },
        { name: 'May', demand: 420 },
      ],
      distribution: [
        { name: 'Fintech Core', value: 350 },
        { name: 'Telco Solutions', value: 200 },
        { name: 'Edtech & Public Stack', value: 120 }
      ]
    }
  ];

  let lastUpdatedText = "Last updated: Today";

  // Helper: Normalize Job Title into a Target Role Title from Roles list
  function attemptNormalizeJobTitle(title: string, selectedRole: string): string {
    const normTitle = title.toLowerCase().trim();
    for (const r of roles) {
      if (r.title.toLowerCase() === normTitle) {
        return r.title;
      }
      for (const mt of r.mappedTitles) {
        if (normTitle.includes(mt.toLowerCase())) {
          return r.title;
        }
      }
    }
    return selectedRole;
  }

  // 🔔 ACTIVITY LOG LOGGER UTILITY
  const addLog = (action: string, details: string) => {
    activityLogs.unshift({
      id: `log-${Date.now()}`,
      action,
      details,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    // Cap logs at 50 to prevent overflow
    if (activityLogs.length > 50) {
      activityLogs = activityLogs.slice(0, 50);
    }
  };

  // API Routes
  app.get("/api/trends", (req, res) => {
    res.json(getTrendsList());
  });

  app.get("/api/reports", (req, res) => {
    // Inject dynamic data computations before serving!
    const updatedReports = reports.map(rep => {
      const activeJobsInRole = rawJobs.filter(j => j.role.toLowerCase() === rep.role.toLowerCase() && j.active);
      const totalListings = activeJobsInRole.length;
      const matchingCompanies = Array.from(new Set(activeJobsInRole.map(j => j.company)));
      
      // Look up company website + logos configuration
      const richCompaniesList = matchingCompanies.map(compName => {
        const foundCo = companies.find(c => c.name.toLowerCase() === compName.toLowerCase());
        return {
          name: compName,
          url: foundCo ? foundCo.url : 'https://google.com/careers',
          logoUrl: foundCo ? foundCo.logoUrl : undefined
        };
      });

      // Find the growth configuration for this report's role mapping
      const matchedRoleDef = roles.find(r => r.title.toLowerCase() === rep.role.toLowerCase());
      const growthPct = matchedRoleDef ? matchedRoleDef.growth : rep.stats.growth;

      // Dynamically simulate time-series bar chart data based on job listings in role
      const multiplier = Math.max(1, totalListings);
      const chartData = [
        { name: 'Jan', demand: Math.round(50 * multiplier) },
        { name: 'Feb', demand: Math.round(75 * multiplier) },
        { name: 'Mar', demand: Math.round(110 * multiplier) },
        { name: 'Apr', demand: Math.round(160 * multiplier) },
        { name: 'May', demand: Math.round(220 * multiplier) },
      ];

      // Dynamically simulate division chart values
      const distribution = [
        { name: 'Tech Core', value: Math.round(totalListings * 30) || 300 },
        { name: 'Enterprise Services', value: Math.round(totalListings * 15) || 120 },
        { name: 'Disruptive Tech Labs', value: Math.round(totalListings * 10) || 80 },
      ];

      return {
        ...rep,
        stats: {
          companies: richCompaniesList.length || rep.stats.companies,
          growth: growthPct,
          totalListings: totalListings // injected dynamically
        },
        companies: richCompaniesList.length > 0 ? richCompaniesList : rep.companies,
        chartData,
        distribution
      };
    });

    res.json(updatedReports);
  });

  app.get("/api/reports/:id", (req, res) => {
    const report = reports.find(r => r.id === req.params.id);
    if (report) {
      // Inject dynamic data as well
      const activeJobsInRole = rawJobs.filter(j => j.role.toLowerCase() === report.role.toLowerCase() && j.active);
      const totalListings = activeJobsInRole.length;
      const matchingCompanies = Array.from(new Set(activeJobsInRole.map(j => j.company)));
      
      const richCompaniesList = matchingCompanies.map(compName => {
        const foundCo = companies.find(c => c.name.toLowerCase() === compName.toLowerCase());
        return {
          name: compName,
          url: foundCo ? foundCo.url : 'https://google.com/careers',
          logoUrl: foundCo ? foundCo.logoUrl : undefined
        };
      });

      const matchedRoleDef = roles.find(r => r.title.toLowerCase() === report.role.toLowerCase());
      const growthPct = matchedRoleDef ? matchedRoleDef.growth : report.stats.growth;

      const multiplier = Math.max(1, totalListings);
      const chartData = [
        { name: 'Jan', demand: Math.round(45 * multiplier) },
        { name: 'Feb', demand: Math.round(65 * multiplier) },
        { name: 'Mar', demand: Math.round(95 * multiplier) },
        { name: 'Apr', demand: Math.round(140 * multiplier) },
        { name: 'May', demand: Math.round(195 * multiplier) },
      ];

      const distribution = [
        { name: 'Tech Core', value: Math.round(totalListings * 30) || 280 },
        { name: 'Enterprise Services', value: Math.round(totalListings * 15) || 150 },
        { name: 'Disruptive Tech Labs', value: Math.round(totalListings * 10) || 70 },
      ];

      res.json({
        ...report,
        stats: {
          companies: richCompaniesList.length || report.stats.companies,
          growth: growthPct,
          totalListings: totalListings // injected dynamically
        },
        companies: richCompaniesList.length > 0 ? richCompaniesList : report.companies,
        chartData,
        distribution
      });
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  });

  // Raw Jobs Endpoints
  app.get("/api/jobs", (req, res) => {
    res.json(rawJobs);
  });

  app.post("/api/jobs", (req, res) => {
    const { title, role, company, location, url, salary, country, expiresAt } = req.body;
    
    if (!title || !company || !location || !expiresAt) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Title, Company, Location, and Job Expire Date are required." });
    }

    // 1. DUPLICATE CHECK: title + company + location (case-insensitive)
    const isDuplicate = rawJobs.some(j => 
      j.title.toLowerCase().trim() === title.toLowerCase().trim() &&
      j.company.toLowerCase().trim() === company.toLowerCase().trim() &&
      j.location.toLowerCase().trim() === location.toLowerCase().trim()
    );

    if (isDuplicate) {
      addLog("Duplicate Blocked", `Prevented redundancy for "${title}" at ${company} in ${location}.`);
      return res.status(409).json({ 
        error: "DUPLICATE_FOUND", 
        message: "Duplicate submission blocked in order to maintain clean job aggregates." 
      });
    }

    // 2. AUTO-NORMALIZATION: software engineer -> software developer based on mapping
    const finalRoleMapping = attemptNormalizeJobTitle(title, role || 'Software Developer');

    const newJob = {
      id: `job-${Date.now()}`,
      title: title.trim(),
      role: finalRoleMapping,
      company: company.trim(),
      location: location.trim(),
      url: url || 'https://google.com/careers',
      salary: salary ? salary.trim() : undefined,
      postedAt: new Date().toISOString().split('T')[0],
      active: true,
      country: country || 'Worldwide',
      expiresAt: expiresAt
    };

    // Auto-create company in index if not existing
    const companyExists = companies.some(c => c.name.toLowerCase() === company.toLowerCase().trim());
    if (!companyExists) {
      const coId = `co-${Date.now()}`;
      companies.push({
        id: coId,
        name: company.trim(),
        url: url || 'https://google.com/careers',
        logoUrl: undefined
      });
      addLog("Inline Company Created", `Added company "${company}" in target index silently.`);
    }

    rawJobs.unshift(newJob);
    addLog("Job Listing Ingested", `Successfully integrated "${title}" at ${company} mapped to [${finalRoleMapping}].`);
    res.status(201).json(newJob);
  });

  app.put("/api/jobs/:id", (req, res) => {
    const idx = rawJobs.findIndex(j => j.id === req.params.id);
    if (idx !== -1) {
      const oldJob = rawJobs[idx];
      rawJobs[idx] = {
        ...rawJobs[idx],
        ...req.body
      };
      addLog("Job Listing Modified", `Updated telemetry parameters for "JR-${oldJob.id.toUpperCase().slice(0,4)}" (${rawJobs[idx].title}).`);
      res.json(rawJobs[idx]);
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  });

  app.delete("/api/jobs/:id", (req, res) => {
    const found = rawJobs.find(j => j.id === req.params.id);
    if (found) {
      rawJobs = rawJobs.filter(j => j.id !== req.params.id);
      addLog("Job Listing Suspended", `Purged active index telemetry for "${found.title}".`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  });

  // Companies Management Endpoints
  app.get("/api/companies", (req, res) => {
    res.json(companies);
  });

  app.post("/api/companies", (req, res) => {
    const { name, url, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required for corporate node." });
    }
    const id = `co-${Date.now()}`;
    const newCompany = { id, name: name.trim(), url: url || 'https://google.com/careers', logoUrl };
    companies.push(newCompany);
    addLog("Corporate Node Created", `Added corporate details for ${name}.`);
    res.status(201).json(newCompany);
  });

  app.delete("/api/companies/:id", (req, res) => {
    const foundCo = companies.find(c => c.id === req.params.id);
    if (foundCo) {
      companies = companies.filter(c => c.id !== req.params.id);
      addLog("Corporate Node Removed", `Excised corporate target parameters for "${foundCo.name}".`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Company node not found" });
    }
  });

  // Roles Definition Management Endpoints (Custom normalizations)
  app.get("/api/admin/roles", (req, res) => {
    res.json(roles);
  });

  app.post("/api/admin/roles", (req, res) => {
    const { title, mappedTitles, growth } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Role title is required." });
    }
    // Check if role already exists to overwrite or create
    const idx = roles.findIndex(r => r.title.toLowerCase() === title.toLowerCase().trim());
    if (idx !== -1) {
      roles[idx] = {
        ...roles[idx],
        mappedTitles: Array.isArray(mappedTitles) ? mappedTitles : roles[idx].mappedTitles,
        growth: growth !== undefined ? Number(growth) : roles[idx].growth
      };
      addLog("Role Mapping Synced", `Updated normalization rules for role model [${roles[idx].title}].`);
      res.json(roles[idx]);
    } else {
      const newRole = {
        id: `role-${Date.now()}`,
        title: title.trim(),
        mappedTitles: Array.isArray(mappedTitles) ? mappedTitles : [],
        growth: Number(growth) || 10
      };
      roles.push(newRole);
      addLog("Role Mapping Created", `Added new normalization target for [${newRole.title}].`);
      res.status(201).json(newRole);
    }
  });

  app.delete("/api/admin/roles/:id", (req, res) => {
    const foundRole = roles.find(r => r.id === req.params.id);
    if (foundRole) {
      roles = roles.filter(r => r.id !== req.params.id);
      addLog("Role Mapping Expelled", `Removed normalization parsing target [${foundRole.title}].`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Role not found" });
    }
  });

  // Media Library Upload/Manage Endpoints
  app.get("/api/media", (req, res) => {
    res.json(mediaAssets);
  });

  app.post("/api/media", (req, res) => {
    const { name, type, dataUrl, size, altText } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: "Media data or dataUrl is required." });
    }
    const id = `img-${Date.now()}`;
    const newAsset = {
      id,
      name: name || `media-asset-${Date.now().toString().slice(-4)}.png`,
      size: size || '120KB',
      type: type || 'image/png',
      uploadedAt: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      dataUrl,
      altText: altText || 'Uploaded asset for reports or logos'
    };
    mediaAssets.unshift(newAsset);
    addLog("Media Asset Ingested", `Saved custom image file: "${newAsset.name}" to memory catalog.`);
    res.status(201).json(newAsset);
  });

  app.delete("/api/media/:id", (req, res) => {
    const foundAsset = mediaAssets.find(m => m.id === req.params.id);
    if (foundAsset) {
      mediaAssets = mediaAssets.filter(m => m.id !== req.params.id);
      addLog("Media Asset Purged", `Cleaned up static storage parameters for "${foundAsset.name}".`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Media asset not found in storage map." });
    }
  });

  // Comprehensive System Statistics endpoint for KPIs
  app.get("/api/admin/stats", (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const addedToday = rawJobs.filter(j => j.postedAt === todayStr).length;
    const activeJobs = rawJobs.filter(j => j.active).length;
    const totalCos = companies.length;
    
    // Sort roles by their active jobs counts representing top roles
    const renderedTrends = getTrendsList().sort((a,b) => b.growth - a.growth).slice(0, 5);

    res.json({
      addedToday: addedToday || rawJobs.length, // fallback if testing on a different date
      activeJobs,
      totalCompanies: totalCos,
      trendingRoles: renderedTrends,
      recentActivity: activityLogs.slice(0, 8),
      lastUpdated: lastUpdatedText
    });
  });

  // Daily Update / Aggregation Intelligence Engine
  app.post("/api/admin/aggregate", (req, res) => {
    // Deduplicate jobs by (company + role + title) case-insensitive
    const seen = new Set<string>();
    const deduplicatedJobs: typeof rawJobs = [];
    
    for (const job of rawJobs) {
      const key = `${job.title.toLowerCase().trim()}:${job.company.toLowerCase().trim()}:${job.location.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedJobs.push(job);
      }
    }

    const previousCount = rawJobs.length;
    rawJobs = deduplicatedJobs;

    // Refresh company nodes list from raw jobs
    for (const job of rawJobs) {
      const exists = companies.some(c => c.name.toLowerCase() === job.company.toLowerCase().trim());
      if (!exists) {
        companies.push({
          id: `co-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: job.company,
          url: job.url || 'https://google.com/careers',
          logoUrl: undefined
        });
      }
    }

    lastUpdatedText = "Last updated: Today (" + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ")";
    
    addLog("Pipeline Triggered", `Executed dynamic data normalizations. deduplicated: ${previousCount - rawJobs.length} redundant listings, fully updated stats.`);

    res.json({
      success: true,
      deduplicatedCount: rawJobs.length,
      originalCount: previousCount,
      updatedTrends: getTrendsList(),
      updatedReports: reports,
      lastUpdated: lastUpdatedText
    });
  });

  // Reports creation/edition API
  app.post("/api/reports", (req, res) => {
    const { title, excerpt, role, content, monthYear, country } = req.body;
    if (!title || !role) {
      return res.status(400).json({ error: "Title and role are required." });
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `report-${Date.now()}`;
    
    const newReport = {
      id: slug,
      title: title.trim(),
      excerpt: excerpt || title,
      role: role,
      monthYear: monthYear || "May 2026",
      updatedAt: new Date().toISOString(),
      country: country || 'Worldwide',
      content: content || `<p>Insight analysis for ${role} in ${monthYear}</p>`,
      stats: {
        companies: 0,
        growth: 15
      },
      roles: [role],
      companies: [],
      chartData: [],
      distribution: []
    };
    
    reports.unshift(newReport);
    addLog("Report Analysis Published", `Created new dynamic report: "${title}" assigned to [${role}].`);
    res.status(201).json(newReport);
  });

  app.put("/api/reports/:id", (req, res) => {
    const idx = reports.findIndex(r => r.id === req.params.id);
    if (idx !== -1) {
      reports[idx] = {
        ...reports[idx],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      addLog("Report Analysis Updated", `Saved revision content for draft "${reports[idx].title}".`);
      res.json(reports[idx]);
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  });

  app.delete("/api/reports/:id", (req, res) => {
    const found = reports.find(r => r.id === req.params.id);
    if (found) {
      reports = reports.filter(r => r.id !== req.params.id);
      addLog("Report Analysis Declassified", `Deleted intelligence document: "${found.title}".`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
