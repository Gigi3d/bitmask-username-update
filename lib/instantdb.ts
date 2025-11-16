import { init as initClient } from '@instantdb/react';
import { init as initAdmin } from '@instantdb/admin';
import { instantSchema } from '@/types';

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (!appId) {
  throw new Error('NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables');
}

// Client-side InstantDB instance
export const db = initClient({
  appId,
  schema: instantSchema as any, // Type assertion needed due to InstantDB schema type complexity
});

// Server-side InstantDB admin instance
// Note: Admin token should be set in environment variables for production
export function getAdminDb() {
  const adminToken = process.env.INSTANT_ADMIN_TOKEN;
  
  if (!adminToken) {
    // For development, we can use the client instance
    // In production, you should set INSTANT_ADMIN_TOKEN
    console.warn('INSTANT_ADMIN_TOKEN not set. Using client instance for server operations.');
  }
  
  return initAdmin({
    appId: appId!, // appId is already validated above
    adminToken: adminToken || undefined,
    schema: instantSchema as any, // Type assertion needed due to InstantDB schema type complexity
  });
}

// Auth helpers
export const auth = db.auth;

// Type helpers for queries
export type AppSchema = typeof instantSchema;
