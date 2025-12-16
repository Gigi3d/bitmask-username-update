'use client';

import { useState } from 'react';
import Tooltip from './Tooltip';

interface ReviewStepProps {
    formData: {
        oldUsername: string;
        newUsername: string;
        npubKey?: string;
    };
    onConfirm: () => void;
    onEdit: (step: number) => void;
}

export default function ReviewStep({ formData, onConfirm, onEdit }: ReviewStepProps) {
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Review Your Information</h2>

            <p className="text-gray-400 text-sm mb-6 text-center">
                Please review your information carefully before submitting. You can edit any field by clicking the Edit button.
            </p>

            {/* Review Cards */}
            <div className="space-y-4 mb-6">
                {/* Step 1: Identifier */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-accent font-semibold">Step 1:</span>
                            <span className="text-gray-300">Old Username / nPUB Key</span>
                        </div>
                        <button
                            onClick={() => onEdit(1)}
                            className="text-accent hover:underline text-sm"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="mt-2">
                        <p className="text-white font-mono text-sm break-all">{formData.oldUsername}</p>
                        {formData.npubKey && (
                            <p className="text-gray-500 text-xs mt-1">
                                (nPUB key detected)
                            </p>
                        )}
                    </div>
                </div>



                {/* Step 3: New Username */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-accent font-semibold">Step 2:</span>
                            <span className="text-gray-300">New Mainnet Username</span>
                        </div>
                        <button
                            onClick={() => onEdit(2)}
                            className="text-accent hover:underline text-sm"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="mt-2">
                        <p className="text-white font-mono text-sm">{formData.newUsername}</p>
                    </div>
                </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-accent cursor-pointer"
                    />
                    <span className="text-gray-300 text-sm">
                        I confirm that the information above is correct and understand that this update is final once processed.
                        {' '}
                        <Tooltip content="You can edit your submission within 24 hours using your tracking ID">
                            <span className="text-gray-400 cursor-help">ℹ️</span>
                        </Tooltip>
                    </span>
                </label>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <span className="text-yellow-500 text-xl">⚠️</span>
                    <div>
                        <h3 className="text-yellow-500 font-semibold mb-1">Important</h3>
                        <p className="text-gray-300 text-sm">
                            Make sure your new username matches the one you created in your new Bitmask mainnet wallet.
                            Incorrect information may delay processing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={onConfirm}
                disabled={!agreedToTerms}
                className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Confirm & Submit
            </button>

            <p className="text-gray-500 text-xs text-center mt-4">
                Processing typically takes 24-48 hours. You&apos;ll receive a tracking ID after submission.
            </p>
        </div>
    );
}
