'use client';

import { useState } from 'react';
import { validateTelegramHandle } from '@/lib/utils';

interface Step2FormProps {
  onNext: (telegramAccount: string) => void;
  onBack: () => void;
  oldUsername: string; // Required: old username from Step 1
  initialValue?: string;
}

export default function Step2Form({ onNext, onBack, oldUsername, initialValue = '' }: Step2FormProps) {
  const [telegramAccount, setTelegramAccount] = useState(initialValue);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    const cleanHandle = telegramAccount.trim();
    
    if (!cleanHandle) {
      setError('Please enter your Telegram account');
      setIsVerifying(false);
      return;
    }

    // Basic format validation
    if (!validateTelegramHandle(cleanHandle)) {
      setError('Invalid Telegram handle format');
      setIsVerifying(false);
      return;
    }

    try {
      // Verify telegram account matches old username in CSV data
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          oldUsername: oldUsername,
          telegramAccount: cleanHandle 
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        // Show detailed error message
        const errorMsg = data.message || 'Telegram account verification failed';
        setError(errorMsg);
        setIsVerifying(false);
        return;
      }

      // Validation passed, proceed to next step
      onNext(cleanHandle);
    } catch (err) {
      console.error('Error verifying telegram account:', err);
      setError('Failed to verify Telegram account. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <label htmlFor="telegramAccount" className="block text-lg font-semibold mb-3">
          Telegram Account
        </label>
        <input
          type="text"
          id="telegramAccount"
          value={telegramAccount}
          onChange={(e) => setTelegramAccount(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          placeholder="@username or username"
          autoFocus
        />
        {error && (
          <div className="mt-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm whitespace-pre-wrap break-words">{error}</p>
          </div>
        )}
        {isVerifying && (
          <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
            <span>Verifying telegram account matches username...</span>
          </div>
        )}
        <p className="mt-2 text-gray-400 text-sm">
          Enter the Telegram handle associated with username: <strong className="text-accent">{oldUsername}</strong>
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
          disabled={isVerifying}
          className="flex-1 bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying...' : 'Next'}
        </button>
      </div>
    </form>
  );
}

