'use client';

/**
 * Request Letter Page
 * /idv/by-mail/request-letter
 * User chooses to verify their address by mail
 * Mirrors: app/controllers/idv/by_mail/request_letter_controller.rb
 */

import { useActionState } from 'react';
import { requestLetter } from '../actions';

const initialState = {
  error: undefined,
  success: undefined,
  rateLimited: undefined,
};

export default function RequestLetterPage() {
  const [state, formAction, isPending] = useActionState(requestLetter, initialState);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verify your address by mail</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">How it works</h2>
        <ul className="list-disc list-inside space-y-2 text-blue-800">
          <li>We&apos;ll mail a letter to the address you provided</li>
          <li>The letter contains a 10-character verification code</li>
          <li>Letters typically arrive within 5-10 business days</li>
          <li>Enter the code on Login.gov to complete verification</li>
        </ul>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {state.rateLimited && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            You&apos;ve reached the maximum number of letter requests. Please wait before requesting another.
          </p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Your mailing address</h3>
        <p className="text-gray-600">
          {/* Address would be loaded from session/profile */}
          123 Main Street<br />
          Apt 4B<br />
          Washington, DC 20001
        </p>
        <a
          href="/idv/verify-info"
          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
        >
          Update address
        </a>
      </div>

      <form action={formAction}>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending || state.rateLimited}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Requesting letter...' : 'Request verification letter'}
          </button>

          <a
            href="/idv/phone"
            className="flex-1 text-center border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Verify by phone instead
          </a>
        </div>
      </form>

      <p className="text-sm text-gray-600 mt-4 text-center">
        By requesting a letter, you agree that we will send mail to this address.
      </p>
    </div>
  );
}
