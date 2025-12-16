'use client';

import { useState, useEffect } from 'react';
import { validateIdentifier } from '@/lib/utils';
import { saveFormData, getFormData } from '@/lib/formPersistence';
import { showToast } from './Toast';
import Tooltip from './Tooltip';

interface Step1FormProps {
  onNext: (identifier: string, npubKey?: string) => void;
  initialValue?: string;
}

export default function Step1Form({ onNext, initialValue = '' }: Step1FormProps) {
  const [identifier, setIdentifier] = useState(initialValue);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Load saved form data on mount
  useEffect(() => {
    if (!initialValue) {
      const savedData = getFormData();
      if (savedData.oldUsername) {
        setIdentifier(savedData.oldUsername);
        showToast('Restored your previous progress', 'info');
      }
    }
  }, [initialValue]);

  // Save form data when identifier changes
  useEffect(() => {
    if (identifier) {
      saveFormData({ oldUsername: identifier, currentStep: 1 });
    }
  }, [identifier]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setIdentifier(text.trim());
      showToast('Pasted from clipboard', 'success');
    } catch {
      showToast('Failed to paste from clipboard', 'error');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(identifier);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setError('Please enter your old bitmask username or nPUB key');
      setIsVerifying(false);
      return;
    }

    // Validate identifier (username or nPUB key)
    const validation = validateIdentifier(trimmedIdentifier);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid input format');
      setIsVerifying(false);
      return;
    }

    try {
      // Verify identifier exists in CSV database
      const response = await fetch('/api/users/verify-old-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: trimmedIdentifier }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.message || 'Identifier not found in campaign records');
        setIsVerifying(false);
        return;
      }

      // Validation passed, proceed to next step
      const npubKey = validation.type === 'npubKey' ? trimmedIdentifier : undefined;
      saveFormData({ oldUsername: trimmedIdentifier, npubKey, currentStep: 2 });
      onNext(trimmedIdentifier, npubKey);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error verifying identifier:', err);
      }
      setError('Failed to verify. Please try again.');
      setIsVerifying(false);
    }
  };

  // Detect what type of input the user is entering
  const inputType = identifier.trim().startsWith('npub1') ? 'npubKey' : 'username';
  const placeholderText = inputType === 'npubKey'
    ? 'npub1...'
    : 'Enter your old username';

  // Character count
  const charCount = identifier.length;
  const maxChars = inputType === 'npubKey' ? 63 : 50;
  const isNearLimit = charCount > maxChars * 0.8;
  const isOverLimit = charCount > maxChars;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="identifier" className="block text-lg font-semibold">
            Old Bitmask Username or nPUB Key <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Enter either your old Bitmask username (e.g., alice@bitmask.app) or your nPUB key (63 characters starting with npub1)">
            <span className="text-gray-400 cursor-help text-sm">ℹ️</span>
          </Tooltip>
        </div>

        <div className="relative">
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 pr-24 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
            placeholder={placeholderText}
            autoFocus
          />

          {/* Copy/Paste buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Tooltip content="Paste from clipboard">
              <button
                type="button"
                onClick={handlePaste}
                className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600"
              >
                📋
              </button>
            </Tooltip>
            {identifier && (
              <Tooltip content="Copy to clipboard">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600"
                >
                  📄
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Character counter */}
        {identifier && (
          <div className="mt-1 text-right">
            <span className={`text-xs ${isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-500'}`}>
              {charCount} / {maxChars} characters
            </span>
          </div>
        )}

        {/* Helpful hint */}
        <p className="mt-2 text-sm text-gray-400">
          {inputType === 'npubKey' ? (
            <>
              <span className="text-accent">✓</span> Detected nPUB key format
            </>
          ) : (
            <>You can enter either your old username or your nPUB key</>
          )}
        </p>

        {error && (
          <div className="mt-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isVerifying && (
          <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
            <span>Verifying in database...</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isVerifying || !identifier}
        className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? 'Verifying...' : 'Next'}
      </button>
    </form>
  );
}
