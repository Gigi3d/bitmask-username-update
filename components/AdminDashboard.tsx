'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/instantdb';
import { id } from '@instantdb/react';
import dynamic from 'next/dynamic';
import CSVUpload from '@/components/CSVUpload';

// Lazy load Analytics component with recharts (heavy library)
const Analytics = dynamic(() => import('@/components/Analytics'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Analytics</h2>
      <div className="text-center py-12 text-gray-400">Loading analytics...</div>
    </div>
  ),
  ssr: false, // Charts don't need SSR
});

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = db.useAuth();
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [adminCreationError, setAdminCreationError] = useState('');

  // Query admin_users to check if current user is an admin
  const { data: adminData } = db.useQuery({ admin_users: {} });

  // Check and create admin user record if needed
  useEffect(() => {
    const checkAndCreateAdmin = async () => {
      if (isLoading || !user?.email || adminCheckDone) return;

      try {
        // Check if admin_users record exists for this user
        const adminUsers = adminData?.admin_users || {};
        const adminArray = Array.isArray(adminUsers) ? adminUsers : Object.values(adminUsers);
        const userIsAdmin = adminArray.some((admin: any) => 
          admin.email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        if (!userIsAdmin) {
          // Admin record doesn't exist, try to create it
          if (process.env.NODE_ENV === 'development') {
            console.log('Creating admin user record for:', user.email);
          }
          
          const recordId = id();
          const now = Date.now();
          
          await db.transact([
            db.tx.admin_users[recordId].create({
              email: user.email.toLowerCase().trim(),
              role: 'superadmin',
              createdAt: now,
            })
          ]);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Admin user record created successfully');
          }
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating admin user record:', error);
        }
        setAdminCreationError(
          error?.message || 'Could not create admin record. You may need to set INSTANT_ADMIN_TOKEN and use the script.'
        );
      } finally {
        setAdminCheckDone(true);
      }
    };

    checkAndCreateAdmin();
  }, [user, isLoading, adminCheckDone, adminData]);

  useEffect(() => {
    // Log auth state for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AdminDashboard auth check:', { 
        isLoading, 
        user: user?.email || 'null',
        hasUser: !!user 
      });
    }
    
    // Give auth state time to update after redirect (race condition fix)
    const checkAuth = setTimeout(() => {
      if (!isLoading && !user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ No user found after delay, redirecting to login...');
        }
        router.push('/admin/login');
      } else if (user && process.env.NODE_ENV === 'development') {
        console.log('✅ User authenticated:', user.email);
      }
    }, 1000); // Wait 1 second before checking

    return () => clearTimeout(checkAuth);
  }, [user, isLoading, router]);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error);
      }
      // Still redirect even if logout fails
      router.push('/admin/login');
    }
  }, [auth, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="w-full h-1 bg-accent mb-8"></div>

        {adminCreationError && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> {adminCreationError}
            </p>
            <p className="text-yellow-300 text-xs mt-2">
              To fix this, add INSTANT_ADMIN_TOKEN to your .env.local file and run: <code className="bg-gray-800 px-2 py-1 rounded">npm run add-root-admin</code>
            </p>
          </div>
        )}

        <div className="space-y-8">
          <CSVUpload />
          <Analytics />
        </div>
      </div>
    </div>
  );
}

