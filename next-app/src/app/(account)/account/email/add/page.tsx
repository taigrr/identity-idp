/**
 * Add Email Page
 * Mirrors: app/views/users/emails/show.html.erb
 */

'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { addEmail, EmailActionState } from '../actions';

const initialState: EmailActionState = { success: false };

export default function AddEmailPage() {
  const [state, formAction, pending] = useActionState(addEmail, initialState);

  return (
    <div className="add-email-page">
      <h1>Add email address</h1>

      <p>
        Adding another email address lets you sign in with either email.
        We&apos;ll send you a confirmation link to verify the new address.
      </p>

      {state.error && (
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{state.error}</p>
          </div>
        </div>
      )}

      <form action={formAction}>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="email">
            Email address
          </label>
          {state.fieldErrors?.email && (
            <span className="usa-error-message">{state.fieldErrors.email}</span>
          )}
          <input
            className="usa-input"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <button type="submit" className="usa-button" disabled={pending}>
          {pending ? 'Adding...' : 'Add email'}
        </button>
      </form>

      <p>
        <Link href="/account" className="usa-link">
          Cancel
        </Link>
      </p>
    </div>
  );
}
