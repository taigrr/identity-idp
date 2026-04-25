'use client';

/**
 * PIV/CAC Error Page
 * Mirrors: app/controllers/two_factor_authentication/piv_cac_verification_controller.rb#error
 * Route: /two-factor/piv-cac/error
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PivCacErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') || 'unknown';

  const getErrorDetails = (code: string): { title: string; message: string; action?: string } => {
    switch (code) {
      case 'certificate.none':
        return {
          title: 'No certificate presented',
          message: 'We did not receive a certificate from your PIV/CAC card. Please make sure your card is properly inserted and try again.',
          action: 'Make sure your card reader is connected and your PIV/CAC card is fully inserted.',
        };
      case 'certificate.invalid':
        return {
          title: 'Invalid certificate',
          message: 'The certificate on your PIV/CAC could not be validated. This may indicate an issue with your card.',
          action: 'Contact your agency\'s IT help desk to verify your PIV/CAC card is valid.',
        };
      case 'certificate.expired':
        return {
          title: 'Certificate expired',
          message: 'The certificate on your PIV/CAC has expired and cannot be used for authentication.',
          action: 'Contact your agency to get a new PIV/CAC card with a valid certificate.',
        };
      case 'certificate.revoked':
        return {
          title: 'Certificate revoked',
          message: 'The certificate on your PIV/CAC has been revoked and cannot be used for authentication.',
          action: 'Contact your agency\'s security office for assistance.',
        };
      case 'certificate.unverified':
        return {
          title: 'Certificate not verified',
          message: 'We could not verify the certificate chain for your PIV/CAC.',
          action: 'Your agency\'s certificate authority may not be recognized. Contact your IT help desk.',
        };
      case 'token.invalid':
        return {
          title: 'Session expired',
          message: 'Your authentication session has expired. Please try signing in again.',
        };
      case 'token.missing':
        return {
          title: 'Missing authentication data',
          message: 'The authentication response was incomplete. Please try again.',
        };
      default:
        return {
          title: 'Authentication error',
          message: 'There was a problem authenticating with your PIV/CAC. Please try again.',
        };
    }
  };

  const { title, message, action } = getErrorDetails(errorCode);

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-600 mb-4">{message}</p>

      {action && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-blue-800 text-sm">{action}</p>
        </div>
      )}

      <div className="space-y-3">
        <Link
          href="/two-factor/piv-cac"
          className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
        >
          Try again
        </Link>

        <Link
          href="/two-factor"
          className="block w-full py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
        >
          Choose another authentication method
        </Link>

        <Link
          href="/sign-in"
          className="block text-center text-gray-600 hover:underline text-sm"
        >
          Cancel and return to sign in
        </Link>
      </div>
    </div>
  );
}
