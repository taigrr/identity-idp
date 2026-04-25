'use client';

/**
 * Completion Form Component
 * Client component for the consent form
 */

import { useState } from 'react';
import Link from 'next/link';

interface UserEmail {
  id: string;
  email: string;
  confirmed: boolean;
  isPrimary: boolean;
}

interface CompletionFormProps {
  userEmails: UserEmail[];
  selectedEmailId?: string;
  submitCompletion: (formData: FormData) => Promise<{ error?: string }>;
  spName: string;
}

export function CompletionForm({
  userEmails,
  selectedEmailId,
  submitCompletion,
  spName,
}: CompletionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(selectedEmailId || userEmails[0]?.id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('selected_email_id', selected);

    const result = await submitCompletion(formData);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // If no error, redirect will happen server-side
  };

  const showEmailSelection = userEmails.length > 1;

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {showEmailSelection && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Select email to share:</h3>
          <div className="space-y-2">
            {userEmails.map((email) => (
              <label
                key={email.id}
                className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="selected_email_id"
                  value={email.id}
                  checked={selected === email.id}
                  onChange={() => setSelected(email.id)}
                  className="mr-3"
                />
                <span>{email.email}</span>
                {email.isPrimary && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </label>
            ))}
          </div>
          <Link href="/signup/select-email" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Use a different email
          </Link>
        </div>
      )}

      {!showEmailSelection && (
        <input type="hidden" name="selected_email_id" value={selected} />
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Continuing...' : `Continue to ${spName}`}
        </button>

        <Link
          href="/account"
          className="block w-full py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
        >
          Cancel and return to your account
        </Link>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        By continuing, you agree to share the information above with {spName}.
        Login.gov will record your consent.
      </p>
    </form>
  );
}
