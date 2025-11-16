export interface CSVRow {
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
}

export interface UserUpdateData {
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  submittedAt: string; // ISO string for proper JSON serialization
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
  createdAt: number;
}

export interface UserUpdate {
  id: string;
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
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
      createdAt: 'number',
    },
    user_updates: {
      oldUsername: 'string',
      telegramAccount: 'string',
      newUsername: 'string',
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

