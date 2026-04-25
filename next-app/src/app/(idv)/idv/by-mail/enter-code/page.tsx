'use client';

/**
 * Enter GPO Code Page
 * /idv/by-mail/enter-code
 * User enters the verification code from their GPO letter
 * Mirrors: app/controllers/idv/by_mail/enter_code_controller.rb
 */

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { verifyCode } from '../actions';

const initialState = {
  error: undefined,
  success: undefined,
  rateLimited: undefined,
  canRequestAnotherLetter: true,
};

export default function EnterCodePage() {
  const [state, formAction, isPending] = useActionState(verifyCode, initialState);
  const [code, setCode] = useState('');

  // Format code as user types (uppercase, remove non-alphanumeric)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 10) {
      setCode(value);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enter your verification code</h1>

      <p className="text-gray-600 mb-6">
        Enter the 10-character code from the letter we mailed to your address.
      </p>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification code
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={code}
            onChange={handleCodeChange}
            placeholder="XXXXXXXXXX"
            maxLength={10}
            autoComplete="one-time-code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono uppercase"
            aria-describedby="code-hint"
          />
          <p id="code-hint" className="mt-2 text-sm text-gray-500">
            {code.length}/10 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending || code.length !== 10}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Verifying...' : 'Verify code'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Code not working?</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Make sure you&apos;re entering all 10 characters</li>
            <li>• Check that you&apos;re using the most recent letter</li>
            <li>• Codes are valid for 30 days from the letter date</li>
          </ul>
        </div>

        {state.canRequestAnotherLetter && (
          <div>
            <h2 className="font-semibold mb-2">Didn&apos;t receive a letter?</h2>
            <Link
              href="/idv/by-mail/request-letter"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Request a new verification letter
            </Link>
          </div>
        )}

        <div>
          <h2 className="font-semibold mb-2">Need to update your address?</h2>
          <p className="text-sm text-gray-600 mb-2">
            If your address has changed, you&apos;ll need to start the verification process again.
          </p>
          <Link
            href="/idv"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Restart identity verification
          </Link>
        </div>
      </div>
    </div>
  );
}
