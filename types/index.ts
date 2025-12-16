export interface CSVRow {
  oldUsername: string;
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
}

export interface UserUpdateData {
  oldUsername: string;
  newUsername: string; // Current/latest username
  npubKey?: string; // Optional nPUB key as alternative identifier
  trackingId?: string; // Optional tracking ID for submission tracking
  submittedAt: number; // Unix timestamp
  // 3-Attempt tracking fields
  updateAttemptCount: number; // 1, 2, or 3
  firstNewUsername?: string;
  secondNewUsername?: string;
  thirdNewUsername?: string;
  lastUpdatedAt: number;
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
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
  createdAt: number;
  uploadedBy?: string; // Email of the admin who uploaded the CSV (optional for backward compatibility)
}

export interface UserUpdate {
  id: string;
  oldUsername: string;
  newUsername: string;
  npubKey?: string; // Optional nPUB key as alternative identifier
  submittedAt: number;
  // 3-Attempt tracking fields
  updateAttemptCount: number;
  firstNewUsername?: string;
  secondNewUsername?: string;
  thirdNewUsername?: string;
  lastUpdatedAt: number;
  trackingId?: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: number;
}

// User update attempts tracking
export interface UserUpdateAttempts {
  oldUsername: string;
  attemptCount: number; // 0, 1, 2, or 3
  attempts: {
    attemptNumber: number;
    username: string;
    timestamp: number;
  }[];
  canUpdate: boolean;
  remainingAttempts: number;
}

// InstantDB Schema Definition
export const instantSchema = {
  entities: {
    csv_records: {
      oldUsername: 'string',
      newUsername: 'string',
      npubKey: 'string',
      createdAt: 'number',
      uploadedBy: 'string',
    },
    user_updates: {
      oldUsername: 'string',
      newUsername: 'string',
      npubKey: 'string',
      submittedAt: 'number',
      updateAttemptCount: 'number',
      firstNewUsername: 'string',
      secondNewUsername: 'string',
      thirdNewUsername: 'string',
      lastUpdatedAt: 'number',
      trackingId: 'string',
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

