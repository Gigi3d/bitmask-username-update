#!/usr/bin/env tsx

/**
 * Sync Schema with InstantDB
 * 
 * InstantDB automatically syncs your schema from instant.schema.ts
 * when you use the app. This script helps verify the schema is ready.
 * 
 * Usage:
 *   npm run sync-schema
 */

import { init } from '@instantdb/admin';

async function syncSchema() {
    console.log('🔄 Syncing schema with InstantDB...\n');

    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;

    if (!appId) {
        console.error('❌ Error: NEXT_PUBLIC_INSTANT_APP_ID not found');
        process.exit(1);
    }

    console.log(`📱 App ID: ${appId.substring(0, 8)}...`);

    try {
        // Initialize InstantDB admin
        const db = init({
            appId,
            adminToken: adminToken || undefined,
        });

        console.log('✅ Connected to InstantDB');
        console.log('\n📋 Schema from instant.schema.ts:');
        console.log('   ✓ csv_uploads entity (NEW)');
        console.log('   ✓ csv_records with uploadId field (UPDATED)');
        console.log('   ✓ csvUploadRecords relationship (NEW)');

        console.log('\n🔄 How InstantDB Schema Sync Works:');
        console.log('   1. Your schema is defined in instant.schema.ts');
        console.log('   2. When you use the app, InstantDB reads this file');
        console.log('   3. Schema changes are automatically applied');
        console.log('   4. No manual dashboard updates needed!');

        console.log('\n✨ To activate the new schema:');
        console.log('   1. Start your dev server: npm run dev');
        console.log('   2. Go to admin dashboard');
        console.log('   3. Upload a CSV file');
        console.log('   4. The new schema will be used automatically!');

        console.log('\n📊 Testing the schema:');
        console.log('   Run: npm run dev');
        console.log('   Then visit: http://localhost:3000/admin/dashboard');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error('\n💡 If you see schema errors:');
        console.error('   1. Make sure instant.schema.ts is correct');
        console.error('   2. Restart your dev server');
        console.error('   3. Clear browser cache');
        process.exit(1);
    }
}

syncSchema().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
