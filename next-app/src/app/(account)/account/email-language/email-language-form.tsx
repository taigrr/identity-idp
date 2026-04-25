'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateEmailLanguage } from './actions';

interface Language {
  code: string;
  name: string;
}

interface EmailLanguageFormProps {
  currentLanguage: string;
  languages: Language[];
}

export function EmailLanguageForm({ currentLanguage, languages }: EmailLanguageFormProps) {
  const [selected, setSelected] = useState(currentLanguage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('language', selected);

    const result = await updateEmailLanguage(formData);
    if (!result.success) {
      setError(result.error || 'Failed to update language');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {languages.map((lang) => (
          <label
            key={lang.code}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selected === lang.code
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="language"
              value={lang.code}
              checked={selected === lang.code}
              onChange={() => setSelected(lang.code)}
              className="sr-only"
            />
            <span className="flex-1">{lang.name}</span>
            {selected === lang.code && (
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

      <button
        type="submit"
        disabled={isSubmitting || selected === currentLanguage}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>

      <div className="text-center">
        <Link href="/account" className="text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
