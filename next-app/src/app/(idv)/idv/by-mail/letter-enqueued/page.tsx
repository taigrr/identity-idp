/**
 * Letter Enqueued Page
 * /idv/by-mail/letter-enqueued
 * Confirmation that a GPO letter has been requested
 * Mirrors: app/controllers/idv/by_mail/letter_enqueued_controller.rb
 */

import Link from 'next/link';

export default function LetterEnqueuedPage() {
  // In real implementation, would check session for letter details
  const expectedDeliveryDays = '5-10';

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Letter on its way!</h1>
        <p className="text-gray-600">
          A verification letter has been mailed to your address.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
        <h2 className="font-semibold text-blue-900 mb-4">What happens next?</h2>
        <ol className="list-decimal list-inside space-y-3 text-blue-800">
          <li>
            Your letter should arrive in <strong>{expectedDeliveryDays} business days</strong>
          </li>
          <li>
            The letter contains a 10-character verification code
          </li>
          <li>
            Return to Login.gov and enter the code to complete verification
          </li>
        </ol>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold mb-2">Looking for the code entry form?</h3>
        <p className="text-gray-600 text-sm mb-3">
          If you already have a verification code from a previous letter, you can enter it now.
        </p>
        <Link
          href="/idv/by-mail/enter-code"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Enter verification code
        </Link>
      </div>

      <div className="space-y-4">
        <Link
          href="/account"
          className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to your account
        </Link>

        <p className="text-sm text-gray-500">
          You can continue using Login.gov with basic access while waiting for your letter.
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-semibold mb-2">Didn&apos;t receive your letter?</h3>
        <p className="text-sm text-gray-600 mb-3">
          If your letter doesn&apos;t arrive within {expectedDeliveryDays} business days,
          you can request another one.
        </p>
        <Link
          href="/idv/by-mail/request-letter"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Request another letter
        </Link>
      </div>
    </div>
  );
}
