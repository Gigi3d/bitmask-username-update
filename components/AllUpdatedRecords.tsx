'use client';

import { useMemo, useState } from 'react';
import { db } from '@/lib/instantdb';

interface UserUpdate {
  id: string;
  oldUsername: string;
  newUsername: string;
  submittedAt: number;
  updateAttemptCount?: number;
  firstNewUsername?: string;
  secondNewUsername?: string;
  thirdNewUsername?: string;
  lastUpdatedAt?: number;
  trackingId?: string;
}

interface AllUpdatedRecordsProps {
  isSuperAdmin?: boolean;
}

export default function AllUpdatedRecords({ isSuperAdmin = false }: AllUpdatedRecordsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'username'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      normalizedSearch: `${update.oldUsername} ${update.newUsername} ${update.firstNewUsername || ''} ${update.secondNewUsername || ''} ${update.thirdNewUsername || ''} ${update.trackingId || ''}`.toLowerCase(),
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
          return (b.lastUpdatedAt || b.submittedAt) - (a.lastUpdatedAt || a.submittedAt);
        case 'oldest':
          return (a.lastUpdatedAt || a.submittedAt) - (b.lastUpdatedAt || b.submittedAt);
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

  const handleCopyTrackingId = async (trackingId: string) => {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopiedId(trackingId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy tracking ID:', error);
    }
  };

  const downloadCSV = () => {
    if (updates.length === 0) return;

    // Define CSV headers
    const headers = [
      'Old Username',
      'Current Username',
      'Tracking ID',
      'Attempt Count',
      'First Username',
      'Second Username',
      'Third Username',
      'Last Updated',
      'Submitted At',
      'Record ID'
    ];

    // Convert updates to CSV rows
    const rows = updates.map(update => [
      update.oldUsername || '',
      update.newUsername || '',
      update.trackingId || '',
      update.updateAttemptCount || 1,
      update.firstNewUsername || '',
      update.secondNewUsername || '',
      update.thirdNewUsername || '',
      formatDate(update.lastUpdatedAt || update.submittedAt),
      formatDate(update.submittedAt),
      update.id
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `bitmask-username-updates-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            placeholder="Search by username or tracking ID..."
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

          {/* Download Button - Only for Superadmins */}
          {isSuperAdmin && updates.length > 0 && (
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 whitespace-nowrap"
              title="Download all records as CSV"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download CSV
            </button>
          )}
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Current Username</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Tracking ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Attempts</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">All Usernames</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Last Updated</th>
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
                  <td className="py-3 px-4">
                    {update.trackingId ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-accent bg-gray-900 px-2 py-1 rounded">
                          {update.trackingId}
                        </code>
                        <button
                          onClick={() => handleCopyTrackingId(update.trackingId!)}
                          className="text-xs text-gray-400 hover:text-accent transition-colors"
                          title="Copy tracking ID"
                        >
                          {copiedId === update.trackingId ? '✓' : '📋'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm">
                      {update.updateAttemptCount || 1} of 3
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 text-sm">
                      {update.firstNewUsername && (
                        <span className="text-gray-400">1: {update.firstNewUsername}</span>
                      )}
                      {update.secondNewUsername && (
                        <span className="text-gray-400">2: {update.secondNewUsername}</span>
                      )}
                      {update.thirdNewUsername && (
                        <span className="text-gray-400">3: {update.thirdNewUsername}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {formatDate(update.lastUpdatedAt || update.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

