/**
 * Delete Account Page
 * Mirrors: app/views/users/delete/show.html.erb
 */

'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { deleteAccount, DeleteAccountState } from './actions';

const initialState: DeleteAccountState = { success: false };

export default function DeleteAccountPage() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <div className="delete-account-page">
      <h1>Delete your account</h1>

      <div className="usa-alert usa-alert--warning">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">
            This action cannot be undone
          </h2>
          <p className="usa-alert__text">
            Deleting your Login.gov account will:
          </p>
          <ul>
            <li>Remove all your personal information from Login.gov</li>
            <li>Sign you out of all government applications you accessed with Login.gov</li>
            <li>Remove your verified identity (if applicable)</li>
          </ul>
          <p className="usa-alert__text">
            <strong>
              You will need to create a new account to sign in to government
              applications that use Login.gov.
            </strong>
          </p>
        </div>
      </div>

      {state.error && (
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{state.error}</p>
          </div>
        </div>
      )}

      <form action={formAction}>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="password">
            Enter your password to confirm
          </label>
          {state.fieldErrors?.password && (
            <span className="usa-error-message">{state.fieldErrors.password}</span>
          )}
          <input
            className="usa-input"
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
          />
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="usa-button usa-button--secondary"
            disabled={pending}
          >
            {pending ? 'Deleting...' : 'Delete account'}
          </button>
          <Link href="/account" className="usa-button usa-button--outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
