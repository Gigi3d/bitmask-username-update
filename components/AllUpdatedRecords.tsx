'use client';

import { useMemo, useState } from 'react';
import { db } from '@/lib/instantdb';

interface UserUpdate {
  id: string;
  oldUsername: string;
  telegramAccount: string;
  newUsername: string;
  submittedAt: number;
}

export default function AllUpdatedRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'username'>('newest');

  // Use reactive query to get all updates
  const { data: updatesData } = db.useQuery({ user_updates: {} });

  // Process and sort updates
  const updates = useMemo(() => {
    if (!updatesData?.user_updates) return [];

    const updatesArray = Array.isArray(updatesData.user_updates)
      ? updatesData.user_updates
      : Object.values(updatesData.user_updates);

    let processed = (updatesArray as UserUpdate[]).map(update => ({
      ...update,
      normalizedSearch: `${update.oldUsername} ${update.newUsername} ${update.telegramAccount}`.toLowerCase(),
    }));

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      processed = processed.filter(update =>
        update.normalizedSearch.includes(searchLower)
      );
    }

    // Sort
    processed.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.submittedAt - a.submittedAt;
        case 'oldest':
          return a.submittedAt - b.submittedAt;
        case 'username':
          return a.newUsername.localeCompare(b.newUsername);
        default:
          return 0;
      }
    });

    return processed;
  }, [updatesData, searchTerm, sortBy]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">All Updated Records</h2>
          <p className="text-gray-400 text-sm">
            Complete list of all username updates ({updates.length} {updates.length === 1 ? 'record' : 'records'})
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by username or telegram..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent w-full sm:w-64"
          />
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'username')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="username">Sort by Username</option>
          </select>
        </div>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {searchTerm ? (
            <>
              <p>No records found matching &quot;{searchTerm}&quot;</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-accent hover:underline"
              >
                Clear search
              </button>
            </>
          ) : (
            <p>No username updates recorded yet.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Old Username</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">New Username</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Telegram Account</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((update) => (
                <tr
                  key={update.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4 text-white font-medium">{update.oldUsername}</td>
                  <td className="py-3 px-4">
                    <span className="text-accent font-bold">{update.newUsername}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{update.telegramAccount}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{formatDate(update.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

