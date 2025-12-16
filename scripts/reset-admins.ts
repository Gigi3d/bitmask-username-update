#!/usr/bin/env node

/**
 * Clean slate: Delete all admin users and create only the two superadmins we need
 */

import { init } from '@instantdb/admin';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

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

    // Step 1: Delete ALL existing admin users
    console.log('\n🗑️  Deleting all existing admin users...');
    try {
        const result = await db.query({ admin_users: {} });
        const adminUsers = result.admin_users || [];

        if (adminUsers.length > 0) {
            const deleteOps = adminUsers.map((admin: any) =>
                db.tx.admin_users[admin.id].delete()
            );
            await db.transact(deleteOps);
            console.log(`✅ Deleted ${adminUsers.length} admin user(s)`);
        } else {
            console.log('ℹ️  No existing admin users found');
        }
    } catch (error) {
        console.error('❌ Error deleting admin users:', error);
        process.exit(1);
    }

    // Step 2: Create the two superadmins
    console.log('\n👥 Creating superadmins...');
    const superadmins = [
        'gideon@diba.io',
        'anastily@diba.io'
    ];

    try {
        const createOps = superadmins.map(email =>
            db.tx.admin_users[randomUUID()].create({
                email: email,
                role: 'superadmin',
                createdAt: Date.now(),
            })
        );

        await db.transact(createOps);
        console.log('✅ Created superadmins:');
        superadmins.forEach(email => console.log(`   - ${email}`));
    } catch (error) {
        console.error('❌ Error creating superadmins:', error);
        process.exit(1);
    }

    // Step 3: Verify
    console.log('\n🔍 Verifying admin users...');
    try {
        const result = await db.query({ admin_users: {} });
        const adminUsers = result.admin_users || [];
        console.log(`\n✅ Total admin users: ${adminUsers.length}`);
        adminUsers.forEach((admin: any) => {
            console.log(`   - ${admin.email} (${admin.role})`);
        });
    } catch (error) {
        console.error('❌ Error verifying:', error);
    }

    console.log('\n🎉 Done! Admin system reset complete.');
}

main();
