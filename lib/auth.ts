import { NextRequest } from 'next/server';
import { adminUserExists } from './storage';

/**
 * Verify if a user is authenticated as admin
 * This checks if the user's email exists in the admin_users table
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{ authenticated: boolean; userId?: string; email?: string; error?: string }> {
  try {
    // Get user email from request headers
    // The client should send the user's email in the x-user-email header
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return { authenticated: false, error: 'User email not provided. Please include user email in x-user-email header.' };
    }

    // Check if user exists in admin_users table
    const isAdmin = await adminUserExists(userEmail);
    
    if (!isAdmin) {
      return { authenticated: false, error: `User ${userEmail} is not an admin. Please ensure the user is added to the admin_users table.` };
    }

    return { authenticated: true, email: userEmail };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, error: 'Failed to verify authentication' };
  }
}

/**
 * Middleware helper to protect admin routes
 * Returns null if authenticated, or an error response if not
 */
export async function requireAdminAuth(request: NextRequest) {
  const authResult = await verifyAdminAuth(request);
  
  if (!authResult.authenticated) {
    return {
      error: true,
      response: new Response(
        JSON.stringify({ message: 'Unauthorized', error: authResult.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  
  return { error: false };
}
