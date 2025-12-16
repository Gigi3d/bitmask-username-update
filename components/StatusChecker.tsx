'use client';

import { useState } from 'react';
import { showToast } from './Toast';

export default function StatusChecker() {
    const [trackingId, setTrackingId] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [status, setStatus] = useState<{
        found: boolean;
        data?: {
            oldUsername: string;
            newUsername: string;
            submittedAt: number;
            updateAttemptCount?: number;
            firstNewUsername?: string;
            secondNewUsername?: string;
            thirdNewUsername?: string;
            lastUpdatedAt?: number;
            status: 'pending' | 'processing' | 'completed' | 'error';
        };
        error?: string;
    } | null>(null);

    const handleCheck = async () => {
        if (!trackingId.trim()) {
            showToast('Please enter a tracking ID', 'error');
            return;
        }

        setIsChecking(true);
        setStatus(null);

        try {
            const response = await fetch('/api/status/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trackingId: trackingId.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus({ found: false, error: data.message || 'Tracking ID not found' });
                return;
            }

            setStatus({ found: true, data: data.submission });
        } catch {
            setStatus({ found: false, error: 'Failed to check status. Please try again.' });
        } finally {
            setIsChecking(false);
        }
    };

    const getStatusColor = (statusType: string) => {
        switch (statusType) {
            case 'completed':
                return 'text-green-400 bg-green-900/30 border-green-700';
            case 'processing':
                return 'text-blue-400 bg-blue-900/30 border-blue-700';
            case 'error':
                return 'text-red-400 bg-red-900/30 border-red-700';
            default:
                return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        }
    };

    const getStatusText = (statusType: string) => {
        switch (statusType) {
            case 'completed':
                return 'Completed ✓';
            case 'processing':
                return 'Processing...';
            case 'error':
                return 'Error';
            default:
                return 'Pending';
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
                    Check Submission Status
                </h1>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
                    <div className="mb-6">
                        <label htmlFor="trackingId" className="block text-lg font-semibold mb-3">
                            Tracking ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="trackingId"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-accent"
                            placeholder="BM-XXXXXXX-XXXXXXX"
                            autoFocus
                        />
                        <p className="mt-2 text-gray-400 text-sm">
                            Enter the tracking ID you received after submitting your update
                        </p>
                    </div>

                    <button
                        onClick={handleCheck}
                        disabled={isChecking || !trackingId}
                        className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                    >
                        {isChecking ? 'Checking...' : 'Check Status'}
                    </button>

                    {/* Status Display */}
                    {status && (
                        <div className="mt-6">
                            {status.found && status.data ? (
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className={`border rounded-lg p-4 ${getStatusColor(status.data.status)}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">Status:</span>
                                            <span className="font-bold">{getStatusText(status.data.status)}</span>
                                        </div>
                                    </div>

                                    {/* Submission Details */}
                                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Submission Details</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Old Username:</span>
                                                <span className="text-white font-mono">{status.data.oldUsername}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">New Username:</span>
                                                <span className="text-accent font-mono font-bold">{status.data.newUsername}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Attempt:</span>
                                                <span className="text-white">{status.data.updateAttemptCount || 1} of 3</span>
                                            </div>
                                            {(status.data.firstNewUsername || status.data.secondNewUsername || status.data.thirdNewUsername) && (
                                                <div className="mt-3 pt-3 border-t border-gray-700">
                                                    <span className="text-gray-400 text-xs block mb-2">All Attempts:</span>
                                                    <div className="space-y-1">
                                                        {status.data.firstNewUsername && (
                                                            <div className="text-xs text-gray-400">1. {status.data.firstNewUsername}</div>
                                                        )}
                                                        {status.data.secondNewUsername && (
                                                            <div className="text-xs text-gray-400">2. {status.data.secondNewUsername}</div>
                                                        )}
                                                        {status.data.thirdNewUsername && (
                                                            <div className="text-xs text-gray-400">3. {status.data.thirdNewUsername}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Last Updated:</span>
                                                <span className="text-white">{formatDate(status.data.lastUpdatedAt || status.data.submittedAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estimated Completion */}
                                    {status.data.status === 'pending' || status.data.status === 'processing' ? (
                                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                            <p className="text-blue-300 text-sm">
                                                <strong>Estimated completion:</strong> 24-48 hours from submission
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                                    <p className="text-red-400 text-sm">{status.error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Help Section */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Don&apos;t have a tracking ID?{' '}
                        <a href="/update" className="text-accent hover:underline">
                            Submit a new update
                        </a>
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Need help?{' '}
                        <a href="mailto:support@bitmask.app" className="text-accent hover:underline">
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
