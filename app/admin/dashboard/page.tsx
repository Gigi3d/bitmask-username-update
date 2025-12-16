'use client';

import AdminDashboard from '@/components/AdminDashboard';

// Force dynamic rendering - no SSR
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
