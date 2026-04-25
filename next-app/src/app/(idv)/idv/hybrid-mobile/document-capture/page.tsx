'use client';

/**
 * Hybrid Mobile Document Capture Page
 * Mirrors: app/controllers/idv/hybrid_mobile/document_capture_controller.rb
 * Route: /idv/hybrid-mobile/document-capture
 */

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type CaptureStep = 'front' | 'back' | 'selfie' | 'complete';

export default function HybridMobileDocumentCapturePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CaptureStep>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionUuid = searchParams.get('session');

  const getStepInstructions = (step: CaptureStep): { title: string; description: string } => {
    const instructions: Record<CaptureStep, { title: string; description: string }> = {
      front: {
        title: 'Front of ID',
        description: 'Position the front of your ID within the frame and tap to capture.',
      },
      back: {
        title: 'Back of ID',
        description: 'Position the back of your ID within the frame and tap to capture.',
      },
      selfie: {
        title: 'Take a selfie',
        description: 'Position your face within the frame. Make sure your face is well-lit.',
      },
      complete: {
        title: 'Capture complete',
        description: 'Your documents have been captured successfully.',
      },
    };
    return instructions[step];
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    setError(null);

    // TODO: Implement actual camera capture using Acuant SDK or similar
    // Simulating capture delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsCapturing(false);

    // Move to next step
    if (currentStep === 'front') {
      setCurrentStep('back');
    } else if (currentStep === 'back') {
      setCurrentStep('selfie');
    } else if (currentStep === 'selfie') {
      setCurrentStep('complete');
    }
  };

  const handleComplete = () => {
    router.push(`/idv/hybrid-mobile/capture-complete?session=${sessionUuid}`);
  };

  const { title, description } = getStepInstructions(currentStep);

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <div className="text-green-500 mb-4">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-300 text-center mb-8">{description}</p>

        <button
          onClick={handleComplete}
          className="w-full max-w-xs py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">
            Step {currentStep === 'front' ? 1 : currentStep === 'back' ? 2 : 3} of 3
          </span>
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>

      {error && (
        <div className="mx-4 bg-red-900 border border-red-600 rounded p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm aspect-[3/4] border-4 border-white border-opacity-50 rounded-lg relative">
          <div className="absolute inset-0 flex items-center justify-center">
            {isCapturing ? (
              <div className="animate-pulse text-white">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            ) : (
              <p className="text-gray-400 text-center">
                {currentStep === 'selfie' ? 'Center your face' : 'Position your ID here'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pb-8">
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="w-full py-4 bg-white text-gray-900 rounded-lg font-semibold disabled:opacity-50"
        >
          {isCapturing ? 'Capturing...' : 'Capture'}
        </button>
      </div>
    </div>
  );
}
