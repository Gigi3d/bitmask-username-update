'use client';

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [1, 2];

  return (
    <div className="flex items-center justify-center mb-12">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          {/* Step circle */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-colors ${step <= currentStep
                ? 'bg-accent text-black border-accent'
                : 'bg-transparent text-white border-gray-600'
              }`}
          >
            {step}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={`w-24 h-1 mx-2 transition-colors ${step < currentStep ? 'bg-accent' : 'bg-gray-600'
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

