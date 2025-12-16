'use client';

import AdminDashboard from '@/components/AdminDashboard';

// Force dynamic rendering - do not prerender this page
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
