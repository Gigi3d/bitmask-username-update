'use client';

import { useState, useEffect } from 'react';
import { validateTelegramHandle } from '@/lib/utils';
import { saveFormData, getFormData } from '@/lib/formPersistence';
import { showToast } from './Toast';
import Tooltip from './Tooltip';

interface Step2FormProps {
  onNext: (telegramAccount: string) => void;
  onBack: () => void;
  oldUsername: string;
  initialValue?: string;
}

export default function Step2Form({ onNext, onBack, oldUsername, initialValue = '' }: Step2FormProps) {
  const [telegramAccount, setTelegramAccount] = useState(initialValue);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Load saved form data on mount
  useEffect(() => {
    if (!initialValue) {
      const savedData = getFormData();
      if (savedData.telegramAccount) {
        setTelegramAccount(savedData.telegramAccount);
      }
    }
  }, [initialValue]);

  // Save form data when telegram account changes
  useEffect(() => {
    if (telegramAccount) {
      saveFormData({ telegramAccount, currentStep: 2 });
    }
  }, [telegramAccount]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTelegramAccount(text.trim());
      showToast('Pasted from clipboard', 'success');
    } catch (err) {
      showToast('Failed to paste from clipboard', 'error');
    }
  };

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

    if (!validateTelegramHandle(cleanHandle)) {
      setError('Invalid Telegram handle format. Must be 5-32 characters (letters, numbers, underscores only)');
      setIsVerifying(false);
      return;
    }

    try {
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
        const errorMsg = data.message || 'Telegram account verification failed';
        setError(errorMsg);
        setIsVerifying(false);
        return;
      }

      saveFormData({ telegramAccount: cleanHandle, currentStep: 3 });
      onNext(cleanHandle);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error verifying telegram account:', err);
      }
      setError('Failed to verify Telegram account. Please try again.');
      setIsVerifying(false);
    }
  };

  // Character count
  const charCount = telegramAccount.replace('@', '').length;
  const minChars = 5;
  const maxChars = 32;
  const isValid = charCount >= minChars && charCount <= maxChars;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="telegramAccount" className="block text-lg font-semibold">
            Telegram Account <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Enter your Telegram username (with or without @). Must be 5-32 characters.">
            <span className="text-gray-400 cursor-help text-sm">ℹ️</span>
          </Tooltip>
        </div>

        <div className="relative">
          <input
            type="text"
            id="telegramAccount"
            value={telegramAccount}
            onChange={(e) => setTelegramAccount(e.target.value)}
            className="w-full px-4 py-3 pr-16 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
            placeholder="@username or username"
            autoFocus
          />

          {/* Paste button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Tooltip content="Paste from clipboard">
              <button
                type="button"
                onClick={handlePaste}
                className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600"
              >
                📋
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Character counter */}
        {telegramAccount && (
          <div className="mt-1 text-right">
            <span className={`text-xs ${!isValid ? 'text-yellow-400' : 'text-gray-500'}`}>
              {charCount} / {minChars}-{maxChars} characters
            </span>
          </div>
        )}

        <p className="mt-2 text-gray-400 text-sm">
          Enter the Telegram handle associated with: <strong className="text-accent">{oldUsername}</strong>
        </p>

        {error && (
          <div className="mt-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm whitespace-pre-wrap break-words">{error}</p>
          </div>
        )}

        {isVerifying && (
          <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
            <span>Verifying telegram account...</span>
          </div>
        )}
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
          disabled={isVerifying || !telegramAccount}
          className="flex-1 bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying...' : 'Next'}
        </button>
      </div>
    </form>
  );
}
