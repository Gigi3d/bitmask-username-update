import { init as initClient } from '@instantdb/react';
import { init as initAdmin } from '@instantdb/admin';
import schema from '../instant.schema';

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

// Debug logging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 InstantDB Initialization:');
  console.log('📧 App ID:', appId ? `${appId.substring(0, 8)}...` : 'MISSING');
  console.log('📋 Schema:', schema ? 'Loaded' : 'Missing');
}

if (!appId) {
  const error = 'NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables';
  console.error('❌ InstantDB Error:', error);
  throw new Error(error);
}

// Client-side InstantDB instance
let db;
try {
  db = initClient({
    appId,
    schema: schema as any, // Use schema from instant.schema.ts which matches the database
  });
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('✅ InstantDB client initialized successfully');
  }
} catch (error: any) {
  console.error('❌ Failed to initialize InstantDB client:', error);
  throw error;
}

// Server-side InstantDB admin instance
// Note: Admin token should be set in environment variables for production
export function getAdminDb() {
  const adminToken = process.env.INSTANT_ADMIN_TOKEN;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 getAdminDb called');
    console.log('🔑 Admin Token:', adminToken ? `${adminToken.substring(0, 8)}...` : 'Not set');
  }
  
  if (!adminToken) {
    // For development, we can use the client instance
    // In production, you should set INSTANT_ADMIN_TOKEN
    console.warn('⚠️ INSTANT_ADMIN_TOKEN not set. Using client instance for server operations.');
  }
  
  try {
    const adminDb = initAdmin({
      appId: appId!, // appId is already validated above
      adminToken: adminToken || undefined,
      schema: schema as any, // Use schema from instant.schema.ts which matches the database
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ InstantDB admin initialized successfully');
    }
    
    return adminDb;
  } catch (error: any) {
    console.error('❌ Failed to initialize InstantDB admin:', error);
    throw error;
  }
}

// Export db instance
export { db };

// Auth helpers
export const auth = db.auth;

// Type helpers for queries
export type AppSchema = typeof schema;
