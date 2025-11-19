'use client';

import { useState, useCallback } from 'react';
import StepIndicator from './StepIndicator';
import Step1Form from './Step1Form';
import Step2Form from './Step2Form';
import Step3Form from './Step3Form';
import SuccessMessage from './SuccessMessage';

export default function UpdateFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    oldUsername: '',
    telegramAccount: '',
    newUsername: '',
  });

  const handleStep1Next = useCallback((oldUsername: string) => {
    setFormData(prev => ({ ...prev, oldUsername }));
    setCurrentStep(2);
  }, []);

  const handleStep2Next = useCallback((telegramAccount: string) => {
    setFormData(prev => ({ ...prev, telegramAccount }));
    setCurrentStep(3);
  }, []);

  const handleStep2Back = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleStep3Submit = async (newUsername: string) => {
    try {
      // Use current formData values directly to avoid race conditions
      const updatePayload = {
        oldUsername: formData.oldUsername,
        telegramAccount: formData.telegramAccount,
        newUsername,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Submitting username update:', {
          oldUsername: formData.oldUsername,
          telegramAccount: formData.telegramAccount,
          newUsername,
        });
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

      // Update state only after successful API call
      setFormData(prev => ({ ...prev, newUsername }));
      setCurrentStep(4); // Success screen
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error updating username:', error);
      }
      const message = error instanceof Error ? error.message : 'Failed to update username. Please try again.';
      // Re-throw to let Step3Form handle the error display
      throw new Error(message);
    }
  };

  const handleStep3Back = useCallback(() => {
    setCurrentStep(2);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        {currentStep < 4 && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Update Your Bitmask Username
            </h1>
            <StepIndicator currentStep={currentStep} />
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
              onSubmit={handleStep3Submit}
              onBack={handleStep3Back}
              initialValue={formData.newUsername}
            />
          )}

          {currentStep === 4 && (
            <SuccessMessage
              oldUsername={formData.oldUsername}
              newUsername={formData.newUsername}
            />
          )}
        </div>
      </div>
    </div>
  );
}

