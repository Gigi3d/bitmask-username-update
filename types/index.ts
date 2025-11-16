export interface CSVRow {
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
}

export interface UserUpdateData {
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  submittedAt: Date;
}

export interface AnalyticsData {
  totalUpdates: number;
  updatesPerDay: { date: string; count: number }[];
  updatesPerWeek: { week: string; count: number }[];
  successRate: number;
  activityTimeline: { date: string; count: number }[];
}

export interface AdminUser {
  username: string;
  password: string;
}

