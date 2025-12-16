'use client';

import { useState, useEffect } from 'react';
import { showToast } from './Toast';
import Tooltip from './Tooltip';

interface SuccessMessageProps {
  oldUsername: string;
  newUsername: string;
  trackingId?: string;
  attemptNumber?: number;
  remainingAttempts?: number;
}

export default function SuccessMessage({ oldUsername, newUsername, trackingId, attemptNumber, remainingAttempts }: SuccessMessageProps) {
  const [copied, setCopied] = useState(false);
  const [attempts, setAttempts] = useState({ current: attemptNumber || 1, remaining: remainingAttempts ?? 2 });

  useEffect(() => {
    // If not provided via props, fetch from API
    if (attemptNumber === undefined && oldUsername) {
      fetch('/api/users/check-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldUsername }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.attemptCount !== undefined) {
            setAttempts({
              current: data.attemptCount,
              remaining: 3 - data.attemptCount,
            });
          }
        })
        .catch(() => {
          // Silently fail, use defaults
        });
    }
  }, [oldUsername, attemptNumber]);

  const twitterMessage = `Just updated my BitMask wallet username to ${newUsername} for RGB protocol on Bitcoin mainnet! 🚀

Bitcoin Native Finance is here @BitMask_App 

#Bitmask #Mainnet #RGB`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(twitterMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy', 'error');
    }
  };

  const handleCopyTrackingId = async () => {
    if (!trackingId) return;
    try {
      await navigator.clipboard.writeText(trackingId);
      showToast('Tracking ID copied!', 'success');
    } catch (err) {
      showToast('Failed to copy tracking ID', 'error');
    }
  };

  const handleShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center animate-fade-in">
          <svg
            className="w-10 h-10 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Your account has been updated!</h2>
        <p className="text-gray-300 text-lg">
          Your username has been successfully updated from <span className="font-semibold text-accent">{oldUsername}</span> to <span className="font-semibold text-accent">{newUsername}</span>
        </p>
      </div>

      {/* Attempts Remaining Notice */}
      <div className={`border rounded-lg p-4 mb-6 ${attempts.remaining > 0 ? 'bg-blue-900/20 border-blue-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`text-lg font-semibold ${attempts.remaining > 0 ? 'text-blue-300' : 'text-red-300'}`}>
            Update Attempt {attempts.current} of 3
          </span>
          <Tooltip content="You can update your username up to 3 times total">
            <span className="text-gray-400 cursor-help text-sm">ℹ️</span>
          </Tooltip>
        </div>
        <p className={`text-sm ${attempts.remaining > 0 ? 'text-blue-200' : 'text-red-200'}`}>
          {attempts.remaining > 0 ? (
            <>You have <strong>{attempts.remaining}</strong> {attempts.remaining === 1 ? 'update' : 'updates'} remaining</>
          ) : (
            <>You have used all 3 updates. No further changes are allowed.</>
          )}
        </p>
      </div>

      {/* Tracking ID Section */}
      {trackingId && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h3 className="text-lg font-semibold">Tracking ID</h3>
            <Tooltip content="Save this ID to check your submission status or make edits within 24 hours">
              <span className="text-gray-400 cursor-help text-sm">ℹ️</span>
            </Tooltip>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
            <code className="text-accent font-mono text-sm">{trackingId}</code>
            <button
              onClick={handleCopyTrackingId}
              className="ml-4 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600"
            >
              Copy
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            Save this tracking ID to check your submission status or make changes within 24 hours.
          </p>
        </div>
      )}

      {/* What Happens Next */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6 text-left">
        <h3 className="text-lg font-semibold mb-4 text-center">What Happens Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-accent text-xl">1.</span>
            <p className="text-gray-300 text-sm">
              <strong>Processing:</strong> Your update will be processed within 24-48 hours.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent text-xl">2.</span>
            <p className="text-gray-300 text-sm">
              <strong>Email Confirmation:</strong> You'll receive an email when processing is complete.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent text-xl">3.</span>
            <p className="text-gray-300 text-sm">
              <strong>Check Status:</strong> Use your tracking ID to check the status anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Share on Twitter */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Share on X (Twitter)</h3>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm whitespace-pre-wrap text-left font-mono">{twitterMessage}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCopy}
            className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <button
            onClick={handleShare}
            className="bg-accent text-black font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Share on X
          </button>
        </div>
      </div>

      <div className="w-full h-1 bg-accent"></div>
    </div>
  );
}
