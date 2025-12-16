'use client';

import { useState, useCallback } from 'react';
import StepIndicator from './StepIndicator';
import Step1Form from './Step1Form';
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
  const [attemptInfo, setAttemptInfo] = useState<{ attemptNumber?: number; remainingAttempts?: number }>({});
  const [formData, setFormData] = useState({
    oldUsername: '',
    newUsername: '',
    npubKey: undefined as string | undefined,
  });

  const handleStep1Next = useCallback((identifier: string, npubKey?: string) => {
    setFormData(prev => ({ ...prev, oldUsername: identifier, npubKey }));
    setCurrentStep(2); // Go directly to Step3 (new username entry)
  }, []);

  const handleStep3Next = useCallback((newUsername: string) => {
    setFormData(prev => ({ ...prev, newUsername }));
    setCurrentStep(3); // Go to review step
  }, []);

  const handleStep3Back = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleReviewEdit = useCallback((step: number) => {
    // Map review edit steps: step 1 = old username, step 2 = new username
    if (step === 1) {
      setCurrentStep(1);
    } else if (step === 2) {
      setCurrentStep(2);
    }
  }, []);

  const handleReviewConfirm = async () => {
    try {
      // Generate tracking ID
      const newTrackingId = generateTrackingId();

      const updatePayload = {
        oldUsername: formData.oldUsername,
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

      // Capture attempt information from response
      if (data.attemptNumber !== undefined && data.remainingAttempts !== undefined) {
        setAttemptInfo({
          attemptNumber: data.attemptNumber,
          remainingAttempts: data.remainingAttempts,
        });
      }

      // Update state and clear form data
      setTrackingId(newTrackingId);
      clearFormData(); // Clear saved form data from localStorage
      setCurrentStep(4); // Success screen
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
        {currentStep < 4 && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Update Your Bitmask Username
            </h1>
            {currentStep < 3 && <StepIndicator currentStep={currentStep} />}
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
            <Step3Form
              onSubmit={handleStep3Next}
              onBack={handleStep3Back}
              initialValue={formData.newUsername}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              formData={formData}
              onConfirm={handleReviewConfirm}
              onEdit={handleReviewEdit}
            />
          )}

          {currentStep === 4 && (
            <SuccessMessage
              oldUsername={formData.oldUsername}
              newUsername={formData.newUsername}
              trackingId={trackingId}
              attemptNumber={attemptInfo.attemptNumber}
              remainingAttempts={attemptInfo.remainingAttempts}
            />
          )}
        </div>
      </div>
    </div>
  );
}

