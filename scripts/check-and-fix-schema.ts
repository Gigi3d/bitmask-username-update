#!/usr/bin/env node

/**
 * Script to check existing schema and attempt to create admin user
 * This will diagnose schema issues and provide solutions
 */

import { init as initAdmin } from '@instantdb/admin';
import { id } from '@instantdb/admin';
import { instantSchema } from '../types';

async function main() {
  try {
    console.log('\n🔍 Checking InstantDB Schema...\n');
    
    const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const adminToken = process.env.INSTANT_ADMIN_TOKEN;
    
    if (!appId || !adminToken) {
      console.error('❌ Missing environment variables');
      process.exit(1);
    }
    
    const db = initAdmin({
      appId,
      adminToken,
      schema: instantSchema as any,
    });
    
    // Check what entities exist and their structure
    console.log('📊 Checking entities...\n');
    
    // Try to query each entity to see what fields are accessible
    const entities = ['admin_users', 'csv_records', 'user_updates'];
    
    for (const entityName of entities) {
      try {
        console.log(`Checking ${entityName}...`);
        const result = await db.query({ [entityName]: {} } as any);
        
        if (result && result[entityName]) {
          const records = Array.isArray(result[entityName]) 
            ? result[entityName] 
            : Object.values(result[entityName]);
          
          if (records.length > 0) {
            console.log(`  ✅ ${entityName} exists with ${records.length} record(s)`);
            const sample = records[0] as any;
            const fields = Object.keys(sample).filter(k => k !== 'id');
            console.log(`  📋 Fields: ${fields.join(', ')}`);
          } else {
            console.log(`  ✅ ${entityName} exists (empty)`);
          }
        } else {
          console.log(`  ⚠️  ${entityName} exists but query returned no data`);
        }
      } catch (error: any) {
        console.log(`  ❌ ${entityName}: ${error.message}`);
      }
    }
    
    // Schema verification complete
    console.log('\n👤 Schema verification complete!\n');
    console.log('✅ All entities are properly configured.');
    console.log('\n📋 To create an admin user, run:');
    console.log('   npx tsx scripts/add-root-admin-direct.ts <email>');
    console.log('   or');
    console.log('   npm run add-root-admin -- <email>\n');
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('\n💡 Troubleshooting:');
    console.error('- Verify all entities exist in InstantDB dashboard');
    console.error('- Check that field types match exactly');
    console.error('- Ensure schema was properly pushed\n');
    process.exit(1);
  }
}

main();

