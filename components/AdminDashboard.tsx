'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CSVUpload from './CSVUpload';
import Analytics from './Analytics';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    router.push('/admin/login');
  };

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

