'use client';

/**
 * Personal Key Regeneration Confirmation Page
 * Mirrors: app/controllers/accounts/personal_keys_controller.rb
 * Route: /account/personal-key/regenerate
 */

import { useState } from 'react';
import Link from 'next/link';
import { regeneratePersonalKey } from './actions';

export default function RegeneratePersonalKeyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await regeneratePersonalKey();
    if (!result.success) {
      setError(result.error || 'Failed to regenerate personal key');
      setIsSubmitting(false);
    }
    // If success, redirect happens server-side
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Regenerate personal key</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Important:</strong> Regenerating your personal key will invalidate your current
          personal key. Make sure you save the new one.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        Your personal key is a backup method to sign in if you lose access to all your other
        authentication methods. Keep it somewhere safe.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isSubmitting ? 'Generating...' : 'Generate new personal key'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/account/security" className="text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </div>
  );
}
