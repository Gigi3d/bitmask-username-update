'use client';

import { useState, useEffect } from 'react';
import { validateUsername } from '@/lib/utils';
import { saveFormData, getFormData } from '@/lib/formPersistence';
import { showToast } from './Toast';
import Tooltip from './Tooltip';

interface Step3FormProps {
  onSubmit: (newUsername: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export default function Step3Form({ onSubmit, onBack, initialValue = '' }: Step3FormProps) {
  const [newUsername, setNewUsername] = useState(initialValue);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved form data on mount
  useEffect(() => {
    if (!initialValue) {
      const savedData = getFormData();
      if (savedData.newUsername) {
        setNewUsername(savedData.newUsername);
      }
    }
  }, [initialValue]);

  // Save form data when new username changes
  useEffect(() => {
    if (newUsername) {
      saveFormData({ newUsername, currentStep: 3 });
    }
  }, [newUsername]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNewUsername(text.trim());
      showToast('Pasted from clipboard', 'success');
    } catch {
      showToast('Failed to paste from clipboard', 'error');
    }
  };

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
      setError('Username must be between 1 and 100 characters');
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

  // Character count
  const charCount = newUsername.length;
  const maxChars = 100;
  const isNearLimit = charCount > maxChars * 0.8;
  const isOverLimit = charCount > maxChars;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="newUsername" className="block text-lg font-semibold">
            New Mainnet Bitmask Username <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Enter your new Bitmask username (e.g., gideon@bitmask.app). You can include or omit @bitmask.app">
            <span className="text-gray-400 cursor-help text-sm">ℹ️</span>
          </Tooltip>
        </div>

        <div className="relative">
          <input
            type="text"
            id="newUsername"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full px-4 py-3 pr-16 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
            placeholder="e.g., gideon@bitmask.app or gideon"
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
        {newUsername && (
          <div className="mt-1 text-right">
            <span className={`text-xs ${isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-500'}`}>
              {charCount} / {maxChars} characters
            </span>
          </div>
        )}

        <p className="mt-2 text-gray-400 text-sm">
          Enter your new username (with or without @bitmask.app)
        </p>

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
          disabled={isSubmitting || !newUsername}
          className="flex-1 bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Username'}
        </button>
      </div>
    </form>
  );
}
