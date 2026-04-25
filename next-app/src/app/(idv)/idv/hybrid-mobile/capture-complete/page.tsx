'use client';

/**
 * Hybrid Mobile Capture Complete Page
 * Mirrors: app/controllers/idv/hybrid_mobile/capture_complete_controller.rb
 * Route: /idv/hybrid-mobile/capture-complete
 */

export default function HybridMobileCaptureCompletePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="max-w-md text-center">
        <div className="text-green-600 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-4">Document capture complete</h1>

        <p className="text-gray-600 mb-8">
          You can now close this browser and return to your computer to continue the
          identity verification process.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-semibold text-blue-900 mb-2">What happens next?</h2>
          <p className="text-blue-800 text-sm">
            Your documents are being processed. Return to your computer to continue.
            If you closed your browser, you can sign back in to Login.gov to check your
            verification status.
          </p>
        </div>
      </div>
    </div>
  );
}
