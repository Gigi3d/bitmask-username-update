#!/usr/bin/env node

/**
 * Script to verify admin user exists
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;

    if (!appId || !adminToken) {
        console.error('❌ Missing environment variables');
        process.exit(1);
    }

    console.log('🔧 Initializing InstantDB...');
    const db = init({ appId, adminToken });

    console.log('📝 Fetching admin users...');

    try {
        const result = await db.query({ admin_users: {} });
        console.log('\n✅ Admin users in database:');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error fetching admin users:', error);
    }
}

main();
