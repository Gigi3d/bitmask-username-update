#!/usr/bin/env node

/**
 * Direct script to add a root admin user to the InstantDB database
 * This version loads environment variables directly
 * Usage: export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts
 */

import { init as initAdmin } from '@instantdb/admin';
import { id } from '@instantdb/admin';
import schema from '../instant.schema';

async function main() {
  try {
    // Get email from command line argument or environment variable
    const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.error(`❌ Error: Admin email is required.`);
      console.error(`\n📋 Usage:`);
      console.error(`   npx tsx scripts/add-root-admin-direct.ts <email>`);
      console.error(`   or set ADMIN_EMAIL environment variable`);
      console.error(`\n💡 Example:`);
      console.error(`   npx tsx scripts/add-root-admin-direct.ts admin@example.com\n`);
      process.exit(1);
    }
    
    console.log(`\n🔧 Adding root admin: ${adminEmail}...\n`);
    
    // Check environment variables
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;
    
    if (!appId) {
      console.error(`❌ Error: NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables.`);
      process.exit(1);
    }
    
    if (!adminToken) {
      console.error(`❌ Error: INSTANT_ADMIN_TOKEN is required to create admin users.`);
      console.error(`\n📋 Instructions:`);
      console.error(`1. Get your admin token from the InstantDB dashboard:`);
      console.error(`   https://instantdb.com/dashboard`);
      console.error(`2. Add it to your .env.local file:`);
      console.error(`   INSTANT_ADMIN_TOKEN=your-admin-token-here`);
      process.exit(1);
    }
    
    // Initialize admin database
    const db = initAdmin({
      appId,
      adminToken,
      schema: schema as any,
    });
    
    // Check if admin already exists
    try {
      const existing = await db.query({ admin_users: {} });
      if (existing?.admin_users) {
        const admins = Array.isArray(existing.admin_users) 
          ? existing.admin_users 
          : Object.values(existing.admin_users);
        const exists = admins.some((admin: any) => 
          admin.email?.toLowerCase() === adminEmail.toLowerCase()
        );
        if (exists) {
          console.log(`ℹ️  Admin user ${adminEmail} already exists in the database.`);
          console.log(`No action needed.\n`);
          process.exit(0);
        }
      }
    } catch (queryError) {
      console.warn('⚠️  Could not check for existing admin users. Proceeding with creation...');
    }
    
    // Create admin user
    const recordId = id();
    const now = Date.now();
    
    console.log('Creating admin user record...');
    await db.transact([
      db.tx.admin_users[recordId].create({
        email: adminEmail.toLowerCase().trim(),
        role: 'superadmin',
        createdAt: now,
      })
    ]);
    
    console.log(`✅ Successfully added ${adminEmail} as a superadmin!`);
    console.log(`\n🎉 The user now has privileges to:`);
    console.log(`   - Access the admin dashboard`);
    console.log(`   - Upload CSV files`);
    console.log(`   - Add other admin users`);
    console.log(`\n🔐 The user can log in at /admin/login using their email address.\n`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
      
      if (error.message.includes('admin_users') || error.message.includes('schema')) {
        console.error(`\n💡 This error usually means:`);
        console.error(`1. The 'admin_users' entity doesn't exist in your InstantDB schema`);
        console.error(`2. The entity fields don't match: email (string), role (string), createdAt (number)`);
        console.error(`\n📋 To fix this:`);
        console.error(`1. Go to https://instantdb.com/dashboard`);
        console.error(`2. Navigate to your app: ${process.env.NEXT_PUBLIC_INSTANT_APP_ID}`);
        console.error(`3. Add the 'admin_users' entity with fields:`);
        console.error(`   - email: string`);
        console.error(`   - role: string`);
        console.error(`   - createdAt: number`);
        console.error(`4. Run this script again\n`);
      } else {
        console.error(`\n💡 Troubleshooting:`);
        console.error(`- Make sure INSTANT_ADMIN_TOKEN is set correctly in .env.local`);
        console.error(`- Verify the admin_users entity exists in your InstantDB schema`);
        console.error(`- Check that the admin token has the necessary permissions\n`);
      }
      process.exit(1);
    } else {
      console.error('❌ An unknown error occurred:', error);
      process.exit(1);
    }
  }
}

main();

