import { getAdminDb } from './instantdb';
import { id } from '@instantdb/admin';
import { CSVRow, UserUpdateData, CSVRecord, UserUpdate, AdminUserRecord, UserUpdateAttempts } from '@/types';

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
 * @returns Map of oldUsername -> CSVRow
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
      // Skip records that have neither oldUsername nor npubKey
      if (!record.oldUsername && !record.npubKey) {
        continue;
      }

      // Filter by admin email if specified and includeAll is false
      if (!includeAll && adminEmail) {
        const uploadedBy = typeof record.uploadedBy === 'string' ? record.uploadedBy : undefined;
        if (uploadedBy?.toLowerCase() !== adminEmail.toLowerCase()) {
          continue;
        }
      }

      const oldUsername = typeof record.oldUsername === 'string' ? record.oldUsername : '';
      const newUsername = typeof record.newUsername === 'string' ? record.newUsername : '';
      const npubKey = typeof record.npubKey === 'string' ? record.npubKey : undefined;

      // Use a composite key: prefer oldUsername, fallback to npubKey
      const mapKey = oldUsername ? oldUsername.toLowerCase() : (npubKey ? npubKey.toLowerCase() : '');

      if (mapKey) {
        csvMap.set(mapKey, {
          oldUsername,
          newUsername,
          npubKey,
        });
      }
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
 * @param csvData - Map of oldUsername -> CSVRow
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

      // Build record matching schema exactly
      const record: {
        oldUsername: string;
        newUsername: string;
        npubKey?: string;
        createdAt: number;
        uploadedBy?: string;
      } = {
        oldUsername: row.oldUsername,
        newUsername: row.newUsername,
        createdAt: now,
        uploadedBy: adminEmail,
      };

      // Only include npubKey if it exists
      if (row.npubKey) {
        record.npubKey = row.npubKey;
      }

      return db.tx.csv_records[recordId].create(record);
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

    // Build record with required fields
    const record: Record<string, string | number> = {
      oldUsername: updateData.oldUsername,
      newUsername: updateData.newUsername,
      submittedAt: updateData.submittedAt || now,
      updateAttemptCount: updateData.updateAttemptCount,
      lastUpdatedAt: updateData.lastUpdatedAt || now,
    };

    // Only add optional fields if they exist (avoid null, use undefined)
    if (updateData.npubKey) record.npubKey = updateData.npubKey;
    if (updateData.trackingId) record.trackingId = updateData.trackingId;
    if (updateData.firstNewUsername) record.firstNewUsername = updateData.firstNewUsername;
    if (updateData.secondNewUsername) record.secondNewUsername = updateData.secondNewUsername;
    if (updateData.thirdNewUsername) record.thirdNewUsername = updateData.thirdNewUsername;

    await db.transact([
      db.tx.user_updates[recordId].create(record)
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
 * Check if a user can still make updates (hasn't reached 3-attempt limit)
 * @param oldUsername - Old username to check
 * @returns Object with canUpdate boolean, attempt count, and remaining attempts
 */
export async function canUserUpdate(
  oldUsername: string
): Promise<{ canUpdate: boolean; attemptCount: number; remainingAttempts: number }> {
  const db = getAdminDb();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { user_updates: {} };
    const result = await db.query(query) as InstantDBQueryResult;

    if (!result?.user_updates) {
      return { canUpdate: true, attemptCount: 0, remainingAttempts: 3 };
    }

    const rawUpdates = Array.isArray(result.user_updates)
      ? result.user_updates
      : Object.values(result.user_updates);

    // Find the latest update for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userUpdates = rawUpdates.filter((update: any) =>
      update.oldUsername?.toLowerCase() === oldUsername.toLowerCase()
    );

    if (userUpdates.length === 0) {
      return { canUpdate: true, attemptCount: 0, remainingAttempts: 3 };
    }

    // Get the most recent update to check attempt count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestUpdate = userUpdates.reduce((latest: any, current: any) => {
      return (current.lastUpdatedAt || current.submittedAt) > (latest.lastUpdatedAt || latest.submittedAt)
        ? current
        : latest;
    });

    const attemptCount = latestUpdate.updateAttemptCount || 0;
    const canUpdate = attemptCount < 3;
    const remainingAttempts = Math.max(0, 3 - attemptCount);

    return { canUpdate, attemptCount, remainingAttempts };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking user update limit:', error);
    }
    // On error, allow update (fail open)
    return { canUpdate: true, attemptCount: 0, remainingAttempts: 3 };
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
    const updates: UserUpdate[] = rawUpdates
      .filter((update: unknown): update is UserUpdate => {
        const isValid = (
          update &&
          typeof (update as UserUpdate).id === 'string' &&
          typeof (update as UserUpdate).oldUsername === 'string' &&
          typeof (update as UserUpdate).newUsername === 'string' &&
          typeof (update as UserUpdate).submittedAt === 'number'
        );
        return Boolean(isValid);
      })
      .map((update: UserUpdate) => ({
        id: update.id,
        oldUsername: update.oldUsername,
        newUsername: update.newUsername,
        npubKey: update.npubKey,
        submittedAt: update.submittedAt,
        // 3-Attempt tracking fields
        updateAttemptCount: update.updateAttemptCount || 1,
        firstNewUsername: update.firstNewUsername,
        secondNewUsername: update.secondNewUsername,
        thirdNewUsername: update.thirdNewUsername,
        lastUpdatedAt: update.lastUpdatedAt || update.submittedAt,
        trackingId: update.trackingId,
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
 * Get a user's update attempt history
 * @param oldUsername - User's old username
 * @returns UserUpdateAttempts object with attempt history
 */
export async function getUserUpdateAttempts(
  oldUsername: string
): Promise<UserUpdateAttempts> {
  const db = getAdminDb();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { user_updates: {} };
    const result = await db.query(query) as InstantDBQueryResult;

    if (!result?.user_updates) {
      return {
        oldUsername,
        attemptCount: 0,
        attempts: [],
        canUpdate: true,
        remainingAttempts: 3,
      };
    }

    const rawUpdates = Array.isArray(result.user_updates)
      ? result.user_updates
      : Object.values(result.user_updates);

    // Find all updates for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userUpdates = rawUpdates.filter((update: any) =>
      update.oldUsername?.toLowerCase() === oldUsername.toLowerCase()
    );

    if (userUpdates.length === 0) {
      return {
        oldUsername,
        attemptCount: 0,
        attempts: [],
        canUpdate: true,
        remainingAttempts: 3,
      };
    }

    // Get the most recent update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestUpdate = userUpdates.reduce((latest: any, current: any) => {
      return (current.lastUpdatedAt || current.submittedAt) > (latest.lastUpdatedAt || latest.submittedAt)
        ? current
        : latest;
    });

    const attemptCount = latestUpdate.updateAttemptCount || 0;
    const attempts = [];

    // Build attempts array from the latest update
    if (latestUpdate.firstNewUsername) {
      attempts.push({
        attemptNumber: 1,
        username: latestUpdate.firstNewUsername,
        timestamp: latestUpdate.submittedAt,
      });
    }
    if (latestUpdate.secondNewUsername) {
      attempts.push({
        attemptNumber: 2,
        username: latestUpdate.secondNewUsername,
        timestamp: latestUpdate.lastUpdatedAt || latestUpdate.submittedAt,
      });
    }
    if (latestUpdate.thirdNewUsername) {
      attempts.push({
        attemptNumber: 3,
        username: latestUpdate.thirdNewUsername,
        timestamp: latestUpdate.lastUpdatedAt || latestUpdate.submittedAt,
      });
    }

    const canUpdate = attemptCount < 3;
    const remainingAttempts = Math.max(0, 3 - attemptCount);

    return {
      oldUsername,
      attemptCount,
      attempts,
      canUpdate,
      remainingAttempts,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user update attempts:', error);
    }
    return {
      oldUsername,
      attemptCount: 0,
      attempts: [],
      canUpdate: true,
      remainingAttempts: 3,
    };
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
    const admins: AdminUserRecord[] = rawAdmins
      .filter((admin: unknown): admin is AdminUserRecord => {
        const isValid = (
          admin &&
          typeof (admin as AdminUserRecord).id === 'string' &&
          typeof (admin as AdminUserRecord).email === 'string' &&
          typeof (admin as AdminUserRecord).role === 'string' &&
          typeof (admin as AdminUserRecord).createdAt === 'number'
        );
        return Boolean(isValid);
      })
      .map((admin: AdminUserRecord) => ({
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
