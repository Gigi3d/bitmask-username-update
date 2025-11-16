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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldUsername.trim()) {
      setError('Please enter your old bitmask username');
      return;
    }

    if (!validateUsername(oldUsername.trim())) {
      setError('Username must be between 1 and 50 characters');
      return;
    }

    onNext(oldUsername.trim());
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
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
      >
        Next
      </button>
    </form>
  );
}

