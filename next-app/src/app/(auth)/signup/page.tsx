'use client';

/**
 * Signup Page
 * /signup
 * User registration with email
 * Mirrors: app/controllers/sign_up/registrations_controller.rb
 */

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { registerEmail } from './actions';

const initialState = {
  error: undefined,
  fieldErrors: undefined,
};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(registerEmail, initialState);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create your account</h1>
      <p className="text-gray-600 mb-6">
        Enter your email address to get started.
      </p>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              state.fieldErrors?.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        {/* Email Language */}
        <div>
          <label htmlFor="email_language" className="block text-sm font-medium text-gray-700 mb-1">
            Email language preference
          </label>
          <select
            id="email_language"
            name="email_language"
            defaultValue="en"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="zh">中文</option>
          </select>
        </div>

        {/* Terms */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms_accepted"
            name="terms_accepted"
            value="true"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className={`mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 ${
              state.fieldErrors?.terms ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <label htmlFor="terms_accepted" className="ml-3 text-sm text-gray-700">
            I agree to the{' '}
            <Link href="/rules-of-use" className="text-blue-600 hover:text-blue-800">
              Login.gov Rules of Use
            </Link>
          </label>
        </div>
        {state.fieldErrors?.terms && (
          <p className="text-sm text-red-600">{state.fieldErrors.terms}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Creating account...' : 'Continue'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
