export interface RawJob {
  id: string;
  title: string;
  role: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  postedAt: string;
  active: boolean;
  country?: string;
  expiresAt?: string;
}

export interface Trend {
  id: string;
  role: string;
  growth: number;
  companies: number;
  trend: 'up' | 'down';
}

export interface Company {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
}

export interface Report {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  role: string;
  monthYear: string;
  content: string; // Rich Text Content in HTML or Markdown structure
  country?: string;
  stats: {
    companies: number;
    growth: number;
  };
  roles: string[];
  companies: { name: string; url: string; logoUrl?: string }[];
  chartData: { name: string; demand: number }[];
  distribution: { name: string; value: number }[];
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  dataUrl: string;
  altText?: string;
}

export interface RoleDefinition {
  id: string;
  title: string;
  mappedTitles: string[];
  growth: number;
}
