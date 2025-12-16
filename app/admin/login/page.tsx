'use client';

import AdminLogin from '@/components/AdminLogin';
import { useEffect, useState, ErrorInfo, Component, ReactNode } from 'react';

// Force dynamic rendering - do not prerender this page
export const dynamic = 'force-dynamic';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminLoginPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-4 text-red-400">Error Loading Login</h1>
            <div className="bg-gray-900 border border-red-800 rounded-lg p-6 mb-4">
              <p className="text-red-400 mb-2 font-semibold">Error Message:</p>
              <pre className="text-sm text-red-300 mb-4">{this.state.error?.message}</pre>
              {this.state.error?.stack && (
                <>
                  <p className="text-red-400 mb-2 font-semibold">Stack Trace:</p>
                  <pre className="text-xs text-gray-400 overflow-auto max-h-64">
                    {this.state.error.stack}
                  </pre>
                </>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/test-db'}
                className="w-full bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700"
              >
                Test Database Connection
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Catch any unhandled errors
    const handleError = (e: ErrorEvent) => {
      console.error('Page error:', e.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AdminLogin />
    </ErrorBoundary>
  );
}

