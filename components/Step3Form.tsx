'use client';

import { useState } from 'react';
import { validateUsername } from '@/lib/utils';

interface Step3FormProps {
  onSubmit: (newUsername: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export default function Step3Form({ onSubmit, onBack, initialValue = '' }: Step3FormProps) {
  const [newUsername, setNewUsername] = useState(initialValue);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!newUsername.trim()) {
      setError('Please enter your new mainnet username');
      setIsSubmitting(false);
      return;
    }

    if (!validateUsername(newUsername.trim())) {
      setError('Username must be between 1 and 50 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(newUsername.trim());
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in Step3Form:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to update username. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <label htmlFor="newUsername" className="block text-lg font-semibold mb-3">
          New Mainnet Bitmask Username
        </label>
        <input
          type="text"
          id="newUsername"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          placeholder="Enter your new username"
          autoFocus
        />
        {error && (
          <div className="mt-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm whitespace-pre-wrap break-words">{error}</p>
          </div>
        )}
        {isSubmitting && (
          <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
            <span>Submitting update...</span>
          </div>
        )}
        <p className="mt-2 text-gray-400 text-sm">
          Create a brand new bitmask wallet and input the new bitmask username
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Username'}
        </button>
      </div>
    </form>
  );
}

