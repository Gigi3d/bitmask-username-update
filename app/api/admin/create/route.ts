import { NextRequest, NextResponse } from 'next/server';
import { createAdminUser } from '@/lib/storage';

/**
 * API route to create an admin user
 * This requires INSTANT_ADMIN_TOKEN to be set in environment variables
 * 
 * POST /api/admin/create
 * Body: { email: string, role?: 'admin' | 'superadmin' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role = 'admin' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "superadmin"' },
        { status: 400 }
      );
    }

    // Check if admin token is set
    // Allow first admin creation without token if no admins exist yet
    const hasAdminToken = !!process.env.INSTANT_ADMIN_TOKEN;
    
    if (!hasAdminToken) {
      // Check if any admins exist
      try {
        const { getAdminUsers } = await import('@/lib/storage');
        const existingAdmins = await getAdminUsers();
        
        // If admins already exist, require admin token
        if (existingAdmins.length > 0) {
          return NextResponse.json(
            { 
              error: 'INSTANT_ADMIN_TOKEN is required to add additional admins. Please set it in your .env.local file.',
              instructions: 'Get your admin token from the InstantDB dashboard: https://instantdb.com/dashboard'
            },
            { status: 500 }
          );
        }
        // If no admins exist, allow creation without token (first admin)
      } catch (error) {
        // If we can't check, require admin token to be safe
        return NextResponse.json(
          { 
            error: 'INSTANT_ADMIN_TOKEN is required. Please set it in your .env.local file.',
            instructions: 'Get your admin token from the InstantDB dashboard: https://instantdb.com/dashboard'
          },
          { status: 500 }
        );
      }
    }

    await createAdminUser(email, role as 'admin' | 'superadmin', false);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${role} user: ${email}`,
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

