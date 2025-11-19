'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Protect test page from production access
export default function TestDB() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/');
    }
  }, [router]);

  // In production, this won't render
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Development-only test page
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">InstantDB Connection Test</h1>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 mb-6">
          <p className="text-yellow-400">
            ⚠️ This page is only available in development mode.
          </p>
        </div>
      </div>
    </div>
  );
}
