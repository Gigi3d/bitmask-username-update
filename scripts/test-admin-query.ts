#!/usr/bin/env node

/**
 * Test if we can query admin users from the API perspective
 */

import { getAdminUsers } from '../lib/storage';

async function main() {
    console.log('🔍 Testing admin user query...\n');

    try {
        const admins = await getAdminUsers();
        console.log(`✅ Successfully fetched ${admins.length} admin users:`);
        admins.forEach(admin => {
            console.log(`   - ${admin.email} (${admin.role})`);
        });
    } catch (error) {
        console.error('❌ Error fetching admin users:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

main();
