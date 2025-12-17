'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/instantdb';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
// Lazy load heavy components for better performance
const CSVUpload = dynamic(() => import('@/components/CSVUpload'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-4"></div>
      <div className="h-64 bg-gray-800 rounded animate-pulse"></div>
    </div>
  ),
});

const AdminManagement = dynamic(() => import('@/components/AdminManagement'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="h-8 w-40 bg-gray-800 rounded animate-pulse mb-4"></div>
      <div className="h-48 bg-gray-800 rounded animate-pulse"></div>
    </div>
  ),
});

const UsernameUpdatesFeed = dynamic(() => import('@/components/UsernameUpdatesFeed'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  ),
});

const AllUpdatedRecords = dynamic(() => import('@/components/AllUpdatedRecords'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="h-8 w-40 bg-gray-800 rounded animate-pulse mb-4"></div>
      <div className="h-64 bg-gray-800 rounded animate-pulse"></div>
    </div>
  ),
});

const CSVViewer = dynamic(() => import('@/components/CSVViewer'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-4"></div>
      <div className="h-96 bg-gray-800 rounded animate-pulse"></div>
    </div>
  ),
});

// Lazy load Analytics component with recharts (heavy library)
const Analytics = dynamic(() => import('@/components/Analytics'), {
  loading: () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-4"></div>
      <div className="h-64 bg-gray-800 rounded animate-pulse"></div>
    </div>
  ),
  ssr: false, // Charts don't need SSR
});

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = db.useAuth();
  const [adminCreationError, setAdminCreationError] = useState('');

  // Query admin_users to check if current user is an admin
  const { data: adminData } = db.useQuery({ admin_users: {} });

  // Check if current user is a superadmin
  const adminUsersArray = adminData?.admin_users
    ? (Array.isArray(adminData.admin_users)
      ? adminData.admin_users
      : Object.values(adminData.admin_users))
    : [];
  const currentUserAdmin = (adminUsersArray as Array<{ email?: string; role?: string }>)
    .find((admin) => admin.email?.toLowerCase() === user?.email?.toLowerCase()) || null;

  const isSuperAdmin = currentUserAdmin?.role === 'superadmin';

  // Check if current user is an admin
  useEffect(() => {
    if (!isLoading && user?.email && adminData?.admin_users) {
      const adminUsersArray = Array.isArray(adminData.admin_users)
        ? adminData.admin_users
        : Object.values(adminData.admin_users);
      const currentUserAdmin = (adminUsersArray as Array<{ email?: string; role?: string }>)
        .find((admin) => admin.email?.toLowerCase() === user.email?.toLowerCase());

      if (!currentUserAdmin) {
        setAdminCreationError(
          `User ${user.email} is not authorized as an admin. Please contact support.`
        );
      }
    }
  }, [user, isLoading, adminData]);

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
  }, [router]);

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
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">
              <strong>Access Denied:</strong> {adminCreationError}
            </p>
            <p className="text-red-300 text-xs mt-2">
              Only authorized administrators can access this dashboard.
            </p>
          </div>
        )}

        <div className="space-y-8">
          <ErrorBoundary componentName="username updates feed">
            <UsernameUpdatesFeed />
          </ErrorBoundary>

          {isSuperAdmin && (
            <ErrorBoundary componentName="admin management">
              <AdminManagement />
            </ErrorBoundary>
          )}

          <ErrorBoundary componentName="CSV upload">
            <CSVUpload />
          </ErrorBoundary>

          <ErrorBoundary componentName="CSV viewer">
            <CSVViewer />
          </ErrorBoundary>

          <ErrorBoundary componentName="analytics">
            <Analytics />
          </ErrorBoundary>

          <ErrorBoundary componentName="updated records list">
            <AllUpdatedRecords />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

