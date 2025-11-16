import { CSVRow, UserUpdateData, CSVRecord, UserUpdate, AdminUserRecord } from '@/types';
import { getAdminDb } from './instantdb';
import { id } from '@instantdb/admin';

// Server-side functions using InstantDB Admin SDK

/**
 * Get all CSV records from InstantDB
 * Returns a Map keyed by normalized telegram account
 */
export async function getCSVData(): Promise<Map<string, CSVRow>> {
  try {
    const db = getAdminDb();
    const result = await db.query({ csv_records: {} });
    
    const csvData = new Map<string, CSVRow>();
    
    if (result?.csv_records) {
      const records = Array.isArray(result.csv_records) ? result.csv_records : Object.values(result.csv_records);
      for (const record of records) {
        const typedRecord = record as CSVRecord;
        const normalizedAccount = typedRecord.telegramAccount.toLowerCase().replace('@', '');
        csvData.set(normalizedAccount, {
          oldUsername: typedRecord.oldUsername,
          telegramAccount: typedRecord.telegramAccount,
          newUsername: typedRecord.newUsername,
        });
      }
    }
    
    return csvData;
  } catch (error) {
    console.error('Error fetching CSV data from InstantDB:', error);
    throw new Error('Failed to fetch CSV data');
  }
}

/**
 * Set CSV data in InstantDB
 * Replaces all existing CSV records with new ones
 */
export async function setCSVData(data: Map<string, CSVRow>): Promise<void> {
  try {
    const db = getAdminDb();
    
    // First, get all existing records to delete them
    const existingResult = await db.query({ csv_records: {} });
    
    // Build transaction chunks
    const txChunks: any[] = [];
    
    // Delete all existing records
    if (existingResult?.csv_records) {
      const existingRecords = Array.isArray(existingResult.csv_records) 
        ? existingResult.csv_records 
        : Object.values(existingResult.csv_records);
      for (const record of existingRecords) {
        const typedRecord = record as CSVRecord;
        txChunks.push(db.tx.csv_records[typedRecord.id].delete());
      }
    }
    
    // Create new records
    const now = Date.now();
    for (const row of data.values()) {
      const recordId = id();
      txChunks.push(db.tx.csv_records[recordId].create({
        oldUsername: row.oldUsername,
        telegramAccount: row.telegramAccount,
        newUsername: row.newUsername,
        createdAt: now,
      }));
    }
    
    await db.transact(txChunks);
  } catch (error) {
    console.error('Error setting CSV data in InstantDB:', error);
    throw new Error('Failed to save CSV data');
  }
}

/**
 * Get all user updates from InstantDB
 */
export async function getUserUpdates(): Promise<UserUpdateData[]> {
  try {
    const db = getAdminDb();
    const result = await db.query({ user_updates: {} });
    
    if (!result?.user_updates) {
      return [];
    }
    
    const updates = Array.isArray(result.user_updates) 
      ? result.user_updates 
      : Object.values(result.user_updates);
    
    return updates.map((update) => {
      const typedUpdate = update as UserUpdate;
      return {
        oldUsername: typedUpdate.oldUsername,
        telegramAccount: typedUpdate.telegramAccount,
        newUsername: typedUpdate.newUsername,
        submittedAt: new Date(typedUpdate.submittedAt).toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching user updates from InstantDB:', error);
    throw new Error('Failed to fetch user updates');
  }
}

/**
 * Add a user update to InstantDB
 */
export async function addUserUpdate(update: UserUpdateData): Promise<void> {
  try {
    const db = getAdminDb();
    const recordId = id();
    const submittedAt = new Date(update.submittedAt).getTime();
    
    await db.transact([
      db.tx.user_updates[recordId].create({
        oldUsername: update.oldUsername,
        telegramAccount: update.telegramAccount,
        newUsername: update.newUsername,
        submittedAt: submittedAt,
      })
    ]);
  } catch (error) {
    console.error('Error adding user update to InstantDB:', error);
    throw new Error('Failed to save user update');
  }
}

/**
 * Get all admin users from InstantDB
 */
export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  try {
    const db = getAdminDb();
    const result = await db.query({ admin_users: {} });
    
    if (!result?.admin_users) {
      return [];
    }
    
    const admins = Array.isArray(result.admin_users) 
      ? result.admin_users 
      : Object.values(result.admin_users);
    
    return admins.map((admin) => admin as AdminUserRecord);
  } catch (error) {
    console.error('Error fetching admin users from InstantDB:', error);
    throw new Error('Failed to fetch admin users');
  }
}

/**
 * Check if an admin user exists by email
 */
export async function adminUserExists(email: string): Promise<boolean> {
  try {
    const admins = await getAdminUsers();
    return admins.some(admin => admin.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error checking admin user existence:', error);
    return false;
  }
}

/**
 * Create an admin user in InstantDB
 */
export async function createAdminUser(email: string, role: 'admin' | 'superadmin' = 'admin', skipExistenceCheck: boolean = false): Promise<void> {
  try {
    const db = getAdminDb();
    
    // Check if admin already exists (skip if admin token is not available)
    if (!skipExistenceCheck) {
      try {
        const exists = await adminUserExists(email);
        if (exists) {
          throw new Error(`Admin user with email ${email} already exists`);
        }
      } catch (checkError) {
        // If existence check fails (e.g., no admin token), skip it and proceed
        // This allows first admin creation without admin token
        console.warn('Could not check if admin user exists, proceeding with creation...');
      }
    }
    
    const recordId = id();
    const now = Date.now();
    
    // Use asUser if we have the email but no admin token (for first admin creation)
    try {
      await db.transact([
        db.tx.admin_users[recordId].create({
          email: email.toLowerCase().trim(),
          role: role,
          createdAt: now,
        })
      ]);
    } catch (transactError: any) {
      // If transaction fails due to admin token, try using client-side approach
      // This is a fallback for first admin creation
      if (transactError?.message?.includes('Admin token') || transactError?.message?.includes('token')) {
        console.warn('Admin token not available. Attempting alternative method...');
        // For now, re-throw the error with a helpful message
        throw new Error('Admin token required. Please set INSTANT_ADMIN_TOKEN in .env.local or use the script: npm run add-root-admin');
      }
      throw transactError;
    }
  } catch (error) {
    console.error('Error creating admin user in InstantDB:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create admin user');
  }
}

