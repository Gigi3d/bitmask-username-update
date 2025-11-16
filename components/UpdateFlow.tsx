'use client';

import { useState } from 'react';
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

  const handleStep1Next = (oldUsername: string) => {
    setFormData(prev => ({ ...prev, oldUsername }));
    setCurrentStep(2);
  };

  const handleStep2Next = (telegramAccount: string) => {
    setFormData(prev => ({ ...prev, telegramAccount }));
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Submit = async (newUsername: string) => {
    setFormData(prev => ({ ...prev, newUsername }));
    
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldUsername: formData.oldUsername,
          telegramAccount: formData.telegramAccount,
          newUsername,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update username');
      }

      setCurrentStep(4); // Success screen
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Failed to update username. Please try again.');
    }
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

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

