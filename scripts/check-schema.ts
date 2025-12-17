#!/usr/bin/env tsx

/**
 * Check what entities exist in InstantDB
 */

import { getAdminDb } from '@/lib/instantdb';

async function checkSchema() {
    console.log('🔍 Checking InstantDB schema...\n');

    try {
        const db = getAdminDb();

        // Try to query csv_uploads
        console.log('Checking csv_uploads entity...');
        try {
            const uploads = await db.query({ csv_uploads: {} });
            console.log('✅ csv_uploads exists');
            console.log('   Records found:', uploads.csv_uploads?.length || 0);
        } catch (error: any) {
            console.log('❌ csv_uploads error:', error.message);
        }

        console.log('\nChecking csv_records entity...');
        try {
            const records = await db.query({ csv_records: {} });
            console.log('✅ csv_records exists');
            console.log('   Records found:', records.csv_records?.length || 0);
        } catch (error: any) {
            console.log('❌ csv_records error:', error.message);
        }

        console.log('\n📋 Expected schema:');
        console.log('\ncsv_uploads should have:');
        console.log('  - uploadName (string)');
        console.log('  - fileName (string)');
        console.log('  - uploadedBy (string)');
        console.log('  - uploadedAt (number)');
        console.log('  - recordCount (number)');

        console.log('\ncsv_records should have:');
        console.log('  - oldUsername (string)');
        console.log('  - newUsername (string)');
        console.log('  - npubKey (string, optional)');
        console.log('  - createdAt (number)');
        console.log('  - uploadId (string)');
        console.log('  - uploadedBy (string, optional)');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

checkSchema();
