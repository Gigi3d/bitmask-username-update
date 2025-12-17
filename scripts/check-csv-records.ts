import { getAdminDb } from '../lib/instantdb';

/**
 * Diagnostic script to check CSV records in the database
 * Run with: npx tsx scripts/check-csv-records.ts
 */

async function checkCSVRecords() {
    const db = getAdminDb();

    try {
        console.log('🔍 Checking CSV records in database...\n');

        const query: any = { csv_records: {} };
        const result = await db.query(query);

        if (!result?.csv_records) {
            console.log('❌ No csv_records found in database');
            return;
        }

        const records = Array.isArray(result.csv_records)
            ? result.csv_records
            : Object.values(result.csv_records);

        console.log(`✅ Found ${records.length} total CSV records\n`);

        // Count records with npubKey
        const recordsWithNpub = records.filter((r: any) => r.npubKey);
        console.log(`📊 Records with npubKey: ${recordsWithNpub.length}`);
        console.log(`📊 Records without npubKey: ${records.length - recordsWithNpub.length}\n`);

        // Search for the specific npub key
        const targetNpub = 'npub14j9lw3uwue8cecwefqr828v7cveg4la35w7vuk82xkd9ttpflapsm3gy5f';
        console.log(`🔎 Searching for: ${targetNpub}\n`);

        const matchingRecord = records.find((r: any) =>
            r.npubKey && r.npubKey.toLowerCase().trim() === targetNpub.toLowerCase().trim()
        );

        if (matchingRecord) {
            console.log('✅ FOUND matching record:');
            console.log(JSON.stringify(matchingRecord, null, 2));
        } else {
            console.log('❌ No matching record found');

            // Show sample of records with npubKey for debugging
            console.log('\n📋 Sample of records with npubKey (first 5):');
            recordsWithNpub.slice(0, 5).forEach((r: any, i: number) => {
                console.log(`\n${i + 1}. npubKey: ${r.npubKey}`);
                console.log(`   oldUsername: ${r.oldUsername}`);
                console.log(`   newUsername: ${r.newUsername}`);
            });
        }

        // Check for similar npub keys (case-insensitive partial match)
        const similarRecords = records.filter((r: any) =>
            r.npubKey && r.npubKey.toLowerCase().includes('npub14j9lw3uwue8cecwefqr')
        );

        if (similarRecords.length > 0) {
            console.log('\n🔍 Found similar npub keys:');
            similarRecords.forEach((r: any) => {
                console.log(`   ${r.npubKey}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkCSVRecords();
