'use client';

import dynamic from 'next/dynamic';

// Disable SSR for AdminDashboard to prevent InstantDB client-side errors
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted">Loading dashboard...</p>
      </div>
    </div>
  ),
});

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
