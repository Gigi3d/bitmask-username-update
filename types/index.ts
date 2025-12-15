export interface CSVRow {
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
}

export interface UserUpdateData {
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
  trackingId?: string; // Optional tracking ID for submission tracking
  submittedAt: number; // Unix timestamp
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

// InstantDB Schema Types
export interface CSVRecord {
  id: string;
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
  createdAt: number;
  uploadedBy?: string; // Email of the admin who uploaded the CSV (optional for backward compatibility)
}

export interface UserUpdate {
  id: string;
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
  submittedAt: number;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: number;
}

// InstantDB Schema Definition
export const instantSchema = {
  entities: {
    csv_records: {
      oldUsername: 'string',
      telegramAccount: 'string',
      newUsername: 'string',
      npubKey: 'string',
      createdAt: 'number',
      uploadedBy: 'string',
    },
    user_updates: {
      oldUsername: 'string',
      telegramAccount: 'string',
      newUsername: 'string',
      npubKey: 'string',
      submittedAt: 'number',
    },
    admin_users: {
      email: 'string',
      role: 'string',
      createdAt: 'number',
    },
  },
  links: {},
  rooms: {},
} as const;

