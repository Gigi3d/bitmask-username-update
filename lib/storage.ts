import { getAdminDb } from './instantdb';
import { id } from '@instantdb/admin';
import { CSVRow, UserUpdateData, CSVRecord, UserUpdate, AdminUserRecord } from '@/types';
import { normalizeTelegramAccount } from './utils';

// Type for InstantDB query results (dynamic structure)
type InstantDBQueryResult = {
  [key: string]: unknown;
};

/**
 * Storage functions for InstantDB operations
 * All functions use the admin database instance for server-side operations
 */

/**
 * Get CSV data from InstantDB
 * @param includeAll - If true, returns all CSV records. If false, filters by adminEmail
 * @param adminEmail - Optional admin email to filter CSV records
 * @returns Map of normalized telegram account -> CSVRow
 */
export async function getCSVData(includeAll: boolean = true, adminEmail?: string): Promise<Map<string, CSVRow>> {
  const db = getAdminDb();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { csv_records: {} };
    const result = await db.query(query) as InstantDBQueryResult;

    if (!result?.csv_records) {
      return new Map();
    }

    const records = Array.isArray(result.csv_records)
      ? result.csv_records
      : Object.values(result.csv_records) as CSVRecord[];

    const csvMap = new Map<string, CSVRow>();

    for (const record of records) {
      // Type guard: ensure required fields exist
      if (!record.telegramAccount || !record.oldUsername) {
        continue;
      }

      // Filter by admin email if specified and includeAll is false
      if (!includeAll && adminEmail) {
        const uploadedBy = typeof record.uploadedBy === 'string' ? record.uploadedBy : undefined;
        if (uploadedBy?.toLowerCase() !== adminEmail.toLowerCase()) {
          continue;
        }
      }

      // Normalize telegram account for map key
      const telegramAccount = typeof record.telegramAccount === 'string' ? record.telegramAccount : '';
      const oldUsername = typeof record.oldUsername === 'string' ? record.oldUsername : '';
      const newUsername = typeof record.newUsername === 'string' ? record.newUsername : '';
      const npubKey = typeof record.npubKey === 'string' ? record.npubKey : undefined;
      // Normalize telegram account for consistent lookups
      const normalizedAccount = normalizeTelegramAccount(telegramAccount);

      csvMap.set(normalizedAccount, {
        oldUsername,
        telegramAccount,
        newUsername,
        npubKey,
      });
    }

    return csvMap;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching CSV data:', error);
    }
    throw new Error('Failed to fetch CSV data');
  }
}

/**
 * Set CSV data in InstantDB
 * Replaces all existing CSV records for the given admin email
 * @param csvData - Map of normalized telegram account -> CSVRow
 * @param adminEmail - Email of the admin who uploaded the CSV
 */
export async function setCSVData(csvData: Map<string, CSVRow>, adminEmail: string): Promise<void> {
  const db = getAdminDb();

  try {
    // First, delete all existing CSV records for this admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { csv_records: {} };
    const existingResult = await db.query(query) as InstantDBQueryResult;

    if (existingResult?.csv_records) {
      const existingRecords = Array.isArray(existingResult.csv_records)
        ? existingResult.csv_records
        : Object.values(existingResult.csv_records) as CSVRecord[];

      // Filter to only records uploaded by this admin
      const adminRecords = existingRecords.filter(
        record => {
          const uploadedBy = typeof record.uploadedBy === 'string' ? record.uploadedBy : undefined;
          return uploadedBy?.toLowerCase() === adminEmail.toLowerCase();
        }
      );

      // Delete existing records for this admin
      if (adminRecords.length > 0) {
        const deleteOps = adminRecords.map(record =>
          db.tx.csv_records[record.id].delete()
        );
        await db.transact(deleteOps);
      }
    }

    // Create new records
    const now = Date.now();
    const createOps = Array.from(csvData.values()).map(row => {
      const recordId = id();
      return db.tx.csv_records[recordId].create({
        oldUsername: row.oldUsername,
        telegramAccount: row.telegramAccount,
        newUsername: row.newUsername,
        npubKey: row.npubKey,
        createdAt: now,
        uploadedBy: adminEmail,
      });
    });

    if (createOps.length > 0) {
      await db.transact(createOps);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error setting CSV data:', error);
    }
    throw new Error('Failed to store CSV data');
  }
}

/**
 * Add a user update to InstantDB
 * @param updateData - User update data
 */
export async function addUserUpdate(updateData: UserUpdateData): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();

  try {
    const recordId = id();
    const now = Date.now();

    await db.transact([
      db.tx.user_updates[recordId].create({
        oldUsername: updateData.oldUsername,
        telegramAccount: updateData.telegramAccount,
        newUsername: updateData.newUsername,
        npubKey: updateData.npubKey || null,
        trackingId: updateData.trackingId || null,
        submittedAt: updateData.submittedAt || now,
      })
    ]);

    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error adding user update:', error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a user update already exists
 * @param oldUsername - Old username to check
 * @param telegramAccount - Telegram account to check
 * @param npubKey - Optional nPUB key to check
 * @returns true if duplicate exists, false otherwise
 */
export async function checkDuplicateUpdate(
  oldUsername: string,
  telegramAccount: string,
  npubKey?: string
): Promise<boolean> {
  const db = getAdminDb();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { user_updates: {} };
    const result = await db.query(query) as InstantDBQueryResult;

    if (!result?.user_updates) {
      return false;
    }

    const rawUpdates = Array.isArray(result.user_updates)
      ? result.user_updates
      : Object.values(result.user_updates);

    // Check if any existing update matches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawUpdates.some((update: any) => {
      const matchesTelegram = update.telegramAccount === telegramAccount;
      const matchesUsername = update.oldUsername === oldUsername;
      const matchesNpub = npubKey && update.npubKey ? update.npubKey === npubKey : false;

      return matchesTelegram && (matchesUsername || matchesNpub);
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking duplicate update:', error);
    }
    // On error, assume no duplicate (fail open)
    return false;
  }
}

/**
 * Get all user updates from InstantDB
 * @returns Array of UserUpdate objects
 */
export async function getUserUpdates(): Promise<UserUpdate[]> {
  const db = getAdminDb();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { user_updates: {} };
    const result = await db.query(query) as InstantDBQueryResult;

    if (!result?.user_updates) {
      return [];
    }

    const rawUpdates = Array.isArray(result.user_updates)
      ? result.user_updates
      : Object.values(result.user_updates);

    // Map and validate the updates to ensure they match UserUpdate type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: UserUpdate[] = rawUpdates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((update: any): update is UserUpdate => {
        return (
          update &&
          typeof update.id === 'string' &&
          typeof update.oldUsername === 'string' &&
          typeof update.telegramAccount === 'string' &&
          typeof update.newUsername === 'string' &&
          typeof update.submittedAt === 'number'
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((update: any) => ({
        id: update.id,
        oldUsername: update.oldUsername,
        telegramAccount: update.telegramAccount,
        newUsername: update.newUsername,
        submittedAt: update.submittedAt,
      }));

    return updates;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user updates:', error);
    }
    throw new Error('Failed to fetch user updates');
  }
}

/**
 * Get all admin users from InstantDB
 * @returns Array of AdminUserRecord objects
 */
export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const db = getAdminDb();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { admin_users: {} };
    const result = await db.query(query) as InstantDBQueryResult;

    if (!result?.admin_users) {
      return [];
    }

    const rawAdmins = Array.isArray(result.admin_users)
      ? result.admin_users
      : Object.values(result.admin_users);

    // Map and validate the admins to ensure they match AdminUserRecord type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admins: AdminUserRecord[] = rawAdmins
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((admin: any): admin is AdminUserRecord => {
        return (
          admin &&
          typeof admin.id === 'string' &&
          typeof admin.email === 'string' &&
          typeof admin.role === 'string' &&
          typeof admin.createdAt === 'number'
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((admin: any) => ({
        id: admin.id,
        email: admin.email,
        role: admin.role as 'admin' | 'superadmin',
        createdAt: admin.createdAt,
      }));

    return admins;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching admin users:', error);
    }
    throw new Error('Failed to fetch admin users');
  }
}

/**
 * Create an admin user in InstantDB
 * @param email - Admin email address
 * @param role - Admin role ('admin' or 'superadmin')
 * @param checkExisting - Whether to check if admin already exists (default: true)
 * @throws Error if admin already exists and checkExisting is true
 */
export async function createAdminUser(
  email: string,
  role: 'admin' | 'superadmin',
  checkExisting: boolean = true
): Promise<void> {
  const db = getAdminDb();

  try {
    // Check if admin already exists
    if (checkExisting) {
      const existingAdmins = await getAdminUsers();
      const exists = existingAdmins.some(
        admin => {
          const adminEmail = typeof admin.email === 'string' ? admin.email : '';
          return adminEmail.toLowerCase() === email.toLowerCase();
        }
      );

      if (exists) {
        throw new Error(`Admin user with email ${email} already exists`);
      }
    }

    // Create admin user
    const recordId = id();
    const now = Date.now();

    await db.transact([
      db.tx.admin_users[recordId].create({
        email: email.toLowerCase().trim(),
        role: role,
        createdAt: now,
      })
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating admin user:', error);
    }
    throw new Error('Failed to create admin user');
  }
}

/**
 * Check if an admin user exists
 * @param email - Email address to check
 * @returns true if admin exists, false otherwise
 */
export async function adminUserExists(email: string): Promise<boolean> {
  try {
    const admins = await getAdminUsers();
    return admins.some(
      admin => {
        const adminEmail = typeof admin.email === 'string' ? admin.email : '';
        return adminEmail.toLowerCase() === email.toLowerCase();
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking admin user existence:', error);
    }
    return false;
  }
}
