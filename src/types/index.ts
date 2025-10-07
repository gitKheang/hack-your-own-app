export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type ScanType = 'SQLi' | 'XSS' | 'OpenRedirect' | 'Headers';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  isVerified: boolean;
  created_at: string;
}

export interface Domain {
  id: string;
  user_id: string;
  domain_name: string;
  isVerified: boolean;
  verification_token?: string;
  verified_at?: string;
  created_at: string;
}

export interface ScanTask {
  id: string;
  user_id: string;
  domain_id: string;
  target_url: string;
  target_status: TaskStatus;
  summary?: string;
  created_at: string;
  completed_at?: string;
}

export interface Evidence {
  request?: string;
  responseSnippet?: string;
  affected?: string[];
}

export interface AIRecommendation {
  recommendation: string;
  impact: string;
  sampleFix?: string;
}

export interface ScanResult {
  id: string;
  task_id: string;
  scan_type: ScanType;
  severity: Severity;
  summary: string;
  raw_output: unknown;
  scanned_at: string;
  created_at: string;
  evidence?: Evidence;
  cwe?: string;
  owasp?: string;
  references?: string[];
  ai?: AIRecommendation;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
