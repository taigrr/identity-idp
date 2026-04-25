'use client';

/**
 * Personal Key Verification Page
 * Mirrors: app/controllers/two_factor_authentication/personal_key_verification_controller.rb
 * Route: /two-factor/personal-key
 */

import { useState } from 'react';
import Link from 'next/link';
import { verifyPersonalKeyAction } from './actions';

export default function PersonalKeyVerificationPage() {
  const [personalKey, setPersonalKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPersonalKey = (value: string): string => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join('-');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPersonalKey(e.target.value);
    setPersonalKey(formatted);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('personal_key', personalKey);

    const result = await verifyPersonalKeyAction(formData);
    if (!result.success) {
      setError(result.error || 'Verification failed');
      setIsSubmitting(false);
    }
    // If success, redirect happens server-side
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Enter your personal key</h1>
      <p className="text-gray-600 mb-6">
        Enter the 16-character personal key you received when you created your account or
        last reset your password.
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          <strong>Important:</strong> Using your personal key will sign you in, but your
          personal key will be reset. You will receive a new personal key that you must save.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="personal_key" className="block text-sm font-medium text-gray-700 mb-2">
            Personal key
          </label>
          <input
            type="text"
            id="personal_key"
            name="personal_key"
            value={personalKey}
            onChange={handleChange}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-4 py-3 border border-gray-300 rounded font-mono text-lg tracking-wider text-center"
            autoComplete="off"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            Format: 16 characters with dashes (e.g., ABCD-1234-EFGH-5678)
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || personalKey.replace(/-/g, '').length !== 16}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isSubmitting ? 'Verifying...' : 'Submit'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <Link href="/two-factor" className="text-blue-600 hover:underline block">
          Choose another authentication method
        </Link>
        <Link href="/forgot-password" className="text-blue-600 hover:underline block text-sm">
          Forgot your personal key?
        </Link>
      </div>
    </div>
  );
}
