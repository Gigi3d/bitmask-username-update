#!/usr/bin/env node

/**
 * Automated Schema Setup Script
 * 
 * This script attempts to configure the InstantDB schema automatically.
 * If programmatic schema creation isn't available, it provides instructions
 * for manual setup or browser automation.
 * 
 * Usage: export $(cat .env.local | xargs) && npx tsx scripts/auto-setup-schema.ts
 */

import { init as initAdmin } from '@instantdb/admin';
import { instantSchema } from '../types';

const SCHEMA_CONFIG = {
  entities: [
    {
      name: 'admin_users',
      fields: [
        { name: 'email', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'createdAt', type: 'number' },
      ],
    },
    {
      name: 'csv_records',
      fields: [
        { name: 'oldUsername', type: 'string' },
        { name: 'telegramAccount', type: 'string' },
        { name: 'newUsername', type: 'string' },
        { name: 'createdAt', type: 'number' },
      ],
    },
    {
      name: 'user_updates',
      fields: [
        { name: 'oldUsername', type: 'string' },
        { name: 'telegramAccount', type: 'string' },
        { name: 'newUsername', type: 'string' },
        { name: 'submittedAt', type: 'number' },
      ],
    },
  ],
};

async function main() {
  console.log('\n🚀 InstantDB Schema Auto-Setup\n');
  console.log('=' .repeat(50));
  
  const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_ADMIN_TOKEN;
  
  if (!appId || !adminToken) {
    console.error('❌ Missing required environment variables');
    console.error('   NEXT_PUBLIC_INSTANT_APP_ID:', appId ? '✅' : '❌');
    console.error('   INSTANT_ADMIN_TOKEN:', adminToken ? '✅' : '❌');
    process.exit(1);
  }
  
  console.log(`\n📋 App ID: ${appId}`);
  console.log(`🔑 Admin Token: ${adminToken.substring(0, 8)}...`);
  
  // Try programmatic approach
  console.log('\n🔧 Attempting programmatic schema creation...\n');
  
  try {
    const db = initAdmin({
      appId,
      adminToken,
      schema: instantSchema as any,
    });
    
    // Method 1: Try applySchema if available
    if (typeof (db as any).applySchema === 'function') {
      console.log('✅ Found applySchema method, applying schema...');
      await (db as any).applySchema(instantSchema);
      console.log('✅ Schema applied successfully!\n');
      await createAdminUser();
      return;
    }
    
    // Method 2: Try creating entities via API (if InstantDB supports it)
    console.log('⚠️  applySchema not available, trying alternative methods...\n');
    
    // Check if entities exist by trying to query them
    const existingEntities: string[] = [];
    
    for (const entity of SCHEMA_CONFIG.entities) {
      try {
        const result = await db.query({ [entity.name]: {} } as any);
        if (result) {
          existingEntities.push(entity.name);
          console.log(`✅ ${entity.name} - exists`);
        }
      } catch (error: any) {
        if (error.message?.includes('schema') || error.message?.includes('entity')) {
          console.log(`❌ ${entity.name} - needs to be created`);
        } else {
          console.log(`⚠️  ${entity.name} - status unknown`);
        }
      }
    }
    
    if (existingEntities.length === SCHEMA_CONFIG.entities.length) {
      console.log('\n✅ All entities already exist!');
      await createAdminUser();
      return;
    }
    
    // If we get here, manual setup is required
    console.log('\n' + '='.repeat(50));
    console.log('⚠️  Automatic schema creation is not available');
    console.log('='.repeat(50));
    console.log('\n📚 Manual Setup Required\n');
    console.log('InstantDB requires schema to be configured in the dashboard.');
    console.log('However, I can help you with the next steps:\n');
    
    printManualInstructions();
    printBrowserAutomationOption();
    
  } catch (error: any) {
    console.error('\n❌ Error during schema setup:', error.message);
    printManualInstructions();
    process.exit(1);
  }
}

async function createAdminUser() {
  console.log('\n👤 Creating admin user...\n');
  try {
    const { execSync } = await import('child_process');
    execSync('npx tsx scripts/add-root-admin-direct.ts', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (error) {
    console.error('Failed to create admin user automatically');
    console.log('Run manually: export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts');
  }
}

function printManualInstructions() {
  console.log('📋 Quick Setup Steps:\n');
  console.log('1. Go to: https://instantdb.com/dashboard');
  console.log(`2. Select app: ${process.env.NEXT_PUBLIC_INSTANT_APP_ID}`);
  console.log('3. Navigate to Schema section');
  console.log('4. Add these 3 entities:\n');
  
  SCHEMA_CONFIG.entities.forEach((entity, idx) => {
    console.log(`   ${idx + 1}. Entity: ${entity.name}`);
    entity.fields.forEach(field => {
      console.log(`      - ${field.name} (${field.type})`);
    });
    console.log('');
  });
  
  console.log('5. Save all changes');
  console.log('6. Run: export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts\n');
}

function printBrowserAutomationOption() {
  console.log('🤖 Browser Automation Option:\n');
  console.log('If you have Playwright or Puppeteer installed, I can create a script');
  console.log('that automates the dashboard interaction. Would you like me to create that?\n');
  console.log('To install Playwright: npm install -D playwright');
  console.log('Then run: npx playwright install chromium\n');
}

main();


