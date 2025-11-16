#!/usr/bin/env node

/**
 * Script to add a root admin user to the InstantDB database
 * Usage: npm run add-root-admin
 * 
 * Note: This script uses dotenv-cli to load .env.local automatically
 */

import { createAdminUser } from '../lib/storage';

const ROOT_ADMIN_EMAIL = 'gideon@diba.io';

async function main() {
  try {
    console.log(`\n🔧 Adding root admin: ${ROOT_ADMIN_EMAIL}...\n`);
    
    // Check if admin token is set
    if (!process.env.INSTANT_ADMIN_TOKEN) {
      console.error(`❌ Error: INSTANT_ADMIN_TOKEN is required to create admin users.`);
      console.error(`\n📋 Instructions:`);
      console.error(`1. Get your admin token from the InstantDB dashboard:`);
      console.error(`   https://instantdb.com/dashboard`);
      console.error(`2. Add it to your .env.local file:`);
      console.error(`   INSTANT_ADMIN_TOKEN=your-admin-token-here`);
      console.error(`\n💡 Alternative: You can also use the API route:`);
      console.error(`   POST /api/admin/create with body: { "email": "${ROOT_ADMIN_EMAIL}", "role": "superadmin" }`);
      console.error(`\n📝 Note: The first user to log in via /admin/login will automatically become an admin.`);
      console.error(`   However, to set a specific user as superadmin with privileges to add other admins,`);
      console.error(`   you need to use this script or the API route with an admin token.\n`);
      process.exit(1);
    }
    
    await createAdminUser(ROOT_ADMIN_EMAIL, 'superadmin', false);
    
    console.log(`✅ Successfully added ${ROOT_ADMIN_EMAIL} as a superadmin!`);
    console.log(`\n🎉 The user now has privileges to:`);
    console.log(`   - Access the admin dashboard`);
    console.log(`   - Upload CSV files`);
    console.log(`   - Add other admin users`);
    console.log(`\n🔐 The user can log in at /admin/login using their email address.\n`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️  ${error.message}`);
        console.log(`The admin user ${ROOT_ADMIN_EMAIL} is already in the database.`);
        console.log(`No action needed.\n`);
      } else {
        console.error(`❌ Error: ${error.message}`);
        console.error(`\n💡 Troubleshooting:`);
        console.error(`- Make sure INSTANT_ADMIN_TOKEN is set correctly in .env.local`);
        console.error(`- Verify the admin_users entity exists in your InstantDB schema`);
        console.error(`- Check that the admin token has the necessary permissions\n`);
        process.exit(1);
      }
    } else {
      console.error('❌ An unknown error occurred:', error);
      process.exit(1);
    }
  }
}

main();

