export interface ProfileResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email_verified: boolean;
  timezone: string;
  time_format: "12h" | "24h";
}

export interface ProfileUpdateRequest extends Omit<ProfileResponse, "email_verified"> {}

export interface ChangeEmailRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ChangePasswordRequest {
  current: string;
  next: string;
}

export interface GeneralSettings {
  landing: "dashboard" | "domains" | "scans";
  openInNewTab: boolean;
  autosave: boolean;
}

export interface SecuritySettings {
  requireOtpOnSensitive: boolean;
  preferredChannel: "email";
}

export interface NotificationsSettings {
  email: {
    scanCompleted: boolean;
    onlyHigh: boolean;
    weeklyDigest: boolean;
    domainReminders: boolean;
  };
  inapp: {
    scanToasts: boolean;
  };
}

export interface AppearanceSettings {
  theme: "system" | "light" | "dark";
  density: "comfortable" | "compact";
  colorAssist: boolean;
  monoForCode: boolean;
  locale: string;
}

export interface ScanDefaults {
  scope: {
    sqli: boolean;
    xss: boolean;
    openRedirect: boolean;
    headers: boolean;
  };
  autoOpenReport: boolean;
}

export interface ApiToken {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiTokenCreateResponse extends ApiToken {
  secretOnce: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  events: Array<"scan.completed" | "scan.failed">;
  endpointUrl: string;
  secret: string;
  createdAt: string;
  lastTriggeredAt: string | null;
}

export interface PrivacySettings {
  retentionDays: 7 | 30 | 90;
  telemetry: boolean;
}

export interface SessionsResponse {
  id: string;
  device: string;
  ip: string;
  location: string;
  created: string;
  lastActive: string;
}

export interface ExportDataResponse {
  url: string;
}
