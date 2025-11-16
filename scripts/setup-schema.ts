#!/usr/bin/env node

/**
 * Script to automatically configure InstantDB schema
 * This attempts to create all required entities programmatically
 * Usage: export $(cat .env.local | xargs) && npx tsx scripts/setup-schema.ts
 */

import { init as initAdmin } from '@instantdb/admin';
import { instantSchema } from '../types';

async function main() {
  try {
    console.log('\n🔧 Setting up InstantDB schema...\n');
    
    // Check environment variables
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;
    
    if (!appId) {
      console.error('❌ Error: NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables.');
      process.exit(1);
    }
    
    if (!adminToken) {
      console.error('❌ Error: INSTANT_ADMIN_TOKEN is required.');
      console.error('Please add it to your .env.local file.');
      process.exit(1);
    }
    
    // Initialize admin database
    console.log('📡 Connecting to InstantDB...');
    const db = initAdmin({
      appId,
      adminToken,
      schema: instantSchema as any,
    });
    
    // Try to apply schema if the method exists
    if (typeof (db as any).applySchema === 'function') {
      console.log('📋 Applying schema...');
      try {
        await (db as any).applySchema(instantSchema);
        console.log('✅ Schema applied successfully!\n');
        return;
      } catch (schemaError: any) {
        console.warn('⚠️  Schema application method not available or failed:', schemaError.message);
        console.log('📝 Falling back to entity creation method...\n');
      }
    }
    
    // Fallback: Try to create entities by creating sample records
    // This will auto-create the schema if InstantDB supports it
    console.log('📝 Attempting to create entities by inserting sample records...\n');
    
    const { id } = await import('@instantdb/admin');
    const now = Date.now();
    
    // Try to create admin_users entity first (most critical)
    try {
      console.log('1️⃣  Creating admin_users entity...');
      const adminId = id();
      await db.transact([
        db.tx.admin_users[adminId].create({
          email: '__schema_init__@temp.com',
          role: 'admin',
          createdAt: now,
        })
      ]);
      console.log('   ✅ admin_users entity created');
      
      // Delete the temp record
      await db.transact([
        db.tx.admin_users[adminId].delete()
      ]);
      console.log('   🧹 Cleaned up temporary record');
    } catch (error: any) {
      if (error.message?.includes('email') || error.message?.includes('schema')) {
        console.log('   ⚠️  admin_users entity may already exist or schema needs manual setup');
        console.log('   💡 If this fails, you may need to create it manually in the dashboard');
      } else {
        throw error;
      }
    }
    
    // Try to create csv_records entity
    try {
      console.log('\n2️⃣  Creating csv_records entity...');
      const csvId = id();
      await db.transact([
        db.tx.csv_records[csvId].create({
          oldUsername: '__temp__',
          telegramAccount: '__temp__',
          newUsername: '__temp__',
          createdAt: now,
        })
      ]);
      console.log('   ✅ csv_records entity created');
      
      // Delete the temp record
      await db.transact([
        db.tx.csv_records[csvId].delete()
      ]);
      console.log('   🧹 Cleaned up temporary record');
    } catch (error: any) {
      if (error.message?.includes('schema')) {
        console.log('   ⚠️  csv_records entity may already exist or schema needs manual setup');
      } else {
        throw error;
      }
    }
    
    // Try to create user_updates entity
    try {
      console.log('\n3️⃣  Creating user_updates entity...');
      const updateId = id();
      await db.transact([
        db.tx.user_updates[updateId].create({
          oldUsername: '__temp__',
          telegramAccount: '__temp__',
          newUsername: '__temp__',
          submittedAt: now,
        })
      ]);
      console.log('   ✅ user_updates entity created');
      
      // Delete the temp record
      await db.transact([
        db.tx.user_updates[updateId].delete()
      ]);
      console.log('   🧹 Cleaned up temporary record');
    } catch (error: any) {
      if (error.message?.includes('schema')) {
        console.log('   ⚠️  user_updates entity may already exist or schema needs manual setup');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Schema setup attempt completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify entities in InstantDB dashboard');
    console.log('2. If entities were created, run: export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts');
    console.log('3. If this failed, follow the manual setup guide: INSTANTDB_SCHEMA_SETUP.md\n');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ Error:', error.message);
      
      if (error.message.includes('schema') || error.message.includes('entity')) {
        console.error('\n💡 This error suggests the schema needs to be configured manually.');
        console.error('📚 Please follow the guide: INSTANTDB_SCHEMA_SETUP.md');
        console.error('\n🔗 Go to: https://instantdb.com/dashboard');
        console.error('   App ID: ' + process.env.NEXT_PUBLIC_INSTANT_APP_ID);
      } else {
        console.error('\n💡 Troubleshooting:');
        console.error('- Verify INSTANT_ADMIN_TOKEN is correct');
        console.error('- Check that your app ID is correct');
        console.error('- Ensure you have admin permissions');
      }
    } else {
      console.error('❌ An unknown error occurred:', error);
    }
    process.exit(1);
  }
}

main();

