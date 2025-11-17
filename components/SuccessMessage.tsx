'use client';

import { useState } from 'react';

interface SuccessMessageProps {
  oldUsername: string;
  newUsername: string;
}

export default function SuccessMessage({ oldUsername, newUsername }: SuccessMessageProps) {
  const [copied, setCopied] = useState(false);
  
  const twitterMessage = `Just updated my BitMask wallet username to ${newUsername} for RGB protocol on Bitcoin mainnet! 🚀

Bitcoin Native Finance is here @BitMask_App 

#Bitmask #Mainnet #RGB`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(twitterMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center">
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

