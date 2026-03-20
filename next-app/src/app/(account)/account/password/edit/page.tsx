/**
 * Change Password Page
 * Mirrors: app/views/users/passwords/edit.html.erb
 */

'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { changePassword, PasswordActionState } from './actions';

const initialState: PasswordActionState = { success: false };

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  // If personal key was regenerated, show the new key
  if (state.success && state.personalKeyRegenerated && state.newPersonalKey) {
    return (
      <div className="personal-key-page">
        <h1>Save your new personal key</h1>
        <div className="usa-alert usa-alert--warning">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              Your password has been changed. Because you have a verified identity,
              we have generated a new personal key. You will need this key to
              recover your account if you lose access.
            </p>
          </div>
        </div>
        <div className="personal-key">
          <code>{state.newPersonalKey}</code>
        </div>
        <p>
          Write down or save this key somewhere safe. You won&apos;t be able to
          see it again.
        </p>
        <Link href="/account" className="usa-button">
          I have saved my personal key
        </Link>
      </div>
    );
  }

  return (
    <div className="change-password-page">
      <h1>Change your password</h1>

      {state.error && (
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{state.error}</p>
          </div>
        </div>
      )}

      <form action={formAction}>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="currentPassword">
            Current password
          </label>
          {state.fieldErrors?.currentPassword && (
            <span className="usa-error-message">
              {state.fieldErrors.currentPassword}
            </span>
          )}
          <input
            className="usa-input"
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
          />
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="password">
            New password
          </label>
          <span className="usa-hint">At least 12 characters</span>
          {state.fieldErrors?.password && (
            <span className="usa-error-message">{state.fieldErrors.password}</span>
          )}
          <input
            className="usa-input"
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="passwordConfirmation">
            Confirm new password
          </label>
          {state.fieldErrors?.passwordConfirmation && (
            <span className="usa-error-message">
              {state.fieldErrors.passwordConfirmation}
            </span>
          )}
          <input
            className="usa-input"
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="usa-button" disabled={pending}>
          {pending ? 'Changing...' : 'Change password'}
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
