// src/lib/roleIcons.ts
// Maps role slugs/names to Lucide icon components
// Used to dynamically assign icons to job categories

export const ROLE_ICON_MAP: Record<string, string> = {
  // Tech & Development
  'software-engineer': 'code',
  'software-developer': 'code',
  'web-developer': 'code',
  'frontend-developer': 'code',
  'backend-developer': 'code',
  'fullstack-developer': 'code',
  'mobile-developer': 'code',
  'devops-engineer': 'code',
  'data-analyst': 'bar-chart',
  'data-scientist': 'bar-chart',
  'data-engineer': 'bar-chart',
  'database-administrator': 'bar-chart',
  'cybersecurity': 'shield',
  'security-analyst': 'shield',
  'network-engineer': 'shield',
  'cloud-engineer': 'code',
  'system-administrator': 'code',
  'it-support': 'headphones',
  'it-technician': 'headphones',
  
  // Design & Creative
  'ui-ux-designer': 'palette',
  'graphic-designer': 'palette',
  'product-designer': 'palette',
  'web-designer': 'palette',
  'creative-director': 'palette',
  
  // Finance & Accounting
  'accountant': 'calculator',
  'financial-analyst': 'calculator',
  'auditor': 'calculator',
  'bookkeeper': 'calculator',
  'banker': 'calculator',
  
  // Customer Service
  'customer-support': 'headphones',
  'customer-service': 'headphones',
  'call-center': 'headphones',
  'help-desk': 'headphones',
  
  // Management
  'project-manager': 'users',
  'product-manager': 'users',
  'operations-manager': 'users',
  'team-leader': 'users',
  'general-manager': 'users',
  
  // Logistics & Supply Chain
  'logistics': 'truck',
  'supply-chain': 'truck',
  'warehouse': 'truck',
  'driver': 'truck',
  'fleet-manager': 'truck',
  
  // Healthcare
  'healthcare': 'stethoscope',
  'doctor': 'stethoscope',
  'nurse': 'stethoscope',
  'pharmacist': 'stethoscope',
  'medical-officer': 'stethoscope',
  
  // Marketing
  'marketing': 'trending-up',
  'digital-marketing': 'trending-up',
  'social-media': 'trending-up',
  'content-writer': 'trending-up',
  'seo-specialist': 'trending-up',
  
  // Sales
  'sales': 'briefcase',
  'sales-representative': 'briefcase',
  'business-development': 'briefcase',
  'account-manager': 'briefcase',
  
  // HR & Recruiting
  'hr-recruiting': 'users',
  'human-resources': 'users',
  'recruiter': 'users',
  'talent-acquisition': 'users',
  
  // Education
  'teacher': 'book-open',
  'lecturer': 'book-open',
  'trainer': 'book-open',
  'tutor': 'book-open',
  
  // Engineering
  'engineer': 'code',
  'civil-engineer': 'building',
  'electrical-engineer': 'zap',
  'mechanical-engineer': 'settings',
  
  // Legal
  'lawyer': 'scale',
  'legal-officer': 'scale',
  'compliance-officer': 'scale',
  
  // Hospitality
  'chef': 'utensils',
  'hotel-manager': 'building',
  'waiter': 'utensils',
  
  // Agriculture
  'agriculture': 'leaf',
  'farmer': 'leaf',
  'agricultural-officer': 'leaf',
  
  // Default fallbacks
  'general': 'briefcase',
  'other': 'briefcase',
};

export const getIconForRole = (roleName: string, roleSlug?: string): string => {
  // Try slug first
  if (roleSlug && ROLE_ICON_MAP[roleSlug]) {
    return ROLE_ICON_MAP[roleSlug];
  }
  
  // Try name as slug
  const nameSlug = roleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (ROLE_ICON_MAP[nameSlug]) {
    return ROLE_ICON_MAP[nameSlug];
  }
  
  // Try partial matches
  for (const [key, icon] of Object.entries(ROLE_ICON_MAP)) {
    if (roleName.toLowerCase().includes(key.replace(/-/g, ' '))) {
      return icon;
    }
  }
  
  // Default
  return 'briefcase';
};
