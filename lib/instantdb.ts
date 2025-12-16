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


/**
 * Client-side InstantDB instance - HMR-safe singleton pattern
 * 
 * Uses lazy initialization to prevent "module factory is not available" errors
 * during Hot Module Replacement (HMR) in development. The db instance is only
 * created when first accessed, and cached for subsequent accesses. This allows
 * the module to be safely reloaded during HMR without breaking the application.
 */
let dbInstance: ReturnType<typeof initClient> | null = null;

/**
 * Gets or initializes the InstantDB client instance.
 * Only initializes on the client side and handles HMR reloads gracefully.
 */
function getDb(): ReturnType<typeof initClient> {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    throw new Error('InstantDB client can only be used on the client side');
  }

  // Validate appId is available
  if (!appId) {
    throw new Error('NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables');
  }

  // If already initialized, return it (handles HMR by reusing existing instance)
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = initClient({
      appId: appId!,
      schema: schema as unknown as Parameters<typeof initClient>[0]['schema'],
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ InstantDB client initialized successfully');
    }

    return dbInstance;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Failed to initialize InstantDB client:', errorObj);

    // During HMR, the module might be reloaded - reset db to allow retry
    if (process.env.NODE_ENV === 'development') {
      dbInstance = null;
    }

    throw errorObj;
  }
}

// Server-side InstantDB admin instance
// Note: Admin token should be set in environment variables for production
export function getAdminDb() {
  const adminToken = process.env.INSTANT_ADMIN_TOKEN;

  // Validate appId is available
  if (!appId) {
    throw new Error('NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables');
  }

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
      schema: schema as unknown as Parameters<typeof initAdmin>[0]['schema'], // Use schema from instant.schema.ts which matches the database
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ InstantDB admin initialized successfully');
    }

    return adminDb;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Failed to initialize InstantDB admin:', errorObj);
    throw errorObj;
  }
}

/**
 * Export db instance as a Proxy for HMR safety.
 * 
 * The Proxy ensures:
 * - Lazy initialization: db is only created when first accessed
 * - HMR resilience: module can be reloaded without breaking
 * - Proper method binding: functions maintain correct 'this' context
 * - Nested object support: handles tx, auth, and other nested properties
 */
export const db = new Proxy({} as ReturnType<typeof initClient>, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    // Bind functions to maintain correct 'this' context
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    // For nested objects (like tx), return a proxy that also binds methods
    if (value && typeof value === 'object') {
      return new Proxy(value, {
        get(_innerTarget, innerProp) {
          const innerValue = value[innerProp as keyof typeof value];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return typeof innerValue === 'function' ? (innerValue as any).bind(value) : innerValue;
        }
      });
    }
    return value;
  }
});

/**
 * Auth helpers - lazy initialization for HMR safety.
 * 
 * Provides access to InstantDB authentication methods (sendMagicCode, signInWithMagicCode)
 * with proper lazy initialization and method binding for HMR compatibility.
 */
export const auth = new Proxy({} as ReturnType<typeof initClient>['auth'], {
  get(_target, prop) {
    const instance = getDb().auth;
    const value = instance[prop as keyof typeof instance];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Type helpers for queries
export type AppSchema = typeof schema;
