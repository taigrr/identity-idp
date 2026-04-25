'use client';

/**
 * Socure Document Capture Page
 * Mirrors: app/controllers/idv/socure/document_capture_controller.rb
 * Route: /idv/socure/document-capture
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type VerificationStatus = 'initializing' | 'ready' | 'capturing' | 'processing' | 'complete' | 'error';

export default function SocureDocumentCapturePage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [socureSessionUrl, setSocureSessionUrl] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Socure session
    const initializeSocure = async () => {
      try {
        // TODO: Call API to create Socure DocV session
        // const response = await createSocureSession();
        // setSocureSessionUrl(response.sessionUrl);

        // Simulating session creation
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSocureSessionUrl('https://socure.example.com/verify?session=abc123');
        setStatus('ready');
      } catch (err) {
        setError('Failed to initialize document verification. Please try again.');
        setStatus('error');
      }
    };

    initializeSocure();
  }, []);

  const handleStartCapture = () => {
    setStatus('capturing');
    // In production, this would launch the Socure SDK/iframe
  };

  const handleComplete = () => {
    router.push('/idv/verify-info');
  };

  if (status === 'initializing') {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold">Preparing document verification...</h1>
        <p className="text-gray-600 mt-2">This may take a moment.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">Something went wrong</h1>

        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try again
          </button>

          <Link
            href="/idv/document-capture"
            className="block w-full py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
          >
            Use a different method
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Verify your ID</h1>
      <p className="text-gray-600 mb-6">
        We&apos;ll use Socure to securely verify your identity documents.
      </p>

      {status === 'ready' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h2 className="font-medium text-blue-900 mb-2">What you&apos;ll need:</h2>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• A valid government-issued ID (driver&apos;s license or passport)</li>
              <li>• Good lighting</li>
              <li>• A steady camera</li>
            </ul>
          </div>

          <button
            onClick={handleStartCapture}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
          >
            Start document capture
          </button>

          <Link
            href="/idv/document-capture"
            className="block text-center text-gray-600 hover:underline text-sm"
          >
            Use a different verification method
          </Link>
        </>
      )}

      {status === 'capturing' && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-lg p-8 mb-6">
            <p className="text-gray-600">
              Socure verification widget would appear here.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              (Integration with Socure DocV SDK)
            </p>
          </div>

          {/* Simulated completion button for demo */}
          <button
            onClick={() => setStatus('processing')}
            className="text-blue-600 hover:underline text-sm"
          >
            [Demo] Simulate capture complete
          </button>
        </div>
      )}

      {status === 'processing' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying your documents...</h2>
          <p className="text-gray-600">
            This usually takes less than a minute.
          </p>

          {/* Simulated completion */}
          <button
            onClick={handleComplete}
            className="mt-8 text-blue-600 hover:underline text-sm"
          >
            [Demo] Complete verification
          </button>
        </div>
      )}
    </div>
  );
}
