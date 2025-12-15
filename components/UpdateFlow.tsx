'use client';

import { useState, useCallback } from 'react';
import StepIndicator from './StepIndicator';
import Step1Form from './Step1Form';
import Step2Form from './Step2Form';
import Step3Form from './Step3Form';
import ReviewStep from './ReviewStep';
import SuccessMessage from './SuccessMessage';
import { clearFormData } from '@/lib/formPersistence';

// Generate a unique tracking ID
function generateTrackingId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `BM-${timestamp}-${randomStr}`.toUpperCase();
}

export default function UpdateFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [trackingId, setTrackingId] = useState<string>('');
  const [formData, setFormData] = useState({
    oldUsername: '',
    telegramAccount: '',
    newUsername: '',
    npubKey: undefined as string | undefined,
  });

  const handleStep1Next = useCallback((identifier: string, npubKey?: string) => {
    setFormData(prev => ({ ...prev, oldUsername: identifier, npubKey }));
    setCurrentStep(2);
  }, []);

  const handleStep2Next = useCallback((telegramAccount: string) => {
    setFormData(prev => ({ ...prev, telegramAccount }));
    setCurrentStep(3);
  }, []);

  const handleStep2Back = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleStep3Next = useCallback((newUsername: string) => {
    setFormData(prev => ({ ...prev, newUsername }));
    setCurrentStep(4); // Go to review step
  }, []);

  const handleStep3Back = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleReviewEdit = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleReviewConfirm = async () => {
    try {
      // Generate tracking ID
      const newTrackingId = generateTrackingId();

      const updatePayload = {
        oldUsername: formData.oldUsername,
        telegramAccount: formData.telegramAccount,
        newUsername: formData.newUsername,
        npubKey: formData.npubKey,
        trackingId: newTrackingId,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Submitting username update:', updatePayload);
      }

      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || 'Failed to update username';
        const errorDetails = data.error ? `\n\nDetails: ${data.error}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Username update successful');
      }

      // Update state and clear form data
      setTrackingId(newTrackingId);
      clearFormData(); // Clear saved form data from localStorage
      setCurrentStep(5); // Success screen
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error updating username:', error);
      }
      const message = error instanceof Error ? error.message : 'Failed to update username. Please try again.';
      throw new Error(message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        {currentStep < 5 && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Update Your Bitmask Username
            </h1>
            {currentStep < 4 && <StepIndicator currentStep={currentStep} />}
          </>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          {currentStep === 1 && (
            <Step1Form
              onNext={handleStep1Next}
              initialValue={formData.oldUsername}
            />
          )}

          {currentStep === 2 && (
            <Step2Form
              onNext={handleStep2Next}
              onBack={handleStep2Back}
              oldUsername={formData.oldUsername}
              initialValue={formData.telegramAccount}
            />
          )}

          {currentStep === 3 && (
            <Step3Form
              onSubmit={handleStep3Next}
              onBack={handleStep3Back}
              initialValue={formData.newUsername}
            />
          )}

          {currentStep === 4 && (
            <ReviewStep
              formData={formData}
              onConfirm={handleReviewConfirm}
              onEdit={handleReviewEdit}
            />
          )}

          {currentStep === 5 && (
            <SuccessMessage
              oldUsername={formData.oldUsername}
              newUsername={formData.newUsername}
              trackingId={trackingId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

