'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/instantdb';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [magicCode, setMagicCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim()) {
        setError('Please enter your email address');
        setIsLoading(false);
        return;
      }

      // Send magic code to email
      await auth.sendMagicCode({ email: email.trim() });
      setCodeSent(true);
      setError('');
    } catch (err: any) {
      console.error('Error sending magic code:', err);
      setError(err?.message || 'Failed to send magic code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!magicCode.trim()) {
        setError('Please enter the magic code');
        setIsLoading(false);
        return;
      }

      // Verify magic code and sign in
      await auth.signInWithMagicCode({ 
        email: email.trim(), 
        code: magicCode.trim() 
      });
      
      // Try to create admin user record if it doesn't exist (first-time login)
      try {
        const response = await fetch('/api/admin/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            role: 'admin', // First user gets admin role, can be upgraded to superadmin later
          }),
        });
        
        // If it fails because user already exists, that's fine
        if (!response.ok) {
          const data = await response.json();
          if (!data.error?.includes('already exists')) {
            console.warn('Could not create admin user record:', data.error);
          }
        }
      } catch (err) {
        // If admin creation fails (e.g., no admin token), that's okay
        // The user can still access the dashboard, but API routes will require admin_users record
        console.warn('Could not auto-create admin user record. You may need to add the user manually.');
      }
      
      // Redirect on success
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid magic code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Admin Login</h1>
          
          <div className="w-full h-1 bg-accent mb-8"></div>

          {!codeSent ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="Enter your email address"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending code...' : 'Send Magic Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-blue-400 text-sm mb-4">
                A magic code has been sent to <strong>{email}</strong>. Please check your email and enter the code below.
              </div>

              <div>
                <label htmlFor="magicCode" className="block text-sm font-semibold mb-2">
                  Magic Code
                </label>
                <input
                  type="text"
                  id="magicCode"
                  value={magicCode}
                  onChange={(e) => setMagicCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent text-center text-2xl tracking-widest"
                  placeholder="Enter code"
                  required
                  autoFocus
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setMagicCode('');
                    setError('');
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

