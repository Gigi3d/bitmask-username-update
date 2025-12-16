#!/usr/bin/env node

/**
 * Quick script to add gideon@diba.io as superadmin
 */

import { init } from '@instantdb/admin';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;

    if (!appId) {
        console.error('❌ NEXT_PUBLIC_INSTANT_APP_ID not found in .env.local');
        process.exit(1);
    }

    if (!adminToken) {
        console.error('❌ INSTANT_ADMIN_TOKEN not found in .env.local');
        process.exit(1);
    }

    console.log('🔧 Initializing InstantDB...');
    const db = init({
        appId,
        adminToken,
    });

    console.log('📝 Creating admin user: gideon@diba.io...');

    try {
        await db.transact([
            db.tx.admin_users[randomUUID()].create({
                email: 'gideon@diba.io',
                role: 'superadmin',
                createdAt: Date.now(),
            })
        ]);

        console.log('✅ Successfully created gideon@diba.io as superadmin!');
        console.log('🎉 You can now log in and upload CSV files.');
    } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
            console.log('ℹ️  Admin user already exists!');
        } else {
            console.error('❌ Error creating admin user:', error);
            process.exit(1);
        }
    }
}

main();
