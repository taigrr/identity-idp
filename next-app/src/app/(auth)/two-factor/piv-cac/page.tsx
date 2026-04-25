'use client';

/**
 * PIV/CAC Verification Page
 * Mirrors: app/controllers/two_factor_authentication/piv_cac_verification_controller.rb
 * Route: /two-factor/piv-cac
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { redirectToPivCacService, verifyPivCac } from './actions';

export default function PivCacVerificationPage() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (token && !isVerifying) {
      setIsVerifying(true);
      verifyPivCac(token).then((result) => {
        if (!result.success) {
          setError(result.error || 'Verification failed');
        }
        setIsVerifying(false);
      });
    }
  }, [token, isVerifying]);

  const handlePresentCard = async () => {
    setError(null);
    await redirectToPivCacService();
  };

  const getErrorMessage = (errorCode: string | null): string => {
    switch (errorCode) {
      case 'certificate.none':
        return 'No PIV/CAC certificate was presented. Please insert your card and try again.';
      case 'certificate.invalid':
        return 'The certificate on your PIV/CAC is invalid. Please contact your agency.';
      case 'certificate.expired':
        return 'The certificate on your PIV/CAC has expired. Please contact your agency.';
      case 'certificate.revoked':
        return 'The certificate on your PIV/CAC has been revoked. Please contact your agency.';
      case 'token.invalid':
        return 'Your session has expired. Please try again.';
      default:
        return 'There was a problem verifying your PIV/CAC. Please try again.';
    }
  };

  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold">Verifying your PIV/CAC...</h1>
        <p className="text-gray-600 mt-2">Please wait while we verify your certificate.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Present your PIV/CAC</h1>
      <p className="text-gray-600 mb-6">
        Insert your PIV or CAC card into your card reader, then click the button below.
      </p>

      {(error || errorParam) && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700">{error || getErrorMessage(errorParam)}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-medium text-blue-900 mb-2">Before you continue:</h2>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Make sure your PIV/CAC card is inserted in your card reader</li>
          <li>• You may be prompted for your PIN</li>
          <li>• A browser security window may appear</li>
        </ul>
      </div>

      <form action={handlePresentCard}>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Present PIV/CAC
        </button>
      </form>

      <div className="text-center space-y-2">
        <Link href="/two-factor" className="text-blue-600 hover:underline block">
          Choose another authentication method
        </Link>
        <Link href="/sign-in" className="text-gray-600 hover:underline block text-sm">
          Cancel and return to sign in
        </Link>
      </div>
    </div>
  );
}
