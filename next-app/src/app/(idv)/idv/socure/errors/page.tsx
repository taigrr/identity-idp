'use client';

/**
 * Socure Errors Page
 * Mirrors: app/controllers/idv/socure/errors_controller.rb
 * Route: /idv/socure/errors
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SocureErrorsPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code') || 'unknown';

  const getErrorDetails = (code: string): { title: string; message: string; canRetry: boolean } => {
    const errors: Record<string, { title: string; message: string; canRetry: boolean }> = {
      document_not_readable: {
        title: 'We couldn\'t read your document',
        message: 'The image quality was too low or the document was not clearly visible. Please try again with better lighting.',
        canRetry: true,
      },
      document_expired: {
        title: 'Your document has expired',
        message: 'The ID you submitted has expired. Please use a valid, unexpired government-issued ID.',
        canRetry: true,
      },
      selfie_mismatch: {
        title: 'Face verification failed',
        message: 'We couldn\'t match your selfie to the photo on your ID. Please try again, making sure your face is clearly visible.',
        canRetry: true,
      },
      document_type_unsupported: {
        title: 'Document type not supported',
        message: 'The type of ID you submitted is not currently accepted. Please use a U.S. driver\'s license or passport.',
        canRetry: true,
      },
      session_expired: {
        title: 'Session expired',
        message: 'Your verification session has expired. Please start the verification process again.',
        canRetry: true,
      },
      service_unavailable: {
        title: 'Service temporarily unavailable',
        message: 'Our document verification service is temporarily unavailable. Please try again later.',
        canRetry: true,
      },
      unknown: {
        title: 'Verification failed',
        message: 'We were unable to verify your identity. Please try again or choose a different verification method.',
        canRetry: true,
      },
    };

    return errors[code] || errors.unknown;
  };

  const { title, message, canRetry } = getErrorDetails(errorCode);

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

      <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

      <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
        <p className="text-red-700">{message}</p>
      </div>

      <div className="space-y-3">
        {canRetry && (
          <Link
            href="/idv/socure/document-capture"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
          >
            Try again
          </Link>
        )}

        <Link
          href="/idv/document-capture"
          className="block w-full py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
        >
          Use a different method
        </Link>

        <Link
          href="/idv"
          className="block text-center text-gray-600 hover:underline text-sm"
        >
          Start over
        </Link>
      </div>
    </div>
  );
}
