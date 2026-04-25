'use client';

/**
 * Verify Password for Reactivation Page
 * Mirrors: app/controllers/users/verify_password_controller.rb
 * Route: /account/reactivate/verify-password
 */

import { useState } from 'react';
import Link from 'next/link';
import { verifyPasswordForReactivation } from './actions';

export default function VerifyPasswordPage() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('password', password);

    const result = await verifyPasswordForReactivation(formData);
    if (!result.success) {
      setError(result.error || 'Verification failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Verify your password</h1>
      <p className="text-gray-600 mb-6">
        Enter your password to reactivate your account and access your verified information.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isSubmitting ? 'Verifying...' : 'Continue'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <Link href="/account/reactivate/verify-personal-key" className="text-blue-600 hover:underline block">
          Use personal key instead
        </Link>
        <Link href="/forgot-password" className="text-blue-600 hover:underline block text-sm">
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
