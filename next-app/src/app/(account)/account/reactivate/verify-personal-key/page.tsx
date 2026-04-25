'use client';

/**
 * Verify Personal Key for Reactivation Page
 * Mirrors: app/controllers/users/verify_personal_key_controller.rb
 * Route: /account/reactivate/verify-personal-key
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerifyPersonalKeyPage() {
  const router = useRouter();
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
    setPersonalKey(formatPersonalKey(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // TODO: Call server action to verify personal key
    const cleanKey = personalKey.replace(/-/g, '');
    if (cleanKey.length !== 16) {
      setError('Please enter a valid 16-character personal key');
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Replace with actual verification
    router.push('/account/personal-key');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Enter your personal key</h1>
      <p className="text-gray-600 mb-6">
        Enter the 16-character personal key you saved when you created your account
        or last reset your password.
      </p>

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
            value={personalKey}
            onChange={handleChange}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-4 py-3 border border-gray-300 rounded font-mono text-lg tracking-wider text-center"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || personalKey.replace(/-/g, '').length !== 16}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isSubmitting ? 'Verifying...' : 'Continue'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <Link href="/account/reactivate/verify-password" className="text-blue-600 hover:underline block">
          Use password instead
        </Link>
        <Link href="/account-reset/request" className="text-blue-600 hover:underline block text-sm">
          Lost your personal key?
        </Link>
      </div>
    </div>
  );
}
