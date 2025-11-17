'use client';

import { db, auth } from '@/lib/instantdb';
import { useEffect, useState } from 'react';

export default function TestDB() {
  const [status, setStatus] = useState('Testing...');
  const [details, setDetails] = useState<any>({});
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    console.log('🔍 TestDB mounted');
    console.log('📧 App ID:', process.env.NEXT_PUBLIC_INSTANT_APP_ID);
    console.log('🔐 Auth object:', auth);
    console.log('👤 User state:', { user, isLoading });

    const checkStatus = async () => {
      try {
        // Test query
        const result = await db.query({ admin_users: {} });
        console.log('✅ Query successful:', result);
        
        setDetails({
          appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID ? 'Set' : 'Missing',
          authAvailable: !!auth,
          userEmail: user?.email || 'Not authenticated',
          isLoading,
          queryResult: result ? 'Success' : 'Failed',
          adminUsersCount: result?.admin_users 
            ? (Array.isArray(result.admin_users) 
                ? result.admin_users.length 
                : Object.keys(result.admin_users).length)
            : 0,
        });

        if (isLoading) {
          setStatus('Loading...');
        } else if (user) {
          setStatus(`✅ Connected! User: ${user.email}`);
        } else {
          setStatus('⚠️ Not authenticated (this is normal if not logged in)');
        }
      } catch (error: any) {
        console.error('❌ TestDB error:', error);
        setStatus(`❌ Error: ${error.message}`);
        setDetails({
          error: error.message,
          stack: error.stack,
        });
      }
    };

    checkStatus();
  }, [user, isLoading]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">InstantDB Connection Test</h1>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-lg">{status}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <pre className="text-sm overflow-auto bg-gray-800 p-4 rounded">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90"
            >
              Go to Admin Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700"
            >
              Refresh Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

