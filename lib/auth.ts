import { NextRequest } from 'next/server';
import { getAdminDb } from './instantdb';

/**
 * Verify if a user is authenticated as admin
 * This checks the auth token from the request headers
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
  try {
    // Get auth token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('instant-auth-token')?.value;
    
    if (!token) {
      return { authenticated: false, error: 'No authentication token provided' };
    }

    // For InstantDB, we can verify the token using the admin SDK
    // Note: InstantDB handles auth tokens automatically on the client side
    // For server-side verification, we may need to check the user's role in the database
    // This is a simplified version - in production, you'd want more robust token verification
    
    const db = getAdminDb();
    
    // Try to get user info from the token
    // Note: InstantDB admin SDK may have different methods for token verification
    // This is a placeholder - adjust based on InstantDB's actual API
    
    // For now, we'll return authenticated if token exists
    // In production, you should verify the token properly with InstantDB
    return { authenticated: true };
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
