'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/instantdb';

interface Upload {
    id: string;
    uploadName: string;
    fileName: string;
    uploadedBy: string;
    uploadedAt: number;
    recordCount: number;
}

interface CSVRecord {
    id: string;
    oldUsername: string;
    newUsername: string;
    npubKey?: string;
    createdAt: number;
}

interface PaginationMetadata {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export default function CSVViewer() {
    const { user } = db.useAuth();
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [expandedUploadId, setExpandedUploadId] = useState<string | null>(null);
    const [records, setRecords] = useState<CSVRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [error, setError] = useState('');
    const [editingUploadId, setEditingUploadId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    // Fetch all uploads
    const fetchUploads = useCallback(async () => {
        if (!user?.email) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/csv/uploads', {
                headers: {
                    'x-user-email': user.email,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch uploads');
            }

            const data = await response.json();
            setUploads(data.uploads || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch uploads');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Fetch records for a specific upload
    const fetchRecords = useCallback(async (uploadId: string, page: number = 1) => {
        if (!user?.email) return;

        setIsLoadingRecords(true);
        setError('');

        try {
            const response = await fetch(
                `/api/csv/uploads/${uploadId}?page=${page}&limit=1000`,
                {
                    headers: {
                        'x-user-email': user.email,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch records');
            }

            const data = await response.json();
            setRecords(data.records || []);
            setPagination(data.pagination);
            setCurrentPage(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch records');
        } finally {
            setIsLoadingRecords(false);
        }
    }, [user]);

    // Rename upload
    const renameUpload = useCallback(async (uploadId: string, newName: string) => {
        if (!user?.email) return;

        try {
            const response = await fetch(`/api/csv/uploads/${uploadId}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email,
                },
                body: JSON.stringify({ uploadName: newName }),
            });

            if (!response.ok) {
                throw new Error('Failed to rename upload');
            }

            // Refresh uploads list
            await fetchUploads();
            setEditingUploadId(null);
            setEditingName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rename upload');
        }
    }, [user, fetchUploads]);

    // Load uploads on mount
    useEffect(() => {
        fetchUploads();
    }, [fetchUploads]);

    // Toggle upload expansion
    const toggleUpload = useCallback((uploadId: string) => {
        if (expandedUploadId === uploadId) {
            setExpandedUploadId(null);
            setRecords([]);
            setPagination(null);
            setCurrentPage(1);
        } else {
            setExpandedUploadId(uploadId);
            fetchRecords(uploadId, 1);
        }
    }, [expandedUploadId, fetchRecords]);

    // Handle page change
    const handlePageChange = useCallback((newPage: number) => {
        if (expandedUploadId) {
            fetchRecords(expandedUploadId, newPage);
        }
    }, [expandedUploadId, fetchRecords]);

    // Start editing upload name
    const startEditing = useCallback((upload: Upload) => {
        setEditingUploadId(upload.id);
        setEditingName(upload.uploadName);
    }, []);

    // Cancel editing
    const cancelEditing = useCallback(() => {
        setEditingUploadId(null);
        setEditingName('');
    }, []);

    // Save edited name
    const saveEditedName = useCallback((uploadId: string) => {
        if (editingName.trim()) {
            renameUpload(uploadId, editingName.trim());
        } else {
            cancelEditing();
        }
    }, [editingName, renameUpload, cancelEditing]);

    // Format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">CSV Uploads</h2>
                <div className="text-gray-400 text-center py-8">Loading uploads...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">CSV Uploads</h2>
                <button
                    onClick={fetchUploads}
                    className="text-accent hover:underline text-sm"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {uploads.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                    No CSV uploads found. Upload a CSV file to get started.
                </p>
            ) : (
                <div className="space-y-3">
                    {uploads.map((upload) => (
                        <div
                            key={upload.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
                        >
                            {/* Upload Header */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <button
                                            onClick={() => toggleUpload(upload.id)}
                                            className="text-accent hover:opacity-80 transition-opacity"
                                        >
                                            {expandedUploadId === upload.id ? '▼' : '▶'}
                                        </button>

                                        {editingUploadId === upload.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            saveEditedName(upload.id);
                                                        } else if (e.key === 'Escape') {
                                                            cancelEditing();
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-accent"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveEditedName(upload.id)}
                                                    className="text-green-400 hover:text-green-300 text-sm font-semibold"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="text-gray-400 hover:text-gray-300 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex-1">
                                                <button
                                                    onClick={() => startEditing(upload)}
                                                    className="text-white font-semibold hover:text-accent transition-colors text-left"
                                                >
                                                    {upload.uploadName}
                                                </button>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {upload.recordCount.toLocaleString()} records • Uploaded by{' '}
                                                    {upload.uploadedBy} • {formatDate(upload.uploadedAt)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Records View */}
                            {expandedUploadId === upload.id && (
                                <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                                    {isLoadingRecords ? (
                                        <div className="text-gray-400 text-center py-8">
                                            Loading records...
                                        </div>
                                    ) : (
                                        <>
                                            {/* Pagination Controls - Top */}
                                            {pagination && pagination.totalPages > 1 && (
                                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                                                    <div className="text-sm text-gray-400">
                                                        Page {pagination.currentPage} of {pagination.totalPages}
                                                        {' • '}
                                                        {pagination.totalRecords.toLocaleString()} total records
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePageChange(currentPage - 1)}
                                                            disabled={!pagination.hasPreviousPage}
                                                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => handlePageChange(currentPage + 1)}
                                                            disabled={!pagination.hasNextPage}
                                                            className="px-4 py-2 bg-accent text-black rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-sm font-semibold"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Records Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-700">
                                                            <th className="text-left py-2 px-3 text-gray-400 font-semibold">
                                                                Old Username
                                                            </th>
                                                            <th className="text-left py-2 px-3 text-gray-400 font-semibold">
                                                                New Username
                                                            </th>
                                                            <th className="text-left py-2 px-3 text-gray-400 font-semibold">
                                                                nPUB Key
                                                            </th>
                                                            <th className="text-left py-2 px-3 text-gray-400 font-semibold">
                                                                Created
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {records.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="text-center py-8 text-gray-400">
                                                                    No records found
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            records.map((record) => (
                                                                <tr
                                                                    key={record.id}
                                                                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                                                >
                                                                    <td className="py-2 px-3 text-white font-mono text-xs">
                                                                        {record.oldUsername}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-white font-mono text-xs">
                                                                        {record.newUsername}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-gray-400 font-mono text-xs">
                                                                        {record.npubKey ? (
                                                                            <span className="truncate block max-w-xs" title={record.npubKey}>
                                                                                {record.npubKey.substring(0, 20)}...
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-600">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-gray-400 text-xs">
                                                                        {formatDate(record.createdAt)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination Controls - Bottom */}
                                            {pagination && pagination.totalPages > 1 && (
                                                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
                                                    <div className="text-sm text-gray-400">
                                                        Showing {((currentPage - 1) * 1000) + 1} to{' '}
                                                        {Math.min(currentPage * 1000, pagination.totalRecords)} of{' '}
                                                        {pagination.totalRecords.toLocaleString()} records
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePageChange(currentPage - 1)}
                                                            disabled={!pagination.hasPreviousPage}
                                                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => handlePageChange(currentPage + 1)}
                                                            disabled={!pagination.hasNextPage}
                                                            className="px-4 py-2 bg-accent text-black rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-sm font-semibold"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
