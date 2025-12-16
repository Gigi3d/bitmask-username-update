'use client';

import { useMemo } from 'react';
import { db } from '@/lib/instantdb';

interface UserUpdate {
  id: string;
  oldUsername: string;
  newUsername: string;
  submittedAt: number;
  updateAttemptCount?: number;
  lastUpdatedAt?: number;
}

export default function UsernameUpdatesFeed() {
  // Use reactive query to get real-time updates
  const { data: updatesData } = db.useQuery({ user_updates: {} });

  // Process and sort updates (newest first)
  const updates = useMemo(() => {
    if (!updatesData?.user_updates) return [];

    const updatesArray = Array.isArray(updatesData.user_updates)
      ? updatesData.user_updates
      : Object.values(updatesData.user_updates);

    return (updatesArray as UserUpdate[])
      .sort((a, b) => (b.lastUpdatedAt || b.submittedAt) - (a.lastUpdatedAt || a.submittedAt))
      .slice(0, 50); // Show latest 50 updates
  }, [updatesData]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Username Updates</h2>
      <p className="text-gray-400 text-sm mb-6">
        Real-time feed of new bitmask username updates
      </p>

      {updates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No username updates yet.</p>
          <p className="text-sm mt-2">Updates will appear here as users submit them.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-semibold">{update.oldUsername}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-accent font-bold">{update.newUsername}</span>
                    {update.updateAttemptCount && update.updateAttemptCount > 1 && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                        Update #{update.updateAttemptCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>🕐 {formatDate(update.lastUpdatedAt || update.submittedAt)}</span>
                    <span className="text-xs">
                      {update.updateAttemptCount || 1} of 3 attempts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}







