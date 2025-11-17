'use client';

import { useState } from 'react';
import { validateUsername } from '@/lib/utils';

interface Step1FormProps {
  onNext: (oldUsername: string) => void;
  initialValue?: string;
}

export default function Step1Form({ onNext, initialValue = '' }: Step1FormProps) {
  const [oldUsername, setOldUsername] = useState(initialValue);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    const trimmedUsername = oldUsername.trim();

    if (!trimmedUsername) {
      setError('Please enter your old bitmask username');
      setIsVerifying(false);
      return;
    }

    if (!validateUsername(trimmedUsername)) {
      setError('Username must be between 1 and 50 characters');
      setIsVerifying(false);
      return;
    }

    try {
      // Verify old username exists in CSV database
      const response = await fetch('/api/users/verify-old-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldUsername: trimmedUsername }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.message || 'Old username not found in campaign records');
        setIsVerifying(false);
        return;
      }

      // Validation passed, proceed to next step
      onNext(trimmedUsername);
    } catch (err) {
      console.error('Error verifying old username:', err);
      setError('Failed to verify username. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <label htmlFor="oldUsername" className="block text-lg font-semibold mb-3">
          Old Bitmask Username
        </label>
        <input
          type="text"
          id="oldUsername"
          value={oldUsername}
          onChange={(e) => setOldUsername(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          placeholder="Enter your old username"
          autoFocus
        />
        {error && (
          <div className="mt-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {isVerifying && (
          <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
            <span>Verifying username in database...</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isVerifying}
        className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? 'Verifying...' : 'Next'}
      </button>
    </form>
  );
}

