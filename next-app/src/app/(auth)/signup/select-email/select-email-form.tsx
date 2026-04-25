'use client';

/**
 * Select Email Form Component
 * Client component for selecting which email to share with SP
 */

import { useState } from 'react';
import Link from 'next/link';

interface UserEmail {
  id: string;
  email: string;
  confirmed: boolean;
  isPrimary: boolean;
}

interface SelectEmailFormProps {
  userEmails: UserEmail[];
  selectedEmailId?: string;
  canAddEmail: boolean;
  selectEmail: (formData: FormData) => Promise<{ error?: string }>;
}

export function SelectEmailForm({
  userEmails,
  selectedEmailId,
  canAddEmail,
  selectEmail,
}: SelectEmailFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(selectedEmailId || userEmails[0]?.id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('selected_email_id', selected);

    const result = await selectEmail(formData);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // If no error, redirect will happen server-side
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {userEmails.map((email) => (
          <label
            key={email.id}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selected === email.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="selected_email_id"
              value={email.id}
              checked={selected === email.id}
              onChange={() => setSelected(email.id)}
              className="sr-only"
            />
            <div className="flex-1">
              <span className="block font-medium">{email.email}</span>
              {email.isPrimary && (
                <span className="text-xs text-gray-500">Primary email</span>
              )}
            </div>
            {selected === email.id && (
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </label>
        ))}
      </div>

      {canAddEmail && (
        <div className="mb-6">
          <Link
            href="/account/emails/add"
            className="text-blue-600 hover:underline text-sm"
          >
            + Add a new email address
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>

        <Link
          href="/signup/completed"
          className="block w-full py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
