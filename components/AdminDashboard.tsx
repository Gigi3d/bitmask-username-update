'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/instantdb';
import CSVUpload from '@/components/CSVUpload';
import Analytics from '@/components/Analytics';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated (after loading)
    if (!isLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/admin/login');
    }
  };

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

        <div className="space-y-8">
          <CSVUpload />
          <Analytics />
        </div>
      </div>
    </div>
  );
}

