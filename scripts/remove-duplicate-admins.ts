#!/usr/bin/env node

/**
 * Remove duplicate admin users
 * Keeps only unique email addresses with their highest role
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function removeDuplicateAdmins() {
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;

    if (!appId || !adminToken) {
        console.error('❌ Missing environment variables');
        process.exit(1);
    }

    console.log('🔍 Checking for duplicate admin users...\n');

    const db = init({ appId, adminToken });

    try {
        // Get all admin users
        const result = await db.query({ admin_users: {} });
        const adminUsers = result.admin_users || [];

        console.log(`📊 Total admin users found: ${adminUsers.length}\n`);

        // Group by email
        const emailMap = new Map<string, any[]>();

        adminUsers.forEach((admin: any) => {
            const email = admin.email.toLowerCase();
            if (!emailMap.has(email)) {
                emailMap.set(email, []);
            }
            emailMap.get(email)!.push(admin);
        });

        // Find duplicates
        const duplicates: string[] = [];
        const toDelete: any[] = [];

        emailMap.forEach((admins, email) => {
            if (admins.length > 1) {
                duplicates.push(email);
                console.log(`🔍 Found ${admins.length} entries for ${email}:`);

                // Sort by role (superadmin first) and createdAt (oldest first)
                admins.sort((a, b) => {
                    if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
                    if (a.role !== 'superadmin' && b.role === 'superadmin') return 1;
                    return a.createdAt - b.createdAt;
                });

                // Keep the first one (highest role, oldest)
                const toKeep = admins[0];
                const toRemove = admins.slice(1);

                console.log(`   ✅ Keeping: ${toKeep.email} (${toKeep.role}) - ID: ${toKeep.id}`);
                toRemove.forEach(admin => {
                    console.log(`   ❌ Removing: ${admin.email} (${admin.role}) - ID: ${admin.id}`);
                    toDelete.push(admin);
                });
                console.log('');
            }
        });

        if (duplicates.length === 0) {
            console.log('✅ No duplicate admin users found!');
            return;
        }

        console.log(`\n📋 Summary:`);
        console.log(`   - Unique emails: ${emailMap.size}`);
        console.log(`   - Emails with duplicates: ${duplicates.length}`);
        console.log(`   - Total entries to delete: ${toDelete.length}\n`);

        // Delete duplicates
        if (toDelete.length > 0) {
            console.log('🗑️  Deleting duplicate entries...');
            const deleteOps = toDelete.map(admin =>
                db.tx.admin_users[admin.id].delete()
            );
            await db.transact(deleteOps);
            console.log(`✅ Deleted ${toDelete.length} duplicate entries\n`);
        }

        // Verify final state
        console.log('🔍 Verifying final admin users...');
        const finalResult = await db.query({ admin_users: {} });
        const finalAdmins = finalResult.admin_users || [];

        console.log(`\n✅ Final admin users (${finalAdmins.length}):`);
        finalAdmins.forEach((admin: any) => {
            console.log(`   - ${admin.email} (${admin.role})`);
        });

        console.log('\n🎉 Done! Duplicate admin users removed.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

removeDuplicateAdmins();
