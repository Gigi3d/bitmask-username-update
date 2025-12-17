#!/usr/bin/env node

/**
 * Script to clear all database entries
 * This will delete:
 * - All CSV records (csv_records)
 * - All user updates (user_updates)
 * - All CSV uploads (csv_uploads)
 * 
 * WARNING: This action is IRREVERSIBLE!
 * 
 * Run with: npx tsx scripts/clear-database.ts
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function clearDatabase() {
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;

    if (!appId || !adminToken) {
        console.error('❌ Missing environment variables');
        process.exit(1);
    }

    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('📋 This includes:');
    console.log('   - All CSV records');
    console.log('   - All user updates');
    console.log('   - All CSV uploads');
    console.log('');

    const db = init({ appId, adminToken });

    try {
        // 1. Delete all CSV records
        console.log('🗑️  Deleting CSV records...');
        const csvRecordsResult = await db.query({ csv_records: {} });
        const csvRecords = csvRecordsResult.csv_records || [];

        if (csvRecords.length > 0) {
            const deleteOps = csvRecords.map((record: any) =>
                db.tx.csv_records[record.id].delete()
            );
            await db.transact(deleteOps);
            console.log(`✅ Deleted ${csvRecords.length} CSV records`);
        } else {
            console.log('ℹ️  No CSV records to delete');
        }

        // 2. Delete all user updates
        console.log('🗑️  Deleting user updates...');
        const userUpdatesResult = await db.query({ user_updates: {} });
        const userUpdates = userUpdatesResult.user_updates || [];

        if (userUpdates.length > 0) {
            const deleteOps = userUpdates.map((update: any) =>
                db.tx.user_updates[update.id].delete()
            );
            await db.transact(deleteOps);
            console.log(`✅ Deleted ${userUpdates.length} user updates`);
        } else {
            console.log('ℹ️  No user updates to delete');
        }

        // 3. Delete all CSV uploads
        console.log('🗑️  Deleting CSV uploads...');
        const csvUploadsResult = await db.query({ csv_uploads: {} });
        const csvUploads = csvUploadsResult.csv_uploads || [];

        if (csvUploads.length > 0) {
            const deleteOps = csvUploads.map((upload: any) =>
                db.tx.csv_uploads[upload.id].delete()
            );
            await db.transact(deleteOps);
            console.log(`✅ Deleted ${csvUploads.length} CSV uploads`);
        } else {
            console.log('ℹ️  No CSV uploads to delete');
        }

        console.log('');
        console.log('✅ Database cleared successfully!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Upload your CSV file via the Admin Dashboard');
        console.log('   2. Verify the records appear in the CSV Viewer');
        console.log('   3. Test the username update flow');

    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
}

// Run the script
console.log('🚀 Starting database clear...\n');
clearDatabase();
