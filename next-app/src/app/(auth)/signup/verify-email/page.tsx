'use client';

/**
 * Verify Email Page
 * /signup/verify-email
 * Check your email confirmation
 * Mirrors: app/controllers/sign_up/emails_controller.rb
 */

import { useState } from 'react';
import Link from 'next/link';
import { resendConfirmationEmail } from './actions';

export default function VerifyEmailPage() {
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // In production, get from session
  const email = 'user@example.com';

  const handleResend = async () => {
    setResendStatus('sending');
    setError(null);

    const result = await resendConfirmationEmail();

    if (result.success) {
      setResendStatus('sent');
    } else {
      setResendStatus('error');
      setError(result.error || 'Failed to resend email');
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-gray-600">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-left">
        <h2 className="font-semibold mb-3">Next steps</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Check your email inbox</li>
          <li>Click the confirmation link in the email</li>
          <li>You&apos;ll be redirected to set up your password</li>
        </ol>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {resendStatus === 'sent' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">Confirmation email sent!</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendStatus === 'sending'}
          className="w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {resendStatus === 'sending' ? 'Sending...' : 'Resend confirmation email'}
        </button>

        <Link
          href="/signup"
          className="block w-full text-center text-gray-600 hover:text-gray-800"
        >
          Use a different email address
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-semibold mb-2">Didn&apos;t receive the email?</h3>
        <ul className="text-sm text-gray-600 space-y-1 text-left">
          <li>• Check your spam or junk folder</li>
          <li>• Make sure you entered your email correctly</li>
          <li>• Wait a few minutes and try again</li>
        </ul>
      </div>
    </div>
  );
}
