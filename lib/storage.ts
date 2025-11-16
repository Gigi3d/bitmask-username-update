import { CSVRow, UserUpdateData, CSVRecord, UserUpdate } from '@/types';
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

