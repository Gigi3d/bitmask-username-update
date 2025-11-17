'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/instantdb';

export default function AdminManagement() {
  const { user } = db.useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Query admin users
  const { data: adminData } = db.useQuery({ admin_users: {} });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    if (!email.trim()) {
      setError('Please enter an email address');
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      if (!user?.email) {
        setError('User email not available. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
        body: JSON.stringify({
          email: email.trim(),
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create admin user');
      }

      setSuccess(true);
      setEmail('');
      setRole('admin');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin user');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, role, user]);

  // Get current admin list from query data
  const currentAdmins = adminData?.admin_users 
    ? (Array.isArray(adminData.admin_users) 
        ? adminData.admin_users 
        : Object.values(adminData.admin_users))
    : [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Management</h2>
      <p className="text-gray-400 mb-6 text-sm">
        Add new admin users to the system. Only superadmins can add other admins.
      </p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label htmlFor="admin-email" className="block text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="admin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-role" className="block text-sm font-semibold mb-2">
              Role
            </label>
            <select
              id="admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent text-black font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Admin'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
          <p className="text-green-400 text-sm">
            Admin user added successfully!
          </p>
        </div>
      )}

      {/* Admin List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Current Admins</h3>
        {currentAdmins.length === 0 ? (
          <p className="text-gray-400 text-sm">No admins found.</p>
        ) : (
          <div className="space-y-2">
            {currentAdmins.map((admin: any) => (
              <div
                key={admin.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-medium">{admin.email}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Role: <span className="text-accent">{admin.role}</span>
                  </p>
                </div>
                {admin.email?.toLowerCase() === user?.email?.toLowerCase() && (
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

