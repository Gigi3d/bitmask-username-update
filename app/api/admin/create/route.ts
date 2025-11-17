import { NextRequest, NextResponse } from 'next/server';
import { createAdminUser, getAdminUsers } from '@/lib/storage';

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
    const userEmail = request.headers.get('x-user-email');

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

    // Check if the requester is a superadmin
    if (userEmail) {
      try {
        const admins = await getAdminUsers();
        const requester = admins.find(
          admin => admin.email.toLowerCase() === userEmail.toLowerCase()
        );
        
        if (!requester) {
          return NextResponse.json(
            { error: 'Unauthorized. You must be an admin to add other admins.' },
            { status: 403 }
          );
        }
        
        if (requester.role !== 'superadmin') {
          return NextResponse.json(
            { error: 'Unauthorized. Only superadmins can add other admins.' },
            { status: 403 }
          );
        }
      } catch (error) {
        // If we can't verify, allow if admin token is set (for first admin creation)
        if (!process.env.INSTANT_ADMIN_TOKEN) {
          return NextResponse.json(
            { error: 'Unable to verify admin permissions. Please ensure you are logged in as a superadmin.' },
            { status: 403 }
          );
        }
      }
    } else {
      // If no user email provided, require admin token
      if (!process.env.INSTANT_ADMIN_TOKEN) {
        return NextResponse.json(
          { error: 'User email required in x-user-email header or INSTANT_ADMIN_TOKEN must be set.' },
          { status: 400 }
        );
      }
    }

    // If no user email provided and no admin token, require one of them
    // This allows first admin creation via script with admin token
    const hasAdminToken = !!process.env.INSTANT_ADMIN_TOKEN;
    
    if (!userEmail && !hasAdminToken) {
      return NextResponse.json(
        { 
          error: 'Either user email (x-user-email header) or INSTANT_ADMIN_TOKEN must be provided.',
          instructions: 'Get your admin token from the InstantDB dashboard: https://instantdb.com/dashboard'
        },
        { status: 400 }
      );
    }

    await createAdminUser(email, role as 'admin' | 'superadmin', false);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${role} user: ${email}`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating admin user:', error);
    }
    
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

