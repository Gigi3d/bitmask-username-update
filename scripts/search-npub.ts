#!/usr/bin/env node

/**
 * Search for a specific npub key in the database
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TARGET_NPUB = 'npub14j9lw3uwue8cecwefqr828v7cveg4la35w7vuk82xkd9ttpflapsm3gy5f';

async function searchNpub() {
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;

    if (!appId || !adminToken) {
        console.error('❌ Missing environment variables');
        process.exit(1);
    }

    console.log(`🔍 Searching for npub key: ${TARGET_NPUB}\n`);

    const db = init({ appId, adminToken });

    try {
        // Get all CSV records
        const result = await db.query({ csv_records: {} });
        const records = result.csv_records || [];

        console.log(`📊 Total CSV records in database: ${records.length}\n`);

        // Count records with npubKey
        const recordsWithNpub = records.filter((r: any) => r.npubKey);
        console.log(`📊 Records with npubKey field: ${recordsWithNpub.length}`);
        console.log(`📊 Records without npubKey field: ${records.length - recordsWithNpub.length}\n`);

        // Search for exact match
        const exactMatch = records.find((r: any) =>
            r.npubKey && r.npubKey.toLowerCase().trim() === TARGET_NPUB.toLowerCase().trim()
        );

        if (exactMatch) {
            console.log('✅ FOUND! Exact match:\n');
            console.log(JSON.stringify(exactMatch, null, 2));
        } else {
            console.log('❌ NOT FOUND - No exact match\n');

            // Search for partial matches
            const partialMatches = records.filter((r: any) =>
                r.npubKey && r.npubKey.toLowerCase().includes('npub14j9lw3uwue8cecwefqr')
            );

            if (partialMatches.length > 0) {
                console.log(`🔍 Found ${partialMatches.length} partial match(es):\n`);
                partialMatches.forEach((r: any, i: number) => {
                    console.log(`${i + 1}. npubKey: ${r.npubKey}`);
                    console.log(`   oldUsername: ${r.oldUsername}`);
                    console.log(`   newUsername: ${r.newUsername}\n`);
                });
            } else {
                console.log('🔍 No partial matches found either\n');

                // Show sample of npub keys for comparison
                console.log('📋 Sample of npub keys in database (first 10):');
                recordsWithNpub.slice(0, 10).forEach((r: any, i: number) => {
                    console.log(`${i + 1}. ${r.npubKey}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

searchNpub();
